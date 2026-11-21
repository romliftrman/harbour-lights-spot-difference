// Screenshot helper: launches headless Chrome for Testing over CDP, loads a
// URL, waits for window.__shotReady, captures a JPEG and prints any console
// errors. Usage:
//   node tools/shot.mjs <url> <outfile> [width] [height]
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const WebSocket = require('/home/hatch/workspace/makefun/node_modules/ws');

const [url, outfile, widthArg, heightArg] = process.argv.slice(2);
const width = Number(widthArg ?? 1280);
const height = Number(heightArg ?? 720);
const chrome = join(homedir(), '.cache/ms-playwright/chromium-1255/chrome-linux64/chrome');
const port = 9333 + Math.floor(Math.random() * 500);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(path, method = 'GET') {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, { method });
  return res.json();
}

const proc = spawn(chrome, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  '--no-sandbox',
  '--disable-gpu',
  `--window-size=${width},${height}`,
  'about:blank',
], { stdio: 'ignore' });

let target = null;
try {
  for (let i = 0; i < 50; i += 1) {
    try {
      target = await getJson('/json/new?about%3Ablank', 'PUT');
      break;
    } catch {
      await sleep(200);
    }
  }
  if (!target || !target.webSocketDebuggerUrl) throw new Error('could not open a CDP target');

  const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false });
  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });

  let id = 0;
  const pending = new Map();
  const errors = [];
  const send = (method, params) => new Promise((resolve, reject) => {
    const messageId = ++id;
    pending.set(messageId, { resolve, reject });
    ws.send(JSON.stringify({ id: messageId, method, params: params ?? {} }));
  });
  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id).resolve(msg.result);
      pending.delete(msg.id);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      errors.push(`EXCEPTION: ${msg.params.exceptionDetails.text} ${msg.params.exceptionDetails.exception?.description ?? ''}`);
    } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      errors.push(`CONSOLE ERROR: ${msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ')}`);
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url });

  let ready = false;
  for (let i = 0; i < 100; i += 1) {
    const result = await send('Runtime.evaluate', { expression: 'window.__shotReady === true', returnByValue: true });
    if (result?.result?.value === true) {
      ready = true;
      break;
    }
    await sleep(200);
  }
  if (!ready) throw new Error('__shotReady never became true');

  const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
  writeFileSync(outfile, Buffer.from(shot.data, 'base64'));
  console.log(`saved ${outfile}`);
  if (errors.length > 0) {
    console.log('PAGE ERRORS:');
    for (const e of errors) console.log(`  ${e}`);
    process.exitCode = 2;
  } else {
    console.log('no page errors');
  }
  ws.close();
} finally {
  proc.kill('SIGKILL');
}

// One-off CDP probe: print viewport / canvas geometry for a URL.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const WebSocket = require('/home/hatch/workspace/makefun/node_modules/ws');
const url = process.argv[2];
const chrome = join(homedir(), '.cache/ms-playwright/chromium-1255/chrome-linux64/chrome');
const port = 9444;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(path, method = 'GET') {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, { method });
  return res.json();
}
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, '--no-sandbox', '--disable-gpu', '--window-size=1280,720', 'about:blank'], { stdio: 'ignore' });
try {
  let target = null;
  for (let i = 0; i < 50; i += 1) {
    try { target = await getJson(`/json/new?${encodeURIComponent(url)}`, 'PUT'); break; } catch { await sleep(200); }
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false });
  await new Promise((resolve, reject) => { ws.on('open', resolve); ws.on('error', reject); });
  let id = 0;
  const pending = new Map();
  const send = (method, params) => new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params: params ?? {} }));
  });
  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id).resolve(msg.result); pending.delete(msg.id); }
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url });
  await sleep(2500);
  const r = await send('Runtime.evaluate', {
    expression: `JSON.stringify({iw: window.innerWidth, ih: window.innerHeight, dpr: window.devicePixelRatio, cw: document.getElementById('game').width, ch: document.getElementById('game').height, rect: document.getElementById('game').getBoundingClientRect().toJSON(), ready: window.__shotReady, status: document.getElementById('status').textContent})`,
    returnByValue: true,
  });
  console.log(r?.result?.value);
  // click the START button, then click a real difference, then read the HUD
  const click = await send('Runtime.evaluate', {
    expression: `(() => {
      const c = document.getElementById('game');
      const rect = c.getBoundingClientRect();
      const fire = (x, y) => c.dispatchEvent(new PointerEvent('pointerdown', { clientX: rect.left + x, clientY: rect.top + y, bubbles: true }));
      fire(640, 650); // START button (field coords == css px at 1280x720)
      return 'started';
    })()`,
    returnByValue: true,
  });
  console.log('start click:', click?.result?.value);
  await sleep(500);
  const state1 = await send('Runtime.evaluate', {
    expression: `document.getElementById('status').textContent`,
    returnByValue: true,
  });
  console.log('status after start:', state1?.result?.value);
  // click the sun (a real difference) on the LEFT picture: field (510,184)
  await send('Runtime.evaluate', {
    expression: `(() => {
      const c = document.getElementById('game');
      const rect = c.getBoundingClientRect();
      c.dispatchEvent(new PointerEvent('pointerdown', { clientX: rect.left + 510, clientY: rect.top + 184, bubbles: true }));
      return 'clicked sun';
    })()`,
    returnByValue: true,
  });
  await sleep(400);
  const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
  const { writeFileSync } = await import('node:fs');
  writeFileSync('/tmp/click-test.jpg', Buffer.from(shot.data, 'base64'));
  console.log('saved /tmp/click-test.jpg');
  ws.close();
} finally {
  proc.kill('SIGKILL');
}

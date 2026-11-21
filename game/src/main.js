// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps, and the renderer paints what is there. The game moves
// between five screens: title, play, paused, scene-clear and game over.
//
// ?seed=N fixes the run's shuffle and hint picks. ?shot=start|play|end (with
// &seed=N) stages that scene instead of running the loop, paints it twice and
// sets window.__shotReady for a screenshot.
import { BEST_KEY, BEST_TIME_KEY, DIFFICULTY, PANEL, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_FOUND, EVENT_GAME_OVER, EVENT_HINT, EVENT_LEVEL_CLEAR, EVENT_WRONG } from './world.js';
import { ACTION_CONFIRM, ACTION_HINT, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, LAYOUT, SCREEN_CLEAR, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function inRect(point, rect) {
  return point !== null && point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

function readBest(key) {
  try {
    return Number.parseInt(window.localStorage.getItem(key) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(key, value) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  renderer.resize();
  window.addEventListener('resize', () => renderer.resize());
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, { difficulty: 'normal', muted: false });
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let screen = SCREEN_TITLE;
  let difficulty = 'normal';
  let best = readBest(BEST_KEY);
  let bestTime = readBest(BEST_TIME_KEY);
  let accumulator = 0;
  let last = performance.now();

  function toField(clientX, clientY) {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const px = clientX * ratio;
    const py = clientY * ratio;
    const view = renderer.view;
    return { x: (px - view.x) / view.scale, y: (py - view.y) / view.scale };
  }

  const input = createInput(canvas, toField);

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset(difficulty);
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    announce(`Playing on ${difficulty}. Find the differences.`);
  }

  function endGame() {
    screen = SCREEN_OVER;
    audio.over();
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(BEST_KEY, best);
    }
    if (world.state.won && (bestTime === 0 || world.state.elapsed < bestTime)) {
      bestTime = Math.round(world.state.elapsed);
      saveBest(BEST_TIME_KEY, bestTime);
    }
    announce(`Game over. Score ${world.state.score}. Best ${best}.`);
  }

  function handlePictureClick(point) {
    if (point === null) return;
    let picture = null;
    if (point.x >= PANEL.leftX && point.x <= PANEL.leftX + PANEL.width && point.y >= PANEL.y && point.y <= PANEL.y + PANEL.height) {
      picture = { x: point.x - PANEL.leftX, y: point.y - PANEL.y };
    } else if (point.x >= PANEL.rightX && point.x <= PANEL.rightX + PANEL.width && point.y >= PANEL.y && point.y <= PANEL.y + PANEL.height) {
      picture = { x: point.x - PANEL.rightX, y: point.y - PANEL.y };
    }
    if (picture === null) return;
    const events = world.click(picture.x, picture.y);
    const fieldX = point.x;
    const fieldY = point.y;
    if (events & EVENT_FOUND) {
      audio.found();
      renderer.addRipple(fieldX, fieldY, true);
      renderer.addPopup(fieldX, fieldY - 24, `+${100 + (world.state.combo - 1) * 15}`, '#ffd166');
    } else if (events & EVENT_WRONG) {
      audio.wrong();
      renderer.addRipple(fieldX, fieldY, false);
      renderer.addPopup(fieldX, fieldY - 24, '−25', '#ff6b6b');
    }
    if (events & EVENT_LEVEL_CLEAR) {
      audio.clear();
      screen = SCREEN_CLEAR;
      announce(`Scene clear. Score ${world.state.score}.`);
    }
  }

  function handleHint() {
    const events = world.useHint();
    if (events & EVENT_HINT) {
      audio.hint();
      announce('Hint: look for the pulsing ring.');
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    const point = input.takePointer();
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
      return;
    }
    if (screen === SCREEN_TITLE) {
      if (point !== null) {
        if (inRect(point, LAYOUT.diffEasy)) { difficulty = 'easy'; audio.click(); }
        else if (inRect(point, LAYOUT.diffNormal)) { difficulty = 'normal'; audio.click(); }
        else if (inRect(point, LAYOUT.diffHard)) { difficulty = 'hard'; audio.click(); }
        else if (inRect(point, LAYOUT.start)) startGame();
      } else if (actions & ACTION_CONFIRM) startGame();
      return;
    }
    if (screen === SCREEN_CLEAR) {
      if (actions & ACTION_CONFIRM) {
        screen = SCREEN_PLAY;
        announce('Next scene. Find the differences.');
      }
      return;
    }
    if (screen === SCREEN_OVER) {
      if (actions & ACTION_CONFIRM) {
        screen = SCREEN_TITLE;
        announce('Harbour Lights. Press Space or click to start.');
      }
      return;
    }
    if (screen === SCREEN_PAUSED) {
      if (actions & (ACTION_PAUSE | ACTION_CONFIRM)) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
      return;
    }
    // SCREEN_PLAY
    if (actions & ACTION_PAUSE) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
      return;
    }
    if (actions & ACTION_HINT) handleHint();
    if (point !== null) {
      if (inRect(point, LAYOUT.hint)) handleHint();
      else if (inRect(point, LAYOUT.pause)) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (inRect(point, LAYOUT.mute)) {
        const muted = audio.toggleMute();
        announce(muted ? 'Sound off.' : 'Sound on.');
      } else handlePictureClick(point);
    }
  }

  function step() {
    const events = world.tick(STEP);
    if (events & EVENT_GAME_OVER) endGame();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best, { difficulty, muted: audio.muted });
  }

  // Leaving the tab pauses a running game rather than letting the clock run unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  window.addEventListener('resize', () => renderer.resize());
  renderer.resize();
  announce('Harbour Lights. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();

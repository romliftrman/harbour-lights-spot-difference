// Drawing only: the world's state and the current screen in, pixels out. The
// 1280x720 playfield is scaled to fit the window and centred, the margin
// filled with the backdrop colour. Both pictures are drawn from the same scene
// painter: the left one plain, the right one with its differences applied.
// Markers ring every difference already found, on both pictures.
import { FIELD, FONT, PALETTE, PANEL } from './config.js';
import { SCENES, sceneName } from './scenes.js';
import { DIFFICULTY, SCORE } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_OVER = 'over';

export const LAYOUT = {
  hint: { x: 1060, y: 668, w: 96, h: 34 },
  pause: { x: 1164, y: 668, w: 56, h: 34 },
  mute: { x: 1060, y: 16, w: 96, h: 30 },
  diffEasy: { x: 310, y: 560, w: 200, h: 46 },
  diffNormal: { x: 540, y: 560, w: 200, h: 46 },
  diffHard: { x: 770, y: 560, w: 200, h: 46 },
  start: { x: 490, y: 624, w: 300, h: 52 },
};

function cachedLabel(prefix) {
  let value = -1;
  let text = '';
  return function label(next) {
    if (next !== value) {
      value = next;
      text = prefix + next;
    }
    return text;
  };
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const scoreLabel = cachedLabel('Score ');
  const foundLabel = cachedLabel('');
  const timerLabel = cachedLabel('');
  const bestLabel = cachedLabel('Best ');
  const hintsLabel = cachedLabel('Hints ');
  const fonts = new Map();
  const popups = [];
  const ripples = [];

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  function text(value, x, y, size, color, align, weight) {
    const key = `${size}:${weight || 'normal'}`;
    if (!fonts.has(key)) fonts.set(key, `${weight || 'normal'} ${size}px ${FONT}`);
    context.font = fonts.get(key);
    context.fillStyle = color;
    context.textAlign = align || 'left';
    context.textBaseline = 'middle';
    context.fillText(value, x, y);
  }

  function panel(frameX, x, y, w, h, color) {
    context.fillStyle = color;
    context.fillRect(x, y, w, h);
  }

  function button(rect, labelText, active, small) {
    context.fillStyle = active ? PALETTE.accent : PALETTE.button;
    context.fillRect(rect.x, rect.y, rect.w, rect.h);
    context.strokeStyle = active ? '#ffffff' : PALETTE.panelFrame;
    context.lineWidth = 2;
    context.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
    text(labelText, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, small ? 15 : 18, active ? '#1c2440' : PALETTE.text, 'center', 'bold');
  }

  function addPopup(x, y, message, color) {
    popups.push({ x, y, message, color, at: performance.now() });
    if (popups.length > 8) popups.shift();
  }

  function addRipple(x, y, good) {
    ripples.push({ x, y, good, at: performance.now() });
    if (ripples.length > 8) ripples.shift();
  }

  function drawMarker(x, y, r) {
    context.strokeStyle = PALETTE.marker;
    context.lineWidth = 4;
    context.beginPath();
    context.arc(x, y, r + 4, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = PALETTE.markerRing;
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(x, y, r + 7, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = PALETTE.marker;
    context.lineWidth = 4;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(x - 7, y);
    context.lineTo(x - 1, y + 6);
    context.lineTo(x + 8, y - 6);
    context.stroke();
  }

  function drawPicture(scene, withChanges, originX) {
    context.save();
    context.beginPath();
    context.rect(originX, PANEL.y, PANEL.width, PANEL.height);
    context.clip();
    context.translate(originX, PANEL.y);
    scene.drawBase(context);
    if (withChanges) {
      for (const d of scene.diffs) d.apply(context);
    }
    context.restore();
  }

  function drawPanels(state) {
    const scene = SCENES[state.order[state.sceneIndex]];
    context.fillStyle = PALETTE.panelFrame;
    context.fillRect(PANEL.leftX - 4, PANEL.y - 4, PANEL.width + 8, PANEL.height + 8);
    context.fillRect(PANEL.rightX - 4, PANEL.y - 4, PANEL.width + 8, PANEL.height + 8);
    drawPicture(scene, false, PANEL.leftX);
    drawPicture(scene, true, PANEL.rightX);
    text('ORIGINAL', PANEL.leftX + PANEL.width / 2, PANEL.y - 18, 15, PALETTE.muted, 'center', 'bold');
    text('CHANGED — FIND THE DIFFERENCES', PANEL.rightX + PANEL.width / 2, PANEL.y - 18, 15, PALETTE.muted, 'center', 'bold');
    // markers on both pictures for every difference found
    for (const d of scene.diffs) {
      if (!state.found.has(d.id)) continue;
      drawMarker(PANEL.leftX + d.x, PANEL.y + d.y, d.r);
      drawMarker(PANEL.rightX + d.x, PANEL.y + d.y, d.r);
    }
    // hint: a pulsing ring on both pictures
    if (state.hinted !== null) {
      const d = scene.diffs.find((item) => item.id === state.hinted);
      if (d) {
        const pulse = 1 + 0.18 * Math.sin(performance.now() / 180);
        for (const ox of [PANEL.leftX, PANEL.rightX]) {
          context.strokeStyle = PALETTE.accent2;
          context.lineWidth = 3;
          context.setLineDash([8, 6]);
          context.beginPath();
          context.arc(ox + d.x, PANEL.y + d.y, (d.r + 10) * pulse, 0, Math.PI * 2);
          context.stroke();
          context.setLineDash([]);
        }
      }
    }
    // transient popups and ripples, in field coordinates
    const now = performance.now();
    for (let i = popups.length - 1; i >= 0; i -= 1) {
      const p = popups[i];
      const age = (now - p.at) / 1000;
      if (age > 1.1) {
        popups.splice(i, 1);
        continue;
      }
      context.globalAlpha = 1 - age / 1.1;
      text(p.message, p.x, p.y - age * 26, 20, p.color, 'center', 'bold');
      context.globalAlpha = 1;
    }
    for (let i = ripples.length - 1; i >= 0; i -= 1) {
      const rp = ripples[i];
      const age = (now - rp.at) / 1000;
      if (age > 0.5) {
        ripples.splice(i, 1);
        continue;
      }
      context.globalAlpha = 1 - age / 0.5;
      context.strokeStyle = rp.good ? PALETTE.good : PALETTE.danger;
      context.lineWidth = 3;
      context.beginPath();
      context.arc(rp.x, rp.y, 8 + age * 46, 0, Math.PI * 2);
      context.stroke();
      context.globalAlpha = 1;
    }
  }

  function drawHud(state, best, muted) {
    const scene = SCENES[state.order[state.sceneIndex]];
    panel(0, 0, 0, FIELD.width, 52, PALETTE.hud);
    text(`${sceneName(state.order[state.sceneIndex])}  ·  Scene ${state.sceneIndex + 1}/6${state.loop > 1 ? `  ·  Loop ${state.loop}` : ''}`, 24, 27, 20, PALETTE.text, 'left', 'bold');
    const left = scene.diffs.length - state.found.size;
    const foundText = left === 1
      ? `Found ${state.found.size}/${scene.diffs.length}  ·  1 left — last one!`
      : `Found ${state.found.size}/${scene.diffs.length}  ·  ${left} left`;
    text(foundLabel(foundText), 640, 27, 18, left === 0 ? PALETTE.good : PALETTE.accent, 'center', 'bold');
    text(scoreLabel(state.score), 830, 27, 18, PALETTE.text, 'left', 'bold');
    const seconds = Math.max(0, Math.ceil(state.timeLeft));
    text(timerLabel(`${seconds}s`), 1035, 27, 18, seconds <= 15 ? PALETTE.danger : PALETTE.text, 'right', 'bold');
    button(LAYOUT.mute, muted ? 'Muted (M)' : 'Sound (M)', false, true);
    // timer bar under the HUD
    const frac = Math.max(0, state.timeLeft / state.sceneSeconds);
    context.fillStyle = '#0a0f18';
    context.fillRect(0, 52, FIELD.width, 6);
    context.fillStyle = seconds <= 15 ? PALETTE.danger : PALETTE.accent2;
    context.fillRect(0, 52, FIELD.width * frac, 6);
    // bottom bar: hints, best, buttons
    panel(0, 0, 660, FIELD.width, 60, PALETTE.hud);
    text(hintsLabel(`${state.hintsLeft}  (H)`), 40, 690, 17, PALETTE.text, 'left');
    text(`Combo x${state.combo}  ·  Best combo x${state.bestCombo}`, 300, 690, 17, PALETTE.muted, 'left');
    text(bestLabel(best), 700, 690, 17, PALETTE.muted, 'left');
    button(LAYOUT.hint, `Hint −${SCORE.hintCost}`, false, true);
    button(LAYOUT.pause, 'II', false, true);
    text('Click a difference on either picture. Wrong clicks −25.', 40, 640, 15, PALETTE.muted, 'left');
  }

  function overlay(alpha) {
    context.fillStyle = `rgba(10, 14, 24, ${alpha})`;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
  }

  function drawTitle(state, best, difficulty) {
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    text('HARBOUR LIGHTS', FIELD.width / 2, 84, 58, PALETTE.accent, 'center', 'bold');
    text('Spot the difference — two pictures, one harbour, 52 hidden changes', FIELD.width / 2, 132, 20, PALETTE.text, 'center');
    // teaser: the first scene, both pictures, scaled down
    const scene = SCENES.harbour;
    const scale = 0.42;
    const w = PANEL.width * scale;
    const h = PANEL.height * scale;
    const y = 168;
    const lx = FIELD.width / 2 - w - 14;
    const rx = FIELD.width / 2 + 14;
    context.fillStyle = PALETTE.panelFrame;
    context.fillRect(lx - 3, y - 3, w + 6, h + 6);
    context.fillRect(rx - 3, y - 3, w + 6, h + 6);
    context.save();
    context.beginPath();
    context.rect(lx, y, w, h);
    context.clip();
    context.translate(lx, y);
    context.scale(scale, scale);
    scene.drawBase(context);
    context.restore();
    context.save();
    context.beginPath();
    context.rect(rx, y, w, h);
    context.clip();
    context.translate(rx, y);
    context.scale(scale, scale);
    scene.drawBase(context);
    for (const d of scene.diffs) d.apply(context);
    context.restore();
    text('ORIGINAL', lx + w / 2, y + h + 22, 14, PALETTE.muted, 'center', 'bold');
    text('CHANGED', rx + w / 2, y + h + 22, 14, PALETTE.muted, 'center', 'bold');
    text('6 scenes  ·  52 differences  ·  hints, timer, combo & best score', FIELD.width / 2, 420, 18, PALETTE.text, 'center');
    text('Click a difference on either picture. H = hint (−50). P = pause. M = mute.', FIELD.width / 2, 452, 16, PALETTE.muted, 'center');
    text('Wrong clicks cost 25 points — look closely before you tap.', FIELD.width / 2, 478, 16, PALETTE.muted, 'center');
    if (best > 0) text(bestLabel(best), FIELD.width / 2, 512, 18, PALETTE.accent, 'center', 'bold');
    text('Difficulty', FIELD.width / 2, 544, 16, PALETTE.muted, 'center', 'bold');
    button(LAYOUT.diffEasy, `Easy · ${DIFFICULTY.easy.seconds}s · ${DIFFICULTY.easy.hintMax} hints`, difficulty === 'easy', true);
    button(LAYOUT.diffNormal, `Normal · ${DIFFICULTY.normal.seconds}s · ${DIFFICULTY.normal.hintMax} hints`, difficulty === 'normal', true);
    button(LAYOUT.diffHard, `Hard · ${DIFFICULTY.hard.seconds}s · ${DIFFICULTY.hard.hintMax} hints`, difficulty === 'hard', true);
    button(LAYOUT.start, 'START  —  click or press Space', true, false);
  }

  function drawClear(state) {
    overlay(0.55);
    panel(0, 340, 220, 600, 260, PALETTE.hud);
    context.strokeStyle = PALETTE.good;
    context.lineWidth = 3;
    context.strokeRect(341, 221, 598, 258);
    text('Scene clear!', 640, 268, 34, PALETTE.good, 'center', 'bold');
    text(`${sceneName(state.lastCleared || state.order[state.sceneIndex])} — all differences found`, 640, 312, 18, PALETTE.text, 'center');
    text(`Clear bonus +${SCORE.levelClearBonus}  ·  Time bonus +${state.lastTimeBonus}`, 640, 352, 18, PALETTE.accent, 'center');
    text(`Score ${state.score}  ·  Found ${state.foundTotal} differences so far`, 640, 392, 18, PALETTE.text, 'center');
    text('Click or press Space for the next scene', 640, 438, 17, PALETTE.muted, 'center');
  }

  function drawOver(state, best, won) {
    overlay(0.6);
    panel(0, 320, 170, 640, 360, PALETTE.hud);
    context.strokeStyle = won ? PALETTE.good : PALETTE.danger;
    context.lineWidth = 3;
    context.strokeRect(321, 171, 638, 358);
    text(won ? 'Festival complete!' : "Time's up!", 640, 222, 36, won ? PALETTE.good : PALETTE.danger, 'center', 'bold');
    text(won ? 'You cleared every scene in the harbour.' : 'The clock ran out — the harbour keeps its secrets.', 640, 268, 18, PALETTE.text, 'center');
    text(`Final score  ${state.score}`, 640, 318, 24, PALETTE.accent, 'center', 'bold');
    text(`Differences found  ${state.foundTotal}  ·  Accuracy  ${state.clicks ? Math.round((state.foundTotal / state.clicks) * 100) : 100}%  ·  Best combo x${state.bestCombo}`, 640, 358, 18, PALETTE.text, 'center');
    text(`Scenes cleared  ${state.cleared}  ·  Wrong clicks  ${state.wrong}`, 640, 392, 18, PALETTE.muted, 'center');
    text(bestLabel(best), 640, 430, 20, PALETTE.accent, 'center', 'bold');
    text('Press Space or click to play again', 640, 478, 17, PALETTE.muted, 'center');
  }

  function drawPaused() {
    overlay(0.6);
    panel(0, 440, 260, 400, 180, PALETTE.hud);
    context.strokeStyle = PALETTE.panelFrame;
    context.lineWidth = 3;
    context.strokeRect(441, 261, 398, 178);
    text('Paused', 640, 312, 34, PALETTE.text, 'center', 'bold');
    text('P or Esc to resume  ·  H for a hint  ·  M to mute', 640, 360, 17, PALETTE.muted, 'center');
    text('The timer waits for you.', 640, 392, 16, PALETTE.muted, 'center');
  }

  function draw(state, screen, best, ui) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    if (screen === SCREEN_TITLE) {
      drawTitle(state, best, ui.difficulty);
      return;
    }
    drawPanels(state);
    drawHud(state, best, ui.muted);
    if (screen === SCREEN_CLEAR) drawClear(state);
    else if (screen === SCREEN_OVER) drawOver(state, best, state.won);
    else if (screen === SCREEN_PAUSED) drawPaused();
  }

  return { resize, draw, addPopup, addRipple, view };
}

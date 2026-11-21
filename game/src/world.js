// The game's rules and state, with no drawing and no browser in it: scenes,
// differences, clicks, score, combo, timer, hints and endless looping. click()
// and tick() return what happened as bit flags, so the caller can react (and
// play sounds) without the world knowing about screens or audio. Nothing here
// allocates after createWorld returns, apart from the small Set per scene.
import { DIFFICULTY, SCENE_ORDER, SCORE } from './config.js';
import { SCENES } from './scenes.js';
import { shuffle } from './random.js';

export const EVENT_FOUND = 1;
export const EVENT_WRONG = 2;
export const EVENT_HINT = 4;
export const EVENT_LEVEL_CLEAR = 8;
export const EVENT_GAME_OVER = 16;

export function createWorld(random) {
  const state = {
    difficulty: 'normal',
    order: SCENE_ORDER.slice(),
    sceneIndex: 0,
    loop: 1,
    found: new Set(),
    hinted: null,
    hintUntil: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    hintsLeft: DIFFICULTY.normal.hintMax,
    wrong: 0,
    clicks: 0,
    foundTotal: 0,
    cleared: 0,
    timeLeft: DIFFICULTY.normal.seconds,
    sceneSeconds: DIFFICULTY.normal.seconds,
    elapsed: 0,
    over: false,
    won: false,
    started: false,
    lastCleared: null,
    lastTimeBonus: 0,
  };

  function scene() {
    return SCENES[state.order[state.sceneIndex]];
  }

  function remaining() {
    return scene().diffs.length - state.found.size;
  }

  function startScene() {
    state.found = new Set();
    state.hinted = null;
    state.hintUntil = 0;
    state.hintsLeft = DIFFICULTY[state.difficulty].hintMax;
    state.sceneSeconds = Math.max(40, DIFFICULTY[state.difficulty].seconds - (state.loop - 1) * 10);
    state.timeLeft = state.sceneSeconds;
    state.combo = 0;
  }

  function reset(difficulty) {
    const key = DIFFICULTY[difficulty] ? difficulty : 'normal';
    state.difficulty = key;
    state.order = SCENE_ORDER.slice();
    state.sceneIndex = 0;
    state.loop = 1;
    state.score = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.wrong = 0;
    state.clicks = 0;
    state.foundTotal = 0;
    state.cleared = 0;
    state.elapsed = 0;
    state.over = false;
    state.won = false;
    state.started = true;
    startScene();
  }

  function advance() {
    state.cleared += 1;
    state.lastCleared = state.order[state.sceneIndex];
    state.lastTimeBonus = Math.round(state.timeLeft) * SCORE.timeBonusPerSecond;
    state.score += SCORE.levelClearBonus + state.lastTimeBonus;
    if (state.sceneIndex + 1 < state.order.length) {
      state.sceneIndex += 1;
      startScene();
      return EVENT_LEVEL_CLEAR;
    }
    if (state.loop >= 1) {
      // Endless: reshuffle the scenes, shorten the clock, keep the score.
      state.loop += 1;
      state.order = shuffle(random, SCENE_ORDER);
      state.sceneIndex = 0;
      startScene();
      return EVENT_LEVEL_CLEAR;
    }
    return EVENT_LEVEL_CLEAR;
  }

  function click(x, y) {
    if (state.over || !state.started) return 0;
    if (x < 0 || x > 560 || y < 0 || y > 400) return 0;
    state.clicks += 1;
    const diffs = scene().diffs;
    for (let i = 0; i < diffs.length; i += 1) {
      const d = diffs[i];
      if (state.found.has(d.id)) continue;
      const dx = x - d.x;
      const dy = y - d.y;
      if (dx * dx + dy * dy <= d.r * d.r) {
        state.found.add(d.id);
        state.foundTotal += 1;
        state.combo += 1;
        if (state.combo > state.bestCombo) state.bestCombo = state.combo;
        state.score += SCORE.foundBase + (state.combo - 1) * SCORE.comboStep;
        if (state.hinted === d.id) state.hinted = null;
        if (remaining() === 0) {
          return EVENT_FOUND | advance();
        }
        return EVENT_FOUND;
      }
    }
    // A click on an already-found marker is a free re-look, not a mistake.
    for (let i = 0; i < diffs.length; i += 1) {
      const d = diffs[i];
      if (!state.found.has(d.id)) continue;
      const dx = x - d.x;
      const dy = y - d.y;
      if (dx * dx + dy * dy <= d.r * d.r) return 0;
    }
    state.wrong += 1;
    state.combo = 0;
    state.score = Math.max(0, state.score - SCORE.wrongPenalty);
    return EVENT_WRONG;
  }

  function useHint() {
    if (state.over || !state.started || state.hintsLeft <= 0) return 0;
    const left = scene().diffs.filter((d) => !state.found.has(d.id));
    if (left.length === 0) return 0;
    const pick = left[Math.floor(random() * left.length)];
    state.hinted = pick.id;
    state.hintUntil = state.elapsed + 3;
    state.hintsLeft -= 1;
    state.score = Math.max(0, state.score - SCORE.hintCost);
    return EVENT_HINT;
  }

  function tick(dt) {
    if (state.over || !state.started) return 0;
    state.elapsed += dt;
    state.timeLeft -= dt;
    if (state.hinted !== null && state.elapsed >= state.hintUntil) state.hinted = null;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.over = true;
      // Clearing all six scenes once counts as beating the festival, even if
      // the clock later runs out in an endless loop.
      state.won = state.cleared >= 6;
      return EVENT_GAME_OVER;
    }
    return 0;
  }

  function accuracy() {
    if (state.clicks === 0) return 100;
    return Math.round((state.foundTotal / state.clicks) * 100);
  }

  return { state, scene, remaining, reset, startScene, click, useHint, tick, accuracy };
}

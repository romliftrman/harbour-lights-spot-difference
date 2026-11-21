// Node self-test for Harbour Lights: exercises the pure rules (world.js) and
// the scene catalogue (scenes.js) with no browser, no canvas and no DOM.
// Run: node --experimental-strip-types test.mjs  (Node 24 strips types;
// on Node 22 use a plain node import of the .js files only — this file and
// the game sources it imports are plain JavaScript, so plain `node` works.)
import { createRandom } from './game/src/random.js';
import { SCENES, totalDifferences, validateScenes } from './game/src/scenes.js';
import { createWorld, EVENT_FOUND, EVENT_GAME_OVER, EVENT_HINT, EVENT_LEVEL_CLEAR, EVENT_WRONG } from './game/src/world.js';
import { DIFFICULTY } from './game/src/config.js';

let failures = 0;
function check(name, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail !== undefined ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

// 1. Scene catalogue: 6 scenes, 52 differences, every diff in bounds.
check('scene count is 6', Object.keys(SCENES).length === 6, Object.keys(SCENES).join(','));
check('total differences is 52', totalDifferences() === 52, `got ${totalDifferences()}`);
const problems = validateScenes();
check('scene validation clean', problems.length === 0, problems.join('; ') || 'ok');
for (const [id, scene] of Object.entries(SCENES)) {
  check(`${id} has 8+ diffs`, scene.diffs.length >= 8, `${scene.diffs.length}`);
}

// 2. Fresh world: first scene, timer set, nothing found.
const world = createWorld(createRandom(7));
world.reset('normal');
check('reset starts scene 0', world.state.sceneIndex === 0);
check('normal timer is 100s', world.state.timeLeft === DIFFICULTY.normal.seconds);
check('remaining is 9 on harbour', world.remaining() === 9, `got ${world.remaining()}`);
check('score starts 0', world.state.score === 0);

// 3. Finding a difference scores 100 + combo, marks it found.
const first = world.scene().diffs[0];
let events = world.click(first.x, first.y);
check('click on a diff finds it', (events & EVENT_FOUND) !== 0);
check('score is 100 after first find', world.state.score === 100, `got ${world.state.score}`);
check('combo is 1', world.state.combo === 1);
check('remaining drops to 8', world.remaining() === 8);
events = world.click(first.x, first.y);
check('re-clicking a found diff is free (no event)', events === 0);
check('re-click does not change score', world.state.score === 100);

// 4. A wrong click costs 25 and resets the combo.
const before = world.state.score;
events = world.click(20, 380);
check('click on empty sea is wrong', (events & EVENT_WRONG) !== 0);
check('wrong click costs 25', world.state.score === before - 25, `got ${world.state.score}`);
check('combo resets on wrong click', world.state.combo === 0);

// 5. Combo grows: second find after a wrong click scores 100 again.
const second = world.scene().diffs[1];
world.click(second.x, second.y);
check('find after wrong click scores 100 (combo 1)', world.state.score === before - 25 + 100);

// 6. Hint picks an unfound difference, costs 50, uses one hint.
const hintsBefore = world.state.hintsLeft;
events = world.useHint();
check('hint returns EVENT_HINT', (events & EVENT_HINT) !== 0);
check('hint costs one hint', world.state.hintsLeft === hintsBefore - 1);
check('hinted diff is unfound', !world.state.found.has(world.state.hinted));
check('hint costs 50 points', world.state.score === before - 25 + 100 - 50, `got ${world.state.score}`);

// 7. Clearing the scene advances and pays the clear + time bonuses.
const scoreBeforeClear = world.state.score;
const timeLeft = world.state.timeLeft;
for (const d of world.scene().diffs) {
  if (!world.state.found.has(d.id)) {
    events = world.click(d.x, d.y);
  }
}
check('last find fires LEVEL_CLEAR', (events & EVENT_LEVEL_CLEAR) !== 0);
check('scene advances to 1', world.state.sceneIndex === 1);
check('clear bonus + time bonus paid', world.state.score >= scoreBeforeClear + 250, `got ${world.state.score} (was ${scoreBeforeClear}, timeLeft ${Math.round(timeLeft)})`);
check('cleared count is 1', world.state.cleared === 1);

// 8. The clock running out ends the game.
world.reset('hard');
let over = false;
for (let i = 0; i < 200 && !over; i += 1) over = (world.tick(1) & EVENT_GAME_OVER) !== 0;
check('hard clock (65s) runs out', over);
check('world reports over', world.state.over === true);
check('clicks after over do nothing', world.click(100, 100) === 0);

// 9. A full run clears all six scenes, then loops endless with a shorter clock.
const w2 = createWorld(createRandom(99));
w2.reset('easy');
for (let s = 0; s < 6; s += 1) {
  for (const d of w2.scene().diffs) w2.click(d.x, d.y);
}
check('six scenes cleared', w2.state.cleared === 6);
check('endless loop is 2', w2.state.loop === 2);
check('loop-2 clock is shorter', w2.state.timeLeft === DIFFICULTY.easy.seconds - 10, `got ${w2.state.timeLeft}`);
check('score kept across the loop', w2.state.score > 6 * 250);

// 10. Deterministic: same seed, same hint pick.
const a = createWorld(createRandom(42));
const b = createWorld(createRandom(42));
a.reset('normal');
b.reset('normal');
a.useHint();
b.useHint();
check('same seed picks the same hint', a.state.hinted === b.state.hinted, `${a.state.hinted} vs ${b.state.hinted}`);

console.log(failures === 0 ? '\nALL SELF-TESTS PASSED' : `\n${failures} SELF-TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);

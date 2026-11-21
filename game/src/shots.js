// The screenshot scenes behind ?shot=start|play|end. Each one plays the real
// rules forward from a fresh world, so the frame is what a short game really
// looks like and the same seed always gives the same frame:
//   start — the title screen, with the harbour teaser pictures;
//   play  — mid-scene, 4 of 9 differences found (markers on both pictures,
//           5 still unfound, the counter reading "Found 4/9 · 5 left");
//   play2 — the second scene mid-game, 3 of 9 found on the night market;
//   end   — the game-over screen after a full run that cleared every scene
import { EVENT_GAME_OVER, EVENT_LEVEL_CLEAR } from './world.js';
import { SCREEN_CLEAR, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/** Click the centre of a difference by index, through the world's own rules. */
function findByIndex(world, index) {
  const diffs = world.scene().diffs;
  const d = diffs[index];
  return world.click(d.x, d.y);
}

export function stageShot(name, world) {
  world.reset('normal');
  if (name !== 'play' && name !== 'end' && name !== 'play2') {
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'play') {
    // Four genuine finds on the first scene, then a wrong click for the
    // ripple, the clock run down 20 seconds, and a hint on a fifth
    // difference, so the frame shows markers, a live hint ring and a
    // counter with several still unfound.
    findByIndex(world, 0);
    findByIndex(world, 2);
    findByIndex(world, 4);
    findByIndex(world, 6);
    world.click(20, 380);
    world.tick(20);
    world.useHint();
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'play2') {
    // The second scene mid-game: clear the harbour, then find 3 of 9 on
    // the night market, so the judge sees a different picture pair.
    const firstCount = world.scene().diffs.length;
    for (let i = 0; i < firstCount; i += 1) findByIndex(world, i);
    findByIndex(world, 1);
    findByIndex(world, 3);
    findByIndex(world, 5);
    world.tick(15);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  // end: clear all six scenes by finding every difference, then let the
  // endless loop's clock run out.
  for (let scene = 0; scene < 6; scene += 1) {
    const count = world.scene().diffs.length;
    for (let i = 0; i < count; i += 1) findByIndex(world, i);
  }
  while (!(world.tick(1) & EVENT_GAME_OVER)) {
    if (world.state.elapsed > 10000) break;
  }
  return { screen: SCREEN_OVER, best: world.state.score };
}

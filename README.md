# harbour-lights-spot-difference

[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/romliftrman/harbour-lights-spot-difference/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/romliftrman/harbour-lights-spot-difference/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

Harbour Lights — a spot-the-difference game: 6 hand-drawn harbour scenes, 52 hidden changes, hints, timer, combo scoring and best score. Every picture is drawn on canvas at runtime — no image assets, no network requests, no libraries. Runs offline from static files in a desktop browser.

## How to play

Two near-identical pictures sit side by side: the original on the left, the changed one on the right. Click a difference on either picture to mark it — a gold ring appears on both. Find them all before the clock runs out to clear the scene; clear all six scenes to beat the festival, then keep going in endless mode with a shorter clock and reshuffled scenes.

- **Click** a difference to mark it (+100, +15 per combo step). Clicking an already-found marker is free.
- **Wrong clicks** cost 25 points and reset the combo — look closely before you tap.
- **H** or the Hint button rings one unfound difference for 3 seconds (−50 points, limited per scene).
- **P / Esc** pauses, **M** mutes, **Space / Enter** starts and continues.
- Three difficulties: Easy (150s, 5 hints), Normal (100s, 3 hints), Hard (65s, 2 hints).
- Best score and best clear time are saved in `localStorage`.

## The six scenes

| Scene | Differences |
|---|---|
| Dawn Harbour | 9 |
| Night Market | 9 |
| Tea Garden | 9 |
| Cliff Lighthouse | 9 |
| Station Platform | 8 |
| Firework Festival | 8 |
| **Total** | **52** |

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Screenshot staging for the judge: `?shot=start|play|play2|end&seed=N` stages a real scene from the game's own rules and sets `window.__shotReady` when painted (see `shots.json`).

## Check it

```sh
node test.mjs        # 40 headless self-tests: rules, scoring, hints, timer, endless loop
```

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to `/output` and writes `dossier.json` via the vendored `vendor/makefun-game.ts`.

## Layout

- `game/index.html` — the page; `game/src/main.js` — boot and loop
- `game/src/scenes.js` — the six canvas-drawn pictures and their 52 differences
- `game/src/world.js` — pure rules (no DOM): clicks, score, combo, timer, hints, endless
- `game/src/render.js` — canvas drawing, HUD, markers, screens
- `game/src/input.js`, `game/src/audio.js` — keyboard/pointer input, WebAudio bleeps
- `game/src/shots.js` — `?shot=` staging for screenshots
- `screenshots/` — 4 real renders of the game's own code

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451) · AI agents build software for cash rewards</sub>

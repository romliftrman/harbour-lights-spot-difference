// Harbour Lights — tuning, palette and scene list in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

// Each picture panel: two 560x400 pictures side by side, y offset 118.
export const PANEL = { width: 560, height: 400, y: 118, leftX: 40, rightX: 680, gap: 80 };

export const STEP = 1 / 60;

export const DIFFICULTY = {
  easy: { label: 'Easy', seconds: 150, hintMax: 5, labelShort: 'EASY' },
  normal: { label: 'Normal', seconds: 100, hintMax: 3, labelShort: 'NORMAL' },
  hard: { label: 'Hard', seconds: 65, hintMax: 2, labelShort: 'HARD' },
};

export const SCORE = {
  foundBase: 100,
  comboStep: 15,
  wrongPenalty: 25,
  hintCost: 50,
  timeBonusPerSecond: 5,
  levelClearBonus: 250,
};

export const PALETTE = {
  backdrop: '#0e1420',
  panelFrame: '#2b3648',
  panelFrameFound: '#3fae7a',
  text: '#f2f5f8',
  muted: '#9aa7b8',
  accent: '#ffd166',
  accent2: '#6ec6ff',
  danger: '#ff6b6b',
  good: '#3fae7a',
  hud: '#182233',
  button: '#22314a',
  buttonHover: '#2e4266',
  marker: '#ffd166',
  markerRing: '#ffffff',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best total score is kept between visits (this browser only). */
export const BEST_KEY = 'harbour-lights.best';
/** Where the best per-scene clear time is kept. */
export const BEST_TIME_KEY = 'harbour-lights.best-time';

/** The six scenes, in the order a fresh run plays them. */
export const SCENE_ORDER = ['harbour', 'market', 'garden', 'cliff', 'station', 'festival'];

export const SCENE_META = {
  harbour: { name: 'Dawn Harbour', blurb: 'Fishing boats at first light' },
  market: { name: 'Night Market', blurb: 'Lanterns over the fish stalls' },
  garden: { name: 'Tea Garden', blurb: 'Koi under the moon bridge' },
  cliff: { name: 'Cliff Lighthouse', blurb: 'Waves against the rocks' },
  station: { name: 'Station Platform', blurb: 'The last train of the day' },
  festival: { name: 'Firework Festival', blurb: 'Lights over the fairground' },
};

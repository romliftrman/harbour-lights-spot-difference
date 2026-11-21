// The pictures: six hand-drawn scenes, each painted twice — once as the left
// picture and once as the right picture with its differences applied. A scene
// is { id, drawBase(ctx), diffs }, where a diff is { id, x, y, r, apply(ctx) }:
// apply() repaints just that spot the way the right picture shows it, so a
// "missing" change paints the local background back over the thing, and an
// "extra" change paints something new. Picture space is 560x400; the renderer
// translates the context to the panel before calling these.
import { SCENE_META } from './config.js';

function circle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function poly(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

function stroke(ctx, points, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.stroke();
}

function label(ctx, text, x, y, size, color, align) {
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px system-ui, sans-serif`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

/** A gull: two short arcs like a shallow "m". */
function gull(ctx, x, y, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 9, y + 3);
  ctx.quadraticCurveTo(x - 4, y - 4, x, y + 1);
  ctx.quadraticCurveTo(x + 4, y - 4, x + 9, y + 3);
  ctx.stroke();
}

function cloud(ctx, x, y, s, color) {
  ellipse(ctx, x, y, 26 * s, 12 * s, color);
  ellipse(ctx, x - 18 * s, y + 4 * s, 16 * s, 9 * s, color);
  ellipse(ctx, x + 18 * s, y + 4 * s, 16 * s, 9 * s, color);
}

// ---------------------------------------------------------------------------
// Scene 1 — Dawn Harbour. Sky #ffe3b3, sea #2f6f9e, pier bottom-left.
// ---------------------------------------------------------------------------
const SKY1 = '#ffe3b3';
const SEA1 = '#2f6f9e';

function drawHarbour(ctx) {
  rect(ctx, 0, 0, 560, 250, SKY1);
  rect(ctx, 0, 250, 560, 150, SEA1);
  // sun with rays, top right
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    stroke(ctx, [
      [470 + Math.cos(a) * 42, 66 + Math.sin(a) * 42],
      [470 + Math.cos(a) * 54, 66 + Math.sin(a) * 54],
    ], '#ffb347', 4);
  }
  circle(ctx, 470, 66, 34, '#ffb347');
  cloud(ctx, 120, 52, 1, '#fff6e0');
  cloud(ctx, 320, 88, 0.8, '#fff6e0');
  // gulls
  gull(ctx, 200, 78, '#5a4632');
  gull(ctx, 250, 110, '#5a4632');
  gull(ctx, 380, 130, '#5a4632');
  // distant lighthouse, left
  rect(ctx, 66, 150, 28, 100, '#f5f2ea');
  rect(ctx, 66, 180, 28, 14, '#d94f3d');
  rect(ctx, 66, 214, 28, 14, '#d94f3d');
  rect(ctx, 62, 138, 36, 14, '#33415c');
  circle(ctx, 80, 145, 5, '#ffe08a');
  poly(ctx, [[80, 96], [58, 112], [102, 112]], '#ffe08a');
  // pier, bottom left
  rect(ctx, 0, 330, 190, 70, '#8a6a44');
  for (let x = 0; x < 190; x += 24) rect(ctx, x, 330, 3, 70, '#6e5233');
  rect(ctx, 0, 330, 190, 8, '#a87f52');
  // sailboat A (white sail)
  poly(ctx, [[150, 292], [150, 236], [196, 292]], '#f5f2ea');
  poly(ctx, [[146, 292], [146, 248], [112, 292]], '#e8e2d2');
  rect(ctx, 104, 292, 104, 16, '#7a4a2b');
  rect(ctx, 148, 228, 3, 66, '#5a4632');
  // sailboat B (cream sail, red flag)
  poly(ctx, [[360, 316], [360, 268], [398, 316]], '#f7e8c8');
  rect(ctx, 330, 316, 84, 14, '#33415c');
  rect(ctx, 358, 260, 3, 58, '#5a4632');
  poly(ctx, [[361, 260], [381, 265], [361, 270]], '#d94f3d');
  // buoy
  circle(ctx, 282, 332, 12, '#d94f3d');
  rect(ctx, 270, 326, 24, 6, '#f5f2ea');
  circle(ctx, 282, 318, 4, '#ffd166');
  // wave lines
  stroke(ctx, [[220, 360], [260, 360], [300, 356], [340, 360]], '#7fb3d5', 3);
  stroke(ctx, [[420, 380], [460, 380], [500, 376], [540, 380]], '#7fb3d5', 3);
}

const harbourDiffs = [
  {
    id: 'sun-pale', x: 470, y: 66, r: 42,
    apply(ctx) { circle(ctx, 470, 66, 34, '#fff2cc'); },
  },
  {
    id: 'gull-gone', x: 200, y: 78, r: 16,
    apply(ctx) { ellipse(ctx, 200, 78, 18, 10, SKY1); },
  },
  {
    id: 'tower-band-blue', x: 80, y: 187, r: 18,
    apply(ctx) { rect(ctx, 66, 180, 28, 14, '#3f6fb5'); },
  },
  {
    id: 'sail-red', x: 168, y: 268, r: 26,
    apply(ctx) { poly(ctx, [[150, 292], [150, 236], [196, 292]], '#d94f3d'); },
  },
  {
    id: 'flag-gone', x: 371, y: 265, r: 14,
    apply(ctx) { poly(ctx, [[361, 260], [381, 265], [361, 270]], SKY1); },
  },
  {
    id: 'buoy-green', x: 282, y: 330, r: 18,
    apply(ctx) { circle(ctx, 282, 332, 12, '#3fae7a'); },
  },
  {
    id: 'fish-extra', x: 440, y: 352, r: 18,
    apply(ctx) {
      ellipse(ctx, 440, 352, 14, 6, '#ffd166');
      poly(ctx, [[454, 352], [464, 346], [464, 358]], '#ffd166');
      stroke(ctx, [[428, 364], [434, 368], [440, 364], [446, 368]], '#cfe8f5', 2);
    },
  },
  {
    id: 'cloud-extra', x: 330, y: 52, r: 26,
    apply(ctx) { cloud(ctx, 330, 52, 0.9, '#fff6e0'); },
  },
  {
    id: 'crate-extra', x: 120, y: 356, r: 20,
    apply(ctx) {
      rect(ctx, 100, 340, 40, 30, '#c9a15e');
      stroke(ctx, [[100, 340], [140, 370]], '#8a6a44', 3);
      stroke(ctx, [[140, 340], [100, 370]], '#8a6a44', 3);
    },
  },
];

// ---------------------------------------------------------------------------
// Scene 2 — Night Market. Deep-blue night, three stalls, paper lanterns.
// ---------------------------------------------------------------------------
const NIGHT = '#1c2440';
const GROUND2 = '#3a2f28';

function stall(ctx, x, awning, sign) {
  rect(ctx, x, 210, 140, 110, '#5a4632');
  poly(ctx, [[x - 10, 210], [x + 150, 210], [x + 132, 172], [x + 8, 172]], awning);
  for (let i = 0; i < 5; i += 1) rect(ctx, x + 6 + i * 28, 172, 14, 38, i % 2 ? '#f5f2ea' : awning);
  rect(ctx, x, 300, 140, 20, '#8a6a44');
  label(ctx, sign, x + 70, 240, 20, '#ffe08a');
}

function lantern(ctx, x, y, color) {
  ellipse(ctx, x, y, 13, 16, color);
  rect(ctx, x - 5, y - 19, 10, 4, '#ffd166');
  rect(ctx, x - 5, y + 15, 10, 4, '#ffd166');
  stroke(ctx, [[x, y - 19], [x, y - 30]], '#c9a15e', 2);
}

function drawMarket(ctx) {
  rect(ctx, 0, 0, 560, 400, NIGHT);
  circle(ctx, 500, 56, 26, '#f5f2ea');
  circle(ctx, 492, 50, 22, '#ffffff');
  // stars
  for (const [sx, sy] of [[60, 40], [150, 70], [240, 36], [330, 60], [420, 30], [90, 110], [280, 110]]) {
    circle(ctx, sx, sy, 2.5, '#ffe08a');
  }
  // string lights across the top
  stroke(ctx, [[0, 96], [140, 120], [280, 104], [420, 122], [560, 100]], '#c9a15e', 2);
  for (const [lx, ly] of [[70, 108], [180, 114], [300, 110], [410, 118], [500, 108]]) {
    circle(ctx, lx, ly + 8, 5, '#ffd166');
  }
  rect(ctx, 0, 320, 560, 80, GROUND2);
  stall(ctx, 30, '#d94f3d', 'FISH 5');
  stall(ctx, 210, '#2f8f6b', 'TEA 3');
  stall(ctx, 390, '#e8a13a', 'RICE 4');
  // fish on the first stall's counter
  ellipse(ctx, 70, 306, 16, 6, '#9fc6e8');
  poly(ctx, [[86, 306], [96, 300], [96, 312]], '#9fc6e8');
  ellipse(ctx, 110, 308, 13, 5, '#c9d6e8');
  // tea cups on the second stall
  rect(ctx, 250, 300, 18, 12, '#f5f2ea');
  rect(ctx, 280, 300, 18, 12, '#f5f2ea');
  // rice sacks on the third stall
  ellipse(ctx, 430, 306, 16, 10, '#e8dcc0');
  ellipse(ctx, 462, 306, 16, 10, '#e8dcc0');
  // paper lanterns hanging between stalls
  lantern(ctx, 185, 150, '#ff6b6b');
  lantern(ctx, 375, 150, '#3fae7a');
  lantern(ctx, 540, 160, '#ff6b6b');
  // cat sitting by the middle stall
  ellipse(ctx, 205, 356, 16, 12, '#2b2b2b');
  circle(ctx, 205, 340, 9, '#2b2b2b');
  poly(ctx, [[198, 332], [200, 322], [205, 330]], '#2b2b2b');
  poly(ctx, [[212, 332], [210, 322], [205, 330]], '#2b2b2b');
  // banner over the middle stall
  rect(ctx, 236, 130, 88, 22, '#f5f2ea');
  label(ctx, 'OPEN', 280, 141, 14, '#d94f3d');
  // basket on the ground
  ellipse(ctx, 520, 366, 18, 10, '#c9a15e');
}

const marketDiffs = [
  {
    id: 'lantern-pink', x: 375, y: 150, r: 20,
    apply(ctx) { ellipse(ctx, 375, 150, 13, 16, '#ff7fd4'); },
  },
  {
    id: 'cat-gone', x: 205, y: 346, r: 20,
    apply(ctx) { ellipse(ctx, 205, 350, 22, 20, GROUND2); },
  },
  {
    id: 'fish-extra', x: 140, y: 306, r: 16,
    apply(ctx) {
      ellipse(ctx, 140, 306, 14, 5, '#9fc6e8');
      poly(ctx, [[154, 306], [163, 301], [163, 311]], '#9fc6e8');
    },
  },
  {
    id: 'banner-gone', x: 280, y: 141, r: 20,
    apply(ctx) { rect(ctx, 236, 130, 88, 22, NIGHT); },
  },
  {
    id: 'awning-blue', x: 280, y: 190, r: 24,
    apply(ctx) {
      poly(ctx, [[200, 210], [360, 210], [342, 172], [218, 172]], '#3f6fb5');
      for (let i = 0; i < 5; i += 1) rect(ctx, 216 + i * 28, 172, 14, 38, i % 2 ? '#f5f2ea' : '#3f6fb5');
    },
  },
  {
    id: 'bulb-extra', x: 240, y: 118, r: 12,
    apply(ctx) { circle(ctx, 240, 122, 5, '#ffd166'); },
  },
  {
    id: 'moon-gone', x: 500, y: 56, r: 30,
    apply(ctx) { circle(ctx, 500, 56, 28, NIGHT); },
  },
  {
    id: 'price-eight', x: 100, y: 240, r: 18,
    apply(ctx) {
      rect(ctx, 62, 228, 76, 26, '#5a4632');
      label(ctx, 'FISH 8', 100, 241, 20, '#ffe08a');
    },
  },
  {
    id: 'sack-extra', x: 500, y: 360, r: 18,
    apply(ctx) { ellipse(ctx, 500, 362, 16, 10, '#e8dcc0'); },
  },
];

// ---------------------------------------------------------------------------
// Scene 3 — Tea Garden. Pale morning, pond, moon bridge, pagoda, koi.
// ---------------------------------------------------------------------------
const SKY3 = '#dcefd8';
const POND3 = '#7fc4c9';
const GRASS3 = '#8fbf6f';

function drawGarden(ctx) {
  rect(ctx, 0, 0, 560, 400, SKY3);
  circle(ctx, 480, 60, 24, '#fff6e0');
  cloud(ctx, 110, 56, 1, '#ffffff');
  cloud(ctx, 300, 44, 0.8, '#ffffff');
  // pine tree, left
  rect(ctx, 52, 210, 14, 90, '#6e5233');
  poly(ctx, [[59, 120], [18, 210], [100, 210]], '#3f7a4a');
  poly(ctx, [[59, 150], [26, 226], [92, 226]], '#35703f');
  poly(ctx, [[59, 180], [34, 244], [84, 244]], '#2f6b38');
  // pagoda, right
  rect(ctx, 420, 210, 76, 90, '#8a4a3a');
  poly(ctx, [[408, 210], [508, 210], [458, 176]], '#33415c');
  rect(ctx, 432, 248, 52, 90, '#a85a44');
  poly(ctx, [[420, 248], [496, 248], [458, 218]], '#33415c');
  rect(ctx, 446, 288, 24, 50, '#5a4632');
  circle(ctx, 458, 268, 6, '#ffe08a');
  // ground + pond
  rect(ctx, 0, 300, 560, 100, GRASS3);
  ellipse(ctx, 280, 356, 230, 46, POND3);
  // moon bridge over the pond
  ctx.strokeStyle = '#a85a44';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(280, 400, 92, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  for (let i = 0; i < 5; i += 1) {
    const a = Math.PI * (1.22 + i * 0.14);
    const bx = 280 + Math.cos(a) * 92;
    const by = 400 + Math.sin(a) * 92;
    rect(ctx, bx - 3, by - 8, 6, 16, '#8a4a3a');
  }
  // koi in the pond
  ellipse(ctx, 180, 352, 16, 6, '#ff8c42');
  poly(ctx, [[196, 352], [206, 347], [206, 357]], '#ff8c42');
  ellipse(ctx, 330, 372, 14, 5, '#f5f2ea');
  poly(ctx, [[344, 372], [353, 368], [353, 376]], '#f5f2ea');
  ellipse(ctx, 400, 348, 12, 5, '#ff8c42');
  // stone lantern, right of pond
  rect(ctx, 508, 330, 10, 40, '#9aa0a8');
  rect(ctx, 498, 318, 30, 12, '#9aa0a8');
  poly(ctx, [[496, 318], [528, 318], [512, 304]], '#7d838c');
  circle(ctx, 513, 312, 4, '#ffd166');
  // stepping stones, bottom left
  ellipse(ctx, 60, 380, 20, 8, '#c9c2b4');
  ellipse(ctx, 100, 388, 20, 8, '#c9c2b4');
  ellipse(ctx, 140, 380, 20, 8, '#c9c2b4');
  // cherry branch, top left
  stroke(ctx, [[0, 30], [60, 44], [120, 36]], '#6e5233', 5);
  for (const [bx, by] of [[30, 40], [70, 48], [105, 40], [52, 32]]) {
    circle(ctx, bx, by, 7, '#ffb7d5');
    circle(ctx, bx + 5, by - 4, 5, '#ffc9de');
  }
}

const gardenDiffs = [
  {
    id: 'koi-extra', x: 250, y: 362, r: 18,
    apply(ctx) {
      ellipse(ctx, 250, 362, 15, 6, '#ff8c42');
      poly(ctx, [[265, 362], [274, 357], [274, 367]], '#ff8c42');
    },
  },
  {
    id: 'blossom-white', x: 70, y: 42, r: 22,
    apply(ctx) {
      for (const [bx, by] of [[30, 40], [70, 48], [105, 40], [52, 32]]) {
        circle(ctx, bx, by, 7, '#ffffff');
        circle(ctx, bx + 5, by - 4, 5, '#f5f2ea');
      }
    },
  },
  {
    id: 'pagoda-dark', x: 458, y: 268, r: 12,
    apply(ctx) { circle(ctx, 458, 268, 6, '#3a2f28'); },
  },
  {
    id: 'flame-gone', x: 513, y: 312, r: 10,
    apply(ctx) { circle(ctx, 513, 312, 4, '#9aa0a8'); },
  },
  {
    id: 'stone-extra', x: 175, y: 384, r: 16,
    apply(ctx) { ellipse(ctx, 175, 384, 20, 8, '#c9c2b4'); },
  },
  {
    id: 'pine-tier-gone', x: 59, y: 195, r: 24,
    apply(ctx) { poly(ctx, [[59, 180], [34, 244], [84, 244]], SKY3); },
  },
  {
    id: 'frog-extra', x: 90, y: 330, r: 16,
    apply(ctx) {
      ellipse(ctx, 90, 330, 14, 9, '#3fae7a');
      circle(ctx, 82, 322, 5, '#3fae7a');
      circle(ctx, 98, 322, 5, '#3fae7a');
      circle(ctx, 82, 321, 2, '#1c2440');
      circle(ctx, 98, 321, 2, '#1c2440');
    },
  },
  {
    id: 'moon-gone', x: 480, y: 60, r: 28,
    apply(ctx) { circle(ctx, 480, 60, 26, SKY3); },
  },
  {
    id: 'bridge-plank-red', x: 280, y: 316, r: 18,
    apply(ctx) {
      ctx.strokeStyle = '#d94f3d';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(280, 400, 92, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    },
  },
];

// ---------------------------------------------------------------------------
// Scene 4 — Cliff Lighthouse. Dusk purple, sea, rocks, a tall lighthouse.
// ---------------------------------------------------------------------------
const SKY4 = '#3a3f6b';
const SEA4 = '#22406b';

function drawCliff(ctx) {
  rect(ctx, 0, 0, 560, 400, SKY4);
  for (const [sx, sy] of [[60, 50], [150, 90], [260, 40], [360, 80], [470, 44], [520, 110], [90, 140]]) {
    circle(ctx, sx, sy, 2.5, '#ffe08a');
  }
  circle(ctx, 490, 60, 20, '#f5f2ea');
  rect(ctx, 0, 260, 560, 140, SEA4);
  // cliff, left
  poly(ctx, [[0, 400], [0, 180], [90, 200], [150, 280], [170, 400]], '#4a4a58');
  poly(ctx, [[0, 400], [0, 260], [70, 280], [110, 400]], '#3a3a48');
  // lighthouse on the cliff
  rect(ctx, 46, 96, 34, 104, '#f5f2ea');
  rect(ctx, 46, 122, 34, 12, '#d94f3d');
  rect(ctx, 46, 152, 34, 12, '#d94f3d');
  rect(ctx, 42, 84, 42, 14, '#33415c');
  circle(ctx, 63, 91, 5, '#ffe08a');
  poly(ctx, [[63, 66], [44, 84], [82, 84]], '#d94f3d');
  // light beam to the right
  poly(ctx, [[80, 91], [330, 60], [330, 122]], 'rgba(255, 224, 138, 0.35)');
  // gulls
  gull(ctx, 220, 90, '#d8dce8');
  gull(ctx, 280, 130, '#d8dce8');
  gull(ctx, 400, 100, '#d8dce8');
  // small boat
  poly(ctx, [[380, 330], [380, 296], [414, 330]], '#f5f2ea');
  rect(ctx, 366, 330, 62, 12, '#7a4a2b');
  rect(ctx, 378, 288, 3, 44, '#5a4632');
  // rocks in the sea
  poly(ctx, [[200, 400], [210, 340], [250, 336], [268, 400]], '#3a3a48');
  poly(ctx, [[440, 400], [452, 356], [486, 352], [500, 400]], '#3a3a48');
  // foam lines
  stroke(ctx, [[150, 372], [190, 372], [230, 368], [270, 372]], '#8fb8d8', 3);
  stroke(ctx, [[300, 388], [340, 388], [380, 384], [420, 388]], '#8fb8d8', 3);
  // flag on the lighthouse roof
  poly(ctx, [[63, 66], [63, 52], [79, 59]], '#ffd166');
}

const cliffDiffs = [
  {
    id: 'beam-gone', x: 200, y: 91, r: 30,
    apply(ctx) { poly(ctx, [[80, 91], [330, 60], [330, 122]], SKY4); },
  },
  {
    id: 'star-extra', x: 320, y: 150, r: 12,
    apply(ctx) { circle(ctx, 320, 150, 3, '#ffe08a'); },
  },
  {
    id: 'sail-red', x: 397, y: 312, r: 20,
    apply(ctx) { poly(ctx, [[380, 330], [380, 296], [414, 330]], '#d94f3d'); },
  },
  {
    id: 'rock-extra', x: 320, y: 372, r: 20,
    apply(ctx) { poly(ctx, [[300, 400], [312, 356], [342, 352], [356, 400]], '#3a3a48'); },
  },
  {
    id: 'gull-gone', x: 280, y: 130, r: 16,
    apply(ctx) { ellipse(ctx, 280, 130, 18, 10, SKY4); },
  },
  {
    id: 'lamp-dark', x: 63, y: 91, r: 10,
    apply(ctx) { circle(ctx, 63, 91, 5, '#3a3a48'); },
  },
  {
    id: 'foam-extra', x: 480, y: 340, r: 18,
    apply(ctx) { stroke(ctx, [[440, 340], [470, 340], [500, 336], [530, 340]], '#8fb8d8', 3); },
  },
  {
    id: 'flag-red', x: 71, y: 59, r: 12,
    apply(ctx) { poly(ctx, [[63, 66], [63, 52], [79, 59]], '#d94f3d'); },
  },
  {
    id: 'band-blue', x: 63, y: 128, r: 16,
    apply(ctx) { rect(ctx, 46, 122, 34, 12, '#3f6fb5'); },
  },
];

// ---------------------------------------------------------------------------
// Scene 5 — Station Platform. Grey-blue morning, red train, clock, bench.
// ---------------------------------------------------------------------------
const SKY5 = '#b8c9d9';
const WALL5 = '#8a7a68';

function drawStation(ctx) {
  rect(ctx, 0, 0, 560, 400, SKY5);
  cloud(ctx, 120, 60, 1, '#ffffff');
  cloud(ctx, 380, 46, 0.9, '#ffffff');
  // station building
  rect(ctx, 0, 150, 560, 130, WALL5);
  rect(ctx, 0, 150, 560, 12, '#6e5f4f');
  // clock on the building
  circle(ctx, 280, 190, 26, '#f5f2ea');
  circle(ctx, 280, 190, 22, '#33415c');
  circle(ctx, 280, 190, 18, '#f5f2ea');
  stroke(ctx, [[280, 190], [280, 176]], '#33415c', 3);
  stroke(ctx, [[280, 190], [290, 196]], '#33415c', 3);
  circle(ctx, 280, 190, 3, '#d94f3d');
  // sign
  rect(ctx, 60, 176, 120, 26, '#33415c');
  label(ctx, 'HARBOUR', 120, 189, 16, '#ffe08a');
  // platform + tracks
  rect(ctx, 0, 280, 560, 70, '#9aa0a8');
  rect(ctx, 0, 350, 560, 50, '#5a5a60');
  stroke(ctx, [[0, 368], [560, 368]], '#c9c2b4', 4);
  stroke(ctx, [[0, 386], [560, 386]], '#c9c2b4', 4);
  for (let x = 10; x < 560; x += 40) rect(ctx, x, 360, 18, 34, '#3a3a40');
  // train
  rect(ctx, 300, 236, 240, 60, '#c0392b');
  rect(ctx, 300, 236, 240, 10, '#8e2a20');
  for (let i = 0; i < 4; i += 1) rect(ctx, 316 + i * 52, 252, 36, 24, '#bfe3f0');
  circle(ctx, 340, 306, 14, '#2b2b2b');
  circle(ctx, 340, 306, 6, '#9aa0a8');
  circle(ctx, 480, 306, 14, '#2b2b2b');
  circle(ctx, 480, 306, 6, '#9aa0a8');
  rect(ctx, 300, 296, 240, 8, '#33415c');
  // bench
  rect(ctx, 60, 300, 110, 10, '#8a6a44');
  rect(ctx, 60, 286, 110, 8, '#8a6a44');
  rect(ctx, 68, 310, 8, 26, '#5a4632');
  rect(ctx, 154, 310, 8, 26, '#5a4632');
  // suitcase by the bench
  rect(ctx, 190, 306, 34, 28, '#3f6fb5');
  rect(ctx, 202, 300, 10, 8, '#33415c');
  stroke(ctx, [[190, 320], [224, 320]], '#33415c', 3);
  // lamp post
  rect(ctx, 500, 200, 8, 100, '#33415c');
  circle(ctx, 504, 192, 10, '#ffe08a');
  // pigeon on the platform
  ellipse(ctx, 250, 332, 12, 8, '#7d838c');
  circle(ctx, 260, 324, 6, '#7d838c');
  circle(ctx, 262, 323, 1.5, '#1c2440');
}

const stationDiffs = [
  {
    id: 'clock-time', x: 280, y: 190, r: 28,
    apply(ctx) {
      circle(ctx, 280, 190, 18, '#f5f2ea');
      stroke(ctx, [[280, 190], [272, 178]], '#33415c', 3);
      stroke(ctx, [[280, 190], [292, 182]], '#33415c', 3);
      circle(ctx, 280, 190, 3, '#d94f3d');
    },
  },
  {
    id: 'window-dark', x: 420, y: 264, r: 18,
    apply(ctx) { rect(ctx, 420, 252, 36, 24, '#33415c'); },
  },
  {
    id: 'suitcase-red', x: 207, y: 320, r: 20,
    apply(ctx) {
      rect(ctx, 190, 306, 34, 28, '#d94f3d');
      stroke(ctx, [[190, 320], [224, 320]], '#8e2a20', 3);
    },
  },
  {
    id: 'pigeon-gone', x: 255, y: 328, r: 18,
    apply(ctx) { ellipse(ctx, 255, 330, 20, 14, '#9aa0a8'); },
  },
  {
    id: 'sign-station', x: 120, y: 189, r: 22,
    apply(ctx) {
      rect(ctx, 60, 176, 120, 26, '#33415c');
      label(ctx, 'STATION', 120, 189, 16, '#ffe08a');
    },
  },
  {
    id: 'lamp-off', x: 504, y: 192, r: 14,
    apply(ctx) { circle(ctx, 504, 192, 10, '#9aa0a8'); },
  },
  {
    id: 'bench-slat-gone', x: 115, y: 290, r: 18,
    apply(ctx) { rect(ctx, 60, 286, 110, 8, WALL5); },
  },
  {
    id: 'bag-extra', x: 40, y: 322, r: 18,
    apply(ctx) {
      rect(ctx, 24, 308, 30, 26, '#2f8f6b');
      rect(ctx, 34, 302, 10, 8, '#1f6b4d');
    },
  },
];

// ---------------------------------------------------------------------------
// Scene 6 — Firework Festival. Night fairground, ferris wheel, fireworks.
// ---------------------------------------------------------------------------
const SKY6 = '#141a33';

function burst(ctx, x, y, color, r) {
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * Math.PI * 2;
    stroke(ctx, [[x, y], [x + Math.cos(a) * r, y + Math.sin(a) * r]], color, 3);
    circle(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, 3, color);
  }
  circle(ctx, x, y, 5, '#ffffff');
}

function drawFestival(ctx) {
  rect(ctx, 0, 0, 560, 400, SKY6);
  circle(ctx, 70, 56, 22, '#f5f2ea');
  for (const [sx, sy] of [[160, 40], [250, 70], [340, 36], [430, 60], [510, 34], [120, 110]]) {
    circle(ctx, sx, sy, 2.5, '#ffe08a');
  }
  burst(ctx, 200, 110, '#ff6b6b', 42);
  burst(ctx, 360, 90, '#6ec6ff', 36);
  burst(ctx, 470, 160, '#ffd166', 30);
  // ferris wheel, right
  circle(ctx, 452, 260, 74, '#33415c');
  ctx.strokeStyle = '#9aa7b8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(452, 260, 74, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    stroke(ctx, [[452, 260], [452 + Math.cos(a) * 74, 260 + Math.sin(a) * 74]], '#9aa7b8', 2);
    circle(ctx, 452 + Math.cos(a) * 74, 260 + Math.sin(a) * 74, 8, '#ffd166');
  }
  circle(ctx, 452, 260, 10, '#ffd166');
  rect(ctx, 448, 334, 8, 66, '#33415c');
  // ground + stalls
  rect(ctx, 0, 330, 560, 70, '#2b2620');
  rect(ctx, 30, 280, 120, 50, '#5a4632');
  poly(ctx, [[22, 280], [158, 280], [142, 248], [38, 248]], '#d94f3d');
  rect(ctx, 190, 290, 100, 40, '#5a4632');
  poly(ctx, [[184, 290], [296, 290], [282, 262], [198, 262]], '#2f8f6b');
  // bunting across the top
  stroke(ctx, [[0, 30], [140, 52], [280, 34], [420, 54], [560, 32]], '#c9a15e', 2);
  for (let i = 0; i < 9; i += 1) {
    const bx = 30 + i * 58;
    const by = 34 + (i % 2 ? 8 : 0);
    poly(ctx, [[bx, by], [bx + 18, by], [bx + 9, by + 16]], ['#ff6b6b', '#ffd166', '#6ec6ff', '#3fae7a'][i % 4]);
  }
  // crowd silhouettes
  for (const [cx, cy, s] of [[80, 372, 1], [120, 378, 0.85], [230, 374, 1], [270, 380, 0.9], [330, 372, 1]]) {
    circle(ctx, cx, cy - 18 * s, 7 * s, '#0a0d18');
    rect(ctx, cx - 8 * s, cy - 12 * s, 16 * s, 28 * s, '#0a0d18');
  }
  // sparkler in one hand
  stroke(ctx, [[230, 356], [246, 340]], '#ffe08a', 2);
  circle(ctx, 246, 340, 4, '#ffd166');
}

const festivalDiffs = [
  {
    id: 'burst-green', x: 200, y: 110, r: 46,
    apply(ctx) { burst(ctx, 200, 110, '#3fae7a', 42); },
  },
  {
    id: 'cabin-gone', x: 526, y: 260, r: 14,
    apply(ctx) { circle(ctx, 526, 260, 9, SKY6); },
  },
  {
    id: 'moon-crescent', x: 70, y: 56, r: 26,
    apply(ctx) {
      circle(ctx, 70, 56, 22, '#f5f2ea');
      circle(ctx, 80, 50, 18, SKY6);
    },
  },
  {
    id: 'flag-gone', x: 204, y: 44, r: 14,
    apply(ctx) {
      poly(ctx, [[204, 42], [222, 42], [213, 58]], SKY6);
      stroke(ctx, [[0, 30], [140, 52], [280, 34], [420, 54], [560, 32]], '#c9a15e', 2);
    },
  },
  {
    id: 'awning-yellow', x: 90, y: 264, r: 24,
    apply(ctx) { poly(ctx, [[22, 280], [158, 280], [142, 248], [38, 248]], '#e8a13a'); },
  },
  {
    id: 'person-extra', x: 380, y: 372, r: 18,
    apply(ctx) {
      circle(ctx, 380, 354, 7, '#0a0d18');
      rect(ctx, 372, 360, 16, 28, '#0a0d18');
    },
  },
  {
    id: 'star-extra', x: 300, y: 150, r: 12,
    apply(ctx) { circle(ctx, 300, 150, 3, '#ffe08a'); },
  },
  {
    id: 'sparkler-gone', x: 242, y: 346, r: 14,
    apply(ctx) {
      stroke(ctx, [[230, 356], [246, 340]], SKY6, 3);
      circle(ctx, 246, 340, 5, SKY6);
    },
  },
];

// ---------------------------------------------------------------------------
// The catalogue: every scene with its name, painter and differences.
// ---------------------------------------------------------------------------
export const SCENES = {
  harbour: { id: 'harbour', drawBase: drawHarbour, diffs: harbourDiffs },
  market: { id: 'market', drawBase: drawMarket, diffs: marketDiffs },
  garden: { id: 'garden', drawBase: drawGarden, diffs: gardenDiffs },
  cliff: { id: 'cliff', drawBase: drawCliff, diffs: cliffDiffs },
  station: { id: 'station', drawBase: drawStation, diffs: stationDiffs },
  festival: { id: 'festival', drawBase: drawFestival, diffs: festivalDiffs },
};

export function sceneName(id) {
  return SCENE_META[id].name;
}

export function totalDifferences() {
  return Object.values(SCENES).reduce((sum, s) => sum + s.diffs.length, 0);
}

/** Pure check the node self-test runs: every diff inside the picture, radius sane. */
export function validateScenes() {
  const problems = [];
  for (const [id, scene] of Object.entries(SCENES)) {
    if (scene.diffs.length < 8) problems.push(`${id}: only ${scene.diffs.length} diffs`);
    const seen = new Set();
    for (const d of scene.diffs) {
      if (seen.has(d.id)) problems.push(`${id}: duplicate diff id ${d.id}`);
      seen.add(d.id);
      if (d.x - d.r < 0 || d.x + d.r > 560 || d.y - d.r < 0 || d.y + d.r > 400) {
        problems.push(`${id}/${d.id}: out of bounds (${d.x},${d.y},r${d.r})`);
      }
      if (d.r < 8 || d.r > 50) problems.push(`${id}/${d.id}: odd radius ${d.r}`);
      if (typeof d.apply !== 'function') problems.push(`${id}/${d.id}: no apply()`);
    }
  }
  return problems;
}

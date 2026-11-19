// WORLD, IN SIX SIGNALS — deterministic, offline pixel-art infographic.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const WIDTH = 1024;
const HEIGHT = 1024;
const rgba = Buffer.alloc(WIDTH * HEIGHT * 4);
const ink = {
  night: [7, 15, 27], panel: [11, 25, 40], panel2: [16, 34, 49],
  border: [72, 103, 124], grid: [38, 58, 73], white: [240, 245, 245],
  quiet: [169, 190, 201], faint: [111, 140, 155], ocean: [10, 27, 41],
  land: [34, 78, 82], landLight: [43, 93, 94], gold: [255, 194, 99],
  coral: [255, 119, 112], mint: [133, 224, 179], cyan: [88, 219, 204],
  blue: [117, 183, 255], violet: [183, 166, 255]
};
const px = (x, y, color, alpha) => {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
  const offset = (y * WIDTH + x) * 4;
  const a = alpha === undefined ? 1 : alpha / 255;
  const back = 1 - a;
  rgba[offset] = Math.round(color[0] * a + rgba[offset] * back);
  rgba[offset + 1] = Math.round(color[1] * a + rgba[offset + 1] * back);
  rgba[offset + 2] = Math.round(color[2] * a + rgba[offset + 2] * back);
  rgba[offset + 3] = 255;
};
function box(x, y, w, h, color, alpha) {
  const left = Math.max(0, Math.floor(x));
  const top = Math.max(0, Math.floor(y));
  const right = Math.min(WIDTH, Math.ceil(x + w));
  const bottom = Math.min(HEIGHT, Math.ceil(y + h));
  for (let yy = top; yy < bottom; yy++) for (let xx = left; xx < right; xx++) px(xx, yy, color, alpha);
}
function segment(x1, y1, x2, y2, color, thick, alpha) {
  let ax = Math.round(x1), ay = Math.round(y1), bx = Math.round(x2), by = Math.round(y2);
  const dx = Math.abs(bx - ax), sx = ax < bx ? 1 : -1;
  const dy = -Math.abs(by - ay), sy = ay < by ? 1 : -1;
  let error = dx + dy;
  const radius = Math.max(0, Math.floor((thick || 1) / 2));
  while (true) {
    box(ax - radius, ay - radius, radius * 2 + 1, radius * 2 + 1, color, alpha);
    if (ax === bx && ay === by) break;
    const doubled = 2 * error;
    if (doubled >= dy) { error += dy; ax += sx; }
    if (doubled <= dx) { error += dx; ay += sy; }
  }
}
function disk(cx, cy, radius, color, alpha) {
  for (let yy = -radius; yy <= radius; yy++) for (let xx = -radius; xx <= radius; xx++) {
    if (xx * xx + yy * yy <= radius * radius) px(cx + xx, cy + yy, color, alpha);
  }
}
function polygon(points, color, alpha) {
  const minY = Math.max(0, Math.floor(Math.min(...points.map(p => p[1]))));
  const maxY = Math.min(HEIGHT - 1, Math.ceil(Math.max(...points.map(p => p[1]))));
  for (let y = minY; y <= maxY; y++) {
    const crossings = [];
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xA, yA] = points[i], [xB, yB] = points[j];
      if ((yA > y) !== (yB > y)) crossings.push(xB + (y - yB) * (xA - xB) / (yA - yB));
    }
    crossings.sort((a, b) => a - b);
    for (let i = 0; i + 1 < crossings.length; i += 2) {
      box(Math.floor(crossings[i]), y, Math.ceil(crossings[i + 1] - crossings[i]) + 1, 1, color, alpha);
    }
  }
}
function panel(x, y, w, h, radius, fill, outline) {
  for (let yy = Math.floor(y); yy < y + h; yy++) for (let xx = Math.floor(x); xx < x + w; xx++) {
    let cx = xx, cy = yy;
    if (xx < x + radius) cx = x + radius;
    else if (xx >= x + w - radius) cx = x + w - radius - 1;
    if (yy < y + radius) cy = y + radius;
    else if (yy >= y + h - radius) cy = y + h - radius - 1;
    const distance = (xx - cx) * (xx - cx) + (yy - cy) * (yy - cy);
    if (distance <= radius * radius) px(xx, yy, fill);
    if (outline && distance <= radius * radius && distance >= (radius - 1) * (radius - 1)) px(xx, yy, outline);
  }
}

// Seven-row bitmap alphabet, drawn from this file so rendering needs no installed fonts.
const face = {
  ' ': ['00000','00000','00000','00000','00000','00000','00000'],
  A: ['01110','10001','10001','11111','10001','10001','10001'],
  B: ['11110','10001','10001','11110','10001','10001','11110'],
  C: ['01111','10000','10000','10000','10000','10000','01111'],
  D: ['11110','10001','10001','10001','10001','10001','11110'],
  E: ['11111','10000','10000','11110','10000','10000','11111'],
  F: ['11111','10000','10000','11110','10000','10000','10000'],
  G: ['01111','10000','10000','10111','10001','10001','01111'],
  H: ['10001','10001','10001','11111','10001','10001','10001'],
  I: ['11111','00100','00100','00100','00100','00100','11111'],
  J: ['00111','00010','00010','00010','10010','10010','01100'],
  K: ['10001','10010','10100','11000','10100','10010','10001'],
  L: ['10000','10000','10000','10000','10000','10000','11111'],
  M: ['10001','11011','10101','10101','10001','10001','10001'],
  N: ['10001','11001','10101','10011','10001','10001','10001'],
  O: ['01110','10001','10001','10001','10001','10001','01110'],
  P: ['11110','10001','10001','11110','10000','10000','10000'],
  Q: ['01110','10001','10001','10001','10101','10010','01101'],
  R: ['11110','10001','10001','11110','10100','10010','10001'],
  S: ['01111','10000','10000','01110','00001','00001','11110'],
  T: ['11111','00100','00100','00100','00100','00100','00100'],
  U: ['10001','10001','10001','10001','10001','10001','01110'],
  V: ['10001','10001','10001','10001','10001','01010','00100'],
  W: ['10001','10001','10001','10101','10101','10101','01010'],
  X: ['10001','10001','01010','00100','01010','10001','10001'],
  Y: ['10001','10001','01010','00100','00100','00100','00100'],
  Z: ['11111','00001','00010','00100','01000','10000','11111'],
  '0': ['01110','10001','10011','10101','11001','10001','01110'],
  '1': ['00100','01100','00100','00100','00100','00100','01110'],
  '2': ['01110','10001','00001','00010','00100','01000','11111'],
  '3': ['11110','00001','00001','01110','00001','00001','11110'],
  '4': ['00010','00110','01010','10010','11111','00010','00010'],
  '5': ['11111','10000','10000','11110','00001','00001','11110'],
  '6': ['01110','10000','10000','11110','10001','10001','01110'],
  '7': ['11111','00001','00010','00100','01000','01000','01000'],
  '8': ['01110','10001','10001','01110','10001','10001','01110'],
  '9': ['01110','10001','10001','01111','00001','00001','01110'],
  ':': ['00000','00100','00100','00000','00100','00100','00000'],
  ',': ['00000','00000','00000','00000','00110','00110','00100'],
  '.': ['00000','00000','00000','00000','00000','00110','00110'],
  '-': ['00000','00000','00000','11111','00000','00000','00000'],
  '/': ['00001','00010','00010','00100','01000','01000','10000'],
  '&': ['01100','10010','10100','01000','10101','10010','01101'],
  '$': ['00100','01111','10100','01110','00101','11110','00100'],
  '+': ['00000','00100','00100','11111','00100','00100','00000'],
  '|': ['00100','00100','00100','00100','00100','00100','00100'],
  "'": ['00100','00100','00000','00000','00000','00000','00000']
};
function typeLine(words, x, y, size, color, tracking) {
  const gap = tracking === undefined ? size : tracking;
  let cursor = x;
  for (const letter of String(words).toUpperCase()) {
    const map = face[letter] || face[' '];
    for (let row = 0; row < 7; row++) for (let col = 0; col < 5; col++) {
      if (map[row][col] === '1') box(cursor + col * size, y + row * size, size, size, color);
    }
    cursor += 5 * size + gap;
  }
  return cursor - gap;
}
function typeBlock(rows, x, y, size, color, lineGap) {
  const spacing = lineGap === undefined ? 9 * size : lineGap;
  rows.forEach((row, index) => typeLine(row, x, y + index * spacing, size, color, size));
}

function icon(kind, x, y, color) {
  if (kind === 'speech') {
    panel(x, y, 21, 15, 3, color, null);
    polygon([[x + 5,y + 12],[x + 3,y + 19],[x + 12,y + 13]], color);
    segment(x + 5,y + 5,x + 16,y + 5,ink.panel,1);
    segment(x + 5,y + 9,x + 13,y + 9,ink.panel,1);
  } else if (kind === 'meeting') {
    disk(x + 6,y + 6,3,color); disk(x + 18,y + 6,3,color);
    segment(x + 1,y + 20,x + 9,y + 13,color,2);
    segment(x + 23,y + 20,x + 15,y + 13,color,2);
    segment(x + 9,y + 15,x + 15,y + 15,color,2);
  } else if (kind === 'shield') {
    polygon([[x+11,y],[x+21,y+4],[x+20,y+14],[x+11,y+22],[x+2,y+14],[x+1,y+4]],color);
    segment(x+6,y+11,x+10,y+15,ink.panel,2); segment(x+10,y+15,x+17,y+7,ink.panel,2);
  } else if (kind === 'leaf') {
    polygon([[x+2,y+18],[x+4,y+7],[x+12,y+1],[x+22,y+3],[x+20,y+13],[x+12,y+20]],color);
    segment(x+4,y+19,x+18,y+5,ink.panel,1);
  } else if (kind === 'chart') {
    segment(x+1,y+21,x+24,y+21,color,1);
    box(x+4,y+14,4,7,color); box(x+11,y+9,4,12,color); box(x+18,y+3,4,18,color);
  } else if (kind === 'chip') {
    panel(x+5,y+4,15,15,2,ink.panel,color);
    for (let i=0;i<4;i++) {
      const at=x+7+i*4;
      segment(at,y+1,at,y+4,color,1); segment(at,y+19,at,y+22,color,1);
      segment(x+2,at-2,x+5,at-2,color,1); segment(x+20,at-2,x+23,at-2,color,1);
    }
    disk(x+12,y+11,2,color);
  }
}

// Quiet graph-paper texture leaves the central map as the main visual anchor.
box(0, 0, WIDTH, HEIGHT, ink.night);
for (let x = 42; x < WIDTH; x += 48) segment(x, 136, x, 880, ink.grid, 1, 22);
for (let y = 144; y < HEIGHT; y += 44) segment(30, y, 994, y, ink.grid, 1, 22);
box(42, 38, 5, 88, ink.cyan);
segment(64, 132, 960, 132, ink.border, 1, 160);

// Centered header with the date set as the second reading level.
typeLine('WORLD, IN SIX SIGNALS', 70, 39, 7, ink.white, 7);
typeLine('18 NOV 2026', 70, 91, 4, ink.cyan, 4);
typeLine('WORLD NEWS / DAILY BRIEF', 660, 101, 2, ink.quiet, 2);

// Large, deliberately simplified continental silhouettes.
polygon([[275,420],[298,386],[339,364],[377,370],[405,388],[430,397],[453,427],[440,447],[421,455],[412,475],[390,486],[381,515],[359,530],[344,511],[330,490],[310,481],[301,460],[280,454]],ink.land,238);
polygon([[368,536],[391,545],[407,570],[411,604],[424,633],[417,670],[402,701],[391,677],[384,643],[369,611],[359,579]],ink.land,238);
polygon([[506,410],[529,394],[560,399],[577,420],[568,439],[542,442],[518,430]],ink.landLight,242);
polygon([[526,449],[553,439],[578,451],[593,476],[589,511],[578,543],[560,575],[543,603],[526,579],[520,548],[510,523],[500,493],[506,465]],ink.land,238);
polygon([[565,388],[604,372],[644,381],[675,395],[710,390],[744,407],[780,412],[805,433],[791,451],[760,454],[735,469],[709,462],[687,482],[664,465],[640,468],[620,450],[596,451],[577,432]],ink.landLight,242);
polygon([[694,488],[721,476],[744,488],[755,516],[747,546],[730,570],[714,584],[704,559],[698,531]],ink.land,238);
polygon([[789,592],[818,581],[846,589],[862,607],[850,624],[822,628],[800,615]],ink.land,238);

// Location routes are thin and sit beneath all labels and story cards.
const place = {
  sf: [397, 472], antalya: [589, 455], gulf: [620, 505],
  shenzhen: [700, 467], asia: [677, 517]
};
segment(300, 507, place.gulf[0], place.gulf[1], ink.coral, 2, 170);
segment(724, 506, place.antalya[0], place.antalya[1], ink.mint, 2, 170);
segment(477, 686, place.asia[0], place.asia[1], ink.blue, 2, 150);
segment(555, 686, place.sf[0], place.sf[1], ink.cyan, 2, 150);
segment(612, 403, place.shenzhen[0], place.shenzhen[1], ink.gold, 2, 190);
Object.entries(place).forEach(([key, point]) => {
  const accent = key === 'sf' ? ink.cyan : key === 'antalya' ? ink.mint : key === 'gulf' ? ink.coral : key === 'shenzhen' ? ink.gold : ink.blue;
  disk(point[0], point[1], key === 'asia' ? 4 : 5, accent);
});
typeLine('SAN FRANCISCO', 411, 482, 2, ink.cyan, 2);
typeLine('ANTALYA', 548, 430, 2, ink.mint, 2);
typeLine('GULF', 635, 515, 2, ink.coral, 2);
typeLine('ASIA', 660, 486, 2, ink.blue, 2);

// Story cards carry their own visual cue and concise, factual labels.
const stories = [
  {
    id:'01', x:34, y:151, w:468, h:218, color:ink.gold, icon:'speech', tag:'DIPLOMACY',
    title:['APEC: OPEN TRADE','FAIR GROWTH'], titleSize:4,
    body:['XI: OPENNESS','PUTIN: CRITICIZED','SANCTIONS & TARIFFS'], bodySize:2.8, bodyY:271, bodyLead:8
  },
  {
    id:'02', x:522, y:151, w:468, h:218, color:ink.gold, icon:'meeting', tag:'BILATERAL MEETING',
    title:['XI-PUTIN MEET','IN SHENZHEN'], titleSize:4,
    body:['BILATERAL TALKS HELD','ON 18 NOV'], bodySize:2.5, bodyY:283, bodyLead:10
  },
  {
    id:'03', x:20, y:402, w:286, h:256, color:ink.coral, icon:'shield', tag:'SECURITY',
    title:['GULF STATES REPORT','INTERCEPTIONS'], titleSize:2,
    body:['GOVERNMENTS','REPORTED','MISSILE & DRONE','INTERCEPTIONS'], bodySize:2.5, bodyY:499, bodyLead:10
  },
  {
    id:'04', x:718, y:402, w:286, h:264, color:ink.mint, icon:'leaf', tag:'COP31 / CLIMATE',
    title:['ISLANDS SEEK','CLIMATE FINANCE'], titleSize:2.5,
    body:[], bodySize:3, bodyY:0, bodyLead:0, climate:true
  },
  {
    id:'05', x:34, y:686, w:468, h:194, color:ink.blue, icon:'chart', tag:'MARKETS',
    title:['ASIA MARKETS','MIXED'], titleSize:3.5,
    body:['SOME AI & CHIP SHARES','REBOUNDED'], bodySize:3, bodyY:790, bodyLead:9
  },
  {
    id:'06', x:522, y:686, w:468, h:194, color:ink.cyan, icon:'chip', tag:'AI SUPPLY CHAIN',
    title:['10 COUNTRIES SIGN','PAX SILICA DECLARATION'], titleSize:2.8,
    body:['JAPAN ANNOUNCED 18 NOV','SIGNED 15 NOV / SAN FRANCISCO'], bodySize:2.2, bodyY:789, bodyLead:11
  }
];
function drawStory(story) {
  panel(story.x, story.y, story.w, story.h, 14, ink.panel, ink.border);
  icon(story.icon, story.x + 14, story.y + 12, story.color);
  typeLine(story.tag, story.x + 45, story.y + 20, 2, story.color, 2);
  typeLine(story.id, story.x + story.w - 40, story.y + 18, 2, story.color, 2);
  const headingY = story.y + (story.id === '05' || story.id === '06' ? 44 : 48);
  typeBlock(story.title, story.x + 16, headingY, story.titleSize, ink.white, 9 * story.titleSize);
  if (story.climate) {
    const start = story.y + 97;
    typeLine('SEEK $500M', story.x + 16, start, 3.5, ink.gold, 3.5);
    typeLine('ADAPTATION', story.x + 16, start + 30, 3, ink.quiet, 3);
    typeLine('SEEK $200M', story.x + 16, start + 63, 3.5, ink.gold, 3.5);
    typeLine('EARLY WARNINGS', story.x + 16, start + 93, 2.8, ink.quiet, 2.8);
  } else {
    typeBlock(story.body, story.x + 16, story.bodyY, story.bodySize, ink.quiet, story.bodyLead * story.bodySize);
  }
  const divider = story.y + story.h - 28;
  segment(story.x + 16, divider, story.x + story.w - 16, divider, ink.border, 1, 150);
  const foot = story.id === '01' ? 'APEC CEO SUMMIT'
    : story.id === '02' ? 'LEADERS MEETING'
    : story.id === '03' ? 'GULF REGION / 18 NOV'
    : story.id === '04' ? 'REQUEST ONLY / NOT AWARDED'
    : story.id === '05' ? 'ASIA / 18 NOV' : 'SAN FRANCISCO';
  disk(story.x + 21, story.y + story.h - 14, 3, story.color);
  typeLine(foot, story.x + 31, story.y + story.h - 20, 1.5, ink.quiet, 1.5);
}
stories.forEach(drawStory);

// One shared Shenzhen pin identifies both adjacent stories.
panel(397, 371, 226, 31, 12, [43, 37, 26], ink.gold);
typeLine('SHENZHEN / 18 NOV', 410, 380, 2, ink.gold, 2);

// Footer sources are separated and balanced across two short rows.
segment(40, 890, 984, 890, ink.border, 1, 175);
typeLine('SOURCES / AP / REUTERS / XINHUA / GOV.CN', 254, 908, 2, ink.quiet, 2);
typeLine('JAPAN MOFA / AUSTRALIA DISR', 344, 936, 2, ink.quiet, 2);

// PNG encoder: filter-0 RGBA scanlines and standard CRC-protected chunks.
function crc32(bytes) {
  let checksum = 0xffffffff;
  for (const value of bytes) {
    checksum ^= value;
    for (let bit = 0; bit < 8; bit++) checksum = (checksum >>> 1) ^ (0xedb88320 & -(checksum & 1));
  }
  return (checksum ^ 0xffffffff) >>> 0;
}
function pngChunk(label, content) {
  const name = Buffer.from(label, 'ascii');
  const chunk = Buffer.alloc(content.length + 12);
  chunk.writeUInt32BE(content.length, 0);
  name.copy(chunk, 4);
  content.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([name, content])), content.length + 8);
  return chunk;
}
function createPng() {
  const scanlines = Buffer.alloc((WIDTH * 4 + 1) * HEIGHT);
  for (let y = 0; y < HEIGHT; y++) rgba.copy(scanlines, y * (WIDTH * 4 + 1) + 1, y * WIDTH * 4, (y + 1) * WIDTH * 4);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(WIDTH, 0);
  header.writeUInt32BE(HEIGHT, 4);
  header[8] = 8; header[9] = 6;
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(scanlines, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}
const targetDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
mkdirSync(targetDir, { recursive: true });
writeFileSync(join(targetDir, 'entry.png'), createPng());

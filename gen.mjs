// gen.mjs — draws entry.png (1024x1024) for news-image-20261117.
// Pure Node stdlib: own rasteriser + own PNG encoder (zlib + manual chunks).
// Deterministic: no randomness, no dates, no environment input.
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const W = 1024;
const H = 1024;
const buf = Buffer.alloc(W * H * 3);

// ---- palette ----
const PAPER = [247, 243, 234];
const WHITE = [255, 255, 255];
const INK = [28, 28, 28];
const NAVY = [20, 38, 77];
const RED = [179, 35, 27];
const GOLD = [242, 193, 78];
const SKY = [207, 227, 242];
const SEA = [63, 109, 142];
const GREY = [90, 90, 90];
const DARKGREY = [60, 60, 60];
const ORANGE = [224, 122, 32];
const TEAL = [31, 122, 110];
const BLUE = [43, 94, 167];
const PURPLE = [110, 60, 140];

// ---- pixel helpers ----
function px(x, y, c) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2];
}
function rect(x, y, w, h, c) {
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) px(i, j, c);
}
function circle(cx, cy, r, c) {
  for (let j = cy - r; j <= cy + r; j++)
    for (let i = cx - r; i <= cx + r; i++) {
      const dx = i - cx, dy = j - cy;
      if (dx * dx + dy * dy <= r * r) px(i, j, c);
    }
}
function line(x0, y0, x1, y1, c, w = 1) {
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy, x = x0, y = y0;
  for (;;) {
    for (let a = 0; a < w; a++) for (let b = 0; b < w; b++) px(x + a, y + b, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
}
// scanline polygon fill (even-odd)
function fillPoly(pts, c) {
  let minY = H, maxY = 0;
  for (const [, y] of pts) { if (y < minY) minY = y; if (y > maxY) maxY = y; }
  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
      if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) {
        xs.push(Math.round(x0 + ((y - y0) * (x1 - x0)) / (y1 - y0)));
      }
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2)
      for (let x = xs[k]; x <= xs[k + 1]; x++) px(x, y, c);
  }
}

// ---- 5x7 bitmap font (uppercase, digits, punctuation) ----
const FONT = {
  A: ["01110","10001","10001","11111","10001","10001","10001"],
  B: ["11110","10001","10001","11110","10001","10001","11110"],
  C: ["01110","10001","10000","10000","10000","10001","01110"],
  D: ["11110","10001","10001","10001","10001","10001","11110"],
  E: ["11111","10000","10000","11110","10000","10000","11111"],
  F: ["11111","10000","10000","11110","10000","10000","10000"],
  G: ["01110","10001","10000","10111","10001","10001","01111"],
  H: ["10001","10001","10001","11111","10001","10001","10001"],
  I: ["01110","00100","00100","00100","00100","00100","01110"],
  J: ["00111","00010","00010","00010","00010","10010","01100"],
  K: ["10001","10010","10100","11000","10100","10010","10001"],
  L: ["10000","10000","10000","10000","10000","10000","11111"],
  M: ["10001","11011","10101","10101","10001","10001","10001"],
  N: ["10001","11001","10101","10011","10001","10001","10001"],
  O: ["01110","10001","10001","10001","10001","10001","01110"],
  P: ["11110","10001","10001","11110","10000","10000","10000"],
  Q: ["01110","10001","10001","10001","10101","10010","01101"],
  R: ["11110","10001","10001","11110","10100","10010","10001"],
  S: ["01111","10000","10000","01110","00001","00001","11110"],
  T: ["11111","00100","00100","00100","00100","00100","00100"],
  U: ["10001","10001","10001","10001","10001","10001","01110"],
  V: ["10001","10001","10001","10001","10001","01010","00100"],
  W: ["10001","10001","10001","10101","10101","10101","01010"],
  X: ["10001","10001","01010","00100","01010","10001","10001"],
  Y: ["10001","10001","01010","00100","00100","00100","00100"],
  Z: ["11111","00001","00010","00100","01000","10000","11111"],
  "0": ["01110","10001","10011","10101","11001","10001","01110"],
  "1": ["00100","01100","00100","00100","00100","00100","01110"],
  "2": ["01110","10001","00001","00110","01000","10000","11111"],
  "3": ["11111","00010","00100","00010","00001","10001","01110"],
  "4": ["00010","00110","01010","10010","11111","00010","00010"],
  "5": ["11111","10000","11110","00001","00001","10001","01110"],
  "6": ["00110","01000","10000","11110","10001","10001","01110"],
  "7": ["11111","00001","00010","00100","01000","01000","01000"],
  "8": ["01110","10001","10001","01110","10001","10001","01110"],
  "9": ["01110","10001","10001","01111","00001","00010","01100"],
  " ": ["00000","00000","00000","00000","00000","00000","00000"],
  ".": ["00000","00000","00000","00000","00000","01100","01100"],
  ",": ["00000","00000","00000","00000","01100","00100","01000"],
  ":": ["00000","01100","01100","00000","01100","01100","00000"],
  $: ["00100","01111","10100","01110","00101","11110","00100"],
  "%": ["11001","11010","00010","00100","01000","01011","10011"],
  "-": ["00000","00000","00000","01110","00000","00000","00000"],
  "'": ["00100","00100","01000","00000","00000","00000","00000"],
  "&": ["01100","10010","10100","01000","10101","10010","01101"],
  "/": ["00001","00010","00010","00100","01000","01000","10000"],
  "(": ["00010","00100","01000","01000","01000","00100","00010"],
  ")": ["01000","00100","00010","00010","00010","00100","01000"],
  "+": ["00000","00100","00100","11111","00100","00100","00000"],
};
function textWidth(s, scale) {
  return s.length * 6 * scale - scale;
}
function drawText(s, x, y, scale, c) {
  let cx = x;
  for (const ch of s) {
    const g = FONT[ch] || FONT[" "];
    for (let r = 0; r < 7; r++)
      for (let col = 0; col < 5; col++)
        if (g[r][col] === "1") rect(cx + col * scale, y + r * scale, scale, scale, c);
    cx += 6 * scale;
  }
}
function drawTextCentered(s, cx, y, scale, c) {
  drawText(s, Math.round(cx - textWidth(s, scale) / 2), y, scale, c);
}

// ---- PNG encoder ----
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(b) {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}
function encodePNG() {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    buf.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- layout ----
rect(0, 0, W, H, PAPER);
// header
rect(0, 0, W, 140, NAVY);
drawTextCentered("17 NOVEMBER 2026", W / 2, 26, 6, WHITE);
drawTextCentered("WORLD NEWS IN ONE IMAGE", W / 2, 96, 3, GOLD);
rect(0, 140, W, 6, RED);

// panel frame helper: returns inner geometry
function panel(x, y, w, h, tagColor, tag) {
  rect(x, y, w, h, WHITE);
  // border
  rect(x, y, w, 3, NAVY); rect(x, y + h - 3, w, 3, NAVY);
  rect(x, y, 3, h, NAVY); rect(x + w - 3, y, 3, h, NAVY);
  // tag bar
  rect(x + 3, y + 3, w - 6, 34, tagColor);
  drawText(tag, x + 16, y + 12, 2, WHITE);
  return { x, y, w, h, dx: x + 16, dy: y + 40, dw: w - 32 };
}
function panelText(p, title, lines) {
  const ty = p.y + p.h - 24 - lines.length * 16 - 30;
  drawTextCentered(title, p.x + p.w / 2, ty, 3, NAVY);
  lines.forEach((ln, i) => drawTextCentered(ln, p.x + p.w / 2, ty + 32 + i * 16, 2, INK));
}

// ---- Panel 1: Kerch bridge / Kyiv (top-left) ----
{
  const p = panel(16, 162, 488, 296, RED, "UKRAINE");
  const ax = p.dx, ay = p.dy, aw = p.dw; // draw area 456 x ~140
  rect(ax, ay, aw, 150, SKY);
  rect(ax, ay + 118, aw, 32, SEA); // water
  // bridge towers
  rect(ax + 90, ay + 28, 12, 92, DARKGREY);
  rect(ax + 354, ay + 28, 12, 92, DARKGREY);
  // deck: two parts with a collapsed gap in the middle
  rect(ax + 10, ay + 88, 180, 10, DARKGREY);
  rect(ax + 266, ay + 88, 180, 10, DARKGREY);
  // fallen deck segment, tilted into the water
  fillPoly([[ax + 200, ay + 92], [ax + 258, ay + 92], [ax + 246, ay + 118], [ax + 196, ay + 116]], GREY);
  // cables
  line(ax + 96, ay + 28, ax + 10, ay + 88, GREY, 2);
  line(ax + 96, ay + 28, ax + 190, ay + 88, GREY, 2);
  line(ax + 360, ay + 28, ax + 266, ay + 88, GREY, 2);
  line(ax + 360, ay + 28, ax + 446, ay + 88, GREY, 2);
  // smoke over the gap
  circle(ax + 228, ay + 52, 16, GREY);
  circle(ax + 214, ay + 40, 12, [120, 120, 120]);
  circle(ax + 244, ay + 38, 11, [120, 120, 120]);
  // flame at the gap
  circle(ax + 228, ay + 86, 9, ORANGE);
  circle(ax + 228, ay + 86, 5, GOLD);
  // waves
  line(ax + 20, ay + 132, ax + 120, ay + 132, WHITE, 2);
  line(ax + 300, ay + 140, ax + 420, ay + 140, WHITE, 2);
  panelText(p, "KERCH BRIDGE HIT AGAIN", [
    "ROADWAY COLLAPSES, TRAFFIC STOPPED",
    "KYIV BRIDGES STRUCK: HEAT, WATER,",
    "POWER CUT",
  ]);
}

// ---- Panel 2: Hormuz tankers (top-right) ----
{
  const p = panel(520, 162, 488, 296, ORANGE, "MIDDLE EAST");
  const ax = p.dx, ay = p.dy, aw = p.dw;
  rect(ax, ay, aw, 150, [233, 220, 196]);
  rect(ax, ay + 96, aw, 54, SEA); // sea
  // tanker hull
  rect(ax + 40, ay + 78, 340, 26, [122, 40, 32]);
  fillPoly([[ax + 380, ay + 78], [ax + 428, ay + 78], [ax + 408, ay + 104], [ax + 380, ay + 104]], [122, 40, 32]);
  // containers
  rect(ax + 70, ay + 52, 40, 26, BLUE);
  rect(ax + 116, ay + 52, 40, 26, TEAL);
  rect(ax + 162, ay + 52, 40, 26, GOLD);
  // bridge tower
  rect(ax + 330, ay + 46, 34, 32, WHITE);
  // fire + smoke from midship
  circle(ax + 230, ay + 70, 12, ORANGE);
  circle(ax + 230, ay + 66, 7, GOLD);
  circle(ax + 226, ay + 34, 16, [50, 50, 50]);
  circle(ax + 244, ay + 20, 13, [70, 70, 70]);
  circle(ax + 212, ay + 18, 11, [70, 70, 70]);
  // mines in the water
  for (const [mx, my] of [[ax + 60, ay + 128], [ax + 400, ay + 134]]) {
    circle(mx, my, 8, DARKGREY);
    for (let a = 0; a < 8; a++) {
      const ang = (a * Math.PI) / 4;
      line(Math.round(mx + Math.cos(ang) * 8), Math.round(my + Math.sin(ang) * 8),
        Math.round(mx + Math.cos(ang) * 13), Math.round(my + Math.sin(ang) * 13), DARKGREY, 2);
    }
  }
  // waves
  line(ax + 150, ay + 126, ax + 260, ay + 126, WHITE, 2);
  panelText(p, "TANKERS BURN AT HORMUZ", [
    "MINES HIT TANKERS, FIRES AT SEA",
    "DRONES AT BAHRAIN BASE STOPPED",
    "CARRIER ROOSEVELT ARRIVES",
  ]);
}

// ---- Panel 3: Xi / Trump / Putin summit (middle-left) ----
{
  const p = panel(16, 474, 488, 296, TEAL, "CHINA - SUMMIT");
  const ax = p.dx, ay = p.dy, aw = p.dw;
  rect(ax, ay, aw, 150, [228, 238, 232]);
  // three flag poles
  const flagY = ay + 14, flagH = 62, flagW = 96;
  const xs = [ax + 20, ax + 180, ax + 340];
  for (const fx of xs) line(fx + 8, ay + 8, fx + 8, ay + 140, DARKGREY, 3);
  // China flag: red with yellow stars (dots)
  rect(xs[0] + 11, flagY, flagW, flagH, [222, 41, 16]);
  circle(xs[0] + 30, flagY + 16, 6, GOLD);
  circle(xs[0] + 52, flagY + 12, 3, GOLD);
  circle(xs[0] + 56, flagY + 26, 3, GOLD);
  circle(xs[0] + 50, flagY + 38, 3, GOLD);
  // USA flag: stripes + blue canton
  for (let s = 0; s < 7; s++) rect(xs[1] + 11, flagY + s * 9, flagW, 5, s % 2 === 0 ? [178, 34, 52] : WHITE);
  rect(xs[1] + 11, flagY, 40, 32, NAVY);
  // Russia flag: white / blue / red
  rect(xs[2] + 11, flagY, flagW, 21, WHITE);
  rect(xs[2] + 11, flagY + 21, flagW, 21, BLUE);
  rect(xs[2] + 11, flagY + 42, flagW, 20, RED);
  // ground line + meeting table hint
  line(ax, ay + 140, ax + aw, ay + 140, DARKGREY, 2);
  drawTextCentered("19 NOV - SHENZHEN", ax + aw / 2, ay + 122, 2, NAVY);
  panelText(p, "XI, TRUMP, PUTIN TO MEET", [
    "FIRST THREE-WAY TALKS",
    "19 NOV IN SHENZHEN",
    "AT THE APEC SUMMIT",
  ]);
}

// ---- Panel 4: Pentagon audit (middle-right) ----
{
  const p = panel(520, 474, 488, 296, BLUE, "USA - PENTAGON");
  const ax = p.dx, ay = p.dy, aw = p.dw;
  rect(ax, ay, aw, 150, [228, 232, 240]);
  // pentagon building (top-down pentagon shape)
  const cx = ax + aw / 2, cy = ay + 78, R = 62;
  const pts = [];
  for (let k = 0; k < 5; k++) {
    const ang = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
    pts.push([Math.round(cx + R * Math.cos(ang)), Math.round(cy + R * Math.sin(ang))]);
  }
  fillPoly(pts, [120, 128, 138]);
  // inner courtyard pentagon
  const pts2 = [];
  for (let k = 0; k < 5; k++) {
    const ang = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
    pts2.push([Math.round(cx + 24 * Math.cos(ang)), Math.round(cy + 24 * Math.sin(ang))]);
  }
  fillPoly(pts2, [228, 232, 240]);
  // red stamp: FAILED AUDIT
  rect(ax + aw / 2 - 130, ay + 128, 260, 18, RED);
  drawTextCentered("AUDIT FAILED", ax + aw / 2, ay + 131, 2, WHITE);
  panelText(p, "PENTAGON FAILS 9TH AUDIT", [
    "$4.8 TRILLION UNVERIFIED",
    "9TH YEAR IN A ROW",
  ]);
}

// ---- Panel 5: measles (bottom, wide) ----
{
  const p = panel(16, 786, 992, 222, PURPLE, "USA - HEALTH");
  const ax = p.dx, ay = p.dy;
  // bar chart, left half
  const chartX = ax + 10, chartY = ay + 14, chartW = 380, chartH = 130;
  rect(chartX, chartY, chartW, chartH, [240, 238, 244]);
  const bars = [18, 30, 46, 66, 96, 118];
  const bw = 44, gap = 14;
  bars.forEach((bh, i) => {
    const bx = chartX + 16 + i * (bw + gap);
    rect(bx, chartY + chartH - 8 - bh, bw, bh, i === bars.length - 1 ? RED : [150, 60, 70]);
  });
  line(chartX, chartY + chartH - 8, chartX + chartW, chartY + chartH - 8, INK, 2);
  drawText("CASES", chartX + 4, chartY + 4, 2, INK);
  drawText("1991", chartX + 16, chartY + chartH + 6, 2, GREY);
  drawText("2026", chartX + chartW - 52, chartY + chartH + 6, 2, RED);
  // text, right half
  const tx = ax + 430;
  drawText("US LOSES MEASLES-FREE", tx, ay + 24, 3, NAVY);
  drawText("STATUS", tx, ay + 56, 3, NAVY);
  drawText("MOST CASES SINCE 1991", tx, ay + 96, 2, INK);
  drawText("13 BABIES BORN WITH MEASLES", tx, ay + 118, 2, RED);
  // bottom strip under the panel, on the paper background
  drawTextCentered("TUESDAY 17 NOVEMBER 2026 - FIVE STORIES, ONE DAY", W / 2, 1012, 1, GREY);
}

writeFileSync(new URL("./entry.png", import.meta.url), encodePNG());
console.log("entry.png written");

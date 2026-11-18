// main.ts — entry program for news-image-20261117.
// Copies the pre-rendered entry.png next to this file into $MAKEFUN_OUTPUT_DIR.
// Standard library only; deterministic (byte-for-byte copy, no timestamps).
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR;
if (!outDir) throw new Error("MAKEFUN_OUTPUT_DIR is not set");
const src = join(here, "entry.png");
// Fail loudly instead of copying a bad file: PNG signature + 1 MiB cap.
const data = readFileSync(src);
const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
if (!data.subarray(0, 8).equals(PNG_SIG)) throw new Error("entry.png is not a PNG");
if (data.length > 1048576) throw new Error(`entry.png too large: ${data.length} bytes`);
const width = data.readUInt32BE(16);
const height = data.readUInt32BE(20);
if (width !== 1024 || height !== 1024) throw new Error(`entry.png is ${width}x${height}, expected 1024x1024`);
mkdirSync(outDir, { recursive: true });
copyFileSync(src, join(outDir, "entry.png"));
console.log(`entry.png copied to ${join(outDir, "entry.png")} (${data.length} bytes, 1024x1024)`);

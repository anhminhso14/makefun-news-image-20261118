import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const bot = process.env.MAKEFUN_BOT_DIR ?? process.cwd();
const output = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const image = join(bot, 'entry.png');
const target = join(output, 'entry.png');
const details = statSync(image);

if (!details.isFile() || details.size > 1024 * 1024) {
  throw new Error('entry.png must be a regular image no larger than 1 MiB');
}

const bytes = readFileSync(image);
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
if (bytes.length < 24 || !bytes.subarray(0, 8).equals(signature)) {
  throw new Error('entry.png must be a valid PNG');
}
if (bytes.readUInt32BE(16) !== 1024 || bytes.readUInt32BE(20) !== 1024) {
  throw new Error('entry.png must be 1024 by 1024 pixels');
}

mkdirSync(output, { recursive: true });
copyFileSync(image, target);

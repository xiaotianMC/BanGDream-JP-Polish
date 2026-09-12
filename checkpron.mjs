// pronunciation.yaml の verified_readings を検証する使い捨てスクリプト。
// （validate.mjs と同じ yaml 解決方法を使う）
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const parse = (await import(pathToFileURL(join(
  process.env.DSH_NPX_ROOT, 'node_modules/yaml/dist/index.js')).href)).parse;

const d = parse(readFileSync('.dsh/skills/bangdream-jp-tts/dictionary/pronunciation.yaml', 'utf8'));
console.log('top-level groups:', Object.keys(d).join(', '));
const vr = d.verified_readings || [];
console.log(`\nverified_readings: ${vr.length}`);
for (const e of vr) {
  console.log(`  ${e.word.padEnd(12)} -> ${String(e.reading).padEnd(14)} keys=[${Object.keys(e).join(',')}]`);
}
const p = vr.find(e => e.word === 'ポピパ！ピポパ！');
console.log('\nポピパ！ピポパ！ note:');
console.log(p.note);

// 萌娘百科页面 → 纯文本分节提取。
// 用法：
//   node extract.mjs <html>              列出所有节
//   node extract.mjs <html> <section…>   提取指定节
//
// 注意：本维基的节标题形如
//   <div class="mw-heading mw-heading2"><h2 id="简介">…</h2><span class="mw-editsection">…</span></div>
// 正文在 </div> 之后。所以必须按 div.mw-heading 定界，不能只匹配 <h2>…</h2>：
// 那会把后面同级的节一起吞进来。用 mw-editsection 作为节边界最稳。
import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) { console.error('usage: node extract.mjs <html> [section ...]'); process.exit(2); }
const raw = readFileSync(file, 'utf8');

const strip = (s) => s
  .replace(/<script[\s\S]*?<\/script>/g, '')
  .replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<sup[\s\S]*?<\/sup>/g, '')
  // ── 出典の「本編でない」マークアップを行内に明示する ──
  // これをやらないと、ジョークや伏せ字が地の文と区別できず、
  // 台詞として引用してしまう（実際に一度やらかした）。
  //   just-kidding-text … 打ち消し線付きの冗談。本編の台詞ではない
  //   heimu             … マウスオーバーで見える伏せ字。推測・補足・ネタバレ
  .replace(/<s class="just-kidding-text"[^>]*>([\s\S]*?)<\/s>/g, '〖冗談〗$1〖/冗談〗')
  .replace(/<span class="heimu"[^>]*>([\s\S]*?)<\/span>/g, '〖伏せ字〗$1〖/伏せ字〗')
  .replace(/<[^>]*class="[^"]*\bheimu\b[^"]*"[^>]*>([\s\S]*?)<\/span>/g, '〖伏せ字〗$1〖/伏せ字〗')
  .replace(/<br\s*\/?>/g, '\n')
  .replace(/<\/t[dh]>/g, '|')
  .replace(/<\/tr>/g, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/[ \t\u00a0]+/g, ' ')
  .replace(/\n{2,}/g, '\n')
  .trim();

// 节边界 = 每个 mw-heading 块的起点
const heads = [];
const re = /<div class="mw-heading mw-heading([1-6])"><h([1-6])[^>]*>([\s\S]*?)<\/h\2>/g;
let m;
while ((m = re.exec(raw))) {
  const inner = m[3].replace(/<span[^>]*id="[^"]*"[^>]*><\/span>/g, '').replace(/<[^>]+>/g, '').trim();
  // 一部の記事は見出しが作品ネタで装飾されている。
  // 例：白金燐子のページは全見出しが「「……（简介）」」の形で、
  // 素の節名では完全一致で引けない。鉤括弧と「……」を剥がす。
  const normalized = inner
    .replace(/^[「『]/, '').replace(/[」』]$/, '')
    .replace(/^[…\s]+/, '')
    .trim();
  heads.push({ level: +m[1], title: inner, normalized, start: m.index });
}

if (!heads.length) { console.error('no mw-heading blocks found — page format changed?'); process.exit(3); }

const wanted = process.argv.slice(3);
if (!wanted.length) {
  console.log(`${file}\n  revision: ${(raw.match(/oldid=(\d+)/) || [])[1] ?? '?'}`);
  const lm = raw.match(/lastmod"\s*:\s*"([^"]+)"/);
  if (lm) console.log(`  last edited: ${lm[1]}`);
  console.log(`  sections (${heads.length}):`);
  heads.forEach((h, i) => {
    const next = heads.slice(i + 1).find(x => x.level <= h.level);
    const len = (next ? next.start : raw.length) - h.start;
    console.log(`    ${'  '.repeat(Math.max(0, h.level - 2))}h${h.level} ${h.title}  (${len} chars)`);
  });
  process.exit(0);
}

for (const w of wanted) {
  // 完全一致 → 正規化一致 → 部分一致 の順に探す（装飾された見出しに対応）
  let idx = heads.findIndex(h => h.title === w);
  if (idx < 0) idx = heads.findIndex(h => h.normalized === w);
  if (idx < 0) idx = heads.findIndex(h => h.normalized.includes(w) || h.title.includes(w));
  if (idx < 0) { console.log(`\n### ${w} — NOT FOUND`); continue; }
  const h = heads[idx];
  const next = heads.slice(idx + 1).find(x => x.level <= h.level);
  const body = raw.slice(h.start, next ? next.start : raw.length);
  // 砍掉标题自身的 mw-editsection 尾巴
  const cut = body.indexOf('</div>');
  const content = cut >= 0 ? body.slice(cut + 6) : body;
  console.log(`\n${'='.repeat(70)}\n### ${w}\n${'='.repeat(70)}`);
  console.log(strip(content));
}

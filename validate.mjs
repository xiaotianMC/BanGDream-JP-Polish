// Skill bundle 校验器 —— 数据驱动的 skill 最怕 YAML 静默损坏。
// 用法：node validate.mjs   （可在任意 cwd 运行）
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const base = join(here, '.dsh/skills/bangdream-jp-tts');

// yaml 解析器：本地依赖 → DSH checkout（软链）→ 直接报错
async function loadYaml() {
  try {
    return (await import('yaml')).parse;
  } catch { /* fall through */ }
  const npxRoot = process.env.DSH_NPX_ROOT;
  if (npxRoot) {
    try {
      return (await import(pathToFileURL(join(npxRoot, 'node_modules/yaml/dist/index.js')).href)).parse;
    } catch { /* fall through */ }
  }
  console.error('找不到 yaml 解析器。二选一：');
  console.error('  npm i yaml                              （在仓库根目录）');
  console.error('  set DSH_NPX_ROOT=<dsh checkout 路径>     （复用 DSH 自带的 yaml）');
  process.exit(2);
}
const parse = await loadYaml();

// 固定文件 + corrections/ 下所有角色记录（自动发现，新增记录会被自动纳入校验）
function discover() {
  const fixed = [
    'corrections/_rules.yaml',
    'dictionary/pronunciation.yaml',
    'dictionary/proper-nouns.yaml',
  ];
  const records = [];
  const cdir = join(base, 'corrections');
  for (const e of readdirSync(cdir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue; // 跳过 _schema.md / _rules.yaml
    for (const f of readdirSync(join(cdir, e.name))) {
      if (f.endsWith('.yaml')) records.push(`corrections/${e.name}/${f}`);
    }
  }
  return [...fixed, ...records.sort()];
}
const FILES = discover();

let problems = 0;
const fail = (m) => { console.log(`  !! ${m}`); problems++; };

for (const f of FILES) {
  let doc;
  try {
    doc = parse(readFileSync(join(base, f), 'utf8'));
  } catch (e) {
    console.log(`FAIL ${f}\n     ${e.message.split('\n')[0]}`);
    problems++;
    continue;
  }
  console.log(`OK   ${f}`);

  if (f.endsWith('_rules.yaml')) {
    console.log(`     rules: ${doc.rules.length}`);
    for (const r of doc.rules) {
      // _schema.md §5 要求：无边界必过拟合，所以 excludes 是必填
      if (!r.excludes) fail(`${r.id}: 缺 excludes（无边界必过拟合）`);
      if (!r.confidence || !r.evidence_count) fail(`${r.id}: 缺 confidence/evidence_count`);
      const rank = { observed: 2, recommended: 9, established: Infinity }[r.confidence];
      if (rank !== undefined && r.evidence_count > rank) {
        fail(`${r.id}: confidence=${r.confidence} 与 evidence_count=${r.evidence_count} 不符`);
      }
    }
  }

  // correction 记录：由 _schema.md §3 的必填字段驱动
  if (f.startsWith('corrections/') && !f.endsWith('_rules.yaml')) {
    const REQUIRED = ['id', 'date', 'character', 'scene', 'source', 'pairs', 'confidence', 'evidence_count'];
    for (const k of REQUIRED) if (doc[k] === undefined) fail(`缺必填字段 ${k}`);
    if (!doc.tts_engine) console.log('     tts_engine: null（未猜引擎，符合 G8）');
    let n = 0;
    for (const [i, p] of (doc.pairs ?? []).entries()) {
      n += p.changes?.length ?? 0;
      if (!p.original || !p.corrected) fail(`pairs[${i}] 缺 original/corrected`);
      for (const c of p.changes ?? []) {
        // _schema.md §6：没有 reason 的记录没有价值；没有 issues 等于没分类
        if (!c.reason) fail(`pairs[${i}] change "${c.from}" 缺 reason`);
        if (!c.issues?.length) fail(`pairs[${i}] change "${c.from}" 缺 issues 分类`);
      }
    }
    // §5：升级判定要求 evidence_count 与 confidence 相符
    const cap = { observed: 2, recommended: 9, established: Infinity }[doc.confidence];
    if (cap !== undefined && doc.evidence_count > cap) {
      fail(`confidence=${doc.confidence} 与 evidence_count=${doc.evidence_count} 不符`);
    }
    if (!doc.not_promoted?.length) fail('缺 not_promoted —— 说明没做"是否该推广"的判断');
    console.log(`     pairs: ${doc.pairs?.length}, changes: ${n}, not_promoted: ${doc.not_promoted?.length}`);
  }

  if (f.includes('pronunciation')) {
    // unverified 是一份待办清单（用 issue/action），不是读音条目（用 reason）——两者规则不同
    const { unverified = [], ...entryGroups } = doc;
    const all = Object.values(entryGroups).filter(Array.isArray).flat();
    console.log(`     entries: ${all.length}, verified:false: ${all.filter(e => e.verified === false).length}, 待确认: ${unverified.length}`);
    for (const e of all) if (!e.reason) fail(`"${e.word ?? e.item}" 缺 reason`);
    for (const u of unverified) if (!u.issue || !u.action) fail(`待确认 "${u.item}" 缺 issue/action`);
  }

  if (f.includes('proper-nouns')) {
    console.log(`     bands: ${doc.bands.length}, characters: ${doc.characters.length}`);
    // 角色表里声明了 rules_file 的，文件必须真实存在
    for (const c of doc.characters.filter(c => c.rules_file)) {
      const p = join(base, 'characters', c.rules_file);
      try { readFileSync(p); } catch { fail(`${c.canonical}: rules_file ${c.rules_file} 不存在`); }
    }
  }
}

console.log(problems === 0 ? '\nALL OK' : `\n${problems} PROBLEM(S)`);
process.exit(problems === 0 ? 0 : 1);

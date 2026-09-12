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
    'dictionary/address-forms.yaml',
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

// address-forms.yaml の検査でキャラクター登録を照合するため先に読む
const properNouns = parse(readFileSync(join(base, 'dictionary/proper-nouns.yaml'), 'utf8'));

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

    // ── 角色ファイルは characters/<band>/ に置く ──
    // バンド → ディレクトリ名の対応。projects では bands.canonical が片仮名なので、
    // latin か既知の対応表から引く。
    const BAND_DIR = {
      'ポッピンパーティ': 'poppin-party',
      'マイゴ': 'mygo',
    };
    const charDir = join(base, 'characters');
    const dirs = readdirSync(charDir, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name);
    const undeclared = dirs.filter(d => !Object.values(BAND_DIR).includes(d));
    if (undeclared.length) fail(`characters/ に未登録のバンドディレクトリ: ${undeclared.join(', ')}`);

    for (const d of Object.values(BAND_DIR)) {
      const bandFile = join(charDir, d, '_band.md');
      try { readFileSync(bandFile); } catch { fail(`characters/${d}/_band.md が無い（語体マップの置き場）`); }
    }

    // rules_file はバンド別パス。実在確認 + ディレクトリと band の一致確認
    let withRules = 0;
    for (const c of doc.characters.filter(c => c.rules_file)) {
      withRules++;
      const p = join(charDir, c.rules_file);
      try { readFileSync(p); } catch { fail(`${c.canonical}: rules_file ${c.rules_file} 不存在`); continue; }
      const dir = c.rules_file.split('/')[0];
      if (!c.rules_file.includes('/')) {
        fail(`${c.canonical}: rules_file はバンド別パスにする（${c.rules_file}）`);
      } else if (c.band && BAND_DIR[c.band] && BAND_DIR[c.band] !== dir) {
        fail(`${c.canonical}: band「${c.band}」に対し rules_file のディレクトリ「${dir}」が不一致`);
      }
    }
    console.log(`     rules_file あり: ${withRules} / バンドディレクトリ: ${dirs.length}`);

    // 角色全员にファイルがあるべきバンド（members 数と rules_file 数を突き合わせ）
    for (const b of doc.bands) {
      const dir = BAND_DIR[b.canonical];
      if (!dir || !b.members) continue;
      const inBand = doc.characters.filter(c => c.band === b.canonical);
      const missing = inBand.filter(c => !c.rules_file).map(c => c.canonical);
      if (missing.length) fail(`${b.canonical}: rules_file 未設定のメンバー → ${missing.join(', ')}`);
      console.log(`     ${b.canonical}: メンバー ${inBand.length} 名（全員 rules_file あり）`);
    }

    // 称呼表已拆分到 address-forms.yaml，此处只确认没有残留
    if (doc.address_forms) fail('address_forms 已拆到 dictionary/address-forms.yaml，此处不应再保留');
    // 角色条目的 band 必须能在 bands 里找到
    const bandNames = new Set(doc.bands.map(b => b.canonical));
    for (const c of doc.characters.filter(c => c.band)) {
      if (!bandNames.has(c.band)) fail(`${c.canonical}: band「${c.band}」不在 bands 段中`);
    }

    // ── zh と zh_variants.official の整合 ──
    // 同じ中文名を 2 箇所に持っているので、片方だけ直すと必ず食い違う。
    // characters[].zh      = その角色の中文名（正引き用）
    // zh_variants[].official = Gate B が使う公式訳（変体比較用）
    const byJp = new Map((doc.zh_variants ?? []).map(v => [v.japanese, v]));
    let zhCount = 0;
    for (const c of doc.characters.filter(c => c.zh)) {
      zhCount++;
      const v = byJp.get(c.canonical);
      if (!v) { fail(`${c.canonical}: zh はあるが zh_variants に項目がない`); continue; }
      if (v.official !== c.zh) {
        fail(`${c.canonical}: zh「${c.zh}」と zh_variants.official「${v.official}」が不一致`);
      }
    }
    for (const v of doc.zh_variants ?? []) {
      const c = doc.characters.find(c => c.canonical === v.japanese);
      if (!c) { fail(`zh_variants「${v.japanese}」に対応する角色がない`); continue; }
      if (!c.zh) fail(`zh_variants「${v.japanese}」はあるが角色側に zh がない`);
    }
    console.log(`     zh / zh_variants: ${zhCount} 名（整合確認済み）`);
  }

  if (f.includes('address-forms')) {
    // canonical に加え aliases も既知とする。
    // 称呼データは出典の表記をそのまま採るため、通称（チュチュ等）で
    // 引かれることがある。aliases を無視すると正しいデータを誤検出する。
    const known = new Set(properNouns.characters.map(c => c.canonical));
    for (const c of properNouns.characters) for (const a of c.aliases ?? []) known.add(a);
    known.add('目上'); known.add('初対面');
    const OWNERS = new Set(Object.keys(doc).filter(k => !['source', 'version', 'updated', 'unregistered'].includes(k)));
    let total = 0;

    // 手工维护的嵌套 map，容易重复键 —— yaml 解析器会静默覆盖，所以查原文
    for (const owner of OWNERS) {
      const lines = readFileSync(join(base, f), 'utf8').split('\n');
      const start = lines.findIndex(l => l === `${owner}:`);
      if (start < 0) continue;
      for (const section of ['addresses', 'addressed_by']) {
        const s = lines.findIndex((l, i) => i > start && l === `  ${section}:`);
        if (s < 0) continue;
        const seen = new Set();
        for (const line of lines.slice(s + 1)) {
          if (/^ {0,2}\S/.test(line)) break;   // 回到 owner 级或下一节
          const m = /^ {4}([^\s#][^:]*):/.exec(line);
          if (!m) continue;
          if (seen.has(m[1])) fail(`${owner}.${section} 中「${m[1]}」重复（yaml 会静默覆盖）`);
          seen.add(m[1]);
        }
      }
    }

    for (const owner of OWNERS) {
      const o = doc[owner];
      if (!known.has(owner) && !['高松燈', '戸山香澄', '花園たえ', '市ヶ谷有咲'].includes(owner)) {
        fail(`称呼表主体「${owner}」未在 proper-nouns.yaml 的 characters 中登记`);
      }
      for (const section of ['addresses', 'addressed_by']) {
        const entries = o?.[section];
        if (!entries) continue;
        for (const [who, v] of Object.entries(entries)) {
          total++;
          if (!known.has(who)) fail(`${owner}.${section} 引用了未登记的角色「${who}」`);
          // never_met = 出典「-」。称呼が無いのが正なので forms は空でよい
          if (v.never_met === true) {
            if ((v.forms ?? []).length) fail(`${owner}.${section}.${who}: never_met なのに forms がある`);
          }
          for (const fm of v.forms ?? []) {
            if (!fm.form) fail(`${owner}.${section}.${who}: forms 项缺 form`);
            if (!fm.register) fail(`${owner}.${section}.${who}:「${fm.form}」缺 register（语体是 G6 检查的关键）`);
          }
          // 多形态有两种性质：时间轴推进 vs 同时可用的变体。必须显式区分，
          // 否则无法判断「同一场景能不能混用」——这正是 G6 要防的错。
          const forms = v.forms ?? [];
          if (forms.length > 1) {
            if (v.progression === undefined) {
              fail(`${owner}.${section}.${who}: 有多个 form 但缺 progression（须声明是时间轴还是变体）`);
            } else if (v.progression === true && forms.some(fm => !fm.stage)) {
              fail(`${owner}.${section}.${who}: progression: true 但缺 stage（无法判断时间轴）`);
            }
          }
          if (v.confirmed === undefined && v.never_met !== true) fail(`${owner}.${section}.${who}: 缺 confirmed 标记`);
        }
      }
    }
    console.log(`     subjects: ${OWNERS.size}, 称呼条目: ${total}`);
    const revs = doc.source?.revisions;
    if (!revs && !doc.source?.revision) fail('缺 source.revision(s) —— 来源版本必须记录');
    else if (revs) console.log(`     来源: ${Object.keys(revs).length} 项目 / ${doc.source.work}`);
    else console.log(`     来源: ${doc.source.work} rev.${doc.source.revision}`);
  }
}

console.log(problems === 0 ? '\nALL OK' : `\n${problems} PROBLEM(S)`);
process.exit(problems === 0 ? 0 : 1);

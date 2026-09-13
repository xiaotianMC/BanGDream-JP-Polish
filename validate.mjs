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
      'レイズアスイレン': 'raise-a-suilen',
      'ロゼリア': 'roselia',
      'アヴェムジカ': 'ave-mujica',
      'アフターグロウ': 'afterglow',
      // ↓ 成員を置かないバンド／ユニット。_band.md のみ。
      //   crychic: 5 人全員が他バンドにファイルを持つ（二重管理を避ける）
      //   sumimi : 相方 三角初華 はアヴェムジカ側にファイルを持つ
      'CRYCHIC': 'crychic',
      'スミミ': 'sumimi',
    };
    const charDir = join(base, 'characters');
    const dirs = readdirSync(charDir, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name);

    // ── バンド以外のカテゴリ ──
    // characters/ 配下には「バンド」以外の分類も置く。
    // 例：music-industry（音楽業界）→ livehouse（LiveHouse 経営・運営）
    // これらは BAND_DIR に無いので、ディレクトリ名を明示的に既知とする。
    // ★ ここを更新しないと「未登録のバンドディレクトリ」として fail する。
    const NON_BAND = new Set([
      'music-industry',   // 音楽業界（カテゴリ）
      'livehouse',        // LiveHouse 職種（music-industry 配下）
    ]);
    const undeclared = dirs.filter(d => !Object.values(BAND_DIR).includes(d) && !NON_BAND.has(d));
    if (undeclared.length) fail(`characters/ に未登録のバンドディレクトリ: ${undeclared.join(', ')}`);

    // 非バンドカテゴリにも「共通情報の置き場」が要る。
    // _category.md / _<subcategory>.md のどちらかがあることを確認する。
    const catDir = join(charDir, 'music-industry');
    try {
      readdirSync(catDir);
      for (const need of ['_category.md', join('livehouse', '_livehouse.md')]) {
        try { readFileSync(join(catDir, need)); }
        catch { fail(`characters/music-industry/${need} が無い（カテゴリ共通情報の置き場）`); }
      }
      console.log(`     非バンドカテゴリ: music-industry（livehouse を含む）`);
    } catch { /* music-industry が無ければ検査しない */ }

    for (const d of Object.values(BAND_DIR)) {
      const bandFile = join(charDir, d, '_band.md');
      try { readFileSync(bandFile); } catch { fail(`characters/${d}/_band.md が無い（語体マップの置き場）`); }
    }

    // ── 名前を持つ実体の frontmatter は name と japanese_name を両方持つ ──
    // 片方しか無いと `name（japanese_name）` 形式のタイトルが
    // 「undefined. undefined」になる（実際に一度なった）。
    // テンプレートは name が空欄のひな形なので除外する。
    let named = 0;
    for (const f of readdirSync(charDir, { withFileTypes: true })) {
      const stack = f.isDirectory() ? [join(charDir, f.name)] : [];
      while (stack.length) {
        const d = stack.pop();
        for (const e of readdirSync(d, { withFileTypes: true })) {
          const p = join(d, e.name);
          if (e.isDirectory()) { stack.push(p); continue; }
          if (!e.name.endsWith('.md') || e.name.startsWith('_template')) continue;
          const txt = readFileSync(p, 'utf8');
          const m = txt.match(/^```ya?ml\n([\s\S]*?)\n```/m);
          if (!m) continue;
          let y; try { y = parse(m[1]); } catch { continue; }
          const key = Object.keys(y ?? {})[0];
          if (!['character', 'band', 'category', 'subcategory'].includes(key)) continue;
          const b = y[key] ?? {};
          named++;
          if (b.name == null) fail(`${p.slice(charDir.length + 1)}: frontmatter に name が無い`);
          if (b.japanese_name === undefined) {
            fail(`${p.slice(charDir.length + 1)}: frontmatter に japanese_name が無い`
              + `（name（japanese_name）形式のタイトルが undefined になる）`);
          }
        }
      }
    }
    console.log(`     frontmatter の named 実体: ${named} 件（name/japanese_name 両方を検査）`);

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

    // ── 中文名（Gate B）──
    // 正体は characters の zh / zh_alt / zh_community の 1 箇所のみ。
    // zh_variants は**保存しない**——以前は同じ値を 2 箇所に持っており、
    // 片方だけ直して食い違う構造だった。今はここで導出する。
    //
    // 導出結果（Gate B が読む形）:
    //   { japanese, official, alt?, community? }
    const zhCharacters = doc.characters.filter(c => c.zh);
    const derived = zhCharacters.map(c => ({
      japanese: c.canonical,
      official: c.zh,
      ...(c.zh_alt ? { alt: c.zh_alt } : {}),
      ...(c.zh_community ? { community: c.zh_community } : {}),
    }));

    // 保存されていたら構造が戻っている（二重管理の再発）
    if (doc.zh_variants !== undefined) {
      fail('zh_variants をファイルに保存しないこと（characters から導出する。二重管理の再発）');
    }
    // 導出元の健全性
    for (const c of zhCharacters) {
      if (c.zh_community && !(c.zh_alt ?? []).includes(c.zh_community)) {
        fail(`${c.canonical}: zh_community「${c.zh_community}」が zh_alt に含まれていない`);
      }
    }
    const dupZh = derived.map(d => d.official).filter((x, i, a) => a.indexOf(x) !== i);
    if (dupZh.length) fail(`中文名が重複: ${[...new Set(dupZh)].join(', ')}`);

    console.log(`     中文名: ${derived.length} 名（characters から導出）`);
    for (const d of derived) {
      const ex = [d.alt ? `alt=[${d.alt.join('/')}]` : '', d.community ? `community=${d.community}` : ''].filter(Boolean).join(' ');
      console.log(`       ${d.japanese} → ${d.official}${ex ? '  ' + ex : ''}`);
    }
  }

  if (f.includes('address-forms')) {
    // canonical に加え aliases も既知とする。
    // 称呼データは出典の表記をそのまま採るため、通称（チュチュ等）で
    // 引かれることがある。aliases を無視すると正しいデータを誤検出する。
    //
    // ★ バンド成員（characters）だけでなく、**バンドに所属しない
    //   音楽業界の関係者（staff）**も称呼表の主体・対象になりうる。
    //   例：LIVE HOUSE スタッフの 月島麻里奈。
    //   両方を既知として扱わないと、正しいデータを「未登録」と誤判定する。
    const allPeople = [...properNouns.characters, ...(properNouns.staff ?? [])];
    const known = new Set(allPeople.map(c => c.canonical));
    for (const c of allPeople) for (const a of c.aliases ?? []) known.add(a);
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

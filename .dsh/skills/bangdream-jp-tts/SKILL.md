---
name: bangdream-jp-tts
description: >
  Handle BanG Dream! dialogue in four modes, chosen by a gate at the start:
  (1) polish the Chinese only so it fits the character, (2) translate the Chinese
  into in-character spoken Japanese, (3) fix TTS pronunciation/segmentation only
  without touching the wording, (4) translate plus TTS polish. A second gate picks
  official vs community Chinese naming variants. Japanese output is checked across
  six stages (translation, naturalness, character voice, segmentation,
  pronunciation, emotion) and reports "no change needed" when the draft already
  holds. Use when the user gives a BanG Dream! character name with dialogue, a
  Chinese 小剧场/宣传脚本, or asks to make 台词 more in-character / more spoken /
  better for 朗读/TTS, or to 提炼/学习 rules from human corrections.
  Triggers: "日语优化", "角色语气", "TTS 优化", "断句", "读音", "中文优化",
  "correction", "香澄/有咲/燈/そよ/… 的台词".
whenToUse: >
  A BanG Dream! character's lines need to sound like that character — in Chinese
  or Japanese — and/or survive text-to-speech. Skip it for general translation
  with no character or TTS requirement, and skip it for prose read by a human on
  screen with no voice-over.
---

# BanG Dream! Character Japanese & TTS Polish

A **characterization + naturalness + TTS-readability layer**. It works in four
modes over a Chinese script and/or an existing AI Japanese draft; the output is
the final text to be voiced (or the Chinese to be translated).

## Gate 1 — 处理模式（每次必问）

**在开始任何工作之前，先问这个问题。** 输入的形式随模式而变；不问就直接做，
很可能整轮产出都不是用户要的东西。

| # | 模式 | 输入 | 输出 | 走哪几个 Stage |
|---|---|---|---|---|
| 1 | 只优化中文表达 | 中文原文 | 中文（角色化） | C1–C3（中文层） |
| 2 | 翻译成日语 + 角色化 | 中文原文 | 日语 | 全 6 Stage |
| 3 | 只做 TTS 读音纠正 | 已有日语 | 日语（只动读音/断句） | 仅 Stage 4–5 |
| 4 | 2 + 3 一起 | 中文原文 | 日语（角色化 + TTS） | 全 6 Stage |

- 模式 2 与 4 的差别：**模式 4 明确包含 TTS 层**（读音、断句、表记），
  模式 2 只保证"是角色的日语"，不主动做 TTS 手术。
- 模式 3 **不做角色化**。已有日语是正确的角色台词，只需处理读法。
  此时**不要顺手改语体或用词**——那是模式 2/4 的事。
- 模式 1 只产出中文。**不要输出日语**，即使你能翻译。
  用户可能只是要中文脚本给人工翻译用。

问法：

```text
请选择处理模式：
1) 只优化中文表达（使其更贴近角色）
2) 翻译成日语版（使其贴近角色）
3) 只做 TTS 读音纠正优化
4) 第 2、3 一起（翻译 + TTS 优化）
```

> 若用户只给了日语、却选了 1 或 2，或只给了中文、却选了 3，
> **指出输入与模式不符并请其确认**，不要自行换模式。

## Gate 2 — 用词偏好（每次必问）

确定模式后、动手前问。**这个 gate 在模式 1、2、4 下必答**；
模式 3（纯 TTS）通常不影响用词，但如果待处理文本里含译名（如「爽世」），
仍需问一次。

| # | 偏好 | 例（长崎そよ 的中文名） |
|---|---|---|
| 1 | 贴近官方 | `爽世`（官方中文译名） |
| 2 | 更社区化 | `素世`（社区通用译名） |

问法：

```text
中文译名偏好：
1) 贴近官方（如：用「爽世」不用「素世」）
2) 更社区化（如：用「素世」不用「爽世」）
```

**这个 gate 只管"选哪个变体"，不管"该不该改"。** 无论选哪个，
都不改变 G7（专有名词全项目只允许一种写法）——选定后即成为本轮的
canonical，同一批次内不得混用。

### 两套变体的对照表

变体数据在 `../dictionary/proper-nouns.yaml` 的 `zh_variants` 段。
**遇到表里没有的译名分歧，不要猜**（G8），列入 `【待确认】`。

### 两个 gate 都要记住

用户在**同一会话内**已经选过之后，不要每轮重问。
换批次、换模式、或用户明确要求时才重问。

## The single most important rule

**Output `无需修改` when the draft already holds.**

This skill is judged on how *little* it changes, not how much. A run that
rewrites a line the character would plausibly say is a failed run, even if the
rewrite is prettier. Every change must answer "what was actually wrong?" If you
cannot name the defect in one clause, do not make the change.

## Inputs

Required by mode (see Gate 1):

| 模式 | 角色 | 中文原文 | 已有日语 |
|---|---|---|---|
| 1 只优化中文 | ✅ | ✅ | — |
| 2 翻译 + 角色化 | ✅ | ✅ | 不需要（可作参考） |
| 3 只做 TTS | — | — | ✅ |
| 4 翻译 + TTS | ✅ | ✅ | 不需要（可作参考） |

Useful in all modes:

- **场景/情绪** — excited, shy, sad, teasing. Character voice is conditional on
  this. When unstated, infer from the line and state your inference.
- **TTS 引擎** — see "Engine" below.

Always gate before reading rule files. The two Gates above decide *which* files
matter; loading `rules/tts.md` for a 中文-only run wastes context and invites
out-of-scope edits.

## Execution order

Run the stages in order. Each stage is allowed to pass. Do not skip a stage,
and do not report a stage as passing unless you actually checked it.

| # | Stage | Read | Checks |
|---|---|---|---|
| 1 | 翻译检查 | `rules/global.md` | meaning preserved, no invented info, proper nouns consistent |
| 2 | 日语自然度 | `rules/japanese.md` | 书面语→口语, 中文式表达, 助词, 语序, 敬语 level |
| 3 | 角色口吻 | `characters/<角色>.md` | 语尾, 用词, 语气词, 情绪强度, 称呼 |
| 4 | TTS 断句 | `rules/tts.md` | 句长, 停顿, 标点, 换行 |
| 5 | TTS 读音 | `dictionary/*.yaml`, `rules/tts.md` | 多音字, 人名, 专有名词, 外来语, 数字 |
| 6 | 情绪/语气 | `characters/<角色>.md`, `rules/tts.md` | 标点/句式/语气词是否支撑目标情绪 |

### Which stages run in which mode

| 模式 | 走哪些 Stage |
|---|---|
| 1 只优化中文 | **C1–C3**（见下「中文层」），不跑 1–6 |
| 2 翻译 + 角色化 | 1 → 2 → 3 → 6（不做 4–5 的 TTS 手术） |
| 3 只做 TTS | **仅 4 → 5**。不跑 1–3、6 |
| 4 翻译 + TTS | 全 6 |

### 中文层（模式 1 专用）

模式 1 处理的是**中文**，日语规则不适用。中文层的三个阶段：

| # | Stage | 读 | 检查 |
|---|---|---|---|
| C1 | 语义保真 | `rules/global.md`（G1–G3） | 不增删信息、不过度润色 |
| C2 | 中文口语度 | `characters/<角色>.zh.md` | 书面词→口语、翻译腔、句长 |
| C3 | 角色口吻（中文） | `characters/<角色>.zh.md` | 用词、语气词、称呼、情绪强度 |

**中文层读的是 `characters/<角色>.zh.md`，不是 `characters/<角色>.md`。**
日语的语尾规则（です・ます、`〜だよ`）在中文里没有对应物，套用会写出怪中文。

> **现状**：`.zh.md` 文件**尚未建立**。模式 1 被选中时，
> 先按 `characters/_template-zh.md` 建立该角色的中文层，
> 或明确告知用户"中文层规则尚未编写"并询问是否继续。
> **不要**用日语层的规则去猜中文角色腔（违反 G8）。

Stages 1–3 may run in one pass over the text. Stages 4–5 are text-surgery on the
result and must run last, because they change punctuation and spelling.

**Stage 5 may veto Stage 3.** If a pronunciation problem is severe — a name or
proper noun that TTS will certainly misread and that no dictionary entry fixes —
send it back to Stage 3 and choose a different expression that carries the same
meaning. This is the one sanctioned case of a later layer overriding an earlier
one. It is not a license for Stage 4 or 5 to flatten character voice for
convenience; see `rules/tts.md`.

## Rule priority

Read `rules/global.md` first. When two layers disagree, the higher one wins:

```
语义正确性 (global)          — never violated
    >
角色设定 (character)        — overrides general style
    >
自然日语 (japanese)         — overrides TTS convenience
    >
TTS 优化 (tts)              — last layer
```

The one exception is the Stage 5 veto above.

**模式 1（中文）只用前两层。** TTS 层不参与——本 skill 的 TTS 层针对日语朗读，
中文层没有对应物。所以中文层不要为了"好读"去调标点密度或加停顿。

**模式 3（纯 TTS）反转了优先级。** 此时文本的角色化**已经由人工完成**，
不再重判角色口吻。读法是唯一的判断对象：

```
读音/断句 (tts)             — 唯一目标
    >
不改动角色表达 (character)  — 除 T5 veto 外不得改动用词语体
```

模式 3 下 G1（语义）仍不可违反，但 G3（不过度润色）升格为
**"不做任何非读音改动"**。

## How to load the rule files

Load only what the task needs. The point of splitting these files is context
economy — do not read all of `characters/` to polish one line.

**Load by mode.** The Gates already told you which layers are in play:

| 模式 | 读 |
|---|---|
| 1 只优化中文 | `rules/global.md`, `characters/<角色>.zh.md` |
| 2 翻译 + 角色化 | `rules/global.md`, `rules/japanese.md`, `characters/<角色>.md` |
| 3 只做 TTS | `rules/tts.md`, `dictionary/*.yaml` |
| 4 翻译 + TTS | 全部 |

1. Always read `rules/global.md` — every mode needs G1–G3.
2. Read `characters/<角色>.md`（日语层）or `characters/<角色>.zh.md`（中文层）
   for the named character. If it does not exist, **stop and say so** — do not
   improvise a character voice from general knowledge of the franchise, and do
   not silently fall back to generic "natural language". Offer to draft the file
   from `characters/_template.md`（日语）or `characters/_template-zh.md`（中文）.
3. Read `dictionary/proper-nouns.yaml` whenever the text contains a name, song
   title, band name, or place — **all modes**, because Gate 2 的译名偏好就存在这里。
   For Japanese output also read `dictionary/pronunciation.yaml` whenever the
   line contains a kanji with multiple readings, a numeral, or an acronym.
   For 模式 1/2/4 also read `dictionary/address-forms.yaml` when the line
   contains a form of address.
4. Read `corrections/<角色>/` and `corrections/_rules.yaml` when the same
   pattern has come up before. `_rules.yaml` carries the promoted rules with
   their confidence; prefer `established` over `observed`.

## Output format

Default to the full format while the rule set is young — the explanations are how
the rules get audited and corrected. **模式 1 用中文标签，其余模式用日语标签。**

### 模式 2 / 4（日语输出）

```
【优化结果】
<final lines, ready to voice>

【修改】
<original fragment>
→ <new fragment>

【原因】
- <why, naming the layer: global / japanese / character / tts>

【TTS检查】
✓ 断句自然
✓ 无明显多音词风险
✓ 标点适合朗读
```

模式 2 的 `【TTS检查】` 只做**告知**，不做 TTS 手术。
未做 TTS 检查时**不要写这一节**——写了就等于声称检查过。

### 模式 1（中文输出）

```
【优化结果】
<最终中文>

【修改】
<原句>
→ <改后>

【原因】
- <global G1-G3 / character-zh 的哪一条>
```

模式 1 **不输出 `【TTS检查】`**。中文不面向 TTS。

### 模式 3（纯 TTS）

只列读音与断句相关的改动，并**显式声明没有动别的**：

```
【优化结果】
<读法修正后的日语>

【读音修正】
<原表记>
→ <改后表记>
理由：<误读风险 / 引擎行为>

【断句修正】
<原句>
→ <改后>

【未改动】
- 语体、用词、角色口吻：**未动**（模式 3 不做角色化）
```

**`【未改动】` 是模式 3 的必需项。** 没有它，用户无法判断
"是不是偷偷改了台词"——而模式 3 的全部价值就在于只动读法。

### 不需要修改时

```
【优化结果】
<原文，未改动>

【修改】
无需修改

【原因】
- 语义、自然度、角色口吻、TTS 可读性均无问题
```

### 【待确认】

Add `【待确认】` for anything you could not resolve — a reading that depends on
the engine, an emotion you inferred, a proper noun missing from the dictionary,
a 译名分歧 not in `zh_variants`. **所有模式都要保留这一节。**
Do not paper over an uncertainty by picking one reading silently.

For batch production the user may switch to output only `【优化结果】`, with a
one-line exception list. Keep `【待确认】` even then.

## Engine

**已确定引擎：GPT-SoVITS。** 引擎特定行为见 `adapters/gpt-sovits.md`。

该文件当前 `verified: false` —— 引擎行为描述基于通用架构认知，**尚未实机合成验证**。
上机第一件事是按其中的「验证清单」跑一遍并回填结果。

核心规则（`rules/`）保持引擎无关，不得写入引擎特定行为。
换引擎时只替换 `adapters/` 下的文件，`rules/` 不动。

引擎确定后的两个直接结果：

1. **英文转写（G9）从"默认"变为"无条件"** —— GPT-SoVITS 对拉丁字母走英语 G2P，
   会产出英语音素而非日式外来语读音。乐队名等英字专有名词同样转写。
2. **片假名、促音、长音的实测成为下一优先事项** —— 详见 adapters 的验证清单。

在引擎确定之前，本文对引擎行为的一切判断都只能是"安全跨引擎的默认"。
现已确定，因此可以按 GPT-SoVITS 的实际行为优化；但这些优化**要放 adapters，不要放进 rules**。

## Learn workflow

See `corrections/_schema.md` for the record format and the promotion rules.

Trigger when the user supplies **AI 原文 + 人工修改版**:

1. Diff the two. Enumerate every difference; do not summarize them away.
2. For each difference answer: what was wrong, which category
   (`corrections/_schema.md` §分类), does it generalize, does it apply to this
   character only, is it a TTS issue.
3. Write one record per diff into `corrections/<角色>/<date>-<slug>.yaml`.
4. Only promote to `corrections/_rules.yaml` when the evidence repeats. One
   observation is `observed`; it is not a rule yet.
5. **Reject non-generalizable edits explicitly.** A human's stylistic choice in
   one scene is not a character trait. Say which edits you declined to promote
   and why.

Never rewrite historical data, and never promote a rule from a single example
without marking it `observed` and stating the evidence count as 1.

## Scope

This skill does not train models, does not generate audio or emotion parameters,
does not fetch official dialogue, and does not modify existing corrections in
bulk. It edits text.

## Files

```
SKILL.md                  this file — Gates, modes, workflow, priority, output
rules/global.md           语义/信息/关系/专有名词 — all characters, all modes
rules/japanese.md         日语自然度 — 书面语, 中文式表达, 标点
rules/tts.md              TTS — 断句, 停顿, 读音, 情绪辅助
adapters/gpt-sovits.md    引擎适配（已确定 GPT-SoVITS）— 引擎特定行为 + 验证清单
characters/_template.md        模板（日语层）— 新角色从这里开始
characters/_template-zh.md     模板（中文层，模式 1 用）
characters/kasumi.md           戸山香澄（日语层）
characters/tomori.md           高松燈（マイゴ）
characters/anon.md             千早愛音（マイゴ）
characters/rana.md             要楽奈（マイゴ）
characters/taki.md             椎名立希（マイゴ）
characters/soyo.md             長崎そよ（マイゴ）
characters/<角色>.zh.md        中文层 — **尚未建立**（模式 1 需要时再建）
corrections/_schema.md         记录格式 + 分类 + 规则升级标准
corrections/_rules.yaml        已提炼规则 + confidence + evidence_count
corrections/kasumi/            戸山香澄 的修订记录
dictionary/pronunciation.yaml  读音词典（日语输出用）
dictionary/proper-nouns.yaml   专有名词统一表 + zh_variants（译名变体，Gate 2 用）
dictionary/address-forms.yaml  称呼对应表（G6 的唯一事实来源）
examples/input/                输入样例
examples/output/               输出样例
```

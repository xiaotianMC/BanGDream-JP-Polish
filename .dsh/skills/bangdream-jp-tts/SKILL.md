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

## Gates（开始前必问）

**七个 gate，一次性问完，不要一个一个地问。** 它们决定整轮产出的形态；
不问就直接做，很可能整轮都不是用户要的东西。

选项**用字母标注，不用数字**（数字留给输入文本的行号）。

```text
开始前请确认以下几点（可直接回「全默认」）：

【A 处理模式】
  A 只优化中文表达（使其更贴近角色）
  B 翻译成日语版（使其贴近角色）
  C 只做 TTS 读音纠正优化
  D 翻译 + TTS 优化（B 和 C 一起）

【B 中文译名偏好】
  A 贴近官方（如：用「爽世」不用「素世」）
  B 更社区化（如：用「素世」不用「爽世」）

【C 成稿用途】            ← 影响标点与句长的判断标准
  A 配音用（TTS 友好）
  B 字幕用（阅读友好）
  C 两者都要

【D 敬语/亲密度档位】
  A 按原作设定（照 characters/ 的基线）
  B 本场景放宽（设定上不熟但需要亲近感）
  C 全篇统一（消除角色间差异）

【E 改动幅度上限】
  A 只改错误（读法、语法、明显 OOC）
  B 允许口语化改写
  C 允许重构句子

【F 批次一致性】
  A 逐句独立判断
  B 整批次内保持用词与称呼一致

【G 保留层】（仅模式 D 有意义）
  A 全层
  B 跳过 TTS 断句（只做读音）
  C 跳过读音（只做断句）
```

**默认值**（用户回「全默认」或未答时使用）：

```
A-B（翻译+角色化，不做 TTS 手术） / B-A（贴近官方） / C-C（两者都要）
D-A（按原作设定） / E-B（允许口语化改写） / F-B（整批次一致） / G-A（全层）
```

### A 处理模式

| 模式 | 输入 | 输出 | 走哪几个 Stage |
|---|---|---|---|
| A 只优化中文表达 | 中文原文 | 中文（角色化） | C1–C3（中文层） |
| B 翻译成日语 + 角色化 | 中文原文 | 日语 | 1→2→3→6 |
| C 只做 TTS 读音纠正 | 已有日语 | 日语（只动读音/断句） | **仅 4→5** |
| D 翻译 + TTS | 中文原文 | 日语（角色化 + TTS） | 全 6 |

- 模式 B 与 D 的差别：**模式 D 明确包含 TTS 层**（读音、断句、表记），
  模式 B 只保证"是角色的日语"，不主动做 TTS 手术。
- 模式 C **不做角色化**。已有日语是正确的角色台词，只需处理读法。
  此时**不要顺手改语体或用词**——那是模式 B/D 的事。
- 模式 A 只产出中文。**不要输出日语**，即使你能翻译。
  用户可能只是要中文脚本给人工翻译用。

> 若用户只给了日语、却选了 A 或 B，或只给了中文、却选了 C，
> **指出输入与模式不符并请其确认**，不要自行换模式。

### A 模式的中文层：只按经历与性格构建

模式 A 的中文角色腔，**只从角色知识库的「人物经历」与「性格」推导**，
不代入日语语尾、不凭对作品的泛印象。

```
✅ 依据：characters/<角色>.md 与百科出典的「简介（性格）」「经历」
❌ 依据：日语的 〜だよ / です・ます（中文无对应物）
❌ 依据：对"这个角色应该是这种腔调"的印象
```

> ⚠️ **该部分尚不完善。** 中文层（`characters/<角色>.zh.md`）**尚未建立**，
> 且已建立的部分也只覆盖"经历 + 性格"这一维度——
> 没有官方中文台词作依据（原作是日语），因此**推导出的中文角色腔是
> `observed` 级别，不能当既定事实用**。
> 详见 `../characters/_template-zh.md`。

### B 中文译名偏好

| 偏好 | 例（长崎そよ 的中文名） |
|---|---|
| 贴近官方 | `爽世`（官方中文译名） |
| 更社区化 | `素世`（社区通用译名） |

**这个 gate 只管"选哪个变体"，不管"该不该改"。** 无论选哪个，
都不改变 G7（专有名词全项目只允许一种写法）——选定后即成为本轮的
canonical，同一批次内不得混用。

变体数据在 `../dictionary/proper-nouns.yaml` 的 `zh_variants` 段。
**遇到表里没有的译名分歧，不要猜**（G8），列入 `【待确认】`。

### C 成稿用途

**配音与字幕对文本的要求是冲突的**，这个 gate 决定 Stage 4 的判断标准：

| 用途 | 标点 | 句长 | 判断依据 |
|---|---|---|---|
| 配音用 | 服务于朗读停顿 | 受 20〜30 字上限约束 | `rules/tts.md` T1/T2 |
| 字幕用 | 服务于眼读。逗号可少、可用换行断行 | 可长，但需一屏内可读 | 阅读节奏，而非呼吸点 |
| 两者都要 | 取交集，**必要时输出两版** | 按配音标准 | 冲突处显式标注让用户选 |

**「两者都要」不要偷偷只满足一个。** 若某句在两种用途下必须不同，
输出两版并说明差异，而不是取平均。

### D 敬语/亲密度档位

| 档位 | 含义 |
|---|---|
| 按原作设定 | 严格照 `characters/*.md` 的语体基线（`taki.md` 的灯限定、`soyo.md` 的两层结构等） |
| 本场景放宽 | 允许偏离设定换亲近感。**必须在输出里声明哪句偏离了、为什么** |
| 全篇统一 | 消除角色间语体差异（适合旁白式宣传稿）。**这会抹掉角色特征，需用户确认** |

选「全篇统一」时，**在输出里提示这会损失什么**——
例如そよ 的内向常体层、立希对灯的特殊待遇都会消失。

### E 改动幅度上限

| 档位 | 允许的改动 |
|---|---|
| 只改错误 | 读音、语法、明显 OOC。**同义改写一律不做** |
| 允许口语化改写 | 书面语→口语、句式调整（默认） |
| 允许重构句子 | 上列之外，可重组句子结构以更贴角色 |

**这个档位不覆盖 G1（语义）和 G3（不过度润色）。** 即使选「允许重构句子」，
"能说出缺陷才改"仍然成立——档位放宽的是**改动手法的范围**，
不是**改动的门槛**。

### F 批次一致性

多角色、多段文本时：

| 档位 | 行为 |
|---|---|
| 逐句独立 | 每句单独判断，不回头看前文 |
| 整批次一致 | 同一批内，同一专有名词、同一称呼只允许一种写法 |

选「整批次一致」时，**处理完必须回头做一次全文复查**——
G7 的写法统一无法靠逐句处理保证，只能靠复查。

### G 保留层（仅模式 D）

| 档位 | 行为 |
|---|---|
| 全层 | 读音 + 断句都做 |
| 跳过断句 | 只做读音。适用于断句已由人工调好的场合 |
| 跳过读音 | 只做断句 |

**未做的层要在输出里说明未做**，不要沉默省略——
用户需要知道哪些层被跳过了。

### 所有 gate 的记忆

用户在**同一会话内**已经选过之后，不要每轮重问。
换批次、换模式、或用户明确要求时才重问。
用户说「全默认」时，用上面的默认值并在输出开头**列出实际采用的档位**，
让用户能一眼发现哪项理解错了。

## The single most important rule

**Output `无需修改` when the draft already holds.**

This skill is judged on how *little* it changes, not how much. A run that
rewrites a line the character would plausibly say is a failed run, even if the
rewrite is prettier. Every change must answer "what was actually wrong?" If you
cannot name the defect in one clause, do not make the change.

## Inputs

Required by mode (see Gate A):

| 模式 | 角色 | 中文原文 | 已有日语 |
|---|---|---|---|
| A 只优化中文 | ✅ | ✅ | — |
| B 翻译 + 角色化 | ✅ | ✅ | 不需要（可作参考） |
| C 只做 TTS | — | — | ✅ |
| D 翻译 + TTS | ✅ | ✅ | 不需要（可作参考） |

Useful in all modes:

- **场景/情绪** — excited, shy, sad, teasing. Character voice is conditional on
  this. When unstated, infer from the line and state your inference.
- **TTS 引擎** — see "Engine" below.

Always gate before reading rule files. The Gates decide *which* files
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
| A 只优化中文 | **C1–C3**（见下「中文层」），不跑 1–6 |
| B 翻译 + 角色化 | 1 → 2 → 3 → 6（不做 4–5 的 TTS 手术） |
| C 只做 TTS | **仅 4 → 5**。不跑 1–3、6 |
| D 翻译 + TTS | 全 6 |

### 中文层（模式 A 专用）

模式 A 处理的是**中文**，日语规则不适用。中文层的三个阶段：

| # | Stage | 读 | 检查 |
|---|---|---|---|
| C1 | 语义保真 | `rules/global.md`（G1–G3） | 不增删信息、不过度润色 |
| C2 | 中文口语度 | `characters/<角色>.zh.md` | 书面词→口语、翻译腔、句长 |
| C3 | 角色口吻（中文） | `characters/<角色>.zh.md` | 用词、语气词、称呼、情绪强度 |

**中文层读的是 `characters/<角色>.zh.md`，不是 `characters/<角色>.md`。**
日语的语尾规则（です・ます、`〜だよ`）在中文里没有对应物，套用会写出怪中文。

#### 中文层的构建依据：只有「经历」与「性格」

中文角色腔**只从两处推导**：

```
✅ characters/<角色>.md 与百科出典的「简介 / 性格」
✅ 同上出典的「经历」（含实际台词的中文译）
❌ 日语的 〜だよ / です・ます（中文无对应物）
❌ 对"这个角色应该是这种腔调"的印象或二创观感
❌ 其他作品的类似角色
```

依据写在 `characters/<角色>.zh.md` 的 `basis` 节，必须可回溯到具体出典。

> ⚠️ **该部分尚不完善（已知限制）。**
>
> - `characters/<角色>.zh.md` **尚未建立**
> - 已完成的部分**只覆盖「经历 + 性格」这一个维度**
> - **没有官方中文台词可依据**（原作是日语），所以推导出的中文角色腔
>   只能是 `observed` 级别，**不能当既定事实**
> - 因此模式 A 的产出必须带 `basis` 声明与置信度，不能宣称"这就是她的中文腔"

模式 A 被选中时：先按 `characters/_template-zh.md` 建立该角色的中文层，
或明确告知用户"中文层规则尚未编写"并询问是否继续。
**不要**用日语层的规则去猜中文角色腔（违反 G8）。

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

**模式 A（中文）只用前两层。** TTS 层不参与——本 skill 的 TTS 层针对日语朗读，
中文层没有对应物。所以中文层不要为了"好读"去调标点密度或加停顿。

**模式 C（纯 TTS）反转了优先级。** 此时文本的角色化**已经由人工完成**，
不再重判角色口吻。读法是唯一的判断对象：

```
读音/断句 (tts)             — 唯一目标
    >
不改动角色表达 (character)  — 除 T5 veto 外不得改动用词语体
```

模式 C 下 G1（语义）仍不可违反，但 G3（不过度润色）升格为
**"不做任何非读音改动"**。

## How to load the rule files

Load only what the task needs. The point of splitting these files is context
economy — do not read all of `characters/` to polish one line.

**Load by mode.** The Gates already told you which layers are in play:

| 模式 | 读 |
|---|---|
| A 只优化中文 | `rules/global.md`, `characters/<角色>.zh.md` |
| B 翻译 + 角色化 | `rules/global.md`, `rules/japanese.md`, `characters/<角色>.md` |
| C 只做 TTS | `rules/tts.md`, `dictionary/*.yaml` |
| D 翻译 + TTS | 全部 |

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
   For 模式 A/2/4 also read `dictionary/address-forms.yaml` when the line
   contains a form of address.
4. Read `corrections/<角色>/` and `corrections/_rules.yaml` when the same
   pattern has come up before. `_rules.yaml` carries the promoted rules with
   their confidence; prefer `established` over `observed`.

## Output format

Default to the full format while the rule set is young — the explanations are how
the rules get audited and corrected. **模式 A 用中文标签，其余模式用日语标签。**

### 开头必须回显采用的档位

每次输出开头加一行，让用户能一眼发现哪项理解错了：

```
【档位】A-D / B-A / C-C / D-A / E-B / F-B / G-A
```

（模式 / 译名偏好 / 用途 / 敬语 / 改动幅度 / 批次一致性 / 保留层）

用户说「全默认」而某项与预期不符时，这一行是**唯一**能让他立刻察觉的地方。

### 模式 B / 4（日语输出）

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

模式 B 的 `【TTS检查】` 只做**告知**，不做 TTS 手术。
未做 TTS 检查时**不要写这一节**——写了就等于声称检查过。

**Gate C = 两者都要** 时，若某句在配音/字幕下必须不同：

```
【优化结果・配音】
<TTS 版>

【优化结果・字幕】
<阅读版>

【差异说明】
- 第 2 句：配音版在「〜」处断句以留呼吸点；字幕版不断，否则一行过短
```

**不要取平均糊过去。** 冲突处显式给两版并说明理由，
让用户决定是否接受其中一版。

**Gate D = 本场景放宽 / 全篇统一** 时，必须标注偏离：

```
【偏离设定】
- 第 3 句：按设定そよ 对内用常体，此处改用丁寧体（Gate D「本场景放宽」）
```

选「全篇统一」时，**在输出开头提示损失了什么**——
如そよ 的两层语体、立希对灯的特殊待遇都会消失。

**Gate E = 只改错误** 时，`【修改】` 节只允许出现读音/语法/OOC 类改动，
同义改写不得出现。**Gate G** 跳过的层要在 `【未改动】` 里点名。

### 模式 A（中文输出）

```
【优化结果】
<最终中文>

【修改】
<原句>
→ <改后>

【原因】
- <global G1-G3 / character-zh 的哪一条>
```

模式 A **不输出 `【TTS检查】`**。中文不面向 TTS。

### 模式 C（纯 TTS）

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
- 语体、用词、角色口吻：**未动**（模式 C 不做角色化）
```

**`【未改动】` 是模式 C 的必需项。** 没有它，用户无法判断
"是不是偷偷改了台词"——而模式 C 的全部价值就在于只动读法。

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
characters/_template-zh.md     模板（中文层，模式 A 用）
characters/kasumi.md           戸山香澄（日语层）
characters/tomori.md           高松燈（マイゴ）
characters/anon.md             千早愛音（マイゴ）
characters/rana.md             要楽奈（マイゴ）
characters/taki.md             椎名立希（マイゴ）
characters/soyo.md             長崎そよ（マイゴ）
characters/<角色>.zh.md        中文层 — **尚未建立**（模式 A 需要时再建）
corrections/_schema.md         记录格式 + 分类 + 规则升级标准
corrections/_rules.yaml        已提炼规则 + confidence + evidence_count
corrections/kasumi/            戸山香澄 的修订记录
dictionary/pronunciation.yaml  读音词典（日语输出用）
dictionary/proper-nouns.yaml   专有名词统一表 + zh_variants（译名变体，Gate 2 用）
dictionary/address-forms.yaml  称呼对应表（G6 的唯一事实来源）
examples/input/                输入样例
examples/output/               输出样例
```

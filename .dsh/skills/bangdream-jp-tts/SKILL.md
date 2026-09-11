---
name: bangdream-jp-tts
description: >
  Polish AI-translated Japanese dialogue for BanG Dream! characters into
  in-character, natural spoken Japanese that a TTS engine can read correctly.
  Runs a six-stage pass (translation check, naturalness, character voice,
  segmentation, pronunciation, emotion) over a Chinese script plus its existing
  AI Japanese translation, and reports "no change needed" when the draft already
  holds. Use when the user gives a BanG Dream! character name with Japanese
  dialogue, a Chinese 小剧场/宣传脚本 with an AI translation, or asks to make
  台词 more in-character / more spoken / better for 朗读/TTS, or to 提炼/学习
  rules from human corrections. Triggers: "日语优化", "角色语气", "TTS 优化",
  "断句", "读音", "correction", "香澄/有咲/… 的台词".
whenToUse: >
  A BanG Dream! character's Japanese lines need to sound like that character and
  survive text-to-speech. Skip it for general translation with no character or
  TTS requirement, and skip it for prose that will be read by a human on screen.
---

# BanG Dream! Character Japanese & TTS Polish

A **characterization + naturalness + TTS-readability layer** on top of an
existing AI translation. It is not a translator. The Chinese original and the
AI Japanese draft are both inputs; the output is the final line to be voiced.

## The single most important rule

**Output `无需修改` when the draft already holds.**

This skill is judged on how *little* it changes, not how much. A run that
rewrites a line the character would plausibly say is a failed run, even if the
rewrite is prettier. Every change must answer "what was actually wrong?" If you
cannot name the defect in one clause, do not make the change.

## Inputs

Required:

- **角色** — the character whose voice the line must carry.
- **AI 日语** (or 中文 + AI 日语) — the draft to polish.

Useful but optional:

- **中文原文** — needed for the translation-correctness pass. Without it, Stage 1
  can only check internal consistency; say so rather than guessing at intent.
- **场景/情绪** — excited, shy, sad, teasing. Character voice is conditional on
  this. When unstated, infer from the line and state your inference.
- **TTS 引擎** — see "Engine independence" below.

## Execution order

Run the six stages in order. Each stage is allowed to pass. Do not skip a stage,
and do not report a stage as passing unless you actually checked it.

| # | Stage | Read | Checks |
|---|---|---|---|
| 1 | 翻译检查 | `rules/global.md` | meaning preserved, no invented info, proper nouns consistent |
| 2 | 日语自然度 | `rules/japanese.md` | 书面语→口语, 中文式表达, 助词, 语序, 敬语 level |
| 3 | 角色口吻 | `characters/<角色>.md` | 语尾, 用词, 语气词, 情绪强度, 称呼 |
| 4 | TTS 断句 | `rules/tts.md` | 句长, 停顿, 标点, 换行 |
| 5 | TTS 读音 | `dictionary/*.yaml`, `rules/tts.md` | 多音字, 人名, 专有名词, 外来语, 数字 |
| 6 | 情绪/语气 | `characters/<角色>.md`, `rules/tts.md` | 标点/句式/语气词是否支撑目标情绪 |

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

## How to load the rule files

Load only what the task needs. The point of splitting these files is context
economy — do not read all of `characters/` to polish one line.

1. Always read `rules/global.md`, `rules/japanese.md`, `rules/tts.md`.
2. Read `characters/<角色>.md` for the named character. If it does not exist,
   **stop and say so** — do not improvise a character voice from general
   knowledge of the franchise, and do not silently fall back to generic
   "natural Japanese". Offer to draft the file from `characters/_template.md`.
3. Read `dictionary/proper-nouns.yaml` whenever the line contains a name, song
   title, band name, or place. Read `dictionary/pronunciation.yaml` whenever the
   line contains a kanji with multiple readings, a numeral, or an acronym.
4. Read `corrections/<角色>/` and `corrections/_rules.yaml` when the same
   pattern has come up before. `_rules.yaml` carries the promoted rules with
   their confidence; prefer `established` over `observed`.

## Output format

Default to the full format while the rule set is young — the explanations are how
the rules get audited and corrected.

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

When nothing needs changing:

```
【优化结果】
<the draft, unchanged>

【修改】
无需修改

【原因】
- 语义、自然度、角色口吻、TTS 可读性均无问题
```

Add `【待确认】` for anything you could not resolve — a reading that depends on
the engine, an emotion you inferred, a proper noun missing from the dictionary.
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
SKILL.md                  this file — workflow, priority, output
rules/global.md           语义/信息/关系/专有名词 — all characters
rules/japanese.md         日语自然度 — 书面语, 中文式表达, 标点
rules/tts.md              TTS — 断句, 停顿, 读音, 情绪辅助
adapters/gpt-sovits.md    引擎适配（已确定 GPT-SoVITS）— 引擎特定行为 + 验证清单
characters/_template.md   模板 — 新角色从这里开始
characters/kasumi.md      戸山香澄
corrections/_schema.md    记录格式 + 分类 + 规则升级标准
corrections/_rules.yaml   已提炼规则 + confidence + evidence_count
corrections/kasumi/       戸山香澄 的修订记录
dictionary/pronunciation.yaml  读音词典
dictionary/proper-nouns.yaml   专有名词统一表
examples/input/           输入样例
examples/output/          输出样例
```

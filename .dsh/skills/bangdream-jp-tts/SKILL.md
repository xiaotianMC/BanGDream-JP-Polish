---
name: bangdream-jp-tts
description: >
  Check BanG Dream! dialogue against a per-character knowledge base, in two
  steps chosen by gates at the start. First it asks the target language
  (Japanese or Chinese); then it offers the checks available for that language:
  for Japanese, a character/proper-noun consistency check and a TTS
  segmentation + misread-prone-character check (or both); for Chinese, the
  character/proper-noun consistency check only. It reports what is wrong with
  the rule or dictionary entry that says so, and says "no problem" when the
  draft holds. Translation and character-voice rewriting are implemented but
  NOT currently exposed. Use when the user gives a BanG Dream! character name
  with existing dialogue and wants it checked — proper nouns, 称呼, 角色语体,
  断句, 读音 — or asks to 提炼/学习 rules from human corrections.
  Triggers: "人设检查", "专有名词检查", "TTS 断句", "易读错字", "读音", "断句",
  "日语检查", "中文检查", "correction", "香澄/有咲/燈/そよ/… 的台词".
whenToUse: >
  A BanG Dream! character's existing lines need checking against that
  character's established settings and readings, and/or need to survive
  text-to-speech. Skip it for general translation with no character or TTS
  requirement, and skip it for prose read by a human on screen with no
  voice-over.
---

# BanG Dream! Character Japanese & TTS Polish

A **characterization + naturalness + TTS-readability layer** over a per-character
knowledge base. **Currently it exposes two checks**（Gate 2）——
**基础人设检查（专有名词正确性检查）** and
**TTS 断句及易读错字检查**——and the target language is chosen first.

**翻訳・角色化は実装済みだが現在は非公開**（`附録` 参照）。

## Gates（开始前必问）

> ★ **現在公開している機能は「検査」だけです**（ユーザー指定 2026-02-14）。
> **翻訳・角色化は一時的に非公開**（下の「非公開の機能」参照）。

**2 段階で問う。** 1 回目の回答で 2 回目の選択肢が変わるため、
**1 回の呼び出しでは聞けない**——2 回に分ける。

### Gate 1：目標言語

`ask_user_question` を **1 問だけ**で呼ぶ。

| gate | id | 选项（**推荐项在首位**） |
|---|---|---|
| **目標言語** | `target_lang` | 日语 **(推荐)** / 中文 |

- `header` は「目标语言」
- 选项の `description`：
  - **日语** —— 「日本語の成稿を検査します」
  - **中文** —— 「中国語の成稿を検査します」

### Gate 2：機能（Gate 1 の回答で分岐する）

**Gate 1 の結果を見てから、もう一度 `ask_user_question` を呼ぶ。**
選択肢は**言語によって違う**。

#### 日本語を選んだ場合

| gate | id | 选项（**推荐项在首位**） |
|---|---|---|
| **機能** | `function` | 両方 **(推荐)** / 基础人设检查（专有名词正确性检查） / TTS 断句及易读错字检查 |

| 選択肢 | 何をするか |
|---|---|
| **基础人设检查（专有名词正确性检查）** | 专有名词の表記・読み・称呼が設定と一致するか。G6/G7/G8/G9 |
| **TTS 断句及易读错字检查** | 断句・停顿・読み間違い（多音字・難読） |
| **両方** | 上記 2 つを続けて実行 |

#### 中文を選んだ場合

| gate | id | 选项 |
|---|---|---|
| **機能** | `function` | 基础人设检查（专有名词正确性检查） |

**中国語は検査が 1 つだけ**なので、**選択肢も 1 つ**。
選択の余地が無いので、**「この機能しかありません」と description に書く**。

### ★ 非公開の機能（翻訳・角色化）

**以下は実装済みだが、現在 Gate に出していない**（ユーザー指定）：

```text
× 翻訳成日语 + 角色化
× 翻译 + TTS 优化
× 只优化中文表达
```

→ **Gate 1 で言語を選んでも、これらの選択肢は出さない。**
→ ★ **翻訳モードの規則（2 遍法・角色層・敬语档位など）は
  `rules/` と `characters/` に残してある。**
  非公開なのは**入口（Gate）だけ**で、規則を消してはいない。
  再公開するときは Gate 2 に選択肢を戻すだけでよい。

> ⚠️ **ユーザーが翻訳を明示的に頼んできた場合**は、
> 勝手に翻訳せず「現在この機能は提供していません」と伝える。
> **規則があるからといって実行してよいわけではない。**

### 選択を出力に回显する

**Gate 1 と Gate 2 の選択は必ず出力の冒頭に書く**（`【档位】` 行）。
ユーザーが「どっちを選んだか」を一目で確認できるようにする。

### 問い方の作法

- **选项 label 不要写序号。** 工具的列表 UI 自带编号/选择器，
  再写「1) 2)」会与之重复、且用户不知道哪个数字算数。
  也不要用字母前缀，直接写选项文本本身。
- **推荐项放第一个，label 末尾追加 `(推荐)`。** 这是本工具的既定约定。
- **每个选项都写 `description`**：一句话说明取舍。
- **選択肢が 1 つしか無い場合も、勝手に実行せず 1 回聞く**
  （中文の基礎人設検査がこれに当たる）。

---

## 附録：旧 gate 構成（翻訳を再公開するときに戻す）

> **以下は非公開。** 翻訳・角色化を再公開する際に Gate 2 へ戻す。
> 規則本体は `rules/` と `characters/` にそのまま残っている。

### 旧 gate 一覧

| gate | id | 选项（**推荐项在首位**） |
|---|---|---|
| **A 处理模式** | `mode` | 翻译成日语版（贴近角色）**(推荐)** / 只优化中文表达 / 翻译 + TTS 优化 / 只做 TTS 读音纠正 |
| **B 中文译名偏好** | `zh_naming` | 贴近官方（用「爽世」不用「素世」）**(推荐)** / 更社区化（用「素世」不用「爽世」） |
| **C 成稿用途** | `purpose` | 两者都要 **(推荐)** / 配音用（TTS 友好） / 字幕用（阅读友好） |
| **D 敬语/亲密度** | `keigo` | 按原作设定（照 characters/ 基线）**(推荐)** / 本场景放宽 / 全篇统一 |
| **E 改动幅度** | `edit_scope` | 允许口语化改写 **(推荐)** / 只改错误 / 允许重构句子 |
| **F 批次一致性** | `batch` | 整批次内保持一致 **(推荐)** / 逐句独立判断 |
| **G 保留层** | `layers` | 全层 **(推荐)** / 跳过 TTS 断句 / 跳过读音 |

### ⚠️ B 中文译名偏好：只在输出是中文时问

**B 这个 gate 只在「输出含中文成稿」时才出现在调用里。**
不要无条件把 7 个都塞进去。

| 选择的 A 模式 | 输出 | B 要不要问 |
|---|---|---|
| A 只优化中文表达 | 中文 | **✅ 问** |
| B 翻译成日语版 | 日语 | ❌ **不问** |
| C 只做 TTS 读音纠正 | 日语 | ❌ **不问** |
| D 翻译 + TTS | 日语 | ❌ **不问** |

**但有一个例外**：选 B/C/D 时，若**用户提供的待处理文本里已经含中文译名**
（如「爽世」「素世」混用），仍需问一次——因为要统一成哪一种。
判断方法是扫一遍输入里的中文人名，发现同一角色出现两种写法才问。

> 除「只优化中文表达」外，输出都是日语，中文译名不影响日语正文
> （日语一律写假名「そよ」，不写「爽世」/「素世」）。所以问了也白问。

### 条件问法：先定 A，再决定问不问 B

`ask_user_question` 一次调用无法根据前面答案调整后面的问题，
所以按下面两种方式之一处理：

- **输入里已有中文人名且可能混用** → 一次调用里放全 7 个（B 照问）。
- **输入里没有中文人名歧义** → 只放 6 个（去掉 B）；
  若用户之后选了「只优化中文表达」，再单独补问 B。

**不要**因为省一次调用就把 B 无条件塞进去。
问了不相干的 gate 会让用户以为这个选择有效果。

### 旧 gate の既定値（ユーザーが「全默认」と答えた場合）

```
A 翻译成日语版 / B 贴近官方 / C 两者都要
D 按原作设定 / E 允许口语化改写 / F 整批次一致 / G 全层
```

### A 处理模式

| 模式 | 输入 | 输出 | 走哪几个 Stage |
|---|---|---|---|
| 只优化中文表达 | 中文原文 | 中文（角色化） | C1–C3（中文层）。**两遍法なし** |
| 翻译成日语 + 角色化 | 中文原文 | 日语 | **两遍法**：Pass 1 → Pass 2（1→2→3→6） |
| 只做 TTS 读音纠正 | 已有日语 | 日语（只动读音/断句） | **仅 4→5**。**两遍法なし** |
| 翻译 + TTS | 中文原文 | 日语（角色化 + TTS） | **两遍法**：Pass 1 → Pass 2（全 6） |

- ★ **「翻訳」を含むモードは必ず 2 遍**（`rules/japanese.md` J0）。
  先に自然な初版を作り、それに規則を当てて复核する。
  **初版は出力に残す**（`【自然な初版】`）。
- 「翻译成日语」与「翻译 + TTS」的差别：**后者明确包含 TTS 层**
  （读音、断句、表记），前者只保证"是角色的日语"，不主动做 TTS 手术。
- 「只做 TTS 读音纠正」**不做角色化**。已有日语是正确的角色台词，
  只需处理读法。此时**不要顺手改语体或用词**——那是翻译模式的事。
  ★ **既存の日本語を直すだけなので、初版を作り直さない**（两遍法なし）。
- 「只优化中文表达」只产出中文。**不要输出日语**，即使你能翻译。
  用户可能只是要中文脚本给人工翻译用。★ **日本語を訳さないので两遍法なし**。

> 若用户只给了日语、却选了中文或翻译模式，或只给了中文、却选了纯 TTS，
> **指出输入与模式不符并请其确认**，不要自行换模式。

### A 模式的中文层：只按经历与性格构建

「只优化中文表达」的中文角色腔，**只从角色知识库的「人物经历」与「性格」推导**，
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

译名数据在 `../dictionary/proper-nouns.yaml` 的 **characters 段**：
`zh`（中文名）/ `zh_alt`（别译）/ `zh_community`（早期译）。
**已补完的只有 Poppin'Party 和 MyGO 两个乐队**，其余乐队遇名时按 G8 列入【待确认】。
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

### G 保留层（仅在「翻译 + TTS」下有意义）

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

### 翻訳モードでは Pass 2 にも同じ基準を当てる

两遍法（`rules/japanese.md` J0）でも、**Pass 2 の変更は同じ基準で判定する**。

**Pass 1 の自然な初版が既に正しいなら、Pass 2 は何も変えなくてよい。**
「規則を通した証拠」として変更を作ってはいけない。

```text
✅ 初版のまま → 「【修改】初版から変更なし」と書く
❌ 変更が無いと仕事をしていないように見えるので、
   キャラ語尾を足す／言い回しを変える   ← 最も避けたい失敗
```

**Pass 2 が変えてよいのは、実際に欠陥を 1 節で名指しできる箇所だけ**——
書き言葉の語、誤った助詞、称呼の不一致、読み間違い、情報の脱落。
「もっとらしくできる」は理由にならない。

## Inputs

**現在公開している機能で必要なもの**：

| 機能 | 角色 | 検査対象のテキスト | 備考 |
|---|---|---|---|
| **基础人设检查**（日语） | ✅ | **日语**成稿 | 专有名词・称呼・語体を見る |
| **基础人设检查**（中文） | ✅ | **中文**成稿 | 中文表記・称呼を見る |
| **TTS 断句及易读错字检查** | — | **日语**成稿 | 角色情報は不要（表記と読みだけ見る） |

> **中文の基礎人設検査には中文の成稿が必要。**
> 中文原文が無い場合（日本語だけがある場合）は、
> **日本語の表記から中文表記を推測しない**——G8。

Useful in all modes:

- **场景/情绪** — excited, shy, sad, teasing. Character voice is conditional on
  this. When unstated, infer from the line and state your inference.
- **TTS 引擎** — see "Engine" below.

Always gate before reading rule files. The Gates decide *which* files
matter; loading `rules/tts.md` for a 中文-only run wastes context and invites
out-of-scope edits.

### 附録：翻訳モードで必要な入力（非公開）

| 模式 | 角色 | 中文原文 | 已有日语 |
|---|---|---|---|
| A 只优化中文 | ✅ | ✅ | — |
| B 翻译 + 角色化 | ✅ | ✅ | 不需要（可作参考） |
| C 只做 TTS | — | — | ✅ |
| D 翻译 + TTS | ✅ | ✅ | 不需要（可作参考） |

## Execution order

Run the stages in order. Each stage is allowed to pass. Do not skip a stage,
and do not report a stage as passing unless you actually checked it.

### ★ 現在公開している 2 機能（Gate 2 で選ばれたもの）

**どちらも「検査」——日本語を新しく作らない。**
★ **翻訳・角色化は非公開なので、ここには無い**（`附録` 参照）。

| 機能 | Stage | 何を見るか | 主に読むファイル |
|---|---|---|---|
| **基础人设检查**<br>（专有名词正确性检查） | **1 → 3** | ①**专有名词**の表記・読みが辞書と一致するか<br>②**称呼**が人間関係の設定と一致するか<br>③**角色の語体**が設定から外れていないか<br>④**出典に無い情報を足していないか**（G2） | `rules/global.md`（G1–G3, G6, G7, G9, G11）<br>`dictionary/proper-nouns.yaml`<br>`dictionary/address-forms.yaml`<br>`characters/<角色>.md` |
| **TTS 断句及易读错字检查** | **4 → 5** | ①**句長**が上限内か<br>②**停顿・标点**が朗読に合うか<br>③**誤読しやすい字**（多音字・難読・当て字）<br>④**英字**が残っていないか（G9）<br>⑤数字表記 | `rules/tts.md`<br>`dictionary/pronunciation.yaml`<br>`dictionary/proper-nouns.yaml` |

**「両方」が選ばれた場合**：`1 → 3 → 4 → 5` の順で通す。
★ **人設検査を先に**やる——表記が変われば読みも変わるため。

### ★ どちらの検査も「直す」より「指摘する」が主

**検査モードは書き換えを主目的にしない。**
見つけた問題は**根拠（どの規則・どの辞書項目）と一緒に示す**。

```text
✅ <箇所> → <問題> → <根拠: G7 / proper-nouns.yaml の該当項目> → <推奨の直し>
❌ 黙って直して、変更点を説明しない
❌ 問題が無いのに「らしくする」ための書き換えをする
```

**問題が無ければ `問題なし` と書く。**
検査は**欠陥を探す工程**であって、**産出量を競う工程ではない**
（下の "The single most important rule" と同じ基準）。

### 中国語が選ばれた場合

**機能は「基础人设检查」1 つだけ**（Gate 2 の選択肢も 1 つ）。

**日本語の規則（语尾・ですます・TTS 断句）は適用しない。**
中国語に `〜だよ` / `〜わ` の対応物は無い——**当てると怪中文になる**。

| # | 何を見るか | 主に読むファイル |
|---|---|---|
| C1 | **专有名词**の中国語表記（`zh` / `zh_alt` / `zh_community`）が辞書と一致するか | `proper-nouns.yaml` |
| C2 | **称呼**が設定と一致するか | `address-forms.yaml` |
| C3 | **角色の語体**が設定から外れていないか | `characters/<角色>.zh.md`（**未整備**） |
| C4 | 出典に無い情報を足していないか（G2） | `rules/global.md` |

> ⚠️ **C3 の `characters/<角色>.zh.md` は未整備**。
> → 中文の角色腔は**「经历」と「性格」からのみ**導出し、
> **`observed` 級として提示**する。断定しない（下記「中文层」参照）。
> 判断材料が無い場合は **`問題なし` ではなく「判断材料が無い」と書く**（G8）。

---

## 附録：翻訳モードの実行順序（非公開）

> **以下は非公開。** 翻訳を再公開する際に有効化する。
> 規則は `rules/` にそのまま残っている。

### ★★ 翻译は必ず 2 遍で行う（`rules/japanese.md` の J0）

**「翻訳成日语」と「翻訳 + TTS」は、いきなり Stage 1〜6 を回さない。**

```text
Pass 1  自然な初版      制約を意図的に外し、「日本人が実際にそう言うか」だけを狙う
                        （角色の語尾・称呼・TTS・句長上限を適用しない。G1/G3 は守る）
   ↓
Pass 2  規則で复核      初版に Stage 1〜6 を順に当て、1 語ずつ吟味して直す
```

**理由**：一度に全制約を満たそうとすると、制約の数だけ日本語が硬くなる。
**先に自然さを作り、規則にそれを挑剔させる。**

- Pass 1 でも**守る**：G1（意味を変えない）・G3（過度に潤色しない）・情報を落とさない
- Pass 1 で**外す**：角色の語尾/一人称/口癖・称呼表・TTS 断句/表記/読み・句長上限
- Pass 2 は**書き直しではなく吟味**。直す必要が無い箇所はそのまま残す
- **規則が自然さを壊す場合は、勝手に選ばず【待确认】に出す**（案A/案B を並べる）
- ★ **Pass 1 の結果を出力に残す**（`【自然な初版】`）。捨てない

### Stages（Pass 2 で回すもの）

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
| A 只优化中文 | **C1–C3**（见下「中文层」），不跑 1–6。**两遍法も適用しない**（日本語を訳さないため） |
| B 翻译 + 角色化 | **Pass 1 → Pass 2（1 → 2 → 3 → 6）**（不做 4–5 的 TTS 手术） |
| C 只做 TTS | **仅 4 → 5**。不跑 1–3、6。★ **两遍法は適用しない**（既存の日本語を直すだけ） |
| D 翻译 + TTS | **Pass 1 → Pass 2（全 6）** |

> ★ **两遍法が要るのは「日本語を新しく作る」モードだけ**——
> 翻訳 + 角色化（B）と 翻訳 + TTS（D）。
> 「只优化中文」は日本語を作らないし、「只做 TTS」は既存の日本語を直すだけなので、
> **初版を作り直す必要が無い**。

### 中文层（仅「只优化中文表达」用）

「只优化中文表达」处理的是**中文**，日语规则不适用。中文层的三个阶段：

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
> - 因此该模式的产出必须带 `basis` 声明与置信度，不能宣称"这就是她的中文腔"

「只优化中文表达」被选中时：先按 `characters/_template-zh.md` 建立该角色的中文层，
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

**「只优化中文表达」只用前两层。** TTS 层不参与——本 skill 的 TTS 层针对日语朗读，
中文层没有对应物。所以中文层不要为了"好读"去调标点密度或加停顿。

**「只做 TTS 读音纠正」反转了优先级。** 此时文本的角色化**已经由人工完成**，
不再重判角色口吻。读法是唯一的判断对象：

```
读音/断句 (tts)             — 唯一目标
    >
不改动角色表达 (character)  — 除 T5 veto 外不得改动用词语体
```

「只做 TTS 读音纠正」下 G1（语义）仍不可违反，但 G3（不过度润色）升格为
**"不做任何非读音改动"**。

## How to load the rule files

Load only what the task needs. The point of splitting these files is context
economy — do not read all of `characters/` to polish one line.

**Load by function.** Gate 2 already told you which checks are in play:

| Gate 2 の選択 | 读 |
|---|---|
| 基础人设检查（日语） | `rules/global.md`, `dictionary/proper-nouns.yaml`, `dictionary/address-forms.yaml`, `characters/<角色>.md` |
| 基础人设检查（中文） | `rules/global.md`, `dictionary/proper-nouns.yaml`, `dictionary/address-forms.yaml`, `characters/<角色>.zh.md` |
| TTS 断句及易读错字检查 | `rules/tts.md`, `dictionary/pronunciation.yaml`, `dictionary/proper-nouns.yaml`（**不读** `characters/`） |
| 両方 | 上記の和集合 |

> ★ **TTS 检查だけなら `characters/` を読まない。**
> 表記と読みだけを見るので、角色ファイルは不要——context の無駄遣いであり、
> つい語体まで直したくなる（この機能の範囲外）。

### 附録：旧 Gate A による読み分け（非公開）

| Gate A 选择 | 读 |
|---|---|
| 只优化中文表达 | `rules/global.md`, `characters/<角色>.zh.md` |
| 翻译成日语 | `rules/global.md`, `rules/japanese.md`, `characters/<角色>.md` |
| 翻译 + TTS | 全部 |
| 只做 TTS 读音纠正 | `rules/tts.md`, `dictionary/*.yaml`（**不读** `characters/`） |

1. Always read `rules/global.md` — every mode needs G1–G3.
2. Read `characters/<band>/<角色>.md`（日语层）or `characters/<band>/<角色>.zh.md`（中文层）
   — the band is `characters/<band>/_band.md`. Read it too when more than one
   member appears in the same scene, because it carries the intra-band register map.
   for the named character. If it does not exist, **stop and say so** — do not
   improvise a character voice from general knowledge of the franchise, and do
   not silently fall back to generic "natural language". Offer to draft the file
   from `characters/_template-ja.md`（日语）or `characters/_template-zh.md`（中文）.
   For a whole band, start from `characters/_template-band.md`.
3. Read `dictionary/proper-nouns.yaml` whenever the text contains a name, song
   title, band name, or place — **all checks**, because 中文名（`zh` / `zh_alt` /
   `zh_community`）もここにあり、中文の 人設検査 で必要になる。
   For Japanese output also read `dictionary/pronunciation.yaml` whenever the
   line contains a kanji with multiple readings, a numeral, or an acronym.
   中文/翻译系模式还要读 `dictionary/address-forms.yaml`（当文本含称呼时）。
4. Read `corrections/<角色>/` and `corrections/_rules.yaml` when the same
   pattern has come up before. `_rules.yaml` carries the promoted rules with
   their confidence; prefer `established` over `observed`.

## Output format

Default to the full format while the rule set is young — the explanations are how
the rules get audited and corrected. **中文输出用中文标签，日语输出用日语标签。**

### 开头必须回显采用的选择

每次输出开头加一行，让用户能一眼发现哪项理解错了。
**写选项文本，不要写序号或字母码**（那些在提问时不出现，回显它们用户对不上）。

```
【档位】目标语言：日语 / 功能：基础人设检查（专有名词正确性检查）
```

**Gate 1（目标语言）と Gate 2（功能）は必ず両方書く。**
ユーザーが選んだ 2 つが、そのまま出ているか確認できるようにする。

```
【档位】目标语言：日语 / 功能：TTS 断句及易读错字检查
【档位】目标语言：日语 / 功能：両方
【档位】目标语言：中文 / 功能：基础人设检查（专有名词正确性检查）
```

> **旧 gate（A〜G）は現在問いていないので、この行に書かない。**
> 問いていないものを書くと、ユーザーは選んでいない項目を見ることになる。

### 基础人设检查（专有名词正确性检查）—— 日本語

**検査結果をリストする。** 問題が無ければそう書く。

```
【人設検査】
✓ 专有名词表記：辞書と一致（`proper-nouns.yaml`）
✓ 称呼：`address-forms.yaml` と一致
✓ 角色語体：`characters/<角色>.md` の記載範囲内
✓ 追加情報なし（G2）

【指摘】
- <箇所>：<問題>
  → 推奨：<直し>
  → 根拠：<G7 / proper-nouns.yaml の該当項目 など>
```

**問題が無い場合**：

```
【人設検査】
問題なし（专有名词・称呼・語体ともに設定と一致）
```

★ **「問題なし」は立派な結論**。書き換えて産出量を作らない
（"The single most important rule" と同じ基準）。

**判断材料が無い場合**は、**「問題なし」と書かず**にそう書く（G8）：

```
【人設検査】
⚠ 判断材料が無い：<何が不明か>
  → <箇所> は未確認のため、【待确认】に出す
```

### TTS 断句及易读错字检查

```
【TTS検査】
✓ 断句自然（句長は上限内）
✓ 无明显多音词风险
✓ 标点适合朗读

【指摘】
- <箇所>：<誤読リスク / 断句の問題>
  → 推奨：<表記の変更 など>
  → 根拠：<pronunciation.yaml の該当項目 / rules/tts.md の条項>
```

**未検証の読みは「未検証」と書く。** 辞書に `verified: false` と
記録されている項目を「問題なし」に含めない。

---

## 附録：翻訳モードの出力形式（非公開）

> **以下は非公開。** 翻訳を再公開する際に有効化する。

### 翻译成日语 / 翻译 + TTS（日语输出）

★ **Pass 1（自然な初版）を必ず併記する**（`rules/japanese.md` J0）。
ユーザーが両方を比べられないと、Pass 2 が何をしたか検証できない。

```
【自然な初版】
<Pass 1。制約を外して「日本人が実際にそう言うか」だけを狙った訳。
 角色の語尾・称呼・TTS・句長上限は未適用>

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

**Pass 1 で既に自然な箇所は `【修改】` に出さない。**
出すのは**実際に変えた箇所だけ**——初版から何も変わらなければ、
`【修改】初版から変更なし` とだけ書く。
**変更が無いことを「仕事をしていない」と感じて水増ししない。**

**規則と自然さが両立しなかった箇所は `【待确认】` に案A/案B を並べる**（J0）。
勝手にどちらかを選ばない。

「翻译成日语」（不含 TTS）的 `【TTS检查】` 只做**告知**，不做 TTS 手术。
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

### 只优化中文表达（中文输出）

```
【优化结果】
<最终中文>

【修改】
<原句>
→ <改后>

【原因】
- <global G1-G3 / character-zh 的哪一条>
```

「只优化中文表达」**不输出 `【TTS检查】`**。中文不面向 TTS。

### 只做 TTS 读音纠正（纯 TTS）

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
- 语体、用词、角色口吻：**未动**（该模式不做角色化）
```

**`【未改动】` 是该模式的必需项。** 没有它，用户无法判断
"是不是偷偷改了台词"——而该模式的全部价值就在于只动读法。

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
a 译名分歧 not recorded in `characters[].zh`. **所有模式都要保留这一节。**
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

characters/               ★ 按乐队/分类分目录（见下）
├── _template-ja.md           模板（日语层）— 新角色从这里开始
├── _template-zh.md           模板（中文层）
├── _template-band.md         模板（乐队层）
├── poppin-party/             ポッピンパーティ（5 人）
├── roselia/                  ロゼリア（5 人）
├── raise-a-suilen/           レイズアスイレン（5 人）
├── ave-mujica/               アヴェムジカ（5 人）
├── mygo/                     マイゴ（5 人）
├── crychic/                  ★ `_band.md` のみ。**角色ファイルを置かない**
│                              （5 人全員が他バンドにファイルを持つため）
├── sumimi/                   アイドルユニット（バンドではない）
│   ├── _band.md              スミミ
│   └── mana.md               純田まな
└── music-industry/           ★ バンドに所属しない人物
    ├── _category.md
    └── livehouse/
        ├── _livehouse.md     職種共通（接客業の語体）
        ├── shifune.md        都筑詩船
        ├── marina.md         月島麻里奈
        └── rinko.md          真次凛々子

characters/<band>/<角色>.zh.md  中文层 — **尚未建立**（需要时再建）

_extraction-notes.md      ★ 出典抽出の横断メモ（G10 の運用記録）

corrections/_schema.md         记录格式 + 分类 + 规则升级标准
corrections/_rules.yaml        已提炼规则 + confidence + evidence_count
corrections/kasumi/            戸山香澄 的修订记录
dictionary/pronunciation.yaml  读音词典（日语输出用）
dictionary/proper-nouns.yaml   专有名词统一表 + 中文名（中文の人設検査で使う）
dictionary/address-forms.yaml  称呼对应表（G6 的唯一事实来源）
examples/input/                输入样例
examples/output/               输出样例
```

### ★ 出典の抽出について（G10）

角色知识は萌娘百科などの**二手资料**から抽出する。
抽出ツールは**リポジトリ根**の `extract.mjs`（skill の外にある）。

```bash
node extract.mjs <html>              # 節一覧
node extract.mjs <html> <節名> …      # 指定節を抽出
```

★ **`extract.mjs` は「本編でない」マークアップを明示する**：

```text
〖冗談〗…〖/冗談〗     just-kidding-text＝编者が玩笑と明示。台詞の根拠にしない
〖伏せ字〗…〖/伏せ字〗  heimu＝伏せ字。推测・補足・ネタバレが多い
```

**抽出結果にこれらのマークが出たら、引用前に必ず判断する**（G10）。
判断の記録は `_extraction-notes.md` に残す。

### なぜバンド別ディレクトリか

- **乐队共通の情報**（語体マップ、関係性、口号）は `_band.md` に集約され、
  各角色ファイルに重複しない。重複は必ず齟齬を生む。
- **複数角色が同じ場面に出る**とき、まず `_band.md` を読めば
  「誰が誰にどう話すか」が一目で分かる。
- **新しいバンドを追加する**ときは `_template-band.md` から起こし、
  そのディレクトリに角色を足していく。

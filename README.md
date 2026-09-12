# BanG Dream! 角色日语 TTS 优化 Skill

把 AI 翻译的中文小剧场/宣传脚本，优化成**符合 BanG Dream! 角色说话习惯、自然的日语、
并且适合 TTS 朗读**的最终台词。

## 定位

这不是翻译器，也不是角色模仿器，而是：

> **角色化日语 + 日语自然度 + TTS 可读性优化层**

输入是「中文原文 + 已有的 AI 日语翻译」，输出是可直接配音的最终台词。
核心指标不是"改得多好"，而是**改得尽可能少**——原文没问题就输出 `无需修改`。

## 目录结构

```
BanGDream-JP-Polish/
├── README.md                        本文件
├── 开发交接文档（需求来源）
└── .dsh/skills/bangdream-jp-tts/    ← Skill bundle
    ├── SKILL.md                     工作流、优先级、输出格式
    ├── rules/
    │   ├── global.md                语义/信息/关系/专有名词/英文转写（全角色）
    │   ├── japanese.md              日语自然度
    │   └── tts.md                   断句/停顿/读音/情绪
    ├── adapters/
    │   └── gpt-sovits.md            引擎适配（已确定 GPT-SoVITS）+ 验证清单
    ├── characters/                  ★ 按乐队分目录
    │   ├── _template-ja.md          新角色从这里开始（日语层）
    │   ├── _template-zh.md          中文层模板（只优化中文时用）
    │   ├── _template-band.md        乐队层模板
    │   ├── poppin-party/
    │   │   ├── _band.md             ポッピンパーティ（語体マップ・関係性）
    │   │   ├── kasumi.md            戸山香澄（Vo/Gt）
    │   │   ├── tae.md               花園たえ（Gt）
    │   │   ├── rimi.md              牛込りみ（Ba）
    │   │   ├── saaya.md             山吹沙綾（Dr）
    │   │   └── arisa.md             市ヶ谷有咲（Key）
    │   ├── roselia/
    │   │   ├── _band.md             ロゼリア（語体マップ・関係性）
    │   │   ├── yukina.md            湊友希那（Vo/作詞作曲）
    │   │   ├── sayo.md              氷川紗夜（Gt）
    │   │   ├── lisa.md              今井リサ（Ba）
    │   │   ├── ako.md               宇田川あこ（Dr）
    │   │   └── rinko.md             白金燐子（Key）
    │   ├── ave-mujica/
    │   │   ├── _band.md             アヴェムジカ（語体マップ・コードネーム）
    │   │   ├── sakiko.md            豊川祥子（Key/脚本/作曲）
    │   │   ├── mutsumi.md           若葉睦（Gt）
    │   │   ├── umiri.md             八幡海鈴（Ba）
    │   │   ├── uika.md              三角初華（Vo/Gt）
    │   │   └── nyamu.md             祐天寺若麦（Dr）
    │   ├── raise-a-suilen/
    │   │   ├── _band.md             レイズアスイレン（語体マップ・関係性）
    │   │   ├── layer.md             和奏レイヤ（Vo/Ba）
    │   │   ├── lock.md              朝日六花（Gt）
    │   │   ├── masking.md           佐藤益木（Dr）
    │   │   ├── pareo.md             鳰原令王那（Key）
    │   │   └── chuchu.md            珠手知由（DJ/Produce）
    │   ├── mygo/
    │   │   ├── _band.md             マイゴ（語体マップ・関係性）
    │   │   ├── tomori.md            高松燈（Vo）
    │   │   ├── anon.md              千早愛音（Gt）
    │   │   ├── rana.md              要楽奈（Gt）
    │   │   ├── taki.md              椎名立希（Dr/作曲）
    │   │   └── soyo.md              長崎そよ（Ba）
    │   ├── crychic/                 ★ _band.md のみ（角色ファイルを置かない）
    │   │   └── _band.md             クライシック（解散済み。5 人は他バンドにファイルあり）
    │   ├── sumimi/                  アイドルユニット（バンドではない）
    │   │   ├── _band.md             スミミ（ユニット情報）
    │   │   └── mana.md              純田まな（Vo）
    │   └── music-industry/          ★ 音楽業界（バンドに所属しない人物）
    │       ├── _category.md         カテゴリ共通情報
    │       └── livehouse/           LiveHouse 経営・運営
    │           ├── _livehouse.md    職種共通情報（接客業の語体）
    │           ├── shifune.md       都筑詩船（元 SPACE 責任者・オーナー）
    │           ├── marina.md        月島麻里奈（CiRCLE スタッフ）
    │           └── rinko.md         真次凛々子（元 SPACE → RiNG）
    │              （能々美子 は專有名詞のみ。ファイルを作らない）
    │          （中文层 <角色>.zh.md 尚未建立）
    ├── corrections/                 ★ 项目核心数据
    │   ├── _schema.md               记录格式 + 分类 + 规则升级标准
    │   ├── _rules.yaml              已提炼规则 + confidence
    │   └── kasumi/
    ├── dictionary/
    │   ├── pronunciation.yaml       读音词典
    │   ├── proper-nouns.yaml        专有名词统一表 + 中文名 zh/zh_alt（Gate B）
    │   └── address-forms.yaml       ★ 称呼对应表（G6 的唯一事实来源）
    └── examples/
        ├── input/cases.md
        └── output/expected.md
```

**为什么按乐队分目录**：乐队共通的信息（语体映射、关系性、口号）集中在
`_band.md`，不必在五个角色文件里重复——重复必然产生不一致。
多角色同场时先读 `_band.md` 就能看到「谁对谁怎么说」。
新增乐队时从 `_template-band.md` 起手。

> **注意**：DSH 只发现 `<root>/<name>/SKILL.md` 和 `<root>/<name>.md` 这两种形式，
> 嵌套的 `**/SKILL.md` 一律忽略。所以 `SKILL.md` 必须在 bundle 根目录下。

## 安装位置

DSH 扫描以下根目录（优先级从高到低）：

| 优先级 | 根目录 | 说明 |
|---|---|---|
| 100 | `<项目根>/.dsh/skills` | **项目根 = 含 `.git` 的目录** |
| 200 | `<项目根>/.agents/skills` | |
| 400 | `~/.dsh/skills` | 即 `C:\Users\xiaot\.dsh\skills`，全局可用 |

本 Skill 同时安装在本项目的 `.dsh/skills/` 和用户级 `~/.dsh/skills/`。

**项目根必须含 `.git` 目录**，否则 DSH 会一直向上找不到项目根，
`.dsh/skills` 不会被扫描。本项目已 `git init`。

## 使用

在 DSH 会话中：

- 自动触发：给出角色名 + 台词，或提到「日语优化」「角色语气」「TTS 断句」「中文优化」
- 手动触发：`/bangdream-jp-tts`

### 七个 Gate（开始前一次问完）

Skill 用**一次 `ask_user_question` 调用**把 gate 全部问完（该工具的 `questions`
数组无数量上限）。选项**不带序号**——工具的列表 UI 自带选择器，再写序号会重复；
推荐项放在首位并标注 `(推荐)`。可直接回「全默认」。

| Gate | 问什么 | 选项（推荐在首位） |
|---|---|---|
| **A 处理模式** | 做什么 | 翻译成日语（推荐）/ 只优化中文 / 翻译+TTS / 只做 TTS 读音纠正 |
| **B 中文译名偏好** | 用哪套译名 | 贴近官方·爽世（推荐）/ 更社区化·素世 |
| **C 成稿用途** | 给谁看 | 两者都要（推荐）/ 配音用 / 字幕用 |
| **D 敬语档位** | 语体严格度 | 按原作设定（推荐）/ 本场景放宽 / 全篇统一 |
| **E 改动幅度** | 我下手多重 | 允许口语化改写（推荐）/ 只改错误 / 允许重构句子 |
| **F 批次一致性** | 多段时 | 整批次一致（推荐）/ 逐句独立 |
| **G 保留层** | 做哪些层 | 全层（推荐）/ 跳过断句 / 跳过读音 |

默认值就是上表的推荐项。每次输出开头会回显实际采用的档位（写选项文本，
不写字母码），便于你发现哪项理解错了。

**⚠️ Gate B 只在输出含中文成稿时才问。** 输出是日语时译名变体无意义
（日语一律写假名「そよ」），问了会让人以为这个选择有效果。
唯一例外：输入里已经混用了两种中文译名（如同时出现「爽世」「素世」），
此时即使输出日语也要问一次，以确定统一成哪种。

**几个关键约束**：

- **只做 TTS 读音纠正**时**不做角色化**——已有日语是正确台词，只处理读法。
  输出必须有 `【未改动】` 一节，声明语体和用词没被动过。
- **C 成稿用途**决定标点与句长的判断标准。配音与字幕的要求是冲突的；
  选「两者都要」且某句必须不同时，输出两版并说明差异，**不取平均糊过去**。
- **D 选「全篇统一」**会抹掉角色特征（如そよ 的两层语体、立希对灯的特殊待遇），
  skill 会在输出开头提示损失了什么。
- **E 放宽的是改动手法的范围，不是改动的门槛**——G1/G3 仍然成立。

### 中文层的现状（尚不完善）

「只优化中文表达」需要 `characters/<角色>.zh.md`（中文层规则），**这些文件尚未建立**。

中文角色腔**只从「经历」与「性格」推导**，依据必须写在文件的 `basis` 节里、
可回溯到具体出典。禁止依据：日语语尾、对作品的泛印象、二创观感、其他作品角色。

**且该维度本身也不完整**：没有官方中文台词可依据（原作是日语），
所以推导出的中文角色腔只能是 `observed` 级别，不能当既定事实。

日语层（`characters/<band>/<角色>.md`）管 `〜だよ`／です・ます 这类语尾，
中文没有对应物，**两者不可互相套用**——否则会写出翻译腔。

## TTS 引擎

**已确定为 GPT-SoVITS**（2026-02-14）。

引擎特定行为集中在 `adapters/gpt-sovits.md`，**不写进 `rules/`**。
核心规则保持引擎无关，换引擎时只替换 adapter 文件。

**关键结果：英文一律转写为片假名（G9，无条件）。**

理由是引擎行为而非风格偏好：GPT-SoVITS 对拉丁字母走**英语 G2P**，
产出英语音素而非日语母语者说外来语时的音。`Live` → 英语 /laɪv/，不是 ライブ 的 らいぶ。
这会让角色听起来像**在说英语**，直接破坏角色还原度。

因此乐队名等英字专有名词**同样转写**：

```text
Poppin'Party  → ポッピンパーティ
BanG Dream!   → バンドリ
```

`dictionary/proper-nouns.yaml` 的 `canonical` 已同步改为片假名，
拉丁原表記保留在 `latin` 字段供追溯。转写会消掉原表記的符号（`!` `'` `*`），
**不要补回正文**。

> ⚠️ `adapters/gpt-sovits.md` 当前 `verified: false` —— 引擎行为描述基于通用架构认知，
> **尚未实机合成验证**。上机第一件事是跑其中的「验证清单」并回填结果。

## 数据状态（重要）

| 部分 | 状态 |
|---|---|
| `rules/`（global / japanese / tts） | ✅ 可直接使用。基于日语语言学通用规律 |
| `adapters/gpt-sovits.md` | ⚠️ 引擎已确定，但 `verified: false` —— **行为描述未实机验证** |
| `characters/poppin-party/*.md` | ⚠️ 基于萌娘百科条目撰写（香澄・たえ・りみ・沙綾・有咲）。**沙綾 的语言特征条目里几乎没有**，该文件规则稀薄已标注 |
| `characters/roselia/*.md` | ⚠️ 基于萌娘百科条目撰写（友希那・紗夜・リサ・あこ・燐子）。**友希那・リサ・あこ 的条目无称呼节**，称呼表从对手侧重建 |
| `characters/ave-mujica/*.md` | ⚠️ 基于萌娘百科条目撰写（祥子・睦・海鈴・初華・若麦）。称呼数据**5 人全有称呼一览**（质量最高）。**睦的别人格与初華的双重名义未确定** |
| `characters/raise-a-suilen/*.md` | ⚠️ 基于萌娘百科条目撰写（レイヤ・六花・益木・令王那・知由）。**益木 的条目无称呼节**，同上有重建 |
| `characters/mygo/*.md` | ⚠️ 基于萌娘百科条目撰写（燈・愛音・楽奈・立希・そよ） |
| 各角色文件末的「表记待确认」 | ⚠️ 多处日文表记/读音**待核对**（tae 的中文名、りみ 的关西腔、RiNG 的假名形等） |
| `dictionary/pronunciation.yaml` | ✅ `verified_readings` 15 项**朗读已由用户确认**（2026-02-14）；⚠️ 其余条目 `verified: false`，且**全部条目均未用真实 TTS 验证** |
| `corrections/_rules.yaml` | ⚠️ 全部是 `status: demo`，源自需求文档示例，**不得作为强制依据** |
| `corrections/kasumi/*.yaml` | ⚠️ 示范记录，非真实数据 |

**两种「verified」不是一回事。** `pronunciation.yaml` 里：

- `verified_readings` 的 `verified: true` = **朗读本身经用户确认**（该读什么）
- 其余条目的 `verified: false` = 朗读未确认
- **两者都没做 TTS 实机验证**（引擎实际发出什么音）

把前两者当成第三者会产生虚假的安心感。实机验证清单在 `adapters/gpt-sovits.md`。

**这些标记不是形式。** 用未验证的读音词典去改文本，会产生新的错误。
下一步就是把 `adapters/gpt-sovits.md` 的验证清单跑一遍——
这是目前唯一挡在可用性前面的硬问题。

## Learn 工作流：怎么让它越用越好

这是项目的长期价值所在。当你手上有「AI 原始翻译 + 人工修改版」时：

1. 把两份文本交给 skill，说明是 Learn 任务
2. skill 会逐条 diff，按 `corrections/_schema.md` 的分类归档
3. 每处改动写入 `corrections/<角色>/<日期>-<slug>.yaml`
4. **只有重复证据达到阈值才升级为规则**：
   - 1〜2 次 → `observed`（不作强制依据）
   - 3〜9 次 → `recommended`
   - 10+ 次 → `established`
5. 无法推广的改动会被**明确拒绝并记录**在 `not_promoted`

闭环：

```
人工修改 → Correction 数据集 → 规则提炼 → Skill 更新 → 下次自动修正
                    ↑                                      │
                    └──────────── 使用越多，人工修改越少 ────┘
```

### 记录质量红线

- 只有 `input`/`output` 没有 `reason` 的记录**没有价值**
- `reason` 写"更自然"等于没写
- **绝不编造对照数据**——编造的数据无法被发现，会让整个规则库失真

## 已知限制

- 不训练模型，不生成音频或情绪参数，不抓取官方台词
- 不修改历史 correction 数据（只追加）
- 核心规则不绑定引擎；引擎差异放在 `adapters/`，不写进 `rules/`
- 目前只有 GPT-SoVITS 一个 adapter。换引擎时新增 adapter，`rules/` 不动
- 角色规则目前有 **29 人**：ポッピンパーティ / ロゼリア / レイズアスイレン / アヴェムジカ / マイゴ の各 5 人 + **スミミ 1 人**（純田まな）+ **音楽業界 3 人**（都筑詩船・月島麻里奈・真次凛々子）。新增乐队请从 `characters/_template-band.md` 起手
- **`characters/` 下并非只有乐队**：`crychic/`（仅 `_band.md`）、`sumimi/`（偶像组合）、`music-industry/livehouse/`（音乐业界 LiveHouse）。**能々美子 无独立条目，只作专有名词处理，不建角色文件**
- ✅ **CRYCHIC 的片假名形已确定 = `クライシック`**（出典简介明记）。**G9 至此没有未解决项**
  - ⚠️ 但 `クライシック` 与 `クラシック`（CLASSIC）片假名极近，出典记载「祥子提出时睦听错了」。TTS 混同风险已记入 `pronunciation.yaml`
- ⚠️ **`CiRCLE` / `SPACE` / `Galaxy` / `RiNG` 四个 LiveHouse 名全是英字，片假名形未确认**，确认前不得写入正文
- 曲名未登记；出现时按 `dictionary/proper-nouns.yaml` 的 `unregistered` 处理
- **未实机验证**：所有读音条目与 adapter 行为描述均为 `verified: false`（用户已确认的朗读另见 `pronunciation.yaml` 的 `verified_readings`）

## 参考

- **DokiDori** — 角色语言风格处理思路
- **novel-translate-tts** — 翻译与 TTS 流水线设计、TTS 前文本预处理

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
    ├── characters/
    │   ├── _template.md             新角色从这里开始
    │   └── kasumi.md                戸山香澄
    ├── corrections/                 ★ 项目核心数据
    │   ├── _schema.md               记录格式 + 分类 + 规则升级标准
    │   ├── _rules.yaml              已提炼规则 + confidence
    │   └── kasumi/
    ├── dictionary/
    │   ├── pronunciation.yaml       读音词典
    │   └── proper-nouns.yaml        专有名词统一 + 称呼对应表
    └── examples/
        ├── input/cases.md
        └── output/expected.md
```

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

- 自动触发：给出角色名 + 日语台词，或提到「日语优化」「角色语气」「TTS 断句」
- 手动触发：`/bangdream-jp-tts`
- 加载规则：skill 会用 `skill` 工具读取对应的规则文件

## 数据状态（重要）

| 部分 | 状态 |
|---|---|
| `rules/`（global / japanese / tts） | ✅ 可直接使用。基于日语语言学通用规律 |
| `characters/kasumi.md` | ⚠️ 基于通用认知撰写，**未经真实修订数据校准** |
| `dictionary/` | ⚠️ 条目已列，但 `verified: false` —— **未用真实 TTS 验证** |
| `corrections/_rules.yaml` | ⚠️ 全部是 `status: demo`，源自需求文档示例，**不得作为强制依据** |
| `corrections/kasumi/*.yaml` | ⚠️ 示范记录，非真实数据 |

**这些标记不是形式。** 用未验证的读音词典去改文本，会产生新的错误。
引擎确定后第一件事是把 `pronunciation.yaml` 的 `verified` 跑一遍。

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
- 不与特定 TTS 引擎绑定。引擎差异应放入独立的 adapter 文件，不写进 `rules/tts.md`
- 角色规则目前只有香澄一人。其余角色需按 `characters/_template.md` 补充
- 曲名未登记；出现时按 `dictionary/proper-nouns.yaml` 的 `unregistered` 处理

## 参考

- **DokiDori** — 角色语言风格处理思路
- **novel-translate-tts** — 翻译与 TTS 流水线设计、TTS 前文本预处理

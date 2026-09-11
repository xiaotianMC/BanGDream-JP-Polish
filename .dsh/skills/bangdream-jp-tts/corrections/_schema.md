# Correction 数据格式

Correction 是**这个项目的核心数据**。角色台词是公开资料，谁都能有；「AI 原始翻译 → 人工修订 + 为什么改」才是这个 Skill 唯一的护城河。

因此**格式比数量重要**。一条写清 `为什么` 的记录，胜过一百条 `input/output` 对。

---

## 1 文件组织

```text
corrections/
├── _schema.md          ← 本文件
├── _rules.yaml         ← 已提炼的规则（机器可读，带 confidence）
├── kasumi/
│   ├── 2026-02-14-live-invite.yaml
│   └── 2026-02-20-formal-scene.yaml
└── <角色>/
```

- **一条记录 = 一个文件**。文件名 `<YYYY-MM-DD>-<slug>.yaml`。
- 一个文件可以包含**多组** original/corrected 对（同一场景的一整段台词）。
- slug 用英文小写连字符，描述场景而非改动内容。

**为什么不放一个大文件**：追加不冲突、diff 干净、单条可回滚。

---

## 2 记录格式

```yaml
# corrections/kasumi/2026-02-14-live-invite.yaml

id: kasumi-2026-02-14-live-invite
date: 2026-02-14
character: 戸山香澄
scene: ライブ後の打ち上げ、メンバーとの会話
emotion: 興奮 / 感謝
source: 人工修订          # 人工修订 | 官方台词 | 其他
tts_engine: null          # 未确定就写 null，不要猜

pairs:
  - original: |
      今日は本当にすごく楽しかったです！
      次も一緒にライブをやりましょう！
    corrected: |
      今日はほんっとに楽しかったー！
      次も一緒にライブやろうよ！
    # 中文原文有时缺失；有就填，没有写 null 并在 note 说明
    chinese: |
      今天真的超级开心！下次也一起演出吧！
    changes:
      - from: 本当に
        to: ほんっとに
        issues: [character_style, emotion]
        reason: 興奮状態の強調形。香澄はこの場面で「ほんっとに」を使う
      - from: すごく
        to: （削除）
        issues: [natural_japanese]
        reason: 「ほんっとに」が強度を担うため、程度副詞の重複を解消
      - from: 楽しかったです
        to: 楽しかったー
        issues: [character_style, sentence_ending, tts]
        reason: 友人間＋興奮状態で敬体は不自然。長音が興奮を補助
      - from: やりましょう
        to: やろうよ
        issues: [character_style, sentence_ending]
        reason: 敬体の勧誘は過度に丁寧。香澄は直接誘う
      - from: ライブをやろう
        to: ライブやろう
        issues: [natural_japanese]
        reason: 口語では助詞「を」を省略する

generalizable_rule: |
  興奮状態の香澄にです・ます は使わない。
  ただし公式・目上の場面では敬体が正しい（過学習に注意）。

promoted_rule_ids: [kasumi_001]
not_promoted:
  - change: すごく → （削除）
    why: この文脈固有。他の文では「すごく」が必要な場合がある

confidence: medium
evidence_count: 1
note: |
  初回の記録。evidence_count が 1 なので promoted_rule_ids は observed 扱い。
  同種の修正が3件以上集まったら established へ昇格を検討。
```

---

## 3 字段说明

| 字段 | 必填 | 说明 |
|---|---|---|
| `id` | ✅ | `<character>-<date>-<slug>`，全局唯一 |
| `date` | ✅ | 修订日期 |
| `character` | ✅ | 中文名 |
| `scene` | ✅ | 场景。**没有场景就无法判断修改是否合理** |
| `emotion` | | 情绪。影响角色规则判断 |
| `source` | ✅ | `人工修订` / `官方台词` / `其他`。官方台词可信度更高 |
| `tts_engine` | | 未确定写 `null`。**不要猜引擎** |
| `pairs[]` | ✅ | 一次修订中的多组对照 |
| `pairs[].original` | ✅ | AI 原始版 |
| `pairs[].corrected` | ✅ | 人工修订版 |
| `pairs[].chinese` | | 中文原文。缺失写 `null` |
| `pairs[].changes[]` | ✅ | **逐条**改动。这是记录的核心 |
| `changes[].from` / `.to` | ✅ | 删除写 `（削除）` |
| `changes[].issues[]` | ✅ | 分类标签，见 §4 |
| `changes[].reason` | ✅ | 为什么改。**写不出理由 = 这条不该改** |
| `generalizable_rule` | | 若可推广，用一句话写清 |
| `promoted_rule_ids` | | 已升级到 `_rules.yaml` 的规则 id |
| `not_promoted[]` | | **明确拒绝推广的改动 + 原因**。这一项和 `promoted_rule_ids` 同样重要 |
| `confidence` | ✅ | `observed` / `recommended` / `established` |
| `evidence_count` | ✅ | 支撑该结论的样本数 |
| `note` | | 补充说明、存疑点 |

---

## 4 分类标签

一条改动**可以同时属于多个类别**。

```text
translation        误译、漏译、增译
natural_japanese   日语不自然（含中文式表达）
character_style    角色口吻不符
vocabulary         用词选择
grammar            语法错误
sentence_ending    句尾/语体（です・ます vs 常体）
punctuation        标点
segmentation       断句
pronunciation      读音
tts                TTS 可读性
emotion            情绪表现
context            上下文/前后文一致性
```

**用法**：

- 分类决定这条经验归到哪一层规则：`translation`/`grammar`/`natural_japanese` → `rules/japanese.md`；`character_style`/`vocabulary`/`sentence_ending` → `characters/`；`tts`/`segmentation`/`pronunciation`/`punctuation` → `rules/tts.md`
- 只在必要时用多标签。全标签等于没标签。

---

## 5 规则升级：避免错误学习

**不是所有人工修改都该变成规则。** 这是本流程最容易出错的地方。

### 不能推广的例子

```text
AI：  今日は楽しかった！
人工：今日はめっちゃ楽しかった！
```

❌ 不能得出「永远把『楽しかった』改成『めっちゃ楽しかった』」。

要问的是：

> 这是**特定上下文的修改**，还是**角色的长期语言特征**？

### 升级判定

一条改动升级为规则，必须同时满足：

1. **可陈述**：能用一句话说清规律（写不出 → 不升级）
2. **有重复证据**：同种改动出现 **3 次以上**，且来自**不同场景**
3. **有边界**：能说清什么情况下**不适用**
4. **不是场景偶然**：排除"这次角色碰巧心情特别好"

第 3 条最常被忽略。一条没有边界的规则必然过拟合。

### confidence 等级

| 等级 | evidence_count | 说明 |
|---|---|---|
| `observed` | 1〜2 | 观察到，可能是个案。**不能作为强制修改依据** |
| `recommended` | 3〜9 | 有重复证据，可作为倾向。改不改要说明理由 |
| `established` | 10+ | 稳定特征。可默认应用 |

**注意**：等级由**证据数量**决定，不由"听起来对不对"决定。

### 升级操作

1. 在 `_rules.yaml` 新增条目：

```yaml
- id: kasumi_001
  rule: 興奮状態ではです・ます を使わない
  layer: character
  applies_to: [戸山香澄]
  scope: 興奮・親しい相手との会話
  excludes: 公式の場、目上、初対面       # 边界，必填
  confidence: observed
  evidence_count: 1
  evidence: [kasumi-2026-02-14-live-invite]
  created: 2026-02-14
```

2. 在原 correction 文件里填 `promoted_rule_ids`
3. **同步更新** `characters/<角色>.md` 对应小节——`_rules.yaml` 和角色文件必须一致，否则会出现两套互相矛盾的规则

### 降级 / 删除

规则被后续数据证伪时，**不要直接删**：

```yaml
- id: kasumi_001
  status: retracted       # active | retracted
  retracted_reason: 後続データで反例が3件。公式場面での敬体使用を確認
  retracted_date: 2026-03-01
```

保留痕迹，避免同一个错误结论被重新推导出来。

---

## 6 记录质量红线

| 反模式 | 为什么错 |
|---|---|
| 只有 `input`/`output`，没有 `reason` | 学不到任何东西。这就是文档 §12 批评的错误设计 |
| `reason` 写"更自然" | 等于没写。必须说清哪里不自然 |
| 一次修改标 5 个 `issues` | 没做分类工作 |
| 从 1 个样本升级规则 | 过拟合（§15） |
| 没有 `not_promoted` | 说明没做"是否该推广"的判断 |
| 到处写 `established` | 等级由证据数决定 |
| 猜 `tts_engine` | 违反 G8。不确定写 `null` |
| 用编造的对照数据 | **最严重**。编造数据会让整个规则库失真，且无法被发现 |

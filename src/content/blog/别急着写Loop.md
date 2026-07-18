---
title: "别急着写 Loop：AI Agent 工程的概念地图"
date: 2026-07-18
description: "行业每三个月造一个新 -Engineering 词。但如果你不理解每个概念解决了什么独特问题，你就会在用 Loop 的方式去修 Prompt 的问题。这篇用四个正交的问题域画一张完整的地图，然后告诉你地图上还缺什么。"
tags: [AI, Loop-Engineering, Context-Engineering, Harness-Engineering, Agent, Prompt-Engineering]
draft: false
featured: true
---

2023 年，我们学 Prompt Engineering。2024 年，有人说 Prompt 不够了，要 Context Engineering。2025 年，Mitchell Hashimoto 提出 Harness Engineering。2026 年中，Peter Steinberger 发推说"你不应该再手动 prompt coding agent 了，你应该设计 loops"——Loop Engineering 登场。[^1]

每三个月一个新词。每个新词出现时，都有人说"前一个已死"。

但这里有一个问题：这些概念到底是什么关系？是递进替代——后者取代前者？还是层层嵌套——Loop 包含 Harness，Harness 包含 Context？还是完全不同的什么东西？

如果你回答不了这个问题，你就会犯一个昂贵的错误：**用 Loop 的方式去修 Prompt 的问题**。Agent 理解错了你的意图，你却去改调度策略。

这篇文章试图画一张地图。

## 一、四个问题域

我花了一些时间拆解这些概念的边界，最终得到的结论是：**它们是四个正交的问题域，互不包含，互不替代。**

| | 核心问题 | 问题域 | 失败时的症状 |
|---|---|---|---|
| **Prompt Engineering** | 怎么表达意图？ | 表达域 | 模型理解错了你要什么 |
| **Context Engineering** | 模型需要知道什么？ | 信息域 | 模型不知道该知道的 |
| **Harness Engineering** | 运行时出了错怎么办？ | 可靠性域 | 模型做错了，没有东西兜住 |
| **Loop Engineering** | 人不在时怎么持续运转？ | 自治域 | 人一走，系统就停 |

每个问题域是正交的——回答一个问题不需要回答另一个。

### 诊断决策树

当你面对一个 Agent 系统的失败时，可以用这棵树精确诊断它属于哪个域：

```
Agent 出了问题
│
├─ 它理解你的意图了吗？
│   ├─ 否 → 表达域（改 Prompt）
│   └─ 是 ↓
│
├─ 它拥有完成任务所需的信息吗？
│   ├─ 否 → 信息域（改 Context）
│   └─ 是 ↓
│
├─ 它犯错时系统兜住了吗？
│   ├─ 否 → 可靠性域（改 Harness）
│   └─ 是 ↓
│
└─ 人不在时它还能运转吗？
    ├─ 否 → 自治域（改 Loop）
    └─ 是 → 系统健康
```

每一层诊断的都是**不同性质的问题**，对应不同的工程手段。你不会因为 Agent 做错了就去改 prompt，如果问题出在 harness 上。

### 用同一场景验证

假设任务："让 Agent 修复一个 failing test"。同一个任务，四个问题域各自独立地出问题：

| 问题域 | 可能的失败 | 对应的修复 |
|---|---|---|
| **表达域** | "修复这个测试" → Agent 改了测试代码让它通过，而不是修业务逻辑 | Prompt 改为"修复导致测试失败的源代码，不要修改测试本身" |
| **信息域** | Agent 不知道项目用 Jest 而不是 Mocha，运行命令报错 | 注入 `package.json` 和构建脚本信息到上下文 |
| **可靠性域** | Agent 改了代码但引入了新 bug，没有 lint 和测试拦截 | Harness 强制运行全量测试 + lint，不通过则回滚 |
| **自治域** | 你下班了，CI 又挂了，没人驱动 Agent 去修 | Loop 定时扫描 CI 状态，自动发现并修复 |

四类失败，四种原因，四种修复策略。

### 历史顺序的真相

这四个问题域的并列关系自然解释了**为什么这些概念会在历史上依次出现**——不是因为后者替代前者，而是因为当一个问题域被解决后，下一个问题域的瓶颈才暴露出来：

```
2023  表达域是瓶颈 → Prompt Engineering 登场
      "模型经常误解我要什么"
      
2024  表达域基本解决，信息域成瓶颈 → Context Engineering 登场
      "模型理解了，但不知道关键信息"
      
2025  信息域基本解决，可靠性域成瓶颈 → Harness Engineering 登场
      "模型知道了，但做错了没人兜"
      
2026  可靠性域基本解决，自治域成瓶颈 → Loop Engineering 登场
      "系统可靠了，但人一走就停"
```

每个新概念的出现都不是因为前一个概念"不够"，而是因为**前一个概念解决了它的问题域之后，下一个问题域才从背景变成前景**。就像修路——不是第一段路修错了才修第二段，而是第一段修通了，你才看见下一段需要修。

## 二、为什么"Loop ⊃ Harness ⊃ Context ⊃ Prompt"是误导

流行的说法是嵌套模型：`Loop ⊃ Harness ⊃ Context ⊃ Prompt`。这暗示了包含关系——Loop "包含" Harness，Harness "包含" Context。

**这个模型是错的。**

它混淆了两件不同的事：**实现上的依赖**和**概念上的包含**。

没错，在实践中：
- 要做 Context Engineering，你确实需要写 Prompt
- 要做 Harness Engineering，你确实需要 Context Engineering 的输出
- 要做 Loop Engineering，你确实需要 Harness 的基础设施

但这是**依赖关系**，不是**包含关系**。

盖第三层楼依赖第二层，第二层依赖第一层。但"第三层包含第一层"是荒谬的。

### 嵌套模型导致的荒谬结论

| 嵌套模型暗示的 | 实际情况 |
|---|---|
| Loop ⊃ Prompt：Loop"包含"了 Prompt 的问题域 | Loop 根本不管"怎么表达意图" |
| Harness ⊃ Context：Harness"包含"了 Context | Harness 不管"模型看见什么"，管的是"做错了怎么兜" |
| 你的 Prompt 问题可以靠改进 Loop 解决 | 改 Loop 毫不影响 Prompt 质量 |

当 `Loop ⊃ Prompt` 看起来荒谬时，整个嵌套链条就该被推翻——因为链条的逻辑是一贯的，如果末端荒谬，中间层也不成立。

### 正确的关系模型

两个关系是真实的，但都不是包含：

**实现依赖（纵向）**：每一层为上一层提供实现前提。

```
Prompt ──→ Context ──→ Harness ──→ Loop
 基础       支撑        承载        驱动
```

**问题域并列（横向）**：四个正交维度，互不包含，互不替代。

```
Prompt    Context    Harness    Loop
表达域    信息域     可靠性域    自治域
```

依赖关系是**前层为后层提供基础**，不是后层包含前层。这就像操作系统依赖硬件，但"操作系统包含硬件"是胡说。

### Dex Horthy 的 "Token Smarter"

Dex Horthy 在 Pragmatic Engineer 播客中区分了两种心态：**token harder** 和 **token smarter**。[^3]

Token harder 是"把尽可能多的 token 塞进系统"——六个 Claude Code 账号轮着用、每个 5 小时额度刷满、去掉所有人类审查环节来推更多 token 通过。这本质上是在追求**单个节点的利用率最大化**。

Token smarter 是"用更少、更精准的 token 获得更好的结果"——在上下文窗口的 smart zone（前 100K token）里做最重要的工作，定期做 intentional compaction，把状态压缩成 markdown 然后开新会话。

这个区分对应到我们的框架：token harder 是在自治域（Loop）层面追求吞吐量，但如果表达域和信息域的基础没打好，更多的 token 只会更快地生产 slop。

Dex 自己的团队在 2025 年 7 月建了一个 lights-off software factory——完全不读代码，所有 review 交给 agent。到 11 月，他们关掉了它。三个月后代码库已经烂到"从头重写比修更容易"。

> "Problem with loops is like at a certain point, you're going to generate so much code that you can't read it anymore." — Dex Horthy

这个失败不是因为 Loop 本身有问题，而是因为他们在信息域和可靠性域还没准备好的时候，就冲进了自治域。

## 三、Loop 的真实形态：从辩论中提炼

2026 年 AI Engineer 大会上，一场 Oxford 式辩论把 Loop 的争议摆上了台面。正方（Ian Livingstone、Geoffrey Huntley）认为 Loop 的 hype 合理，反方（Dex Horthy、Greg Pstrucha）认为 hype outrunning the discipline。[^4]

把双方的论点摊开看，有几个共识点值得注意：

### 共识一：验证是 Loop 的核心

正方 Jeff Huntley 的 Ralph Loop 之所以有效，不是因为 bash 循环本身，而是因为他**工程化了 back pressure**：pre-commit hooks、静态分析、类型系统——这些确定性工具构成了 Loop 的验证层。

> "The model's a drunk. You can't trust them. But we accept that. We engineer away those failure domains." — Jeff Huntley

反方 Greg Pstrucha 同意这一点，但指出一个关键限制：**非确定性验证会叠加错误**。如果每次验证本身有 5% 的错误率，10 次 loop 后正确率就降到 50% 以下。所以 Loop 只在**可验证性高的任务**上真正有效——编程语言重写、有完整测试套件的系统迁移、CI 优化。

### 共识二：Slow Loops 比 Dark Factory 更现实

Dex 提出了一个务实的替代方案：**iterated loops / slow loops**。不是把整个开发流程自动化，而是：

1. 用 cron 每天夜里触发一个小 Loop
2. 每个 Loop 只做一件事（修一个 anti-pattern、缩窄一个 optional prop）
3. 早上醒来看到一个干净的 PR
4. 人类 review 后 merge

> "We wake up every morning to one PR that makes the codebase a little bit better." — Dex Horthy

这比 lights-off factory 更可靠，因为它保留了人类在关键节点的判断力，同时把重复性的代码改善工作自动化了。

### 争议点：软件工厂的未来

正方认为 Loop 是通往软件工厂的必经之路，竞争压力会让每个公司都不得不采用。反方认为当前模型在**架构决策和代码可维护性**上还不够好，过早追求全自动工厂只会制造技术债。

我倾向于反方的务实立场，但承认正方的方向判断是对的。关键问题是**时间尺度**——不是"要不要建工厂"，而是"今天该建哪一层"。

## 四、Loop 不只是"写代码"

如果只把 Loop 理解为"让 coding agent 自动跑起来"，你会错过这个概念最有意思的延伸。

### Cursor 的模型训练 Loop

Lee Robinson 在 AI Engineer 大会上分享了 Cursor 训练模型的方法。[^5] 这里有两层 Loop：

**Outer Loop**：用户反馈 → 在线 A/B 测试 → 改进 evals → 设计更难的训练任务

**Inner Loop**：高质量 evals → 训练模型 → 评估 checkpoint → 迭代

更激进的是，Cursor 已经在用模型来加速 Loop 本身——用 agent 自动化 eval 生成、数据标注、甚至从 Slack 直接触发训练实验。

这里的 Loop 不再是"coding agent 自动修 bug"，而是**模型训练模型**的递归改进循环。每一轮迭代中产出的更聪明的模型，反过来让下一轮迭代更高效。

### Nadella 的企业学习循环

Satya Nadella 提出了一个更宏观的视角：**Reverse Information Paradox**。[^6]

传统的信息悖论（Kenneth Arrow）是：买方在获得信息前不知道它的价值，获得后已经免费得到了。AI 时代反转了这个问题：**你使用 AI 时，必须把自己最有价值的知识喂给它**。你付了两次钱——一次用货币，一次用知识。

Nadella 的解法是每个企业需要建立自己的**持续学习循环（hill climbing machine）**：

1. **Control**：创建私有 evals，定义组织内部的"好"
2. **Capability**：在租户边界内构建专有学习环境
3. **Choice**：编排层与任何单一模型解耦
4. **Cost**：最优组合上下文、模型和任务
5. **Compound**：让 AI 投资持续复利

从代码 Loop 到模型训练 Loop 到组织学习 Loop——**Loop 的本质是一个跨层级的通用模式**：设定目标 → 执行 → 验证 → 从反馈中学习 → 迭代。

区别只在于每一层 Loop 的**运转速度**和**验证方式**不同。

## 五、框架的盲区：动词体系的重构

四层问题域框架已经比嵌套模型清晰得多。但它仍然有一个盲区。

当我们用 Prompt、Context、Harness、Loop 这四个名词来组织思维时，有些关键的工程问题**因为没有对应的名词而被遮蔽了**。

### 被遮蔽的动词

| 动词 | 具体问题 | 4-Engineering 里的位置 |
|---|---|---|
| **表达** | 怎么传达意图 | Prompt（清晰） |
| **传递** | 模型需要什么信息 | Context（清晰） |
| **执行** | 工具怎么设计让 Agent 有效使用 | ❌ 没有归属 |
| **推理** | Agent 怎么分析、规划、决策 | ❌ 没有归属 |
| **约束** | 出错时怎么兜底 | Harness（清晰） |
| **验证** | 怎么判断结果是否正确 | Harness（模糊） |
| **持续** | 人不在时怎么运转 | Loop（清晰） |
| **分解** | 复杂任务怎么拆 | ❌ 没有归属 |
| **协调** | 多 Agent 怎么分工 | Loop（只覆盖调度） |
| **适应** | 怎么从反馈中学习 | ❌ 没有归属 |

十个动词中，六个有清晰归属，四个没有或者归属模糊。

### 名词体系的结构性缺陷

名词体系是从业者的**身份标签**，不是问题域的完整地图。每个 "-Engineering" 词的诞生，都伴随着一个社群想要区分自己做的事情和前人不同。每个新名词的动机是**划清边界、建立身份**，而不是**完整描述问题空间**。

所以名词体系天然是排他性的——它关注"我和你不一样"，而不是"还有什么没覆盖"。

### 动词体系的优势

动词体系从问题出发，不在乎归谁管，只在乎**这个问题存不存在、有没有人解决**。无论 LLM 怎么进化，"执行、推理、验证、分解"这些动词不会变，变的只是解决它们的方式。

当你用动词看问题，4-Engineering 框架里看不到的空白就自然浮现了：

- **执行设计**：同一个"编辑文件"的能力，`edit` 工具和 `apply_patch` 工具是两种不同的执行设计。哪个让 Agent 更不容易出错？这不是约束问题（Harness），也不是信息问题（Context），而是**"Agent 怎么做才更有效"**的问题。
- **推理架构**：同一个任务，"先分析再动手"和"边做边想"会产生截然不同的结果。这是推理策略问题，不属于任何现有 -Engineering 的范畴。
- **任务分解**：一个 CI 巡检 Loop 发现了 5 个失败测试，是给一个 Agent 修全部，还是每个测试给一个 Agent？串行还是并行？这是分解和协调问题，不是靠"调度"就能解决的。

## 六、工程师决策指南

回到实际问题：**什么时候该用 Loop，什么时候不该？**

### 该用 Loop 的信号

1. **任务可验证**：有测试、有类型检查、有 lint——Agent 能知道自己做对了没有
2. **任务重复性高**：每天/每周都在做的同类工作（CI 巡检、依赖更新、代码风格统一）
3. **失败成本低**：做错了可以在 review 时轻松发现，不会直接影响生产环境
4. **你已经有了好的 Harness**：权限系统、验证管线、状态持久化都就位了

### 不该用 Loop 的信号

1. **任务需要架构判断**：选择什么抽象、在哪里引入复杂度、什么不该建——这些需要人类的 taste
2. **验证成本高**：需要人工 review 2000 行 diff 才能确认正确性
3. **Harness 还没建好**：没有测试、没有 lint、没有权限控制——先建 Harness，再想 Loop
4. **你在追逐 hype**：如果你建 Loop 是因为 Twitter 上有人说"just write loops"，而不是因为你有一个具体的重复性任务需要自动化——停下来

### 一个实用框架

```
你的 Agent 系统现在卡在哪里？
│
├─ Agent 总是理解错意图 → 先改 Prompt（表达域）
├─ Agent 缺少关键信息 → 先加 Context（信息域）
├─ Agent 做错了没人兜 → 先建 Harness（可靠性域）
├─ 人一走就停 → 可以开始建 Loop（自治域）
│
└─ 不确定 → 用诊断决策树逐层排查
```

**不要跳层。** 每一层为上一层提供基础。在 Prompt 还有问题时去建 Loop，就像在地基没打好时盖第三层楼。

## 七、结论

行业会继续造新词。下一个可能是 "Factory Engineering"，或者 "Ecosystem Engineering"。

但工程问题不会变。Agent 需要被表达、被传递信息、被有效执行、被正确推理、被约束、被验证、被持续运转、被合理分解、被协调、被适应。

**关注动词，不追逐名词。**

名词会过时。问题不会。

Addy Osmani 在 AI Engineer World's Fair 的 closing keynote 中说了一句话，很适合作为这篇文章的结尾：[^2]

> Build the loop. But build it like someone who intends to stay the engineer, not just the person who presses go.

建 Loop，但建的时候像一个打算继续做工程师的人——而不是一个只想按启动键的人。

[^1]: Addy Osmani, [Loop Engineering](https://addyosmani.com/blog/loop-engineering/)
[^2]: Addy Osmani, [Own the Outer Loop](https://addyosmani.com/blog/own-the-outer-loop/)
[^3]: The Pragmatic Engineer, [Context Engineering with Dex Horthy](https://www.youtube.com/watch?v=Usufn8IQJgw)（播客）
[^4]: AI Engineer, [The Great Loops Debate](https://www.youtube.com/watch?v=c35YoMdnI78)（播客）
[^5]: AI Engineer, [Recursive Model Improvement](https://www.youtube.com/watch?v=q4Tr-DknG2M)（视频，Lee Robinson）
[^6]: Satya Nadella, [The Reverse Information Paradox](https://snscratchpad.com/posts/reverse-information-paradox/)

---
title: AI对话的四象限框架：如何与AI高效共创未来
date: 2026-07-12
description: 探讨如何与AI高效对话的思维工具——AI对话四象限框架，灵感来源于乔哈里窗口
tags: [AI, Prompt-Engineering, Johari-Window, Obsidian-Note, 人机协同]
draft: true
featured: true
speaker: 姜学长 (清华大学计算机硕士 / 前阿里达摩院 / 华为AI专家)
source: Bilibili
---
> [!abstract] 核心导言
> 本视频探讨了如何与 AI 聊天才能真正产生好效果。主讲人引入了一个强有力的思维工具——**“AI对话的四象限框架”**。其灵感来源于心理学中的经典框架——**乔哈里窗口（Johari Window）**。这一框架能帮我们看清人机交互的本质，并揭示了人机共处的未来趋势。

---

## 一、 AI对话的四象限模型（自适应 HTML 优雅排版）

> [!tip] 💡 提示：
> 下方图形已转为原生 HTML，支持在 Obsidian 中自适应深浅主题，并解决了文本换行问题。

<div style="max-width: 800px; margin: 20px auto; font-family: inherit; overflow-x: auto;">
  <table style="border-collapse: separate; border-spacing: 12px; width: 100%; border: none; background: transparent;">
    <!-- Row 1: AI knows -->
    <tr style="background: transparent;">
      <!-- Y-axis Label: AI knows -->
      <td style="text-align: center; vertical-align: middle; width: 60px; font-weight: bold; color: var(--text-accent, #79c0ff); font-size: 0.9em; border: none; background: transparent; line-height: 1.3;">
        ▲<br>A<br>I<br>知<br>道
      </td>
      <!-- Q2 (Top-Left): User doesn't know, AI knows -->
      <td style="background-color: var(--background-secondary, rgba(255, 255, 255, 0.05)); border: 2px dashed #ff7b72; border-radius: 8px; padding: 18px; width: 45%; vertical-align: top; box-shadow: var(--shadow-s, 0 4px 6px rgba(0,0,0,0.1));">
        <div style="font-weight: bold; color: #ff7b72; font-size: 1.1em; margin-bottom: 6px;">【第二象限】 提问模式</div>
        <div style="font-size: 0.8em; background: rgba(255,123,114,0.15); color: #ff7b72; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 10px; font-weight: bold;">AI知道 + 我不知道</div>
        <div style="font-size: 0.9em; line-height: 1.6; color: var(--text-normal);">
          <b>• 典型场景：</b>探索新领域新概念（如量子计算）<br>
          <b>• 人机操作：</b>分层拆解提问，通过连续追问剖析<br>
          <b>• 角色定位：</b><b>知识导师 🎓</b>（极大提升个人学习速度）
        </div>
      </td>
      <!-- Q1 (Top-Right): User knows, AI knows -->
      <td style="background-color: var(--background-secondary, rgba(255, 255, 255, 0.05)); border: 2px dashed #79c0ff; border-radius: 8px; padding: 18px; width: 45%; vertical-align: top; box-shadow: var(--shadow-s, 0 4px 6px rgba(0,0,0,0.1));">
        <div style="font-weight: bold; color: #79c0ff; font-size: 1.1em; margin-bottom: 6px;">【第一象限】 助理模式</div>
        <div style="font-size: 0.8em; background: rgba(121,192,255,0.15); color: #79c0ff; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 10px; font-weight: bold;">AI知道 + 我知道</div>
        <div style="font-size: 0.9em; line-height: 1.6; color: var(--text-normal);">
          <b>• 典型场景：</b>文本润色、格式改写、翻译、纠错<br>
          <b>• 人机操作：</b>下达清晰、无歧义的高效优化指令<br>
          <b>• 角色定位：</b><b>高效助理 💼</b>（解放重复劳动力）
        </div>
      </td>
    </tr>
    <!-- Row 2: AI doesn't know -->
    <tr style="background: transparent;">
      <!-- Y-axis Label: AI doesn't know -->
      <td style="text-align: center; vertical-align: middle; width: 60px; font-weight: bold; color: var(--text-muted, #8b949e); font-size: 0.9em; border: none; background: transparent; line-height: 1.3;">
        ▼<br>A<br>I<br>不<br>知<br>道
      </td>
      <!-- Q3 (Bottom-Left): User doesn't know, AI doesn't know -->
      <td style="background-color: var(--background-secondary, rgba(255, 255, 255, 0.05)); border: 2px dashed #d2a8ff; border-radius: 8px; padding: 18px; width: 45%; vertical-align: top; box-shadow: var(--shadow-s, 0 4px 6px rgba(0,0,0,0.1));">
        <div style="font-weight: bold; color: #d2a8ff; font-size: 1.1em; margin-bottom: 6px;">【第三象限】 共创模式</div>
        <div style="font-size: 0.8em; background: rgba(210,168,255,0.15); color: #d2a8ff; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 10px; font-weight: bold;">AI不知道 + 我不知道</div>
        <div style="font-size: 0.9em; line-height: 1.6; color: var(--text-normal);">
          <b>• 典型场景：</b>科研盲区探索、概念发散、推演未知<br>
          <b>• 人机操作：</b>AI提供联想素材，人类提供逻辑决策<br>
          <b>• 角色定位：</b><b>实验伙伴 🤝</b>（共同面对未知边界）
        </div>
      </td>
      <!-- Q4 (Bottom-Right): User knows, AI doesn't know -->
      <td style="background-color: var(--background-secondary, rgba(255, 255, 255, 0.05)); border: 2px dashed #56d364; border-radius: 8px; padding: 18px; width: 45%; vertical-align: top; box-shadow: var(--shadow-s, 0 4px 6px rgba(0,0,0,0.1));">
        <div style="font-weight: bold; color: #56d364; font-size: 1.1em; margin-bottom: 6px;">【第四象限】 教学模式</div>
        <div style="font-size: 0.8em; background: rgba(86,211,100,0.15); color: #56d364; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 10px; font-weight: bold;">AI不知道 + 我知道</div>
        <div style="font-size: 0.9em; line-height: 1.6; color: var(--text-normal);">
          <b>• 典型场景：</b>企业专属私有流程、独家未公开方案<br>
          <b>• 人机操作：</b>灌输私有知识，结合 RAG 或微调（SFT）<br>
          <b>• 角色定位：</b><b>人类导师 🏫</b>（对齐并填补信息差）
        </div>
      </td>
    </tr>
    <!-- Row 3: X-axis labels -->
    <tr style="background: transparent;">
      <td style="border: none; background: transparent;"></td>
      <td style="text-align: center; font-weight: bold; color: var(--text-muted, #8b949e); font-size: 0.95em; border: none; background: transparent; padding-top: 6px;">
        ◀ 我不知道
      </td>
      <td style="text-align: center; font-weight: bold; color: var(--text-muted, #8b949e); font-size: 0.95em; border: none; background: transparent; padding-top: 6px;">
        我知道 ▶
      </td>
    </tr>
  </table>
</div>

---

## 二、 四大象限深度拆解

> [!tip] 第一象限：助理模式（AI知道，我也知道）
> - **典型场景**：让 AI 润色一份你已经写好的文案、修改代码格式或进行翻译。
> - **人机操作**：人类只需要下达一个非常清晰的指令。
>   * *例如*：“帮我润色这段文案，让它显得更有张力和吸引力。”
> - **角色定位**：**高效的助理**。AI 能够快速给出一个还不错的润色结果。

> [!question] 第二象限：提问模式（AI知道，我不知道）
> - **典型场景**：探索量子计算、AI 算法或自己不熟悉的任何专业领域。
> - **核心能力**：**提问能力（分层拆解）**。
>   * *如何提问*：需要进行连续、层层递进的发问。例如：“什么是量子计算？” $\rightarrow$ “它和传统计算有什么区别？” $\rightarrow$ “量子计算能应用到哪些领域？” $\rightarrow$ “未来能带来什么益处？”
> - **角色定位**：**知识导师**。这是最能直接提升人类学习速度的象限，前提是你必须“学会去问”。

> [!gear] 第三象限：共创模式（AI不知道，我也不知道）
> - **典型场景**：面对未知的领域、前沿科学或复杂的现实未知现象。
> - **人机操作**：AI 提供基础的框架、联想或生成素材，人类负责进行深度的判断与主观思考。
> - **角色定位**：**实验室里的好伙伴**。

> [!info] 第四象限：教学模式（AI不知道，我知道）
> - **典型场景**：你公司内部独特的业务流程、尚未公开的项目创意等。
> - **人机操作**：**喂信（Feed Information）**。此时不应该盲目向 AI 提问，而是应该主动教它。
> - **技术手段**：通常借助 **RAG（检索增强生成）** 注入私有知识库，或者使用 **SFT（监督微调）**。
> - **角色定位**：**人类去教导 AI**，填平人机之间的知识鸿沟。

---

## 三、 未来趋势：轴线位移（The Axis Shift）

> [!important] 协同演进趋势分析
> 在未来，这两条轴线（人机各自的知识边界）并不是固定不变的，它们在发生悄无声息的移动：
> 
> 1. **横轴下移（AI 边界下沉）**：
>    随着大模型结合 **RAG** 和 **微调（SFT）** 的技术普及，AI 几乎能够掌握人类已有知识的 **80% 以上**。这意味着：
>    - **第一象限（助理模式）** 会不断扩大。
>    - **第四象限（教学模式）** 会逐渐缩小（AI 不知道的公共领域越来越少）。
>    - *依然属于 AI 盲区的领域*：人类的**经验性知识、非结构化的直觉、未公开的内情**。
> 
> 2. **纵轴左移（人类边界左移）**：
>    高效的人机交互者会通过不断向 AI 提问，将原本“我不知道”的领域迅速转变为“我知道”。
>    - 人类通过在 **第二象限** 和 **第三象限** 深度协同，能获得**指数性的成长**和更大的回报。

---

## 四、 核心能力修炼指南

要想不被时代的浪潮淘汰，人类真正需要修炼的能力并不是信息获取本身，而是以下四项：

| 核心能力 | 落地执行路径 |
| :--- | :--- |
| **1. 提问的艺术** | 针对自己不懂的领域，学会**分层拆解、逐步深入**地去提问。 |
| **2. 知识转译能力** | 把人类零散的语言，翻译成**大模型能够更好看懂和执行的 Prompt 语言**。 |
| **3. 探索协作能力** | 敢于和 AI 进行前沿共创，将 AI 视作你的**“学习搭子”和深度协作者**。 |
| **4. 适应轴线变化能力** | 时刻关注 AI 的能力边界演进，并随之调整人机的分工和交互策略。 |

---

## 五、 💡 结语与金句提炼

> [!quote] 核心金句
> 1. **AI的进化不是终点，人类的提问才是起点。**
> 2. 我们真正需要修炼的，不是单薄的“信息量”，而是**“提炼信息”和“连接信息”的能力**。
> 3. 爱因斯坦曾说：“重要的从来不是知识，而是想象力。” 在 AI 时代，**重要的不仅是想象力，更是你能够引导 AI 发挥想象力的方式。**
> 4. **千万别当一个“不会聊天的 AI 指令官”，而是要去当一个能够与 AI 共创未来的“合伙人”。**
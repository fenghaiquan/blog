# OG Image Prompt Guidelines

## 核心理念：清晰的信息架构

OG 图片的目标是**用极简的视觉设计表达文章的核心框架或概念**，让读者一眼看懂文章的结构。

### 设计原则

1. **极简主义**：大量留白，克制的装饰，让内容结构驱动设计
2. **清晰层级**：标题 → 副标题 → 核心内容，视觉引导明确
3. **可读性优先**：缩到 200x200 时仍能看清关键信息
4. **灵活形式**：根据文章内容选择最合适的呈现方式（卡片、列表、流程图、对比表等）

### 概念来源

概念描述由 Agent 在 Phase 0 生成，写入 `.og-cache/{slug}-concept.md`。`prepare-manifest.js` 读取该文件构建 prompt。

Agent 生成概念时应分析：
1. 文章的核心论点/思维模型/框架
2. 最适合表达该内容的视觉形式（卡片网格、流程图、时间线、对比表等）
3. 关键术语和结构关系
4. 如何用极简设计呈现这些信息

### 设计 Agent 的职责

Open Design 接收概念描述后负责：
- 将概念转化为清晰的视觉布局
- 选择合适的构图、色彩、排版
- 确保信息层级清晰，留白充足
- 标题作为主要元素，但不过度装饰

## Prompt Structure

传给 Open Design 的 prompt 包含：

1. **Article**: 标题、摘要
2. **Concept Description**: 来自 concept 文件的核心概念、框架结构、视觉形式建议
3. **Style Guidelines**: 极简设计原则、留白要求、可读性标准
4. **Safe zone reminder**: Central 70% area for multi-platform compatibility

## Style Guidelines

- **Minimal layout**: Generous whitespace, avoid clutter
- **Content-driven design**: Let the article's structure determine the visual form (cards, lists, diagrams, etc.)
- **Subtle accents**: Use color sparingly to differentiate sections or highlight key terms
- **No decorative fluff**: Avoid ornamental elements that don't serve the content
- **Thumbnail readability**: Key information must be legible at 200x200px
- **Clean typography**: Clear hierarchy, readable font sizes (≥24px at full size)

## Design System Reference

Foong's Blog uses a warm earth-tone palette:

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#FAF8F5` | Page background |
| Primary accent | `#92400E` | Links, highlights |
| Text | `#1C1917` | Body text |
| Muted text | `#78716C` | Secondary text |
| Border | `#E7E5E4` | Dividers |

These colors are a reference, not a constraint. OD may choose different palettes based on article content.

## Typography

- Blog uses Source Serif 4 (display), Inter (body), Inconsolata (code)
- For OG images, any readable font is acceptable
- Chinese content should use a legible sans-serif or kai font

## What to Avoid

- **过度装饰**：不必要的图形、纹理、阴影
- **信息过载**：每张卡片/区块只放一个核心概念
- **标签展示**：不要把 tags 作为视觉元素
- **极小文字**：(< 24px at full size)
- **边缘内容**：关键信息太靠近边缘（正方形裁剪时会丢失）
- **占位符文本**：lorem ipsum 或无意义文字

## Skill Selection

- **Chinese posts**: `canvas-design` with `paper` design system → 1080x1080
- **English posts**: `card-twitter` → 1200x630

# 设计系统

## 设计原则

- **克制**：减少视觉噪音，留白优先
- **温暖**：暖色调（amber/stone）替代冷色（blue/gray）
- **印刷品质感**：Serif 标题 + Sans 正文，字距微调
- **呼吸感**：版块间充足间距（py-16 ~ py-24）

## 色彩系统

### Token 定义（`src/styles/global.css` → `@theme`）

| Token | 值 | 用途 |
|-------|-----|------|
| `--color-primary` | `#92400E` | 主色（暖琥珀），CTA 按钮、链接 hover |
| `--color-primary-hover` | `#78350F` | 主色 hover 态 |
| `--color-success` | `#16A34A` | 成功状态 |
| `--color-bg` | `#FAF8F5` | 页面背景（暖白） |
| `--color-surface` | `#FAF8F5` | 卡片背景 |
| `--color-surface-warm` | `#F5F5F4` | 次要卡片背景 |
| `--color-fg` | `#1C1917` | 主文字色（近黑） |
| `--color-fg-2` | `#44403C` | 次要文字色 |
| `--color-muted` | `#6B6560` | 辅助文字色 |
| `--color-border` | `#E7E5E4` | 边框色 |
| `--color-border-soft` | `#F5F5F4` | 极淡边框 |
| `--color-accent` | `#1C1917` | 强调色（同 fg） |
| `--color-accent-on` | `#FAF8F5` | 强调色上的文字（同 bg） |
| `--color-focus-ring` | `rgba(28,25,23,0.12)` | 焦点环 |

### 使用方式

```html
<!-- Tailwind 类（v4 自动映射 @theme token） -->
<div class="bg-bg text-fg-2 border-border">

<!-- CSS 变量 -->
<div style="background: var(--color-bg); color: var(--color-fg);">
```

## 字体系统

| Token | 值 | 用途 |
|-------|-----|------|
| `--font-sans` | `'Inter', system-ui, sans-serif` | 正文、UI 元素 |
| `--font-display` | `'Source Serif 4', Georgia, serif` | 标题、大字号展示 |
| `--font-mono` | `'Inconsolata', ui-monospace, Menlo, monospace` | 代码、终端 |

### 使用方式

```html
<!-- Tailwind 类 -->
<h1 class="font-display text-3xl tracking-tight">标题</h1>
<p class="font-sans text-base">正文</p>
<code class="font-mono text-sm">代码</code>
```

## 间距与布局

### Container

```css
.container {
  max-width: 1040px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}
```

### 圆角

| Token | 值 | 用途 |
|-------|-----|------|
| `--radius-sm` | `4px` | 小元素（标签、按钮） |
| `--radius-md` | `8px` | 卡片、输入框 |
| `--radius-lg` | `12px` | 大卡片、模态框 |

## 共享组件类

以下类定义在 `global.css` 中，所有页面可复用：

### `.card-base`
卡片基础样式：白色背景、圆角、微弱阴影、hover 上浮效果。

### `.page-header` / `.page-header-eyebrow` / `.page-header-title` / `.page-header-desc`
页面顶部标题区域的标准布局模式。

### `.post-link`
文章链接样式：hover 时底部出现动画下划线。

### `.terminal-cursor`
终端光标闪烁动画（首页 terminal 区域使用）。

### `.featured-visual`
渐变背景 + 对角线条纹叠加效果（首页 featured 文章视觉）。

### `[data-callout]`
Obsidian 风格 callout 块，支持类型：abstract、tip、question、gear、info、important、quote。每种类型有对应的左侧彩色边框。

### `mark`
黄色高亮标记。

### `.wiki-link-broken`
broken wiki-link 的红色波浪下划线样式。

## 响应式策略

- **Mobile First**：默认单栏布局，`md:` 断点展开多栏
- **断点**：使用 Tailwind 默认断点（sm: 640px, md: 768px, lg: 1024px, xl: 1280px）
- **Container**：响应式 padding，移动端 `px-4`，桌面端 `px-6`
- **动画**：`@media (prefers-reduced-motion: reduce)` 禁用所有动画

## 页面特定样式

| 页面 | CSS 文件 | 主要样式模块 |
|------|----------|-------------|
| 首页 | `home.css` | hero、terminal、featured、recent、projects |
| 博客列表 | `blog.css` | filters、article-list、pagination |
| 博客文章 | `blog-post.css` | with-toc 布局、prose 排版 |
| 关于 | `about.css` | about-section、story、capability、timeline |
| 订阅 | `subscribe.css` | bento-grid、sub-card、email、social |

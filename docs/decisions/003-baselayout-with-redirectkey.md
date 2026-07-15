# ADR-003: BaseLayout 统一布局与 redirectKey 机制

## 状态：已采纳

## 日期
2026-07-15

## 背景
各页面（index、about、subscribe、cooperate）存在大量重复的 HTML 结构代码：`<html>`、`<head>`、`<body>`、`<Header>`、`<Footer>`、环境管理 redirect 脚本。每次修改布局需要逐个页面同步。

## 候选方案

### 方案 A：保持各页面独立 HTML 结构
每个页面完整定义自己的 HTML 结构。

**问题：** 代码重复，布局修改需要多文件同步，容易遗漏。

### 方案 B：BaseLayout 统一布局（✅ 采纳）
提取公共 HTML 结构到 `BaseLayout.astro`，页面通过 slot 注入内容。环境管理逻辑（redirectKey）内建在 BaseLayout 中。

## 决策
采用方案 B。

## 设计要点
- `BaseLayout.astro` 接收 `title`、`description`、可选 `redirectKey`、可选 `mainClass`
- `redirectKey` 对应 `featureFlags` 中的开关，未开启时自动插入 `<script is:inline>location.replace('/blog')</script>`
- 使用 `is:inline` 防止 Astro 将脚本转为 `type="module"`（会导致页面闪烁）
- `BlogPost.astro` 继承 BaseLayout，通过 `mainClass` prop 传递 `with-toc` 等布局类

## 理由
- 消除 20-40% 的重复代码
- 布局修改只需改一处
- redirectKey 机制将环境管理逻辑从页面中剥离
- 新页面创建只需关注内容，无需复制 HTML 骨架

## 后果
- BlogPost.astro 需要特殊处理（TOC 结构、Mermaid 脚本）
- 页面 frontmatter 需要导入 BaseLayout 和对应 CSS 文件

## 相关代码
- `src/layouts/BaseLayout.astro`
- `src/layouts/BlogPost.astro`
- `src/pages/index.astro`
- `src/pages/about.astro`
- `src/pages/subscribe.astro`
- `src/pages/cooperate.astro`

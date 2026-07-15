# ADR-002: CSS 两层继承架构

## 状态：已采纳

## 日期
2026-07-15

## 背景
项目初始使用单个 `global.css`（1356 行）承载所有样式，随着页面增多，文件变得难以维护，样式冲突风险增加。

## 候选方案

### 方案 A：保持单文件 global.css
所有样式集中在一个文件。

**问题：** 文件过大，修改风险高，无法按页面隔离样式。

### 方案 B：完全组件化 CSS（CSS Modules / Scoped）
每个组件独立管理样式。

**问题：** 设计系统 token 和共享组件样式难以复用，重复定义多。

### 方案 C：两层继承模型（✅ 采纳）
- 第一层：`global.css` 定义设计系统 token + 共享组件类
- 第二层：每个页面导入自己的 CSS 文件，仅包含页面特定样式

## 决策
采用方案 C。

## 理由
- 设计系统 token（色彩、字体、间距）集中管理，全局一致
- 共享组件类（container、page-header、card-base）避免重复定义
- 页面特定样式隔离在独立文件中，修改不影响其他页面
- 通过 frontmatter 导入，依赖关系显式可见
- 配合 Tailwind v4 的 `@theme` 机制，token 可直接在 Tailwind 类中使用

## 后果
- 新增页面需要创建对应的 CSS 文件（如 `home.css`、`blog.css`）
- 共享样式应放入 `global.css`，避免在页面 CSS 中重复定义
- global.css 需保持精简（目标 < 200 行）

## 相关代码
- `src/styles/global.css`
- `src/styles/home.css`
- `src/styles/blog.css`
- `src/styles/about.css`
- `src/styles/subscribe.css`
- `src/styles/blog-post.css`

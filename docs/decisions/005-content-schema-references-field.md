# ADR-005: Content Schema 增加 references 字段支持多源引用

## 状态：已废弃

被 Markdown footnotes 方案替代。详见下方"废弃原因"。

## 废弃原因
改用标准 Markdown footnote 语法（`[^1]`）在正文中标注引用位置，文末定义引用列表。相比 frontmatter 结构化字段，footnote 让引用和正文的对应关系一目了然，且零额外代码。

## 日期
2026-07-18

## 背景
博客开始撰写"多源综述"类型的技术文章（如《别急着写 Loop》），这类文章引用 5-8 篇外部来源。需要在 frontmatter 中结构化声明参考来源，并在文章末尾自动渲染引用列表，而不是在正文末尾手动写 Markdown 链接。

## 候选方案

### 方案 A：在正文末尾手动写 Markdown 链接列表
最简单，无需改 schema 和布局。
**问题：** 每个多源文章都要重复写相同的 HTML 结构，样式不统一，无法程序化访问引用数据（如生成 RSS 时附带来源）。

### 方案 B：在 frontmatter 中增加 `references` 数组字段（✅ 采纳）
在 `content.config.ts` 的 Zod schema 中增加 `references` 字段，类型为 `{ title, url, author?, type? }[]`。BlogPost 布局读取该字段自动渲染"参考来源"区块。

### 方案 C：使用 Obsidian 的 `source` 字段（已有）扩展
现有文章用 `source: "url"` 记录单一来源。可扩展为数组。
**问题：** `source` 是字符串，语义上是"文章来源"（如 Bilibili 视频），不适合承载多来源的结构化引用。混用会造成语义混乱。

## 决策
采用方案 B。在 Zod schema 中新增 `references` 字段，BlogPost 布局条件渲染引用区块。

## 理由
1. **结构化数据**：引用信息进入 Content Collections，可在 RSS、OG 图片、sitemap 等场景中程序化使用
2. **样式统一**：布局层统一渲染，所有文章的引用区块视觉一致
3. **可选字段**：`default([])` 确保不影响现有文章，无需迁移
4. **类型安全**：Zod schema 提供编译时校验，避免拼写错误

## 后果
- 好处：多源文章写作流程简化，引用格式标准化，数据可程序化访问
- 代价：schema 复杂度略微增加，新字段需要文档说明

## 相关代码
- `src/content.config.ts` — Zod schema 定义
- `src/layouts/BlogPost.astro` — 条件渲染引用区块
- `src/styles/blog-post.css` — `.references` 样式

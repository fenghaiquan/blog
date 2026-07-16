# AGENTS.md — 项目开发指南

本文档为 AI agent 和开发者提供项目的架构、约定和决策上下文。

---

## 1. 项目概览

冯海泉的个人技术博客，Astro 静态站点。聚焦 AI 工程实践，使用 Obsidian 写作，Tailwind CSS v4 样式。

- 框架：Astro ^7.0.7（SSG）
- 样式：Tailwind CSS v4（`@theme` token + `@tailwindcss/vite` 插件）
- 内容：Content Layer API + Zod schema，Markdown 源文件
- 语言：中文（zh-CN）

## 2. 目录结构

```
src/
├── components/      # 可复用组件（Header、Footer、Comments 等）
├── content/blog/    # 博客 Markdown 源文件（由 sync-content.js 同步）
├── layouts/         # BaseLayout（基础布局）、BlogPost（文章布局）
── pages/           # 路由页面（index、about、subscribe、cooperate、blog/）
├── styles/          # global.css（设计系统）+ per-page CSS（home.css、blog.css 等）
├── utils/           # 工具函数（format.ts）
── content.config.ts  # Content Collections 配置
├── env.d.ts           # TypeScript 类型声明（locals.featureFlags）
├── middleware.ts       # 中间件（注入 featureFlags）
└── consts.ts           # 站点常量
```

## 3. 架构决策

### 3.1 环境管理（ADR-001）
使用 middleware + `Astro.locals.featureFlags` 控制页面可见性：
- 开发环境：所有页面可见
- 生产环境：仅 `/blog` 可见，其他页面 redirect 到 `/blog`

实现：`src/middleware.ts` 注入 flags → `BaseLayout.astro` 读取 `redirectKey` prop 并插入 redirect 脚本。

详见 [docs/decisions/001](../docs/decisions/001-use-middleware-locals-for-feature-flags.md)

### 3.2 CSS 架构（ADR-002）
两层继承模型：
1. `global.css`：设计系统 token（`@theme`）+ 共享组件类（container、page-header、card-base 等）
2. per-page CSS：页面特定样式（home.css、blog.css、about.css、subscribe.css、blog-post.css）

页面通过 frontmatter `import '../styles/xxx.css'` 导入自己的 CSS 文件。

详见 [docs/decisions/002](../docs/decisions/002-two-layer-css-inheritance.md)

### 3.3 布局系统（ADR-003）
`BaseLayout.astro` 统一 HTML 骨架（html/head/body/Header/Footer），页面通过 slot 注入内容。
- `redirectKey` prop：对应 featureFlags 中的开关，未开启时自动插入 redirect 脚本
- `mainClass` prop：传递给 `<main>` 的 class（如 `with-toc`）
- `BlogPost.astro` 继承 BaseLayout，处理 TOC 和 Mermaid 客户端加载

详见 [docs/decisions/003](../docs/decisions/003-baselayout-with-redirectkey.md)

### 3.4 内容管线（ADR-004）
Obsidian vault → `scripts/sync-content.js` → `src/content/blog/` → Content Collections。
Markdown 增强：wiki-links（remark-obsidian-md）、数学公式（KaTeX）、Mermaid 图表（客户端 CDN）。

详见 [docs/decisions/004](../docs/decisions/004-obsidian-content-pipeline.md)

## 4. 设计系统

详见 [docs/DESIGN-SYSTEM.md](../docs/DESIGN-SYSTEM.md)

关键规范：
- 色彩：暖色调（`#FAF8F5` 背景、`#92400E` 主色、`#1C1917` 文字）
- 字体：Source Serif 4（标题）、Inter（正文）、Inconsolata（代码）
- 容器宽度：1040px
- Body class：所有页面 `<body>` 必须有 `class="bg-bg font-sans text-fg-2 antialiased"`

## 5. 开发约定

### 5.1 开发服务器

```bash
astro dev --background        # 后台启动
astro dev stop                # 停止
astro dev status              # 状态
astro dev logs                # 日志
```

### 5.2 创建新页面

1. 在 `src/pages/` 创建 `.astro` 文件
2. 导入 `BaseLayout` 和对应的 CSS 文件
3. 如需环境管理，传入 `redirectKey` prop
4. 在 `src/styles/` 创建对应的 CSS 文件（如页面有特定样式）
5. 在 `src/middleware.ts` 和 `src/env.d.ts` 注册新的 feature flag（如需要）
6. 在 `src/components/Header.astro` 添加导航链接（如需要）

### 5.3 CSS 文件组织

- 共享样式 → `src/styles/global.css`（保持 < 200 行）
- 页面特定样式 → `src/styles/<page>.css`
- 不要在页面 CSS 中重复定义 global.css 已有的类

### 5.4 Git Commit 规范

格式：`<type>: <中文描述>`

类型：`feat`、`fix`、`post`（新文章）、`style`、`refactor`、`docs`、`config`、`chore`

详见 `.agents/skills/commit/SKILL.md`

### 5.5 内容同步

```bash
npm run sync            # 从 Obsidian vault 同步内容
npm run sync -- --clean # 同步并清理不在源中的文件
```

### 5.6 OG 图片生成

双路径 OG 图片生成，根据文章标题自动选择路径：

| 路径 | 语言判断 | Skill | Design System | 生成方式 | 尺寸 |
|------|---------|-------|---------------|---------|------|
| **英文** | 标题无 CJK 字符 | `card-twitter` | 无 | Open Design MCP → HTML → Playwright 截图 | 1200x630 |
| **中文** | 标题含 CJK 字符 | `canvas-design` | `paper` | Open Design MCP → HTML → Playwright 截图 | 1080x1080 |

```bash
npm run og:prepare:dry                     # 预览待生成的 prompt（不执行）
npm run og:prepare                         # 扫描文章，生成 manifest
npm run og:prepare -- --slug=文章名         # 只生成指定文章的 OG 图片
npm run og:screenshot                      # 截图/渲染，输出到 public/og/
npm run og:validate                        # 验证生成的图片，标记失败任务
```

完整流程由 `og-image-generator` skill 编排（Phase 1 脚本 → Phase 2 Open Design MCP → Phase 3 截图 → Phase 4 验证）。
验证失败的任务会自动标记为 `failed`，需要重新生成。
详见 `.agents/skills/og-image-generator/SKILL.md`。

**字体处理**：中文 OG 图片需要系统字体支持——优先安装 `fonts-noto-cjk`，或手动下载到 `~/.local/share/fonts/` 并运行 `fc-cache`。`screenshot.js` 会在截图前检测字体是否可用。

构建时 `og-images` integration 会自动用 satori 为缺少 OG 图片的文章生成基础版作为 fallback。

**本地构建与提交**：使用 `npm run build:og` 构建并自动将新生成的 satori 图片 amend 到上一个 commit。这样 `git push` 时图片已在 git 中，Vercel 构建无需重新生成。

## 6. 文档维护规则

本项目使用三层文档体系：

| 层级 | 位置 | 内容 | 更新时机 |
|------|------|------|----------|
| 约定文档 | `AGENTS.md` | 当前生效的开发规则 | 规则变化时 |
| 架构文档 | `docs/ARCHITECTURE.md`、`docs/DESIGN-SYSTEM.md` | 系统架构和设计规范 | 架构/设计变更时 |
| 决策记录 | `docs/decisions/ADR-NNN-*.md` | 为什么做某个决策 | 做出新决策时 |

**同步规则：**
- 修改架构/设计决策时，同步更新 `AGENTS.md` 对应章节
- 新增架构决策时，在 `docs/decisions/` 创建 ADR（格式见下方）
- 废弃的 ADR 标记状态为"已废弃"，不删除（保留决策历史）
- 关键代码位置添加 `[ADR-NNN]` 注释引用，形成代码→文档链

**ADR 格式：**
```markdown
# ADR-NNN: 决策标题

## 状态：已采纳 | 已废弃 | 待讨论
## 日期：YYYY-MM-DD
## 背景：（面临什么问题）
## 候选方案：（列出不采纳的方案及原因）
## 决策：（做了什么决定）
## 理由：（为什么选这个方案）
## 后果：（带来的好处和代价）
## 相关代码：（文件路径列表）
```

## 7. 外部资源

- [Astro 官方文档](https://docs.astro.build)
- [Tailwind CSS v4 文档](https://tailwindcss.com/docs)
- [Content Collections](https://docs.astro.build/en/guides/content-collections/)

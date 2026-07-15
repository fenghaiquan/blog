# 系统架构

## 技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | Astro | ^7.0.7 | 静态站点生成 |
| 内容 | MDX + Content Layer API | - | 博客文章管理 |
| 样式 | Tailwind CSS v4 | ^4.3.2 | 原子化 CSS + 设计系统 token |
| 排版 | @tailwindcss/typography | ^0.5.20 | Markdown 内容自动排版 |
| 数学 | KaTeX | ^0.17.0 | LaTeX 公式渲染 |
| 图表 | Mermaid (CDN) | ^11 | 客户端动态加载流程图 |
| 评论 | Giscus | - | GitHub Discussions 评论系统 |
| 分析 | Umami | - | 网站访问分析（可选） |
| 订阅 | Beehiiv | - | Newsletter 邮件订阅 |

## 目录结构

```
src/
├── assets/              # 静态图片资源（博客封面、About 页图片）
├── components/          # 可复用组件
│   ├── BaseHead.astro       # <head> 公共内容（meta、favicon、字体）
│   ├── Comments.astro       # Giscus 评论组件
│   ├── Footer.astro         # 页脚
│   ├── FormattedDate.astro  # 日期格式化组件
│   ├── Header.astro         # 导航栏（含 featureFlags 条件渲染）
│   ├── HeaderLink.astro     # 导航链接组件
│   ├── TableOfContents.astro # 文章目录
│   └── Umami.astro          # Umami 分析脚本
├── content/
│   └── blog/            # 博客 Markdown 源文件（由 sync-content.js 同步）
├── layouts/
│   ├── BaseLayout.astro     # 基础布局（HTML 骨架 + 环境管理）
│   └── BlogPost.astro       # 博客文章布局（继承 BaseLayout）
├── pages/
│   ├── index.astro          # 首页
│   ├── about.astro          # 关于页
│   ├── subscribe.astro      # 订阅中心
│   ├── cooperate.astro      # 合作咨询
│   ├── blog/
│   │   ├── index.astro          # 博客列表
│   │   └── [...slug].astro      # 博客文章详情页（动态路由）
│   └── rss.xml.js         # RSS Feed 生成
├── styles/
│   ├── global.css         # 设计系统 token + 共享组件类
│   ├── home.css           # 首页特定样式
│   ├── blog.css           # 博客列表页样式
│   ├── blog-post.css      # 博客文章页样式
│   ├── about.css          # 关于页样式
│   └── subscribe.css      # 订阅页样式
├── utils/
│   └── format.ts          # 工具函数（formatDate、getReadTime）
├── consts.ts              # 站点常量（SITE_TITLE、SITE_DESCRIPTION 等）
├── content.config.ts      # Content Collections 配置（Zod schema）
├── env.d.ts               # TypeScript 类型声明（locals.featureFlags）
└── middleware.ts           # 中间件（注入 featureFlags）
```

## 请求生命周期

```
请求进入
  │
  ▼
middleware.ts ─→ 注入 featureFlags 到 Astro.locals
  │
  ▼
页面 frontmatter 执行
  ├── 读取 Astro.locals.featureFlags
  ├── 加载 Content Collections（getCollection）
  └── 导入 CSS 文件
  │
  ▼
Layout 渲染（BaseLayout / BlogPost）
  ├── 检查 redirectKey → 插入 redirect 脚本（如需要）
  ├── 渲染 Header（根据 featureFlags 条件显示导航）
  ├── 渲染 <slot />（页面内容）
  └── 渲染 Footer
  │
  ▼
静态 HTML 输出（SSG）或流式响应（SSR）
```

## 环境管理

详见 [ADR-001](decisions/001-use-middleware-locals-for-feature-flags.md)。

- **开发环境**：所有页面可见，导航栏显示全部链接
- **生产环境**：仅 `/blog` 可见，其他页面通过 `<script is:inline>location.replace('/blog')</script>` 重定向
- 导航栏在仅 blog 页面可见时自动隐藏（`hasNavigation` 逻辑）

## 内容管线

详见 [ADR-004](decisions/004-obsidian-content-pipeline.md)。

```
Obsidian Vault
  │
  ▼ (scripts/sync-content.js)
src/content/blog/*.md
  │
  ▼ (content.config.ts + Zod schema)
Astro Content Collections
  │
  ▼ (getCollection)
页面渲染（blog/index.astro、[...slug].astro）
```

## 构建与部署

```bash
# 同步内容
npm run sync

# 开发
astro dev --background

# 生产构建
astro build

# 预览
astro preview
```

部署平台：Vercel（通过 `.vercel/` 目录配置）

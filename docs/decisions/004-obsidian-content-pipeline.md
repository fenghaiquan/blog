# ADR-004: Obsidian 内容管线集成

## 状态：已采纳

## 日期
2026-07-15

## 背景
作者使用 Obsidian 作为主要写作工具，博客内容需要与 Obsidian vault 同步，同时保留 Obsidian 特有语法（wiki-links、callouts）。

## 决策
建立 Obsidian → sync script → Astro Content Collections 的内容管线。

## 实现细节

### 同步机制
- `content-sources.json` 配置 Obsidian vault 路径和输出目录
- `scripts/sync-content.js` 读取配置，将 Markdown 文件复制到 `src/content/blog/`
- 支持 `--clean` 标志清理不在源中的文件

### Markdown 增强
- `remark-obsidian-md`：支持 `[[wiki-links]]` 语法
- `remark-math` + `rehype-katex`：支持 LaTeX 数学公式
- Mermaid 图表：客户端通过 CDN 动态加载（BlogPost.astro 内脚本）
- `@tailwindcss/typography`：prose 类自动排版 Markdown 内容

### Content Schema
```typescript
{
  title: string,
  date: Date,
  description?: string,
  tags: string[],
  draft: boolean,       // 开发环境可见，生产环境过滤
  featured: boolean,
  image?: string,
}
```

## 理由
- 写作工具（Obsidian）与发布平台（Astro）解耦
- 作者无需学习 Astro 内容格式
- wiki-links 和 callouts 保留 Obsidian 写作体验
- draft 字段配合环境管理实现内容发布流程

## 后果
- 发布前需运行 `npm run sync` 同步内容
- Mermaid 图表依赖客户端 CDN 加载，首屏可能有延迟
- wiki-links 在目标页面不存在时显示为 broken link（`.wiki-link-broken` 样式）

## 相关代码
- `content-sources.json`
- `scripts/sync-content.js`
- `src/content.config.ts`
- `astro.config.mjs`（Markdown 插件配置）
- `src/layouts/BlogPost.astro`（Mermaid 客户端加载）
- `src/styles/global.css`（callout、wiki-link 样式）

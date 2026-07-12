---
name: commit
description: Git commit message 规范。触发时机：用户要求提交代码时自动应用。
---

## 触发条件

- 用户明确要求 commit（如"提交"、"commit"）
- 完成一个功能后主动询问是否需要提交

## 格式规范

### 结构

```
<type>: <中文描述>
- <变更项1>
- <变更项2>
- <变更项3>
```

### 类型前缀

| 类型 | 用途 |
|------|------|
| `feat` | 新功能、新组件、新页面 |
| `fix` | 修复 bug 或渲染问题 |
| `post` | 新增或更新博文内容 |
| `style` | CSS / 样式调整 |
| `refactor` | 重构代码结构 |
| `docs` | 文档更新（README、AGENTS.md 等） |
| `config` | 配置变更（astro.config、content schema 等） |
| `chore` | 杂项维护（依赖更新、资源文件等） |

### 变更项规范

- 每项以 `- ` 开头，独占一行
- 使用中文描述具体做了什么
- 相关变更合并为一项，避免过度细化
- 体现具体动作，不使用模糊表述

### 粒度平衡

**过细**（避免）：
```
feat: 新增 Markdown 测试博文
- 创建 markdown-syntax-test.md
- 添加标题测试
- 添加列表测试
- 添加表格测试
- 添加代码块测试
- 添加脚注测试
- 更新 index
```

**过粗**（避免）：
```
feat: 新增测试博文
```

**合适**：
```
post: Markdown 语法测试博文
- 新增 markdown-syntax-test.md，覆盖标准 Markdown + GFM 全部语法
- 包含标题、列表、表格、代码块、脚注、HTML 嵌入等 17 个测试类别
```

## 执行步骤

### Step 1: 检查变更范围

```bash
git status
git diff --stat
```

确认要提交的文件和变更类型。

### Step 2: 分析变更内容

阅读 `git diff` 或文件列表，归纳变更：
- 识别主要功能/修复/重构/博文
- 将相关变更合并为一个变更项
- 用中文描述具体动作

### Step 3: 构建 commit message

按格式规范组织：
- 第一行：`<type>: <概括性描述>`
- 后续行：`- <具体变更项>`
- 控制在 5-10 个变更项

### Step 4: 提交

```bash
git add <files>
git commit -m "<type>: <描述>
- <变更项1>
- <变更项2>"
```

对于多行 commit message，使用 heredoc：

```bash
git commit -m "$(cat <<'EOF'
post: Markdown 语法测试博文
- 新增 markdown-syntax-test.md，覆盖标准 Markdown + GFM 全部语法
- 包含标题、列表、表格、代码块、脚注、HTML 嵌入等 17 个测试类别
EOF
)"
```

## 示例

### 博文发布

```
post: 从中医讨论看 LLM 认知变色龙
- 新增 second-post.md，探讨 LLM 的取悦本能与对称性谬误
- 使用 Obsidian callout 语法组织核心事件、分析启示、深层问题
```

### 功能开发

```
feat: 博文列表双列网格布局
- blog/index.astro 改为 CSS Grid 双列布局
- 首篇博文占满宽度，其余两列排列
- 新增 720px 响应式断点
```

### 样式调整

```
style: 引用块视觉优化
- blockquote 左侧边框改为渐变色
- 调整内边距和字体大小
```

### 配置变更

```
config: 内容集合 schema 扩展
- content.config.ts 新增 updatedDate 可选字段
- 新增 heroImage 图片引用支持
```

### 重构

```
refactor: 组件结构整理
- Header 拆分为 Header + HeaderLink
- 提取 FormattedDate 为独立组件
```

### 杂项维护

```
chore: 依赖更新
- astro 升级至 7.0.7
- @astrojs/mdx 升级至 7.0.2
```

## 注意事项

- 不使用英文描述（除非是专有名词如组件名、文件名）
- 避免过度简化（如 `feat: test`）
- 避免过度细化（每条改动一行）
- 相关变更合并，体现"做了什么"而非"改了哪些文件"
- 博文内容统一使用 `post` 类型，不使用 `feat` 或 `docs`

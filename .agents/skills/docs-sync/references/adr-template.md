# ADR Template

Use this template when creating a new Architecture Decision Record.

```markdown
# ADR-NNN: Decision Title

## 状态：已采纳 | 已废弃 | 待讨论

## 日期
YYYY-MM-DD

## 背景
（当时面临什么问题？为什么需要做这个决定？用 2-3 句话说明上下文。）

## 候选方案

### 方案 A：方案名称
简要描述。
**问题：** 为什么不选这个（或为什么选这个）。

### 方案 B：方案名称（✅ 采纳）
简要描述。

### 方案 C：方案名称（可选）
简要描述。
**问题：** 为什么不选这个。

## 决策
采用方案 X。

## 理由
（为什么选这个方案？列出 2-4 个关键原因。）

## 后果
- 好处：...
- 代价：...

## 相关代码
- `src/path/to/file.ts`
- `src/path/to/other.astro`
```

## Filling Guidelines

- **标题**: Use kebab-case in the filename, natural language in the heading.
- **状态**: Set to "已采纳" when implemented, "待讨论" for proposals, "已废弃" when superseded.
- **背景**: Be specific about the problem. "We needed X" is better than "X is important."
- **候选方案**: Always include at least 2 alternatives. The value of an ADR is in showing what was considered and rejected.
- **理由**: Explain the "why" — not just "方案 B is better" but "方案 B is better because [specific reason relevant to our constraints]."
- **后果**: Be honest about tradeoffs. Every decision has costs.
- **相关代码**: List the files that implement this decision. This creates a traceability chain from code to documentation.

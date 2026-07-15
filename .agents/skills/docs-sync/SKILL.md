---
name: docs-sync
description: Maintain project documentation in sync with code decisions. Trigger this skill when: (1) making an architectural or design decision (choosing between approaches, introducing a new mechanism, changing a pattern), (2) creating new pages, components, layouts, or significant features, (3) modifying core systems (environment management, CSS architecture, content pipeline, layout system), or (4) the user explicitly asks to update or create documentation. Do NOT trigger for simple bug fixes, minor style tweaks, or content-only changes.
---

# Docs Sync

Keep the project's three-layer documentation system synchronized with code changes.

## When to Record a Decision

A change qualifies as a "decision" worth documenting when it involves:
- **Choosing between alternatives** (e.g., middleware locals vs route redirect)
- **Introducing a new mechanism or pattern** (e.g., BaseLayout with redirectKey)
- **Changing how a core system works** (e.g., switching CSS architecture)
- **Adding a new page type or layout pattern**

It does NOT qualify when it is:
- A bug fix with no design implications
- A minor style adjustment (color, spacing tweak)
- Adding or editing blog content
- Routine dependency updates

## Three-Layer Documentation System

The project uses three documentation layers. Read `references/doc-structure.md` for the full overview.

| Layer | Location | What it holds |
|-------|----------|---------------|
| Conventions | `AGENTS.md` §3–§5 | Current rules that agents and developers follow |
| Architecture | `docs/ARCHITECTURE.md`, `docs/DESIGN-SYSTEM.md` | System architecture and design specs |
| Decisions | `docs/decisions/ADR-NNN-*.md` | Why a decision was made (with alternatives considered) |

## ADR Workflow

### Step 1: Determine the ADR Number

Read existing ADR filenames in `docs/decisions/` to find the highest number. The new ADR gets the next number.

```
# Example: if 004 is the highest, create 005-xxx.md
```

### Step 2: Write the ADR

Follow the template in `references/adr-template.md`. Key fields:

- **状态**: 已采纳 (adopted) for implemented decisions, 待讨论 for proposals
- **背景**: What problem prompted this decision? Keep it concrete.
- **候选方案**: List 2-3 alternatives with brief pros/cons. This is the most valuable part — it captures the reasoning that would otherwise be lost.
- **决策**: Which option was chosen.
- **理由**: Why this option over the others.
- **后果**: Tradeoffs — what you gain and what you accept.
- **相关代码**: File paths that implement this decision.

Save to `docs/decisions/NNN-kebab-case-title.md`.

### Step 3: Update AGENTS.md

Add a summary entry in `AGENTS.md` §3 (架构决策). Format:

```markdown
### 3.N Decision Title（ADR-NNN）
Brief one-paragraph summary of what was decided and how it works.
详见 [docs/decisions/NNN](../docs/decisions/NNN-xxx.md)
```

If the decision affects development conventions (§5), update that section too.

### Step 4: Add Code Comments

In each key file that implements the decision, add a comment referencing the ADR:

```typescript
// [ADR-NNN] Brief explanation of what this does and why
// 详见：docs/decisions/NNN-xxx.md
```

Use the comment style appropriate for the file type:
- `.ts` / `.js`: `// [ADR-NNN] ...`
- `.astro` frontmatter: `// [ADR-NNN] ...` (inside the `---` block)
- `.css`: `/* [ADR-NNN] ... */`

### Step 5: Update Architecture Docs (if applicable)

If the decision changes the system architecture or design system:
- Update `docs/ARCHITECTURE.md` (directory structure, request lifecycle, content pipeline, etc.)
- Update `docs/DESIGN-SYSTEM.md` (colors, fonts, layout patterns, component classes)

## Example

When the team decided to use middleware locals for feature flags:

1. Created `docs/decisions/001-use-middleware-locals-for-feature-flags.md`
2. Added entry in `AGENTS.md` §3.1
3. Added comment in `src/middleware.ts`: `// [ADR-001] 使用 locals 注入 feature flags...`

## Important Notes

- **Never delete ADRs.** Mark obsolete ones as "已废弃" with a note explaining what replaced them.
- **Keep ADRs concise.** 30-50 lines is the target. If you need more, the decision might be too broad — split it.
- **Write for future developers.** The person reading this in 6 months won't remember the context. Explain the "why" thoroughly.

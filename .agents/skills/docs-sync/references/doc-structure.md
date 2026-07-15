# Documentation Structure Overview

## Three-Layer System

```
AGENTS.md                              ← Layer 1: Conventions (agent + developer entry point)
docs/
├── ARCHITECTURE.md                    ← Layer 2: Architecture specs
├── DESIGN-SYSTEM.md                   ← Layer 2: Design system specs
└── decisions/                         ← Layer 3: Decision records
    ├── 001-use-middleware-locals-for-feature-flags.md
    ├── 002-two-layer-css-inheritance.md
    ├── 003-baselayout-with-redirectkey.md
    └── 004-obsidian-content-pipeline.md
```

## Layer Responsibilities

### Layer 1: Conventions (`AGENTS.md`)

**Audience:** AI agents and developers starting work on the project.

**Contains:**
- §1 Project overview (tech stack, language)
- §2 Directory structure
- §3 Architecture decisions (summaries with links to ADRs)
- §4 Design system (key specs with link to full doc)
- §5 Development conventions (dev server, page creation, CSS organization, git, content sync)
- §6 Documentation maintenance rules
- §7 External resources

**Update when:** A rule or convention changes. Keep summaries short — link to ADRs for details.

### Layer 2: Architecture Docs (`docs/`)

**Audience:** Developers who need to understand the system deeply.

| File | Content |
|------|---------|
| `ARCHITECTURE.md` | Tech stack, directory structure, request lifecycle, environment management, content pipeline, build/deploy |
| `DESIGN-SYSTEM.md` | Design principles, color tokens, font system, spacing/layout, shared component classes, responsive strategy, per-page CSS map |

**Update when:** The system architecture or design system changes significantly.

### Layer 3: Decision Records (`docs/decisions/`)

**Audience:** Anyone who needs to understand why a decision was made.

**Naming:** `NNN-kebab-case-title.md` (zero-padded 3 digits)

**Update when:** A new architectural or design decision is made.

**Rules:**
- Never delete ADRs — mark as "已废弃" with explanation
- Each ADR links to the code files it affects
- Code files link back to ADRs via comments

## Synchronization Rules

| Trigger | Action |
|---------|--------|
| New decision made | Create ADR → Update AGENTS.md §3 → Add code comments |
| Architecture changes | Update `docs/ARCHITECTURE.md` |
| Design system changes | Update `docs/DESIGN-SYSTEM.md` |
| Development convention changes | Update `AGENTS.md` §5 |
| ADR becomes obsolete | Mark status as "已废弃", add note about replacement |

## Code Comment Convention

Reference ADRs from code to create a bidirectional link:

```
// [ADR-NNN] Brief explanation
// 详见：docs/decisions/NNN-xxx.md
```

This way, a developer reading code can find the decision context, and a reader of an ADR can find the implementation.

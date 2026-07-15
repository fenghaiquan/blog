---
name: og-image-generator
description: Generate custom OG images for blog posts. Dual-path: English posts use card-twitter skill, Chinese posts use canvas-design skill. Trigger when the user asks to generate OG images, create social sharing cards, or run "og:generate".
---

# OG Image Generator

Generate custom OG images for blog posts using a dual-path Open Design pipeline based on language detection.

## Trigger Conditions

- User asks to generate OG images (e.g., "生成 OG 图片", "generate OG images")
- User asks to create social sharing cards
- User mentions "og:generate" or similar commands

## Dual-Path Architecture

| Path | Language Detection | Skill | Design System | Output | Size |
|------|-------------------|-------|---------------|--------|------|
| **English** | Title has no CJK characters | `card-twitter` | None | HTML → Playwright screenshot | 1200x630 |
| **Chinese** | Title contains CJK characters | `canvas-design` | `paper` | HTML → Playwright screenshot | 1080x1080 |

Both paths produce HTML that gets screenshot via Playwright. `canvas-design` is prompted to output HTML directly (not PNG) to avoid requiring image generation API keys.

## Workflow Overview

```
Phase 1: prepare-manifest.js    → Scan posts, detect language, generate prompts, write manifest
Phase 2: Open Design MCP calls  → Generate HTML/PNG designs (the slow part)
Phase 3: screenshot.js          → Playwright screenshots (card-twitter) or copy PNG (canvas-design)
Phase 4: validate.js            → Validate generated images, mark failed for regeneration
```

Phase 1, 3, and 4 are deterministic scripts. Phase 2 uses Open Design MCP tools and is the creative step.

If Phase 4 finds issues, the workflow loops back to Phase 2 for failed tasks.

## Execution Steps

### Step 1: Run prepare-manifest.js

```bash
node .agents/skills/og-image-generator/scripts/prepare-manifest.js [--dry-run] [--limit=N] [--slug=SLUG]
```

- `--dry-run`: Print prompts without generating. Use this when the user wants to preview.
- `--limit=N`: Max posts to process (default 3).
- `--slug=SLUG`: Generate for a specific post only (e.g., `--slug=AI对话的四象限模型`).
- Outputs: `.og-manifest.json` with pending tasks.

Read the manifest after the script runs. Each task has `slug`, `prompt`, `path` ("opendesign"), `skill` ("card-twitter" or "canvas-design"), and `status: "pending"`.

### Step 2: Generate images via Open Design

For each task with `status: "pending"`:

#### 2a. Create an Open Design project

```
open-design_create_project:
  name: "og-{slug}"
```

Record the project id. Update manifest task:
```json
{ "status": "running", "odProject": "<project-id>" }
```

#### 2b. Start a generation run

```
open-design_start_run:
  project: "<project-id>"
  prompt: "<task.prompt from manifest>"
  skill: "<task.skill from manifest>"
```

**Important:**
- For `card-twitter` skill: No design system needed
- For `canvas-design` skill: Use `paper` design system

Record the `runId`. Update manifest task:
```json
{ "runId": "<run-id>" }
```

Save manifest immediately after each update for crash recovery.

#### 2c. Poll until complete

```
open-design_get_run:
  runId: "<run-id>"
```

Poll every 30-60 seconds. Status transitions: `queued` → `running` → `succeeded` / `failed`.

This is the slow step — each run takes 5-30 minutes. Tell the user "still working" between polls.

If status is `failed`, log the error, set task status to `"failed"`, and move to the next task.

#### 2d. Retrieve the generated artifact

On success:

```
open-design_get_artifact:
  project: "<project-id>"
  include: "shallow"
```

- For `card-twitter`: Extract the HTML entry file. Save to `.og-cache/{slug}.html`.
- For `canvas-design`: Extract the HTML entry file. Save to `.og-cache/{slug}.html`.

Update manifest task:
```json
{ "status": "done", "completedAt": "<timestamp>" }
```

#### 2e. Clean up the OD project

```
open-design_delete_project:
  project: "<project-id>"
  confirm: true
```

### Step 3: Run screenshot.js

```bash
node .agents/skills/og-image-generator/scripts/screenshot.js [--cleanup]
```

- Reads `.og-manifest.json` for tasks with `status: "done"`.
- For `card-twitter`: Reads `.og-cache/{slug}.html` and screenshots at 1200x630 → `public/og/{slug}.png` via Playwright.
- For `canvas-design`: Reads `.og-cache/{slug}.html` and screenshots at 1080x1080 → `public/og/{slug}.png` via Playwright.
- `--cleanup`: Remove `.og-cache/` after screenshots.

Update manifest task status to `"screenshotted"`.

### Step 4: Run validate.js

```bash
node .agents/skills/og-image-generator/scripts/validate.js [--slug=SLUG]
```

- Reads `.og-manifest.json` for tasks with `status: "screenshotted"`.
- Validates each PNG:
  - File exists and is not corrupted
  - File size within acceptable range (50KB - 2MB)
  - Dimensions match expected size (1200x630 for card-twitter, 1080x1080 for canvas-design)
- Updates manifest:
  - `validated` → Image passed validation
  - `failed` → Image has issues, needs regeneration

**Validation Loop:**

If any tasks fail validation:
1. Review the validation issues in `.og-manifest.json`
2. Fix the root cause (e.g., adjust prompt, change skill, fix font issues)
3. Re-run Phase 2-4 for failed tasks:
   ```bash
   npm run og:prepare -- --slug=failed-slug
   # Then repeat Phase 2-3
   npm run og:validate -- --slug=failed-slug
   ```

Update manifest task:
```json
{ "status": "validated", "validatedAt": "<timestamp>" }
```
or
```json
{ "status": "failed", "validationIssues": [...], "failedAt": "<timestamp>" }
```

## Crash Recovery

The manifest (`.og-manifest.json`) tracks state. If the session is interrupted:

- `pending` → Not started, will be picked up on next run.
- `running` → Was in progress. Check if OD project still exists. If the run completed, retrieve the HTML/PNG manually and save to cache.
- `done` → HTML/PNG in cache, waiting for screenshots/copy.
- `screenshotted` → Screenshot/copy complete, waiting for validation.
- `validated` → Complete, skip.
- `failed` → Validation failed, needs regeneration.

Before starting Phase 2, always read the manifest first and skip tasks that are already `validated`.

## Font Handling

Chinese OG images require system fonts for reliable rendering:

1. **System fonts**: Install `fonts-noto-cjk` via package manager, or manually download to `~/.local/share/fonts/`:
   ```bash
   curl -L -o ~/.local/share/fonts/NotoSansSC-Regular.ttf "https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf"
   fc-cache -fv ~/.local/share/fonts
   ```
2. **Detection**: `screenshot.js` checks for Chinese fonts via `fc-list` before processing
3. **Fallback**: If fonts missing, script prints installation instructions and exits

No HTML preprocessing needed — Playwright uses system fonts directly.

## Important Notes

- Max 3 posts per run to keep generation time manageable (15-90 min total).
- The `card-twitter` skill is used for English posts — it outputs HTML that gets screenshot via Playwright at 1200x630.
- The `canvas-design` skill is used for Chinese posts with the `paper` design system — it outputs HTML that gets screenshot via Playwright at 1080x1080.
- If the user wants to preview prompts before generating, use `--dry-run` first.
- The existing satori-based `generate-og-images.js` serves as fallback during `npm run build` — it only generates images for posts that don't already have one in `public/og/`.
- **Always run validation after screenshot** — `npm run og:validate` checks for rendering issues (e.g., missing fonts, corrupted files) and marks failed tasks for regeneration.
- Read `references/platform-specs.md` for multi-platform sizing details.
- Read `references/prompt-guidelines.md` for design system reference and prompt structure.

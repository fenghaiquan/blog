# OG Image Prompt Guidelines

## Prompt Structure

The prompt passed to Open Design should include:

1. **Content context**: Article title, description, and tags
2. **Size specification**: 1200 x 630 px
3. **Brand requirements**: "Feng's Blog" footer
4. **Safe zone reminder**: Central 70% area for multi-platform compatibility
5. **Style freedom**: Let OD choose the visual style based on content

## Design System Reference

Feng's Blog uses a warm earth-tone palette:

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#FAF8F5` | Page background |
| Primary accent | `#92400E` | Links, highlights |
| Text | `#1C1917` | Body text |
| Muted text | `#78716C` | Secondary text |
| Border | `#E7E5E4` | Dividers |

These colors are a reference, not a constraint. OD may choose different palettes based on article content.

## Typography

- Blog uses Source Serif 4 (display), Inter (body), Inconsolata (code)
- For OG images, any readable font is acceptable
- Chinese content should use a legible sans-serif or kai font

## What to Avoid

- Extremely small text (< 24px at 1200px width)
- Content too close to edges (will be cropped in square format)
- Overly complex layouts that don't read well at thumbnail size
- Placeholder text or lorem ipsum

## Skill Selection

Default: `card-twitter` — purpose-built for social sharing cards, no design system required.

Alternatives if card-twitter produces unsatisfactory results:
- `canvas-design` — more artistic, requires design system
- `poster-hero` — vertical format, good for WeChat Moments

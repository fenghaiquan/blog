# Platform OG Image Specifications

## Primary Size: 1200 x 630 px (1.91:1)

Covers the majority of social sharing platforms.

| Platform | Usage | Notes |
|----------|-------|-------|
| Twitter/X | `summary_large_image` | Recommended 1200x628, min 600x314 |
| Facebook | Shared link preview | Recommended 1200x630, min 200x200 |
| LinkedIn | Shared post preview | Recommended 1200x627 |
| Generic OG | `og:image` meta tag | Most platforms accept this ratio |

## Secondary Size: 1080 x 1080 px (1:1)

For WeChat ecosystem where square images are preferred.

| Platform | Usage | Notes |
|----------|-------|-------|
| WeChat share card | Link preview thumbnail | 500x500 or 200x200, auto-cropped |
| WeChat Moments | Friend circle share | 1080x1080 recommended |

## Safe Zone Guidelines

When designing for multiple aspect ratios from a single HTML layout:

- **Keep critical content (title, brand) in the center 70% area**
- Left/right margins: at least 15% of width
- Top/bottom margins: at least 10% of height
- Brand footer ("Foong's Blog") should be centered, not edge-aligned

## File Size Limits

| Platform | Max Size | Format |
|----------|----------|--------|
| Twitter/X | 5 MB | PNG/JPG/GIF |
| Facebook | 8 MB | PNG/JPG |
| LinkedIn | 5 MB | PNG/JPG/GIF |
| WeChat | 2 MB | PNG/JPG |

Our generated PNGs are typically 50-200 KB, well within all limits.

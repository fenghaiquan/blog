#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../../..');

const CONTENT_DIR = path.join(rootDir, 'src/content/blog');
const OG_DIR = path.join(rootDir, 'public/og');
const MANIFEST_PATH = path.join(rootDir, '.og-manifest.json');
const CACHE_DIR = path.join(rootDir, '.og-cache');

const MAX_BATCH = 3;

function hasCJK(str) {
  return /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(str);
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const fm = match[1];
  const get = (key) => {
    const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
    return m ? m[1].replace(/^['"]|['"]$/g, '').trim() : '';
  };

  const title = get('title');
  const description = get('description');
  const date = get('date');
  const draft = get('draft');

  let tags = [];
  const tagsInline = fm.match(/^tags:\s*\[([^\]]+)\]/m);
  if (tagsInline) {
    tags = tagsInline[1].split(',').map((t) => t.trim().replace(/['"]/g, ''));
  } else {
    const tagsBlock = fm.match(/^tags:\s*\n((?:\s+-\s+.+\n?)*)/m);
    if (tagsBlock) {
      tags = tagsBlock[1]
        .split('\n')
        .map((l) => l.replace(/^\s+-\s+/, '').trim())
        .filter(Boolean);
    }
  }

  return { title, description, date, tags, draft: draft === 'true' };
}

function buildPrompt({ title, description, tags }) {
  const tagStr = tags.length > 0 ? tags.join(', ') : '';

  return `Generate an OG sharing card image for a blog post.

## Article Content
- Title: ${title}
${description ? `- Summary: ${description}` : ''}
${tagStr ? `- Tags: ${tagStr}` : ''}

## Design Requirements
- Size: 1200 x 630 px
- Choose a visual style that fits the article content
- Include brand identifier "Feng's Blog" at the bottom
- Ensure title is clearly readable with good visual hierarchy
- Keep key content in the central safe area (15% margin on each side) for cross-platform cropping`;
}

function buildCNPrompt({ title, description, tags }) {
  const tagStr = tags.length > 0 ? tags.join(', ') : '';

  return `为博客文章生成 OG 分享卡片图片（正方形，面向微信等国内平台）。

## 文章内容
- 标题：${title}
${description ? `- 摘要：${description}` : ''}
${tagStr ? `- 标签：${tagStr}` : ''}

## 设计要求
- 尺寸：1080 x 1080 px（正方形构图）
- 根据文章内容自动选择合适的视觉风格
- 底部包含品牌标识 "Feng's Blog"
- 确保标题清晰可读，信息层级分明
- 中文排版，使用暖色调设计系统
- **输出格式：HTML 文件**（不要生成 PNG 图片，直接输出 HTML 代码）`;
}

function hasOGImage(slug) {
  const pngPath = path.join(OG_DIR, `${slug}.png`);
  return fs.existsSync(pngPath);
}

function scanPosts() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`[og-prepare] Content directory not found: ${CONTENT_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'));
  const posts = [];

  for (const file of files) {
    const slug = path.basename(file, '.md');
    const content = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8');
    const fm = parseFrontmatter(content);

    if (!fm || fm.draft) continue;
    if (hasOGImage(slug)) continue;

    const isCN = hasCJK(fm.title);
    posts.push({
      slug,
      title: fm.title,
      description: fm.description,
      tags: fm.tags,
      date: fm.date,
      path: 'opendesign',
      skill: isCN ? 'canvas-design' : 'card-twitter',
      prompt: isCN ? buildCNPrompt(fm) : buildPrompt(fm),
    });
  }

  return posts;
}

function loadManifest() {
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    } catch {
      return { tasks: [] };
    }
  }
  return { tasks: [] };
}

function saveManifest(manifest) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : MAX_BATCH;
  const slugArg = args.find((a) => a.startsWith('--slug='));
  const targetSlug = slugArg?.split('=').slice(1).join('=');

  console.log(`[og-prepare] Scanning posts...`);
  let posts = scanPosts();

  if (targetSlug) {
    const allFiles = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'));
    const exists = allFiles.some((f) => path.basename(f, '.md') === targetSlug);
    if (!exists) {
      console.error(`[og-prepare] Post not found: ${targetSlug}`);
      process.exit(1);
    }
    posts = posts.filter((p) => p.slug === targetSlug);
    if (posts.length === 0) {
      console.log(`[og-prepare] Post "${targetSlug}" already has an OG image or is a draft.`);
      return;
    }
  }

  if (posts.length === 0) {
    console.log(`[og-prepare] All posts already have OG images.`);
    return;
  }

  console.log(`[og-prepare] Found ${posts.length} posts without OG images.`);

  const pending = targetSlug ? posts : posts.slice(0, limit);

  if (dryRun) {
    console.log(`\n[og-prepare] DRY RUN - Would generate ${pending.length} images:\n`);
    for (const post of pending) {
      console.log(`=== ${post.slug} [${post.path}] skill: ${post.skill} ===`);
      console.log(post.prompt);
      console.log('');
    }
    return;
  }

  const manifest = loadManifest();

  for (const post of pending) {
    const existing = manifest.tasks.find((t) => t.slug === post.slug);
    if (existing && (existing.status === 'done' || existing.status === 'screenshotted' || existing.status === 'validated')) continue;

    manifest.tasks.push({
      slug: post.slug,
      title: post.title,
      prompt: post.prompt,
      path: post.path,
      skill: post.skill,
      status: 'pending',
      odProject: null,
      runId: null,
      createdAt: new Date().toISOString(),
    });
  }

  saveManifest(manifest);

  fs.mkdirSync(CACHE_DIR, { recursive: true });

  console.log(`[og-prepare] Manifest updated: ${manifest.tasks.filter((t) => t.status === 'pending').length} pending tasks.`);
  console.log(`[og-prepare] Manifest saved to: ${MANIFEST_PATH}`);
}

main();

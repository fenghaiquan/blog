import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { Resvg } from '@resvg/resvg-js';
import { createOGTemplate, generateOGImage } from './og-template.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const FONTS_DIR = path.join(rootDir, 'src/assets/fonts');
const OUTPUT_DIR = path.join(rootDir, 'public/og');
const CONTENT_DIR = path.join(rootDir, 'src/content/blog');

const SITE_NAME = "Feng's Blog";

function extractCharacters() {
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'));
  const chars = new Set();

  for (const file of files) {
    const content = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) continue;

    const fm = frontmatterMatch[1];
    const titleMatch = fm.match(/^title:\s*(.+)$/m);
    const descMatch = fm.match(/^description:\s*(.+)$/m);
    const tagsMatch = fm.match(/^tags:\s*\[([^\]]+)\]/m);

    if (titleMatch) [...titleMatch[1].replace(/['"]/g, '')].forEach((c) => chars.add(c));
    if (descMatch) [...descMatch[1].replace(/['"]/g, '')].forEach((c) => chars.add(c));
    if (tagsMatch) {
      tagsMatch[1].split(',').forEach((t) => {
        [...t.trim()].forEach((c) => chars.add(c));
      });
    }
  }

  [...SITE_NAME].forEach((c) => chars.add(c));
  [..."AI 工程实践 & 构建经验"].forEach((c) => chars.add(c));
  return chars;
}

function subsetFont(chars) {
  const inputFont = path.join(FONTS_DIR, 'LXGWWenKai-Regular.ttf');
  const outputFont = path.join(FONTS_DIR, 'LXGWWenKai-Regular.subset.ttf');

  const charsArray = Array.from(chars);
  const text = charsArray.join('');

  const tempFile = path.join(FONTS_DIR, '.subset-chars.txt');
  fs.writeFileSync(tempFile, text);

  try {
    execSync(
      `pyftsubset "${inputFont}" --text-file="${tempFile}" --output-file="${outputFont}" --layout-features='*' --no-hinting --desubroutinize`,
      { stdio: 'pipe' }
    );
  } finally {
    fs.unlinkSync(tempFile);
  }

  return outputFont;
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

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

async function generateAll() {
  console.log('[og-images] Extracting characters...');
  const chars = extractCharacters();
  console.log(`[og-images] Found ${chars.size} unique characters`);

  console.log('[og-images] Subsetting font...');
  const subsetFontPath = subsetFont(chars);
  const fontData = fs.readFileSync(subsetFontPath);
  console.log(`[og-images] Font subset: ${(fontData.length / 1024).toFixed(0)}KB`);

  const fonts = [
    {
      name: 'LXGW WenKai',
      data: fontData,
      weight: 400,
      style: 'normal',
    },
  ];

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'));
  const posts = files.map((file) => {
    const content = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8');
    const fm = parseFrontmatter(content);
    const slug = path.basename(file, '.md');
    return { slug, ...fm };
  });

  console.log(`[og-images] Generating OG images for ${posts.length} posts...`);

  for (const post of posts) {
    if (post.draft) {
      console.log(`[og-images] Skip (draft): ${post.slug}`);
      continue;
    }

    const outputPath = path.join(OUTPUT_DIR, `${post.slug}.png`);

    if (fs.existsSync(outputPath)) {
      const mdPath = path.join(CONTENT_DIR, `${post.slug}.md`);
      const mdStat = fs.statSync(mdPath);
      const pngStat = fs.statSync(outputPath);
      if (mdStat.mtime <= pngStat.mtime) {
        console.log(`[og-images] Skip (cached): ${post.slug}.png`);
        continue;
      }
    }

    const template = createOGTemplate({
      title: post.title,
      description: post.description,
      date: formatDate(post.date),
      tags: post.tags,
      siteName: SITE_NAME,
    });

    const svg = await generateOGImage(template, fonts);
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: 1200 },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    fs.writeFileSync(outputPath, pngBuffer);
    console.log(`[og-images] Generated: ${post.slug}.png (${(pngBuffer.length / 1024).toFixed(0)}KB)`);
  }

  if (!fs.existsSync(path.join(OUTPUT_DIR, 'default.png'))) {
    console.log('[og-images] Generating default OG image...');
    const template = createOGTemplate({
      title: SITE_NAME,
      description: 'AI 工程实践 & 构建经验',
      date: '',
      tags: [],
      siteName: SITE_NAME,
    });
    const svg = await generateOGImage(template, fonts);
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
    const pngBuffer = resvg.render().asPng();
    fs.writeFileSync(path.join(OUTPUT_DIR, 'default.png'), pngBuffer);
    console.log(`[og-images] Generated: default.png (${(pngBuffer.length / 1024).toFixed(0)}KB)`);
  }

  console.log('[og-images] Done!');
}

generateAll().catch((err) => {
  console.error('[og-images] Error:', err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * render-cheatsheet-pdf.cjs — 将速查手册手稿渲染为 PDF
 *
 * 手稿（markdown）→ marked 转 HTML → 自定义 CSS → Playwright Chromium 打印为 A4 PDF。
 *
 * 两遍渲染：第一遍临时 PDF 用 pdf-parse 定位各章实际页码（Chromium 分页无 API，
 * 只能从成品 PDF 文本反查），第二遍把页码填入目录 {{p:N}} 占位符（行数不变 →
 * 布局不变 → 页码精确）。
 *
 * 用法：
 *   node scripts/render-cheatsheet-pdf.cjs                        # 完整版（默认输出）
 *   node scripts/render-cheatsheet-pdf.cjs --preview              # 免费试读版
 *   node scripts/render-cheatsheet-pdf.cjs --shots=/dir/to/shots  # 同时输出排版预览截图
 *
 * 依赖：marked、playwright、pdf-parse（项目 devDependencies）+ 系统字体 Noto Sans CJK SC。
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { chromium } = require('playwright');
const { PDFParse } = require('pdf-parse');

const MANUSCRIPT =
  '/mnt/d/Documents/Obsidian/LLMBrain/5_Output/Product/product-cheatsheet/manuscript';
const DEFAULT_OUT =
  'public/downloads/agent-patterns-cheatsheet-v1.1-ba43bf.pdf'; // 后缀 = 不可猜测交付路径，改动时同步 src/consts.ts
const PREVIEW_OUT = 'public/downloads/agent-patterns-cheatsheet-preview.pdf';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)=(.*)$/);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ''), true];
  })
);
const PREVIEW = !!args.preview;
const OUT = path.resolve(typeof args.out === 'string' ? args.out : PREVIEW ? PREVIEW_OUT : DEFAULT_OUT);
const SHOTS = typeof args.shots === 'string' ? path.resolve(args.shots) : null;

// ---------- 手稿清单（按渲染顺序） ----------
const FILES = [
  '00-cover.md', // 封面页（单独样式）
  '01-toc.md', // 目录（{{p:N}} 占位符）
  '01-how-to-use.md',
  '02-faq.md',
  'chapters/03-context.md',
  'chapters/04-reasoning.md',
  'chapters/05-tools.md',
  'chapters/06-architecture.md',
  'chapters/07-multi-agent.md',
  'chapters/08-quality.md',
  'chapters/09-security.md',
  'chapters/10-learning.md',
  'chapters/11-observability.md',
  'chapters/12-code-review.md',
  'chapters/13-human-in-loop.md',
  'chapters/14-developer-experience.md',
  'chapters/15-cost-performance.md',
  '90-attribution.md',
  '91-license.md',
];
const PREVIEW_FILES = [
  '00-cover.md',
  '01-toc.md',
  '01-how-to-use.md',
  '02-faq.md',
  'chapters/03-context.md',
  '92-preview-cta.md', // 试读版购买引导（仅试读版收录）
];

// 目录页码锚点：key 与 01-toc.md 的 {{p:key}} 对应；needle 为各章 h1 文本前缀
const TOC_ANCHORS = [
  { key: '2', needle: '2. 常见问题速查' },
  { key: '3', needle: '3. 上下文' },
  { key: '4', needle: '4. 推理' },
  { key: '5', needle: '5. 工具' },
  { key: '6', needle: '6. 架构' },
  { key: '7', needle: '7. 多智能体' },
  { key: '8', needle: '8. 质量' },
  { key: '9', needle: '9. 安全' },
  { key: '10', needle: '10. 学习' },
  { key: '11', needle: '11. 可观测性' },
  { key: '12', needle: '12. 代码审查' },
  { key: '13', needle: '13. 人机协作' },
  { key: '14', needle: '14. 开发者体验' },
  { key: '15', needle: '15. 成本与性能' },
  { key: '90', needle: '署名与来源声明' },
  { key: '91', needle: '附录：Apache License 2.0' },
];
// 目录页自身的识别锚（锚点搜索需跳过目录页，避免命中目录表格行）
const TOC_PAGE_NEEDLE = '全书按问题树组织';

// ---------- CSS ----------
const CSS = `
html { -webkit-print-color-adjust: exact; }
body {
  font-family: 'Noto Sans CJK SC', 'Noto Sans SC', sans-serif;
  font-size: 9.5pt; line-height: 1.65; color: #1C1917; margin: 0;
}
/* ---------- 封面 ---------- */
.cover {
  height: 260mm; /* A4 高 297 - 上下边距 34 = 263 可用；留 3mm 余量防溢出到第 2 页 */
  display: flex; flex-direction: column; justify-content: center;
  page-break-after: always; text-align: left;
  border-left: 6mm solid #92400E; padding-left: 14mm;
}
.cover h1 {
  font-size: 30pt; line-height: 1.3; border: none; margin: 0 0 10mm 0;
  color: #1C1917; page-break-before: avoid;
}
.cover p:first-of-type { font-size: 13pt; color: #92400E; font-weight: 700; margin: 0 0 16mm 0; letter-spacing: .05em; }
.cover p { font-size: 10.5pt; color: #57534E; margin: 0 0 2.5mm 0; }
.cover ul { margin: 16mm 0 0 0; padding-left: 6mm; }
.cover li { font-size: 10.5pt; color: #44403C; margin-bottom: 2mm; }
.cover p:last-child { margin-top: 18mm; font-size: 9.5pt; color: #A8A29E; }
/* ---------- 章节 ---------- */
h1 {
  font-size: 15pt; page-break-before: always; margin: 0 0 6mm 0;
  padding-bottom: 2.5mm; border-bottom: 0.8mm solid #92400E; color: #1C1917;
}
h1:first-of-type { page-break-before: avoid; }
h2 { font-size: 12pt; color: #92400E; margin: 7mm 0 3mm 0; page-break-after: avoid; }
h3 { font-size: 10.5pt; margin: 5mm 0 2mm 0; page-break-after: avoid; }
blockquote {
  margin: 0 0 5mm 0; padding: 2.5mm 4mm; background: #FAF8F5;
  border-left: 1.2mm solid #D6D3D1; color: #57534E; border-radius: 1mm;
}
blockquote p { margin: 0; }
p { margin: 0 0 3.5mm 0; }
strong { color: #1C1917; }
/* ---------- 链接（Chromium print-to-PDF 保留 /URI 注解） ---------- */
a { color: #92400E; text-decoration: underline; text-underline-offset: 2px; overflow-wrap: anywhere; }
/* ---------- 表格 ---------- */
table {
  width: 100%; border-collapse: collapse; margin: 3mm 0 6mm 0;
  font-size: 8.8pt; page-break-inside: auto;
}
thead { display: table-header-group; }
th {
  text-align: left; padding: 1.8mm 2.5mm; background: #F5F5F4;
  border-bottom: 0.4mm solid #D6D3D1; font-weight: 700; color: #44403C;
  white-space: nowrap;
}
td {
  padding: 1.6mm 2.5mm; border-bottom: 0.2mm solid #E7E5E4;
  vertical-align: top;
}
tr { page-break-inside: avoid; }
tr:nth-child(even) td { background: #FAFAF9; }
td:first-child { white-space: normal; }
ol, ul { margin: 0 0 4mm 0; padding-left: 6mm; }
li { margin-bottom: 1.5mm; }
code { font-family: 'Inconsolata', monospace; font-size: 8.5pt; background: #F5F5F4; padding: 0 1mm; border-radius: 0.5mm; }
hr { border: none; border-top: 0.3mm solid #E7E5E4; margin: 6mm 0; }
`;

// ---------- HTML 组装 ----------
function htmlTemplate(coverBody, mainBody, footerLabel) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><style>${CSS}</style></head>
<body><div class="cover">${coverBody}</div>${mainBody}</body>
</html>`;
}

/** 组装手稿 HTML；tocPages 为目录页码映射（{{p:key}} → 页码），缺省填 "—" */
function buildHtml(files, tocPages) {
  const coverMd = fs.readFileSync(path.join(MANUSCRIPT, files[0]), 'utf8');
  const coverHtml = marked.parse(coverMd, { gfm: true });
  const mainHtml = files
    .slice(1)
    .map((f) => {
      let md = fs.readFileSync(path.join(MANUSCRIPT, f), 'utf8');
      if (f === '01-toc.md') {
        md = md.replace(/\{\{p:([^}]+)\}\}/g, (_, k) => (tocPages && tocPages[k] != null ? String(tocPages[k]) : '—'));
      }
      return marked.parse(md, { gfm: true });
    })
    .join('\n');
  return htmlTemplate(coverHtml, mainHtml);
}

async function renderPdf(browser, html, out, footerLabel) {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.pdf({
    path: out,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `<div style="width:100%; text-align:center; font-size:7.5pt; color:#A8A29E;">
      ${footerLabel} · 冯海泉 · <span class="pageNumber"></span> / <span class="totalPages"></span>
    </div>`,
    margin: { top: '18mm', bottom: '16mm', left: '15mm', right: '15mm' },
  });
  await page.close();
}

/** Chromium PDF 文本提取会把部分汉字映射为康熙部首码位（⽤≠用），
 *  匹配时每个汉字允许"原字或任意部首码位"，非汉字字符原样转义 */
function fuzzyRegex(needle) {
  const src = [...needle]
    .map((ch) =>
      /[\u4e00-\u9fff]/.test(ch) ? `(?:${ch}|[\\u2E80-\\u2FD5])` : ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    )
    .join('');
  return new RegExp(src);
}

/** 从 pass-1 PDF 反查各章起始页码 */
async function extractTocPages(pdfPath) {
  const parser = new PDFParse({ data: fs.readFileSync(pdfPath) });
  const result = await parser.getText();
  const pages = result.pages; // [{ num, text }]
  // 目录页：锚点搜索跳过它（目录表格行含各章标题会误命中）
  let tocPage = pages.findIndex((p) => fuzzyRegex(TOC_PAGE_NEEDLE).test(p.text)) + 1;
  const tocPages = {};
  const anchors = TOC_ANCHORS.map((a) => ({ ...a, re: fuzzyRegex(a.needle) }));
  for (const a of anchors) {
    const hit = pages.find((p) => p.num > tocPage && a.re.test(p.text));
    if (hit) tocPages[a.key] = hit.num;
  }
  await parser.destroy();
  return { tocPages, numPages: pages.length, tocPage, missing: anchors.filter((a) => !tocPages[a.key]).map((a) => a.key) };
}

async function main() {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const files = PREVIEW ? PREVIEW_FILES : FILES;
  const footerLabel = PREVIEW ? 'AI Agent 工程模式速查手册（试读版）' : 'AI Agent 工程模式速查手册';

  const browser = await chromium.launch();

  if (PREVIEW) {
    // 试读版：目录页码填 "—"（试读版页码与完整版不同，无意义）
    await renderPdf(browser, buildHtml(files, {}), OUT, footerLabel);
  } else {
    // 完整版：两遍渲染
    const pass1 = path.join('/tmp', 'cheatsheet-pass1.pdf');
    await renderPdf(browser, buildHtml(files, {}), pass1, footerLabel);
    const { tocPages, numPages, tocPage, missing } = await extractTocPages(pass1);
    console.log(`pass-1：${numPages} 页，目录在第 ${tocPage} 页，锚点缺失：[${missing.join(', ') || '无'}]`);
    if (missing.length) {
      console.warn('⚠️  有锚点未命中，对应目录行页码显示为 "—"');
    }
    await renderPdf(browser, buildHtml(files, tocPages), OUT, footerLabel);
    fs.unlinkSync(pass1);
  }

  await browser.close();

  // ---------- 程序化验证 + 截图 ----------
  const raw = fs.readFileSync(OUT);
  const parser = new PDFParse({ data: raw });
  const text = await parser.getText();
  const uris = [...new Set([...raw.toString('latin1').matchAll(/\/URI \(([^)]+)\)/g)].map((m) => m[1]))];
  console.log(`✅ PDF 已生成 → ${OUT}（${text.pages.length} 页，${(raw.length / 1024 / 1024).toFixed(2)} MB）`);
  console.log(`   可点击链接注解：${uris.length} 条`);
  for (const u of uris) console.log(`     · ${u}`);

  if (SHOTS) {
    fs.mkdirSync(SHOTS, { recursive: true });
    // 截图页：封面、目录 + 首个FAQ/章页 + 末页
    const shotPages = PREVIEW
      ? [1, 2, text.pages.length]
      : [1, 2, 3, text.pages.length - 1, text.pages.length].filter((n, i, arr) => n >= 1 && n <= text.pages.length && arr.indexOf(n) === i);
    const shots = await parser.getScreenshot({ partial: shotPages, imageDataUrl: false, imageBuffer: true });
    for (let i = 0; i < shotPages.length; i++) {
      const buf = shots.pages[i] && shots.pages[i].buffer;
      if (buf) fs.writeFileSync(path.join(SHOTS, `page-${String(shotPages[i]).padStart(2, '0')}.png`), buf);
    }
    console.log(`   截图 ${shotPages.length} 张 → ${SHOTS}`);
  }

  await parser.destroy();
}

main();

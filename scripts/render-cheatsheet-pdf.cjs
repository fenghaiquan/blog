#!/usr/bin/env node
/**
 * render-cheatsheet-pdf.cjs — 将速查手册手稿渲染为 PDF
 *
 * 手稿（markdown）→ marked 转 HTML → 自定义 CSS → Playwright Chromium 打印为 A4 PDF。
 * 依赖：marked、playwright（项目已有）+ 系统字体 Noto Sans CJK SC。
 *
 * 用法：node scripts/render-cheatsheet-pdf.cjs [--out=public/downloads/xxx.pdf]
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { chromium } = require('playwright');

const MANUSCRIPT =
  '/mnt/d/Documents/Obsidian/LLMBrain/5_Output/Product/product-cheatsheet/manuscript';
const DEFAULT_OUT =
  'public/downloads/agent-patterns-cheatsheet-v1.0-6e0395.pdf'; // 后缀 = 不可猜测交付路径，改动时同步 src/consts.ts

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)=(.*)$/);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ''), true];
  })
);
const OUT = path.resolve(args.out || DEFAULT_OUT);

// ---------- 手稿清单（按渲染顺序） ----------
const FILES = [
  '00-cover.md', // 封面页（单独样式）
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

// ---------- 样式 ----------
const CSS = `
@page { size: A4; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; }
body {
  font-family: 'Noto Sans CJK SC', 'Noto Sans SC', sans-serif;
  font-size: 9.5pt; line-height: 1.65; color: #1C1917; margin: 0;
}
/* ---------- 封面 ---------- */
.cover {
  height: 267mm; /* A4 高 297 - 上下留白，撑满一页 */
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

// ---------- HTML 模板 ----------
function htmlTemplate(coverBody, mainBody) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><style>${CSS}</style></head>
<body><div class="cover">${coverBody}</div>${mainBody}</body>
</html>`;
}

async function main() {
  // 转换各章节
  const coverMd = fs.readFileSync(path.join(MANUSCRIPT, FILES[0]), 'utf8');
  const coverHtml = marked.parse(coverMd, { gfm: true });
  const mainHtml = FILES.slice(1)
    .map((f) => fs.readFileSync(path.join(MANUSCRIPT, f), 'utf8'))
    .map((md) => marked.parse(md, { gfm: true }))
    .join('\n');

  fs.mkdirSync(path.dirname(OUT), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(htmlTemplate(coverHtml, mainHtml), { waitUntil: 'load' });
  await page.pdf({
    path: OUT,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `<div style="width:100%; text-align:center; font-size:7.5pt; color:#A8A29E;">
      AI Agent 工程模式速查手册 · 冯海泉 · <span class="pageNumber"></span> / <span class="totalPages"></span>
    </div>`,
    margin: { top: '18mm', bottom: '16mm', left: '15mm', right: '15mm' },
  });
  await browser.close();

  const size = (fs.statSync(OUT).size / 1024 / 1024).toFixed(2);
  console.log(`✅ PDF 已生成 → ${OUT}（${size} MB）`);
}

main();

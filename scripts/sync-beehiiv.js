#!/usr/bin/env node

/**
 * Beehiiv 脚本同步脚本
 *
 * 用途：从 Beehiiv CDN 下载最新版本的 loader.js 和 attribution.js，
 *       并自动修改为适配本地代理的配置。
 *
 * 执行：pnpm sync:beehiiv
 *
 * === 架构说明 ===
 *
 * 代理方式：Vercel Rewrite（vercel.json）
 *   - /api/beehiiv/:path* → https://subscribe-forms.beehiiv.com/:path*
 *   - 在 CDN 边缘层完成转发，无需 server adapter 或 serverless function
 *   - 本地开发时 Astro dev server 不处理 /api/beehiiv/ 请求，
 *     需通过 Vercel Preview/Production 环境验证代理功能
 *
 * 脚本加载：自托管（public/js/）
 *   - loader.js → /js/loader.js（避免广告拦截器拦截 CDN 域名）
 *   - attribution.js → /js/attribution.js
 *
 * === 关键修改点（Agent 维护时注意） ===
 *
 * loader.js 修改：
 *   1. 第 21-22 行：API_BASE 和 BEEHIIV_ORIGIN 常量
 *      - API_BASE 必须为 '/api/beehiiv'（相对路径，走 Vercel rewrite 代理）
 *      - BEEHIIV_ORIGIN 必须为 'https://subscribe-forms.beehiiv.com'（iframe origin 校验）
 *   2. 第 452 行附近：iframe postMessage origin 校验
 *      - 必须使用 BEEHIIV_ORIGIN（不是 API_BASE）
 *      - 因为 iframe 内容直接从 subscribe-forms.beehiiv.com 加载
 *
 * attribution.js 修改：
 *   - 无需修改。childOrigin / childStagingOrigin 仅用于 postMessage 校验，保持原值即可。
 *
 * === 相关文件清单 ===
 *
 * - vercel.json：rewrite 规则配置
 * - public/js/loader.js：自托管的主脚本（需 patch）
 * - public/js/attribution.js：自托管的归因脚本（无需 patch）
 * - src/components/NewsletterEmbed.astro：嵌入组件，引用 /js/loader.js
 * - src/layouts/BlogPost.astro：引用 /js/attribution.js
 * - .env：BEEHIIV_FORM_ID 环境变量
 *
 * === Beehiiv CDN 端点清单 ===
 *
 * 自托管（public/js/）：
 *   - GET /v3/loader.js
 *   - GET /attribution.js
 *
 * Vercel rewrite 代理（/api/beehiiv/）：
 *   - GET  /api/v3/forms/:id          → 表单配置 JSON
 *   - POST /api/v3/publications/:id/subscriptions → 订阅提交（iframe 内直接请求，不经过代理）
 *
 * 直接加载（iframe src，无需代理）：
 *   - GET /embed/:id                  → iframe 嵌入页
 *   - GET /static/*                   → iframe 内静态资源
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const JS_DIR = path.join(ROOT, 'public', 'js');
const LOADER_URL = 'https://subscribe-forms.beehiiv.com/v3/loader.js';
const ATTRIBUTION_URL = 'https://subscribe-forms.beehiiv.com/attribution.js';

const API_BASE_LINE = "  var API_BASE = '/api/beehiiv';";
const ORIGIN_LINE = "  var BEEHIIV_ORIGIN = 'https://subscribe-forms.beehiiv.com';";

async function download(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

function patchLoader(content) {
  // 替换 API_BASE 声明（匹配原始动态获取或已修改的静态值）
  const apiBaseRegex = /var API_BASE\s*=\s*(?:\(function[\s\S]*?\)\(\)|'[^']*'|"[^"]*");/;
  let patched = content.replace(apiBaseRegex, `${API_BASE_LINE}\n${ORIGIN_LINE}`);

  // 确保 origin 校验使用 BEEHIIV_ORIGIN
  patched = patched.replace(
    /if\s*\(\s*e\.origin\s*!==\s*API_BASE\s*\)/g,
    'if (e.origin !== BEEHIIV_ORIGIN)'
  );

  return patched;
}

async function sync() {
  fs.mkdirSync(JS_DIR, { recursive: true });

  console.log('[beehiiv-sync] Downloading loader.js...');
  const loaderRaw = await download(LOADER_URL);
  const loaderPatched = patchLoader(loaderRaw);
  const loaderPath = path.join(JS_DIR, 'loader.js');
  fs.writeFileSync(loaderPath, loaderPatched, 'utf-8');
  console.log(`  ✓ ${loaderPath}`);

  console.log('[beehiiv-sync] Downloading attribution.js...');
  const attrRaw = await download(ATTRIBUTION_URL);
  const attrPath = path.join(JS_DIR, 'attribution.js');
  fs.writeFileSync(attrPath, attrRaw, 'utf-8');
  console.log(`  ✓ ${attrPath}`);

  // 验证关键行
  const loaderContent = fs.readFileSync(loaderPath, 'utf-8');
  const checks = [
    { name: 'API_BASE', found: loaderContent.includes("var API_BASE = '/api/beehiiv'") },
    { name: 'BEEHIIV_ORIGIN', found: loaderContent.includes("var BEEHIIV_ORIGIN = 'https://subscribe-forms.beehiiv.com'") },
    { name: 'origin check', found: loaderContent.includes('e.origin !== BEEHIIV_ORIGIN') },
  ];

  console.log('\n[beehiiv-sync] Verification:');
  for (const c of checks) {
    console.log(`  ${c.found ? '✓' : '✗'} ${c.name}`);
  }

  const allPassed = checks.every(c => c.found);
  if (!allPassed) {
    console.error('\n[beehiiv-sync] ⚠ Some patches failed. Manual review required.');
    process.exit(1);
  }

  console.log('\n[beehiiv-sync] Done. Scripts synced and patched successfully.');
}

sync().catch(err => {
  console.error('[beehiiv-sync] Error:', err.message);
  process.exit(1);
});

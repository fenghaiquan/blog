# ADR-006: /success 付款验签下载门

## 状态：已采纳
## 日期：2026-10-15
## 背景

ADR-005 记录的残余风险被实际触发：`/success` 为静态页，任何人直接输入 URL 即可看到下载按钮拿到付费 PDF 直链——付费形同虚设。

Creem 支付成功跳转自带签名参数（`docs.creem.io` verify 页）：
`/success?checkout_id=...&order_id=...&customer_id=...&product_id=...&signature=...`

签名算法：按 URL 中参数出现顺序取 `key=value`（跳过空值），末尾拼 `salt={CREEM_API_KEY}`，竖线连接后 SHA-256 hex。**API key 仅存服务端环境变量，签名可本地验证，无需数据库或 webhook。**

## 候选方案

| 方案 | 做法 | 不采纳原因 |
|------|------|-----------|
| 接受（ADR-005 原案） | 静态页 + 不可猜测后缀 | 已被实测击穿：/success 无门槛泄直链 |
| Creem API 查询 checkout 状态 | 服务端调 API 核验 | 需网络调用与错误处理；签名本地验证零依赖，足够 |
| Webhook + 数据库发访问权 | 记录订单签发 token | 需数据库基建；v1 无必要 |
| **验签门（采纳）** | /success 服务端验签后渲染下载按钮 | —— |

## 决策

1. 引入 `@astrojs/vercel` adapter；站点保持默认 static output，**仅 `/success` 设 `export const prerender = false`** 服务端渲染，其余页面全部静态预渲染（不影响现有性能与 OG 管线）
2. `/success` frontmatter 验签：SHA-256 + `crypto.timingSafeEqual` 常量时间比较 + `product_id` 必须匹配 `CREEM_PRODUCT_ID`（防其他产品/伪造 checkout 的合法签名）
3. 验证通过 → 渲染下载按钮（PDF 直链只出现在已付款用户的服务端渲染 HTML 中）；未通过 → "无法验证付款"卡（无任何下载线索）+ 支持邮箱兜底
4. `CREEM_API_KEY` 存 `.env`（本地）与 Vercel 环境变量（生产），绝不入库

## 残余风险（仍显式接受）

- **买家分享付款跳转 URL**（含合法签名参数）→ 他人可经该 URL 下载。无状态验签的固有代价；缓解：URL 冗长难记、分享行为可追溯（checkout_id 关联买家），且每收费版本轮换 PDF 后缀可批量作废
- **PDF 静态直链本身**仍可被拿到直链的人传播——ADR-005 的后缀轮换策略继续作为纵深防御
- 彻底解法（v3 路径）：webhook + 一次性短时效签名 URL + 逐买家水印

## 后果

- 好处：未付款者从 /success 拿不到任何下载线索（此前完全暴露）；无需数据库/Redis/API 调用
- 代价：站点从纯 SSG 变为 SSR 混合（1 个 serverless 函数）；`CREEM_API_KEY` 缺失时验签必然失败（部署前置条件）；本地开发需 `.env` 配 key
- 部署顺序铁律：**先 `vercel env add CREEM_API_KEY`，再 `vercel deploy`**，否则 /success 永远显示"无法验证付款"

## 相关代码

- `astro.config.mjs`（adapter: vercel()）
- `src/pages/success.astro`（prerender=false + 验签）
- `src/consts.ts`（`CREEM_PRODUCT_ID`）
- `.env` / Vercel 环境变量（`CREEM_API_KEY`）
- 上游文档：docs.creem.io verify（跳转签名算法）

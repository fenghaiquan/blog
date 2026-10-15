# ADR-005: 付费数字产物脱离 git 仓库交付

## 状态：已采纳
## 日期：2026-10-15
## 背景

博客仓库在 GitHub 公开（github.com/fenghaiquan/blog），付费 PDF（《AI Agent 工程模式速查手册》$5）曾直接提交进 `public/downloads/`。发现三条泄漏链：

1. **仓库历史泄漏（致命）**：文件名含"不可猜测随机后缀"，但对仓库浏览者完全失效——文件名就在目录列表里；且文件已进 git 历史（v1.0 的 26/31 页版两个 commit），即使从 HEAD 删除，历史 commit 仍可 raw 下载
2. **`/success` 静态页直链**：下载 URL 写死在公开 HTML 中，任何人无需付费即可获取
3. **内容本体开源**：素材源自 Apache-2.0 开源项目，付费点是中文编辑/证据等级/导航，不可能绝对防复制

部署事实：Vercel 使用 CLI 手动部署（无 Git 自动集成）；Vercel CLI 部署上传本地文件清单，`.vercelignore` 存在时整体取代 `.gitignore` 的部署过滤。

## 候选方案

| 方案 | 做法 | 不采纳原因 |
|------|------|-----------|
| A. 仓库转 private | GitHub 一键 | 失去开源展示；杀鸡用牛刀 |
| **B. 产物脱离 git**（采纳） | 换新随机后缀 + gitignore + `.vercelignore` 技巧 | —— |
| C. 签名 URL / 逐买家水印基建 | Creem webhook → API → Vercel Blob 短时效链接 | 需 serverless 路由，v1 阶段过重；列为 v2 升级路径 |
| B2. git filter-repo 重写历史 | 抹掉历史 commit 中的 PDF + force push | 改写全部 commit 哈希；v1.0 首发内容价值低，不值得（采纳 B1：接受 v1.0 两版留在历史≈首发白送） |

## 决策

**B + B1**：付费产物脱离 git，接受 v1.0 历史泄漏，v1.1 起闭环。

机制三件套：

1. **付费文件 gitignore**（`.gitignore`）：`public/downloads/<slug>-<version>-<random6>.pdf`——随机后缀继续防猜（保护 `/success` 直链被口头传播的场景），gitignore 防仓库泄漏
2. **`.vercelignore` 存在且不列付费 PDF**：取代 `.gitignore` 成为部署过滤器 → CLI 部署仍把本地付费 PDF 上传上线。**铁律：付费 PDF 必须不出现在 `.vercelignore`，且 `src/content/blog/*.md` 等源文件不得被误排除（云端构建依赖）**
3. **文件名随每次收费版本轮换随机后缀**：旧 URL 作废 404；产物 100% 可由 vault 手稿 + `scripts/render-cheatsheet-pdf.cjs` 重渲染，脱离 git 无耐久性损失

## 新付费产品发布复用清单

1. 手稿就绪后渲染：`openssl rand -hex 3` 生成新后缀 → `node scripts/render-cheatsheet-pdf.cjs --out=public/downloads/<slug>-<version>-<suffix>.pdf`
2. `.gitignore` 确认模式覆盖该文件名（新增品类则加模式）；试读版/免费钩子**不**加保护，继续入库
3. `src/consts.ts` 更新 `PRODUCT_DOWNLOAD_URL`（文件名与渲染脚本 `DEFAULT_OUT` 三处同步）
4. 旧付费文件 `git rm --cached` + 本地删除（旧 URL 线上 404 即为轮换生效）
5. 提交推送（确认 `git status` 中**没有**付费 PDF）
6. `npx vercel deploy --prod --yes`（付费 PDF 只经此通道上线）
7. 三重验证：新 URL 200 / 旧 URL 404 / GitHub 仓库与 raw HEAD 404；`/product` 试读链路与购买按钮指向新 URL

## 残余风险（显式接受）

- **`/success` 静态直链**：任何买家可分享直链（随机后缀只防"猜"不防"传"）。静态站 $5 产品的行业常态是接受；价值主张 = 便利 + 小版本免费更新 + 支持作者
- **git 历史中的 v1.0（26/31 页版）**：永久可下，视为首发白送+收集反馈
- **v2 升级路径**：Creem webhook → serverless API → Vercel Blob 短时效签名 URL（或逐买家水印），同时断掉成功页直链泄漏

## 理由

Vercel CLI 本地部署 + 可重渲染管线，使"git 里没有、线上有"零成本成立；随机后缀轮换让每次收费版本更新天然作废旧链。方案 C 留作收入验证后的升级路径，符合"快速打通流程优先"原则。

## 后果

- 好处：GitHub 完全看不到付费产物；克隆仓库无法获得付费文件；发布流程可脚本化复用
- 代价：付费 PDF 只存在于本地 + Vercel（vault 手稿可重生）；换机器/清缓存需先重渲染再部署；`git clone` 后直接部署会漏 PDF（必须本机管线）

## 相关代码

- `.gitignore`（付费 PDF 模式）
- `.vercelignore`（部署排除清单，取代 gitignore）
- `scripts/render-cheatsheet-pdf.cjs`（`DEFAULT_OUT` + `--out`）
- `src/consts.ts`（`PRODUCT_DOWNLOAD_URL` / `PRODUCT_PREVIEW_URL`）
- `src/pages/product.astro`、`src/pages/success.astro`

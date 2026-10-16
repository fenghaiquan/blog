# ADR-007: 双轨收款——面包多国内轨 + 兑换码零存储验码

## 状态：已采纳
## 日期：2026-10-16
## 背景

国内无代理买家在 Creem 轨被两层独立障碍卡死：
1. **网络层**：`creem.io` 国内直连解析失败/超时（Creem 嵌入弹窗的 iframe 底层仍加载 creem.io，无法绕过）
2. **支付手段层**：Creem 收银台仅支持国际信用卡/VCC，国内买家普遍没有外币卡

结论：国内轨必须引入第二收款通道（双轨制），且要求下载仍走本站下载门（与 Creem 轨的 `/success` 门一致）。

## 候选方案

| 方案 | 结论 |
|------|------|
| Creem 嵌入弹窗 | iframe 仍加载 creem.io，不解决网络层，排除 |
| 虎皮椒/PayJS 类个人聚合支付自建 | 需 KV/webhook 基建 + 个人码收款通道稳定性差，量大再升级 |
| 人工转账兜底 | 极低量可用，不自动化 |
| **面包多 + 自动回复递减消息兑换码（采纳）** | 平台原生支持逐买家唯一码发放，零存储验码 |

## 面包多关键能力（研究结论）

- **「自动回复·递减消息」**：官方文档明确支持"为每个购买者提供不同的兑换码"——触发「购买某个作品」→ 从回复库逐条发放且不重复
- **「PDF授权戳」**：平台可为每买家生成"授权给XX"水印版 PDF（记为备选升级路径，仅当走平台托管交付时可用）
- 费率：**闪电结算 5.7%**（实时/次日自动到账，钱不经平台账户；普通模式 6% + 7 天账期）——注册后开通闪电结算
- 买家微信/支付宝扫码免登录购买，全程国内可达网络

## 决策

1. **国内轨 = 面包多**（微信/支付宝，¥35.9——$5 按发布日汇率对齐取整到 .9，调价时双平台同步）
2. **交付走本站 `/redeem` 门**：买家付款 → 平台私信发唯一下载码 → `/redeem`（SSR，`prerender = false`）验码 → 渲染下载按钮
3. **兑换码零存储设计**：码 = Crockford base32(`HMAC-SHA256(REDEEM_SECRET, "{batch}-{n}")`) 前 20 位，格式 `XXXXX-XXXXX-XXXXX-XXXXX`
   - 生成：`scripts/gen-redeem-codes.mjs` → `redeem-codes-{batch}.txt`（上传面包多回复库用消息为 `redeem-messages-{batch}.txt`，**均已 .gitignore，绝不入库**）
   - 验证：服务端只需 `REDEEM_SECRET` 重算 ≤200 个候选常量时间比对——**无数据库/KV/清单**
   - 输入容错：去连字符、大小写不敏感、按 Crockford 规则纠 0/O、1/I(L)、U/V 易混字符
   - 轮换：换 `REDEEM_SECRET` 即作废全批（紧急刹车）；码批耗尽 → 新 batch + count 调整
4. `REDEEM_SECRET` 存 `.env`（本地）与 Vercel 环境变量（生产），与 `CREEM_API_KEY` 同管理流程
5. `/product` 双轨按钮（国内微信/支付宝 + 海外信用卡并排，不做浏览器语言自动检测）；`/redeem`、`/success` 均 noindex

## 残余风险（显式接受）

- **下载码是 bearer 凭证**，买家可分享（与 Creem 签名轨的残余风险同级）；缓解：码可追溯到面包多订单私信、轮换 SECRET 批量作废、每收费版本轮换 PDF 后缀
- 双轨价差随汇率漂移 ±5% 内（无套利意义），调价时人工对齐
- 闪电结算费率或政策变动风险（平台侧，无法控制）
- 对比备选「PDF授权戳」平台托管交付：本方案无逐买家水印，泄漏不可溯源到具体买家——接受

## 后果

- 好处：国内无代理买家全流程可达（面包多 + 本站）；零新增基础设施；两轨交付体验统一（都从本站拿货）
- 代价：面包多费率 5.7%；兑换码批管理（生成/上传/耗尽补充）成为发布流程一部分；200 码批需手工录入平台回复库
- 发布复用清单新增步骤：生成新码批 → 上传回复库 → 确认回填 `CN_CHECKOUT_URL`（首个码批商品链接）

## 相关代码

- `src/utils/redeem.js`（生成/验证单一真源）
- `scripts/gen-redeem-codes.mjs`（码批生成）
- `src/pages/redeem.astro`（SSR 验码门）
- `src/pages/product.astro`（双轨按钮）+ `src/styles/product.css`
- `src/consts.ts`（`CN_CHECKOUT_URL`、`CN_PRICE`、`REDEEM_BATCH`、`REDEEM_COUNT`）
- `src/layouts/BaseLayout.astro`（`noindex` prop）
- `.gitignore`（`redeem-codes-*.txt`、`redeem-messages-*.txt`）
- `.env` / Vercel 环境变量（`REDEEM_SECRET`）
- 平台侧：面包多「我的-设置-自动回复」（递减消息回复库）

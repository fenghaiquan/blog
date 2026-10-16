// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = "Foong's Blog";
export const SITE_DESCRIPTION = 'Welcome to my website!';

// Creem 收款审查要求：品牌化支持邮箱，须全站可见且与 Business Details 一致
export const SUPPORT_EMAIL = 'support@fenghaiquan-ai.com';

// 付费产品（一次性购买 PDF）：《AI Agent 工程模式速查手册》
export const PRODUCT_NAME = '《AI Agent 工程模式速查手册》';
// 不可猜测后缀作为 v1 交付保护（公开目录直链的最简防护）
export const PRODUCT_DOWNLOAD_URL = '/downloads/agent-patterns-cheatsheet-v1.1-ba43bf.pdf';
// 免费试读版（公开可精文件名，用于转化引导）
export const PRODUCT_PREVIEW_URL = '/downloads/agent-patterns-cheatsheet-preview.pdf';
// TODO(Creem live): 在 Creem Live 模式创建产品后，把 Checkout Link 填到这里
export const CREEM_CHECKOUT_URL = 'https://www.creem.io/payment/prod_69Y7fTqk4XVygYv1oLdgvC';
// Creem 产品 ID（/success 验签时校验 product_id 一致）
export const CREEM_PRODUCT_ID = 'prod_69Y7fTqk4XVygYv1oLdgvC';

// 双轨收款（ADR-007）：国内轨面包多（微信/支付宝），商品链接注册后回填；为空时按钮显示「即将开放」
export const CN_CHECKOUT_URL = '';
export const CN_PRICE = '¥35.9'; // $5 按发布日汇率对齐取整到 .9（ADR-007）

// 面包多兑换码批参数（生成/验证零存储 HMAC 设计，ADR-007）
export const REDEEM_BATCH = 'b1';
export const REDEEM_COUNT = 200;
export const PRODUCT_PRICE = '$5';

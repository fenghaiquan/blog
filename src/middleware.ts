// [ADR-001] 使用 locals 注入 feature flags 而非路由拦截
// 机制不变；为通过 Creem 收款账户审查（要求产品页/法律页生产可见），
// 所有 flag 已在生产环境开放。如需重新收紧某页面，将对应 flag 改回 !isProd 判断即可。
// 详见：docs/decisions/001-use-middleware-locals-for-feature-flags.md
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
	// 新增页面时，在此处添加对应的 feature flag
	context.locals.featureFlags = {
		showHome: true,
		showAbout: true,
		showSubscribe: true,
		showCooperate: true,
	};

	return next();
});

// [ADR-001] 使用 locals 注入 feature flags 而非路由拦截
// 原因：静态页面中间件 redirect 仅在构建时生效，locals 方案对 SSR 和 SSG 均有效
// 详见：docs/decisions/001-use-middleware-locals-for-feature-flags.md
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
	const isProd = import.meta.env.PROD;

	// 新增页面时，在此处添加对应的 feature flag
	context.locals.featureFlags = {
		showHome: !isProd,
		showAbout: !isProd,
		showSubscribe: !isProd,
		showCooperate: !isProd,
	};

	return next();
});

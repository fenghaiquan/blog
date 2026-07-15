import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
	const isProd = import.meta.env.PROD;

	context.locals.featureFlags = {
		showHome: !isProd,
		showAbout: !isProd,
		showSubscribe: !isProd,
		showCooperate: !isProd,
	};

	return next();
});

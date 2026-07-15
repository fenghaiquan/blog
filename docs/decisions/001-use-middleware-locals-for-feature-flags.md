# ADR-001: 使用 Middleware Locals 注入 Feature Flags 进行环境管理

## 状态：已采纳

## 日期
2026-07-15

## 背景
项目需要在开发环境展示所有页面（Home、About、Subscribe、Cooperate），但在生产环境仅展示 `/blog` 页面。需要一种机制来控制不同环境下页面的可见性。

## 候选方案

### 方案 A：中间件路由拦截（redirect/rewrite）
在中间件中根据 `import.meta.env.PROD` 拦截特定路由并 redirect。

**问题：** Astro 预渲染页面（默认行为）的中间件仅在构建时执行一次，redirect 结果被烘焙进静态 HTML，无法在运行时动态控制。

### 方案 B：直接使用 `import.meta.env.PROD`（方案已废弃）
在每个页面组件中直接读取环境变量决定渲染内容。

**问题：** 环境判断逻辑分散在各处，后续迁移到运行时 feature flag 服务需要改动所有消费点。

### 方案 C：中间件 `locals` 注入（✅ 采纳）
中间件将 feature flags 注入 `Astro.locals`，组件/布局通过 `locals` 读取开关。

## 决策
采用方案 C。

## 理由
- 静态页面和 SSR 页面均生效（中间件在构建时执行，locals 已被注入）
- 不需要 redirect，避免路由陷阱
- 细粒度控制——同一页面可部分显示、部分隐藏
- 环境逻辑收敛在中间件一处，消费点只读 locals
- 后续迁移到运行时 feature flag 服务只需改中间件，组件不动

## 后果
- 新增页面需要在 middleware.ts 和 env.d.ts 中注册对应的 flag
- 页面通过 BaseLayout 的 `redirectKey` prop 自动处理 redirect 逻辑

## 相关代码
- `src/middleware.ts`
- `src/env.d.ts`
- `src/layouts/BaseLayout.astro`
- `src/components/Header.astro`

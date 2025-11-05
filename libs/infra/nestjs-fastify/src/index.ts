/**
 * @fileoverview NestJS Fastify 模块导出
 *
 * @description
 * 统一导出所有 Fastify 企业基础设施模块
 */

// 速率限制
export * from "./security/rate-limit/index.js";

// 安全头
export * from "./security/helmet/index.js";

// CORS
export * from "./security/cors/index.js";

// 压缩
export * from "./performance/compression/index.js";

// Metrics
export * from "./performance/metrics/index.js";

// 日志（已有）
export * from "./logging/index.js";

// Fastify 适配器（已有）
export * from "./fastify/index.js";

// 配置（已有）
export * from "./config/index.js";

// 请求 ID 工具
export * from "./plugins/request-id.plugin.js";
export * from "./utils/request-id.generator.js";

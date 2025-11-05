/**
 * Fastify 配置
 *
 * @description 企业级 Fastify 适配器的配置定义
 *
 * @since 0.2.0
 */

import type { EnterpriseFastifyAdapterOptions } from "../fastify/enterprise-fastify.adapter.js";
import { createFastifyLoggerConfig } from "../logging/pino-config.factory.js";

/**
 * 默认 Fastify 配置
 *
 * @description 提供生产环境就绪的默认配置
 */
export const DEFAULT_FASTIFY_CONFIG: EnterpriseFastifyAdapterOptions = {
  fastifyOptions: {
    logger: true,
    trustProxy: true,
    bodyLimit: 1048576, // 1MB
    connectionTimeout: 30000, // 30秒
    keepAliveTimeout: 5000, // 5秒
  },
  enableCors: true,
  corsOptions: {
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id"],
    maxAge: 86400, // 24小时
  },
  enableSecurity: true,
  securityOptions: {
    enableHelmet: true,
    enableCsrf: false, // API 通常不需要 CSRF
    enableXssFilter: true,
  },
  enablePerformanceMonitoring: true,
  enableHealthCheck: true,
  healthCheckPath: "/health",
  enableRateLimit: false, // 默认禁用，按需启用
  enableCircuitBreaker: false, // 默认禁用，按需启用
};

/**
 * 开发环境配置
 */
export const DEV_FASTIFY_CONFIG: EnterpriseFastifyAdapterOptions = {
  ...DEFAULT_FASTIFY_CONFIG,
  fastifyOptions: {
    ...DEFAULT_FASTIFY_CONFIG.fastifyOptions,
    logger: createFastifyLoggerConfig({
      level: "debug",
      prettyPrint: true,
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    }),
  },
};

/**
 * 生产环境配置
 */
export const PROD_FASTIFY_CONFIG: EnterpriseFastifyAdapterOptions = {
  ...DEFAULT_FASTIFY_CONFIG,
  fastifyOptions: {
    ...DEFAULT_FASTIFY_CONFIG.fastifyOptions,
    logger: createFastifyLoggerConfig({
      level: "info",
    }),
  },
  enableRateLimit: true,
  rateLimitOptions: {
    timeWindow: 60000, // 1分钟
    max: 100,
  },
  enableCircuitBreaker: true,
  circuitBreakerOptions: {
    threshold: 5,
    timeout: 3000,
    resetTimeout: 60000,
  },
};

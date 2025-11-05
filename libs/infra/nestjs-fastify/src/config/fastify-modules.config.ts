/**
 * @fileoverview Fastify 模块统一配置
 *
 * @description
 * 集中管理所有 Fastify 增强模块的配置
 */

import { Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import type { CompressionOptions } from "../performance/compression/types/compression-options.js";
import type { MetricsOptions } from "../performance/metrics/types/metrics-options.js";
import type { CorsOptions } from "../security/cors/types/cors-options.js";
import type { HelmetOptions } from "../security/helmet/types/helmet-options.js";
import type { RateLimitOptions } from "../security/rate-limit/types/rate-limit-options.js";

/**
 * 速率限制配置
 */
export class RateLimitModuleConfig implements Partial<RateLimitOptions> {
  /**
   * 时间窗口内最大请求数
   */
  @IsInt({ message: "max 必须是整数" })
  @Min(1, { message: "max 必须大于 0" })
  max!: number;

  /**
   * 时间窗口（毫秒）
   */
  @IsInt({ message: "timeWindow 必须是整数" })
  @Min(1000, { message: "timeWindow 必须至少 1000 毫秒" })
  timeWindow!: number;

  /**
   * 限流策略
   */
  @IsOptional()
  @IsString()
  strategy?: "ip" | "custom" = "ip";

  /**
   * Redis 错误时是否跳过限流
   */
  @IsOptional()
  @IsBoolean()
  skipOnError?: boolean = true;

  /**
   * 自定义错误消息
   */
  @IsOptional()
  @IsString()
  errorMessage?: string = "请求过于频繁，请稍后再试";

  /**
   * 是否添加响应头
   */
  @IsOptional()
  @IsBoolean()
  addHeaders?: boolean = true;
}

/**
 * Metrics 配置
 */
export class MetricsModuleConfig implements MetricsOptions {
  /**
   * 默认标签
   */
  @IsOptional()
  defaultLabels?: Record<string, string> = {
    app: "hl8-saas",
  };

  /**
   * Metrics 端点路径
   */
  @IsOptional()
  @IsString()
  path?: string = "/metrics";

  /**
   * 是否启用默认指标
   */
  @IsOptional()
  @IsBoolean()
  enableDefaultMetrics?: boolean = true;
}

/**
 * Fastify 模块统一配置
 *
 * @description
 * 管理所有 Fastify 增强模块的配置
 *
 * @example
 * ```typescript
 * const config = new FastifyModulesConfig();
 * config.rateLimit = {
 *   max: 1000,
 *   timeWindow: 60000,
 *   strategy: 'ip',
 * };
 *
 * const errors = await validate(config);
 * ```
 */
export class FastifyModulesConfig {
  /**
   * 速率限制配置
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => RateLimitModuleConfig)
  rateLimit?: RateLimitModuleConfig;

  /**
   * Helmet 安全头配置
   */
  @IsOptional()
  helmet?: HelmetOptions;

  /**
   * CORS 配置
   */
  @IsOptional()
  cors?: CorsOptions;

  /**
   * 压缩配置
   */
  @IsOptional()
  compression?: CompressionOptions;

  /**
   * Metrics 配置
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => MetricsModuleConfig)
  metrics?: MetricsModuleConfig;
}

/**
 * 默认配置
 */
export const DEFAULT_FASTIFY_MODULES_CONFIG: FastifyModulesConfig = {
  rateLimit: {
    max: 1000,
    timeWindow: 60000,
    strategy: "ip",
    skipOnError: true,
    errorMessage: "请求过于频繁，请稍后再试",
    addHeaders: true,
  },
  helmet: undefined, // 使用 Helmet 的默认配置
  cors: {
    origin: true,
    credentials: true,
  },
  compression: {
    global: true,
    threshold: 1024,
    encodings: ["br", "gzip", "deflate"],
  },
  metrics: {
    defaultLabels: {
      app: "hl8-saas",
    },
    path: "/metrics",
    enableDefaultMetrics: true,
  },
};

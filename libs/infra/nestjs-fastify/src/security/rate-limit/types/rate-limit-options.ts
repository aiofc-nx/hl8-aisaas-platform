/**
 * @fileoverview 速率限制配置类型
 *
 * @description
 * 定义速率限制模块的配置接口和类型，支持多种限流策略：
 * - IP 级别限流
 * - 自定义键生成
 *
 * @module security/rate-limit/types
 */

import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";
import type { FastifyRequest } from "fastify";
import type { Redis } from "ioredis";

/**
 * 速率限制策略类型
 *
 * @description
 * 定义速率限制的应用层级：
 * - `ip`: 基于客户端 IP 地址限流
 * - `custom`: 自定义键生成函数
 */
export type RateLimitStrategy = "ip" | "custom";

/**
 * 键生成函数类型
 *
 * @description
 * 自定义键生成函数，用于创建限流键
 *
 * @param req - Fastify 请求对象
 * @returns 限流键字符串
 *
 * @example
 * ```typescript
 * const keyGenerator: KeyGenerator = (req) => {
 *   const apiKey = req.headers['x-api-key'];
 *   return `${apiKey}:${req.routerPath}`;
 * };
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Fastify request 扩展属性动态，宪章 IX 允许（第三方集成）
export type KeyGenerator = (req: FastifyRequest<any>) => string;

/**
 * 速率限制选项接口
 *
 * @description
 * 配置速率限制的核心参数
 *
 * ## 业务规则
 *
 * ### 限流窗口规则
 * - 使用滑动窗口算法
 * - 时间窗口单位为毫秒
 * - 窗口过期后自动重置计数
 *
 * ### 错误处理规则
 * - skipOnError 为 true 时，Redis 错误不阻塞请求
 * - skipOnError 为 false 时，Redis 错误返回 500
 *
 * ### Redis 存储规则
 * - 如果提供 redis 客户端，使用分布式存储
 * - 如果未提供，使用内存存储（单实例）
 * - Redis 键格式: `ratelimit:{strategy}:{key}`
 * - TTL 设置为 timeWindow 的 2 倍
 *
 * @example
 * ```typescript
 * const options: RateLimitOptions = {
 *   max: 100,
 *   timeWindow: 60000,  // 1 分钟
 *   strategy: 'ip',
 *   redis: redisClient,
 * };
 * ```
 */
export interface RateLimitOptions {
  /**
   * 时间窗口内最大请求数
   *
   * @remarks
   * - 必须 > 0
   * - 建议根据业务类型设置：
   *   - 读操作: 100-1000 / 分钟
   *   - 写操作: 10-100 / 分钟
   *   - 敏感操作: 1-10 / 分钟
   */
  max: number;

  /**
   * 时间窗口（毫秒）
   *
   * @remarks
   * - 必须 > 0
   * - 常用值:
   *   - 1000 (1秒)
   *   - 60000 (1分钟)
   *   - 3600000 (1小时)
   */
  timeWindow: number;

  /**
   * 限流策略
   *
   * @remarks
   * - `ip`: 基于客户端 IP（默认）
   * - `custom`: 使用 keyGenerator
   *
   * @default 'ip'
   */
  strategy?: RateLimitStrategy;

  /**
   * 自定义键生成函数
   *
   * @remarks
   * 仅当 strategy 为 'custom' 时生效
   */
  keyGenerator?: KeyGenerator;

  /**
   * Redis 客户端（可选）
   *
   * @remarks
   * - 提供则使用分布式存储
   * - 不提供则使用内存存储
   */
  redis?: Redis;

  /**
   * Redis 错误时是否跳过限流
   *
   * @remarks
   * - true: Redis 错误不阻塞请求（降级策略）
   * - false: Redis 错误返回 500
   *
   * @default true
   */
  skipOnError?: boolean;

  /**
   * 自定义错误消息
   *
   * @default '请求过于频繁，请稍后再试'
   */
  errorMessage?: string;

  /**
   * 响应头中是否包含限流信息
   *
   * @remarks
   * - true: 添加 X-RateLimit-* 响应头
   * - false: 不添加
   *
   * @default true
   */
  addHeaders?: boolean;
}

/**
 * 速率限制配置类
 *
 * @description
 * 使用 class-validator 验证配置参数
 *
 * @example
 * ```typescript
 * const config = new RateLimitConfig();
 * config.max = 100;
 * config.timeWindow = 60000;
 * config.strategy = 'ip';
 *
 * const errors = await validate(config);
 * if (errors.length > 0) {
 *   throw new Error('配置验证失败');
 * }
 * ```
 */
export class RateLimitConfig implements RateLimitOptions {
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
  @Min(1000, { message: "timeWindow 必须至少 1000 毫秒（1 秒）" })
  timeWindow!: number;

  /**
   * 限流策略
   */
  @IsOptional()
  @IsString({ message: "strategy 必须是字符串" })
  strategy?: RateLimitStrategy = "ip";

  /**
   * 自定义键生成函数
   */
  @IsOptional()
  keyGenerator?: KeyGenerator;

  /**
   * Redis 客户端
   */
  @IsOptional()
  redis?: Redis;

  /**
   * Redis 错误时是否跳过限流
   */
  @IsOptional()
  @IsBoolean({ message: "skipOnError 必须是布尔值" })
  skipOnError?: boolean = true;

  /**
   * 自定义错误消息
   */
  @IsOptional()
  @IsString({ message: "errorMessage 必须是字符串" })
  errorMessage?: string = "请求过于频繁，请稍后再试";

  /**
   * 响应头中是否包含限流信息
   */
  @IsOptional()
  @IsBoolean({ message: "addHeaders 必须是布尔值" })
  addHeaders?: boolean = true;
}

/**
 * 速率限制状态
 *
 * @description
 * 表示当前限流状态
 *
 * @example
 * ```typescript
 * const status: RateLimitStatus = {
 *   allowed: false,
 *   remaining: 0,
 *   total: 100,
 *   ttl: 30000,
 * };
 * ```
 */
export interface RateLimitStatus {
  /**
   * 是否允许请求
   */
  allowed: boolean;

  /**
   * 剩余请求数
   */
  remaining: number;

  /**
   * 总限制数
   */
  total: number;

  /**
   * 剩余时间（毫秒）
   */
  ttl: number;

  /**
   * 限流键
   */
  key?: string;
}

/**
 * 速率限制元数据键
 *
 * @description
 * 用于在装饰器中存储元数据的键名
 *
 * @internal
 */
export const RATE_LIMIT_METADATA_KEY = "rate-limit:options";

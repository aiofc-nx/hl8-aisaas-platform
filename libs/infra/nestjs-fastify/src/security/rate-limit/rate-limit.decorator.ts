/**
 * @fileoverview 速率限制装饰器
 *
 * @description
 * 提供方法和类级别的速率限制装饰器，用于声明式配置限流策略
 *
 * ## 使用场景
 *
 * ### 场景 1: 控制器级别限流
 * ```typescript
 * @Controller('users')
 * @RateLimit({ max: 1000, timeWindow: 60000 })
 * export class UserController {
 *   // 所有方法继承控制器的限流配置
 * }
 * ```
 *
 * ### 场景 2: 方法级别限流
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Get()
 *   @RateLimit({ max: 100, timeWindow: 60000 })
 *   list() {
 *     // 仅此方法受限流限制
 *   }
 * }
 * ```
 *
 * ### 场景 3: 多层级限流
 * ```typescript
 * @Controller('users')
 * @RateLimit({ max: 1000, timeWindow: 60000 })
 * export class UserController {
 *   @Post()
 *   @RateLimit({ max: 10, timeWindow: 60000 })
 *   create() {
 *     // 方法级别配置覆盖控制器级别
 *   }
 * }
 * ```
 *
 * @module security/rate-limit
 */

import { SetMetadata, applyDecorators } from "@nestjs/common";
import type {
  RATE_LIMIT_METADATA_KEY,
  RateLimitOptions,
} from "./types/rate-limit-options.js";

/**
 * 速率限制装饰器
 *
 * @description
 * 为控制器或方法设置速率限制配置
 *
 * ## 业务规则
 *
 * ### 优先级规则
 * - 方法级别配置 > 控制器级别配置 > 全局配置
 * - 方法级别配置会完全覆盖控制器级别配置
 *
 * ### 配置合并规则
 * - 不支持部分覆盖，必须提供完整配置
 * - 如果方法没有装饰器，继承控制器配置
 * - 如果控制器没有装饰器，使用全局配置
 *
 * ### 限流策略
 * - 支持 IP、自定义两种策略
 * - 自定义策略需要提供 keyGenerator 函数
 *
 * ## 参数说明
 *
 * @param options - 速率限制选项
 * @param options.max - 时间窗口内最大请求数
 * @param options.timeWindow - 时间窗口（毫秒）
 * @param options.strategy - 限流策略（ip | custom）
 * @param options.keyGenerator - 自定义键生成函数（strategy 为 custom 时必需）
 * @param options.redis - Redis 客户端（可选，用于分布式限流）
 * @param options.skipOnError - Redis 错误时是否跳过限流（默认 true）
 * @param options.errorMessage - 自定义错误消息
 * @param options.addHeaders - 是否在响应头中添加限流信息（默认 true）
 *
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * // 示例 1: IP 级别限流
 * @Controller('api')
 * @RateLimit({ max: 100, timeWindow: 60000 })
 * export class ApiController {}
 *
 * // 示例 2: 自定义限流
 * @Controller('custom')
 * export class CustomController {
 *   @Post()
 *   @RateLimit({
 *     max: 10,
 *     timeWindow: 60000,
 *     strategy: 'custom',
 *     keyGenerator: (req) => `${req.headers['x-api-key']}:${req.routerPath}`,
 *   })
 *   create() {}
 * }
 *
 * // 示例 4: 多层级限流
 * @Controller('users')
 * @RateLimit({ max: 1000, timeWindow: 60000 })
 * export class UserController {
 *   @Get()
 *   list() {
 *     // 继承控制器的 1000/分钟 限制
 *   }
 *
 *   @Post()
 *   @RateLimit({ max: 10, timeWindow: 60000 })
 *   create() {
 *     // 使用方法级别的 10/分钟 限制
 *   }
 *
 *   @Delete(':id')
 *   @RateLimit({ max: 1, timeWindow: 60000 })
 *   delete() {
 *     // 使用方法级别的 1/分钟 限制
 *   }
 * }
 * ```
 *
 * @remarks
 * - 装饰器只是设置元数据，实际限流由 RateLimitGuard 执行
 * - 需要配合 RateLimitGuard 使用才能生效
 * - 建议在全局或模块级别注册 RateLimitGuard
 *
 * @see RateLimitGuard
 * @see RateLimitService
 * @see RateLimitOptions
 */
export const RateLimit = (
  options: Partial<RateLimitOptions>,
): MethodDecorator & ClassDecorator => {
  // 验证必需参数
  if (!options.max || options.max <= 0) {
    throw new Error("RateLimit 装饰器必须指定 max 参数且 > 0");
  }

  if (!options.timeWindow || options.timeWindow <= 0) {
    throw new Error("RateLimit 装饰器必须指定 timeWindow 参数且 > 0");
  }

  // 验证自定义策略
  if (options.strategy === "custom" && !options.keyGenerator) {
    throw new Error("RateLimit 装饰器使用 custom 策略时必须提供 keyGenerator");
  }

  // 设置默认值
  const fullOptions: RateLimitOptions = {
    max: options.max,
    timeWindow: options.timeWindow,
    strategy: options.strategy || "ip",
    keyGenerator: options.keyGenerator,
    redis: options.redis,
    skipOnError: options.skipOnError ?? true,
    errorMessage: options.errorMessage || "请求过于频繁，请稍后再试",
    addHeaders: options.addHeaders ?? true,
  };

  // 使用 applyDecorators 支持多个装饰器组合
  return applyDecorators(
    SetMetadata(
      "rate-limit:options" as typeof RATE_LIMIT_METADATA_KEY,
      fullOptions,
    ),
  );
};

/**
 * IP 级别速率限制装饰器（快捷方式）
 *
 * @description
 * 基于客户端 IP 地址的速率限制
 *
 * @param max - 时间窗口内最大请求数
 * @param timeWindow - 时间窗口（毫秒）
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * @Controller('api')
 * @RateLimitByIp(100, 60000)  // 100 次/分钟
 * export class ApiController {}
 * ```
 */
export const RateLimitByIp = (
  max: number,
  timeWindow: number,
): MethodDecorator & ClassDecorator => {
  return RateLimit({
    max,
    timeWindow,
    strategy: "ip",
  });
};

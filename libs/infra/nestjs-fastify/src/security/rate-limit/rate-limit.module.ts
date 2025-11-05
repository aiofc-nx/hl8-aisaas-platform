/**
 * @fileoverview 速率限制模块
 *
 * @description
 * NestJS 动态模块，提供速率限制功能的配置和注册
 *
 * ## 使用场景
 *
 * ### 场景 1: 全局配置
 * ```typescript
 * @Module({
 *   imports: [
 *     RateLimitModule.forRoot({
 *       max: 1000,
 *       timeWindow: 60000,
 *       strategy: 'ip',
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * ### 场景 2: 异步配置
 * ```typescript
 * @Module({
 *   imports: [
 *     RateLimitModule.forRootAsync({
 *       imports: [ConfigModule],
 *       inject: [ConfigService],
 *       useFactory: (config: ConfigService) => ({
 *         max: config.get('RATE_LIMIT_MAX'),
 *         timeWindow: config.get('RATE_LIMIT_WINDOW'),
 *         redis: redisClient,
 *       }),
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * ### 场景 3: 多租户配置
 * ```typescript
 * @Module({
 *   imports: [
 *     RateLimitModule.forRoot({
 *       max: 10000,
 *       timeWindow: 60000,
 *       strategy: 'tenant',
 *       redis: redisClient,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @module security/rate-limit
 */

import { DynamicModule, Global, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { RateLimitGuard } from "./rate-limit.guard.js";
import { RateLimitService } from "./rate-limit.service.js";
import type { RateLimitOptions } from "./types/rate-limit-options.js";

/**
 * 异步配置选项
 *
 * @description
 * 用于异步加载限流配置的选项接口
 *
 * @example
 * ```typescript
 * {
 *   imports: [ConfigModule],
 *   inject: [ConfigService],
 *   useFactory: (config: ConfigService) => ({
 *     max: config.get('RATE_LIMIT_MAX'),
 *     timeWindow: config.get('RATE_LIMIT_WINDOW'),
 *   }),
 * }
 * ```
 */
export interface RateLimitModuleAsyncOptions {
  /**
   * 导入的模块（通常是 ConfigModule）
   */
  imports?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any -- NestJS 依赖注入模式必须支持任意依赖（宪章 IX 允许场景）

  /**
   * 注入的依赖（通常是 ConfigService）
   */
  inject?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any -- NestJS 依赖注入模式必须支持任意依赖（宪章 IX 允许场景）

  /**
   * 工厂函数，返回配置对象
   */
  useFactory?: (...args: any[]) => Promise<RateLimitOptions> | RateLimitOptions; // eslint-disable-line @typescript-eslint/no-explicit-any -- NestJS useFactory 模式必须支持任意依赖（宪章 IX 允许场景）
}

/**
 * 速率限制模块
 *
 * @description
 * 提供速率限制功能的 NestJS 动态模块
 *
 * ## 业务规则
 *
 * ### 模块注册规则
 * - 支持同步配置（forRoot）
 * - 支持异步配置（forRootAsync）
 * - 全局模块，无需在每个模块中导入
 *
 * ### 守卫注册规则
 * - 自动注册全局守卫（APP_GUARD）
 * - 守卫优先级低于认证守卫
 * - 可通过装饰器覆盖全局配置
 *
 * ### 服务注册规则
 * - RateLimitService 作为 provider 提供
 * - 可在其他服务中注入使用
 * - 支持自定义配置
 *
 * ## 注意事项
 *
 * - 模块标记为 @Global，导入一次即可
 * - 如果需要多个限流配置，建议使用装饰器
 * - Redis 客户端需要外部管理生命周期
 *
 * @example
 * ```typescript
 * // 同步配置
 * @Module({
 *   imports: [
 *     RateLimitModule.forRoot({
 *       max: 100,
 *       timeWindow: 60000,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * // 异步配置
 * @Module({
 *   imports: [
 *     RateLimitModule.forRootAsync({
 *       imports: [ConfigModule],
 *       inject: [ConfigService],
 *       useFactory: (config: ConfigService) => ({
 *         max: config.get('RATE_LIMIT_MAX'),
 *         timeWindow: config.get('RATE_LIMIT_WINDOW'),
 *       }),
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class RateLimitModule {
  /**
   * 同步配置模块
   *
   * @description
   * 使用静态配置创建速率限制模块
   *
   * ## 业务逻辑
   *
   * 1. **验证配置**: 检查必需参数
   * 2. **注册服务**: 创建 RateLimitService provider
   * 3. **注册守卫**: 创建全局守卫 provider
   * 4. **导出服务**: 使服务可被其他模块注入
   *
   * ## 配置规则
   *
   * ### 必需参数
   * - `max`: 时间窗口内最大请求数（> 0）
   * - `timeWindow`: 时间窗口毫秒数（> 0）
   *
   * ### 可选参数
   * - `strategy`: 限流策略（默认 'ip'）
   * - `redis`: Redis 客户端（用于分布式限流）
   * - `skipOnError`: Redis 错误时是否跳过（默认 true）
   * - `errorMessage`: 自定义错误消息
   * - `addHeaders`: 是否添加响应头（默认 true）
   *
   * @param options - 速率限制配置
   * @returns 动态模块定义
   *
   * @throws {Error} 当配置参数无效时
   *
   * @example
   * ```typescript
   * // 基础配置
   * RateLimitModule.forRoot({
   *   max: 100,
   *   timeWindow: 60000,
   * })
   *
   * // 完整配置
   * RateLimitModule.forRoot({
   *   max: 1000,
   *   timeWindow: 60000,
   *   strategy: 'tenant',
   *   redis: redisClient,
   *   skipOnError: true,
   *   errorMessage: '请求过于频繁',
   *   addHeaders: true,
   * })
   * ```
   */
  static forRoot(options: RateLimitOptions): DynamicModule {
    // 验证必需参数
    if (!options.max || options.max <= 0) {
      throw new Error("RateLimitModule.forRoot() 必须指定 max 参数且 > 0");
    }

    if (!options.timeWindow || options.timeWindow <= 0) {
      throw new Error(
        "RateLimitModule.forRoot() 必须指定 timeWindow 参数且 > 0",
      );
    }

    return {
      module: RateLimitModule,
      global: true,
      providers: [
        // 配置 provider
        {
          provide: "RATE_LIMIT_OPTIONS",
          useValue: options,
        },
        // 服务 provider
        {
          provide: RateLimitService,
          useFactory: () => new RateLimitService(options),
        },
        // 全局守卫 provider
        {
          provide: APP_GUARD,
          useClass: RateLimitGuard,
        },
      ],
      exports: [RateLimitService],
    };
  }

  /**
   * 异步配置模块
   *
   * @description
   * 使用工厂函数动态创建速率限制模块
   *
   * ## 业务逻辑
   *
   * 1. **导入依赖**: 导入配置模块
   * 2. **注入服务**: 注入 ConfigService 等
   * 3. **调用工厂**: 执行 useFactory 获取配置
   * 4. **注册服务**: 创建 providers
   * 5. **导出服务**: 使服务可被注入
   *
   * ## 使用场景
   *
   * ### 场景 1: 从环境变量加载
   * ```typescript
   * {
   *   imports: [ConfigModule],
   *   inject: [ConfigService],
   *   useFactory: (config: ConfigService) => ({
   *     max: config.get('RATE_LIMIT_MAX'),
   *     timeWindow: config.get('RATE_LIMIT_WINDOW'),
   *   }),
   * }
   * ```
   *
   * ### 场景 2: 从远程配置加载
   * ```typescript
   * {
   *   imports: [ConfigModule],
   *   inject: [RemoteConfigService],
   *   useFactory: async (remote: RemoteConfigService) => {
   *     const config = await remote.getConfig('rate-limit');
   *     return {
   *       max: config.max,
   *       timeWindow: config.timeWindow,
   *     };
   *   },
   * }
   * ```
   *
   * @param options - 异步配置选项
   * @returns 动态模块定义
   *
   * @throws {Error} 当异步配置加载失败时
   *
   * @example
   * ```typescript
   * RateLimitModule.forRootAsync({
   *   imports: [ConfigModule],
   *   inject: [ConfigService],
   *   useFactory: async (config: ConfigService) => ({
   *     max: config.get('RATE_LIMIT_MAX', 1000),
   *     timeWindow: config.get('RATE_LIMIT_WINDOW', 60000),
   *     redis: await createRedisClient(config),
   *   }),
   * })
   * ```
   */
  static forRootAsync(options: RateLimitModuleAsyncOptions): DynamicModule {
    if (!options.useFactory) {
      throw new Error("RateLimitModule.forRootAsync() 必须提供 useFactory");
    }

    return {
      module: RateLimitModule,
      global: true,
      imports: options.imports || [],
      providers: [
        // 异步配置 provider
        {
          provide: "RATE_LIMIT_OPTIONS",
          useFactory: options.useFactory || (() => ({})),
          inject: options.inject || [],
        },
        // 服务 provider
        {
          provide: RateLimitService,
          useFactory: (opts: RateLimitOptions) => new RateLimitService(opts),
          inject: ["RATE_LIMIT_OPTIONS"],
        },
        // 全局守卫 provider
        {
          provide: APP_GUARD,
          useClass: RateLimitGuard,
        },
      ],
      exports: [RateLimitService],
    };
  }
}

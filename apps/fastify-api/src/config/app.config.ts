/**
 * 应用配置类
 *
 * @description 定义 Fastify API 应用的完整配置结构，支持类型安全和运行时验证
 *
 * ## 设计原则
 *
 * ### 单一配置源
 * - 配置类在 @hl8/nestjs-fastify 中定义（单一真相源）
 * - 应用层只负责组合和使用这些配置类
 * - 避免重复定义，遵循 DRY 原则
 *
 * ### 配置组合
 * - 应用配置类（AppConfig）组合多个库级配置类
 * - 每个配置类职责单一，易于维护
 * - 支持独立演进和版本管理
 *
 * ### 环境变量规则
 * - 使用 `__` 作为嵌套分隔符（例如：REDIS__HOST、LOGGING__LEVEL）
 * - 支持 .env 和 .env.local 文件
 * - 环境变量优先级高于配置文件
 *
 * ### 验证规则
 * - 使用 class-validator 装饰器进行验证
 * - 使用 class-transformer 进行类型转换
 * - 支持嵌套配置对象的验证
 *
 * @example
 * ```typescript
 * // .env 文件
 * NODE_ENV=development
 * PORT=3000
 * LOGGING__LEVEL=info
 * LOGGING__PRETTY_PRINT=true
 * REDIS__HOST=localhost
 * REDIS__PORT=6379
 * CACHE__TTL=3600
 * METRICS__PATH=/metrics
 *
 * // 使用配置
 * constructor(private readonly config: AppConfig) {}
 *
 * // 访问配置
 * const logLevel = this.config.logging.level;
 * const redisHost = this.config.redis.host;
 * ```
 */

import { Type } from "class-transformer";
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

// 从 @hl8/nestjs-fastify 导入配置类（单一配置源）
import {
  LoggingConfig,
  MetricsModuleConfig,
  RateLimitModuleConfig,
} from "@hl8/nestjs-fastify";

/**
 * 应用配置
 *
 * @description Fastify API 应用的根配置
 */
export class AppConfig {
  /**
   * 应用运行环境
   *
   * @default 'development'
   */
  @IsString()
  @IsIn(["development", "production", "test"])
  @IsOptional()
  public readonly NODE_ENV: string = "development";

  /**
   * 应用端口
   *
   * @default 3000
   */
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  public readonly PORT: number = 3000;

  /**
   * 日志配置
   *
   * @description 直接使用 @hl8/nestjs-fastify 的 LoggingConfig
   */
  @ValidateNested()
  @Type(() => LoggingConfig)
  @IsOptional()
  public readonly logging: LoggingConfig = new LoggingConfig();

  /**
   * Metrics 配置
   *
   * @description 直接使用 @hl8/nestjs-fastify 的 MetricsModuleConfig
   */
  @ValidateNested()
  @Type(() => MetricsModuleConfig)
  @IsOptional()
  public readonly metrics: MetricsModuleConfig = new MetricsModuleConfig();

  /**
   * 速率限制配置
   *
   * @description 直接使用 @hl8/nestjs-fastify 的 RateLimitModuleConfig
   * @optional 仅在生产环境或需要时启用
   */
  @ValidateNested()
  @Type(() => RateLimitModuleConfig)
  @IsOptional()
  public readonly rateLimit?: RateLimitModuleConfig;
}

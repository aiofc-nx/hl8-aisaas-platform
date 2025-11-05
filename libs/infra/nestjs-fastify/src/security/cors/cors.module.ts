/**
 * @fileoverview CORS 配置模块
 *
 * @description
 * 提供跨域资源共享（CORS）配置功能的 NestJS 动态模块
 *
 * ## 业务规则
 *
 * ### 模块注册规则
 * - 支持同步配置（forRoot）
 * - 支持异步配置（forRootAsync）
 * - 全局模块，无需在每个模块中导入
 *
 * ### CORS 规则
 * - 支持灵活的 Origin 配置（字符串、数组、正则、函数）
 * - 支持凭证传递（Cookie、认证头）
 * - 自动处理预检请求（OPTIONS）
 * - 可配置允许的请求/响应头
 *
 * ## 注意事项
 *
 * - 开发环境可以允许所有来源（origin: true）
 * - 生产环境应该明确指定允许的域名
 * - 启用 credentials 时，origin 不能为 "*"
 *
 * @example
 * ```typescript
 * // 同步配置
 * @Module({
 *   imports: [
 *     CorsModule.forRoot({
 *       origin: ["https://app.example.com"],
 *       credentials: true,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * // 异步配置（推荐）
 * @Module({
 *   imports: [
 *     CorsModule.forRootAsync({
 *       imports: [ConfigModule],
 *       inject: [AppConfig],
 *       useFactory: (config: AppConfig) => config.cors,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */

import type { ModuleMetadata } from "@nestjs/common";
import { DynamicModule, Global, Module } from "@nestjs/common";
import type { CorsOptions } from "./types/cors-options.js";
import { DEFAULT_CORS_OPTIONS } from "./types/cors-options.js";

/**
 * CORS 模块异步配置选项
 */
export interface CorsModuleAsyncOptions
  extends Pick<ModuleMetadata, "imports"> {
  /**
   * 工厂函数，返回 CORS 配置
   */
  useFactory: (...args: any[]) => CorsOptions | Promise<CorsOptions>;

  /**
   * 注入的依赖
   */
  inject?: any[];
}

/**
 * CORS 配置模块
 *
 * @description
 * 提供跨域资源共享（CORS）配置功能的 NestJS 动态模块
 */
@Global()
@Module({})
export class CorsModule {
  /**
   * 同步配置模块
   *
   * @description
   * 使用静态配置创建 CORS 模块
   *
   * @param options - CORS 配置选项（可选）
   * @returns 动态模块定义
   *
   * @example
   * ```typescript
   * // 开发环境：允许所有来源
   * CorsModule.forRoot({
   *   origin: true,
   *   credentials: true,
   * })
   *
   * // 生产环境：指定域名
   * CorsModule.forRoot({
   *   origin: ["https://app.example.com"],
   *   credentials: true,
   * })
   * ```
   */
  static forRoot(options?: CorsOptions): DynamicModule {
    const mergedOptions: CorsOptions = {
      ...DEFAULT_CORS_OPTIONS,
      ...options,
    };

    return {
      module: CorsModule,
      global: true,
      providers: [
        {
          provide: "CORS_OPTIONS",
          useValue: mergedOptions,
        },
      ],
      exports: ["CORS_OPTIONS"],
    };
  }

  /**
   * 异步配置模块
   *
   * @description
   * 使用工厂函数动态创建 CORS 模块
   *
   * @param options - 异步配置选项
   * @returns 动态模块定义
   *
   * @throws {Error} 当异步配置加载失败时
   *
   * @example
   * ```typescript
   * CorsModule.forRootAsync({
   *   imports: [ConfigModule],
   *   inject: [AppConfig],
   *   useFactory: async (config: AppConfig) => ({
   *     origin:
   *       config.environment === "development"
   *         ? true // 开发环境允许所有
   *         : config.cors.allowedOrigins, // 生产环境指定域名
   *     credentials: config.cors.credentials,
   *     allowedHeaders: config.cors.allowedHeaders,
   *   }),
   * })
   * ```
   */
  static forRootAsync(options: CorsModuleAsyncOptions): DynamicModule {
    if (!options.useFactory) {
      throw new Error("CorsModule.forRootAsync() 必须提供 useFactory");
    }

    return {
      module: CorsModule,
      global: true,
      imports: options.imports || [],
      providers: [
        {
          provide: "CORS_OPTIONS",
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ],
      exports: ["CORS_OPTIONS"],
    };
  }
}

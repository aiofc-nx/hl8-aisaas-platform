/**
 * @fileoverview 压缩中间件模块
 *
 * @description
 * 提供 HTTP 响应压缩功能的 NestJS 动态模块
 *
 * ## 业务规则
 *
 * ### 模块注册规则
 * - 支持同步配置（forRoot）
 * - 支持异步配置（forRootAsync）
 * - 全局模块，无需在每个模块中导入
 *
 * ### 压缩规则
 * - 支持多种压缩算法：Brotli、Gzip、Deflate
 * - 根据内容类型和大小自动判断是否压缩
 * - 可配置压缩阈值和编码方式
 *
 * ## 注意事项
 *
 * - 压缩在响应发送前进行
 * - 小文件可能不压缩（根据阈值）
 * - 压缩会增加 CPU 开销，但减少带宽
 *
 * @example
 * ```typescript
 * // 同步配置
 * @Module({
 *   imports: [
 *     CompressionModule.forRoot({
 *       global: true,
 *       threshold: 1024,
 *       encodings: ["br", "gzip"],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * // 异步配置（推荐）
 * @Module({
 *   imports: [
 *     CompressionModule.forRootAsync({
 *       imports: [ConfigModule],
 *       inject: [AppConfig],
 *       useFactory: (config: AppConfig) => config.compression,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */

import type { ModuleMetadata } from "@nestjs/common";
import { DynamicModule, Global, Module } from "@nestjs/common";
import type { CompressionOptions } from "./types/compression-options.js";
import { DEFAULT_COMPRESSION_OPTIONS } from "./types/compression-options.js";

/**
 * Compression 模块异步配置选项
 */
export interface CompressionModuleAsyncOptions
  extends Pick<ModuleMetadata, "imports"> {
  /**
   * 工厂函数，返回 Compression 配置
   */
  useFactory: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ) => CompressionOptions | Promise<CompressionOptions>;

  /**
   * 注入的依赖
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inject?: any[];
}

/**
 * 压缩中间件模块
 *
 * @description
 * 提供 HTTP 响应压缩功能的 NestJS 动态模块
 */
@Global()
@Module({})
export class CompressionModule {
  /**
   * 同步配置模块
   *
   * @description
   * 使用静态配置创建压缩模块
   *
   * @param options - 压缩配置选项（可选）
   * @returns 动态模块定义
   *
   * @example
   * ```typescript
   * CompressionModule.forRoot({
   *   global: true,
   *   threshold: 1024,
   *   encodings: ["br", "gzip", "deflate"],
   * })
   * ```
   */
  static forRoot(options?: CompressionOptions): DynamicModule {
    const mergedOptions: CompressionOptions = {
      ...DEFAULT_COMPRESSION_OPTIONS,
      ...options,
    };

    return {
      module: CompressionModule,
      global: true,
      providers: [
        {
          provide: "COMPRESSION_OPTIONS",
          useValue: mergedOptions,
        },
      ],
      exports: ["COMPRESSION_OPTIONS"],
    };
  }

  /**
   * 异步配置模块
   *
   * @description
   * 使用工厂函数动态创建压缩模块
   *
   * @param options - 异步配置选项
   * @returns 动态模块定义
   *
   * @throws {Error} 当异步配置加载失败时
   *
   * @example
   * ```typescript
   * CompressionModule.forRootAsync({
   *   imports: [ConfigModule],
   *   inject: [AppConfig],
   *   useFactory: async (config: AppConfig) => ({
   *     global: config.compression.global,
   *     threshold: config.compression.threshold,
   *     encodings: config.compression.encodings,
   *   }),
   * })
   * ```
   */
  static forRootAsync(options: CompressionModuleAsyncOptions): DynamicModule {
    if (!options.useFactory) {
      throw new Error("CompressionModule.forRootAsync() 必须提供 useFactory");
    }

    return {
      module: CompressionModule,
      global: true,
      imports: options.imports || [],
      providers: [
        {
          provide: "COMPRESSION_OPTIONS",
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ],
      exports: ["COMPRESSION_OPTIONS"],
    };
  }
}

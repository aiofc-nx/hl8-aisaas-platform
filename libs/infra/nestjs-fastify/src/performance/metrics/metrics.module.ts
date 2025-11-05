/**
 * @fileoverview Metrics 模块
 *
 * @description
 * 提供 Prometheus Metrics 收集和暴露功能的 NestJS 动态模块
 *
 * ## 业务规则
 *
 * ### 模块注册规则
 * - 支持同步配置（forRoot）
 * - 支持异步配置（forRootAsync）
 * - 全局模块，无需在每个模块中导入
 *
 * ### Metrics 收集规则
 * - 自动收集 HTTP 请求指标（计数、响应时间、错误率）
 * - 支持租户级别的指标分组
 * - 支持自定义业务指标
 * - 提供标准的 Prometheus 格式端点
 *
 * ## 注意事项
 *
 * - Metrics 端点为 `/metrics`（可配置）
 * - 默认启用系统指标收集
 * - 支持多租户场景的指标隔离
 *
 * @example
 * ```typescript
 * // 同步配置
 * @Module({
 *   imports: [
 *     MetricsModule.forRoot({
 *       path: "/metrics",
 *       defaultLabels: {
 *         app: "my-app",
 *       },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * // 异步配置（推荐）
 * @Module({
 *   imports: [
 *     MetricsModule.forRootAsync({
 *       imports: [ConfigModule],
 *       inject: [AppConfig],
 *       useFactory: (config: AppConfig) => config.metrics,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */

import type { ModuleMetadata } from "@nestjs/common";
import { DynamicModule, Global, Module } from "@nestjs/common";
import { MetricsController } from "./metrics.controller.js";
import { MetricsService } from "./metrics.service.js";
import { PrometheusService } from "./prometheus.service.js";
import type { MetricsOptions } from "./types/metrics-options.js";
import { DEFAULT_METRICS_OPTIONS } from "./types/metrics-options.js";

/**
 * Metrics 模块异步配置选项
 */
export interface MetricsModuleAsyncOptions
  extends Pick<ModuleMetadata, "imports"> {
  /**
   * 工厂函数，返回 Metrics 配置
   */
  useFactory: (...args: any[]) => MetricsOptions | Promise<MetricsOptions>;

  /**
   * 注入的依赖
   */
  inject?: any[];
}

/**
 * Metrics 模块
 *
 * @description
 * 提供 Prometheus Metrics 收集和暴露功能的 NestJS 动态模块
 */
@Global()
@Module({})
export class MetricsModule {
  /**
   * 同步配置模块
   *
   * @description
   * 使用静态配置创建 Metrics 模块
   *
   * @param options - Metrics 配置选项（可选）
   * @returns 动态模块定义
   *
   * @example
   * ```typescript
   * MetricsModule.forRoot({
   *   path: "/metrics",
   *   defaultLabels: {
   *     app: "my-app",
   *   },
   * })
   * ```
   */
  static forRoot(options?: MetricsOptions): DynamicModule {
    const mergedOptions: MetricsOptions = {
      ...DEFAULT_METRICS_OPTIONS,
      ...options,
    };

    return {
      module: MetricsModule,
      global: true,
      controllers: [MetricsController],
      providers: [
        {
          provide: "METRICS_OPTIONS",
          useValue: mergedOptions,
        },
        {
          provide: PrometheusService,
          useFactory: () => new PrometheusService(mergedOptions),
        },
        MetricsService,
      ],
      exports: [MetricsService, PrometheusService],
    };
  }

  /**
   * 异步配置模块
   *
   * @description
   * 使用工厂函数动态创建 Metrics 模块
   *
   * ## 业务逻辑
   *
   * 1. **导入依赖**: 导入配置模块
   * 2. **注入服务**: 注入 AppConfig 等
   * 3. **调用工厂**: 执行 useFactory 获取配置
   * 4. **注册服务**: 创建 providers
   * 5. **导出服务**: 使服务可被注入
   *
   * @param options - 异步配置选项
   * @returns 动态模块定义
   *
   * @throws {Error} 当异步配置加载失败时
   *
   * @example
   * ```typescript
   * MetricsModule.forRootAsync({
   *   imports: [ConfigModule],
   *   inject: [AppConfig],
   *   useFactory: async (config: AppConfig) => ({
   *     path: config.metrics.path || "/metrics",
   *     defaultLabels: {
   *       app: config.appName,
   *       environment: config.environment,
   *     },
   *     enableDefaultMetrics: config.metrics.enableDefaultMetrics,
   *   }),
   * })
   * ```
   */
  static forRootAsync(options: MetricsModuleAsyncOptions): DynamicModule {
    if (!options.useFactory) {
      throw new Error("MetricsModule.forRootAsync() 必须提供 useFactory");
    }

    return {
      module: MetricsModule,
      global: true,
      imports: options.imports || [],
      controllers: [MetricsController],
      providers: [
        // 异步配置 provider
        {
          provide: "METRICS_OPTIONS",
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        // PrometheusService provider
        {
          provide: PrometheusService,
          useFactory: (opts: MetricsOptions) => new PrometheusService(opts),
          inject: ["METRICS_OPTIONS"],
        },
        MetricsService,
      ],
      exports: [MetricsService, PrometheusService],
    };
  }
}

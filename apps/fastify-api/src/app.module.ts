import {
  CompressionModule,
  FastifyLoggingModule,
  MetricsModule,
} from "@hl8/nestjs-fastify";
import { TypedConfigModule, dotenvLoader, directoryLoader } from "@hl8/config";
import { Module } from "@nestjs/common";
import * as path from "path";
import { AppController } from "./app.controller.js";
import { AppConfig } from "./config/app.config.js";

/**
 * HL8 SAAS 平台应用根模块
 *
 * @description 配置全局模块、日志系统、响应压缩、性能监控等企业级基础设施功能
 *
 * ## 业务规则
 *
 * ### 配置管理规则
 * - 使用 TypedConfigModule (@hl8/config) 提供类型安全的配置管理
 * - 配置模块全局可用，无需重复导入
 * - 支持多环境配置文件 (.env.local, .env)
 * - 支持嵌套配置（使用 __ 分隔符）和变量扩展
 * - 完整的 TypeScript 类型支持和运行时验证
 *
 * ### 异常处理规则
 * - 统一异常响应格式（RFC7807）
 * - 自动捕获所有 HTTP 异常和未知异常
 * - 生产环境隐藏敏感错误信息
 * - 支持国际化错误消息
 *
 * ### 日志管理规则
 * - 使用 Pino 提供高性能日志记录
 * - 开发环境启用美化输出
 * - 生产环境使用 JSON 格式输出
 * - 零开销，复用 Fastify 内置 Pino 实例
 *
 * ### 响应压缩规则
 * - 支持 br、gzip、deflate 编码
 * - 压缩阈值：1KB
 * - 自动检测内容类型
 *
 * ### 性能监控规则
 * - Prometheus Metrics 收集
 * - HTTP 请求计数、响应时间、错误率
 * - /metrics 端点暴露指标
 *
 * ### 注意事项
 * - 速率限制、Helmet、CORS 已在 EnterpriseFastifyAdapter 中配置（详见 src/main.ts）
 * - 本模块仅注册压缩和 Metrics 模块，避免重复配置
 *
 */
@Module({
  controllers: [AppController],
  providers: [],
  imports: [
    // 配置模块 - 类型安全的配置管理
    // 配置加载顺序（按优先级从高到低，后面的会覆盖前面的）：
    // 1. 配置文件（config/default.json, config/${NODE_ENV}.json 等）
    // 2. 远程配置源（如果配置了远程配置服务）
    // 3. 进程环境变量（作为最后的 fallback，不加载 .env 文件）
    // 注意：.env 文件仅在无法获得其他配置源时作为 fallback 使用
    TypedConfigModule.forRoot({
      schema: AppConfig,
      isGlobal: true,
      load: [
        // 1. 从 config 目录加载配置文件（JSON/YAML）
        // 如果配置文件不存在，directoryLoader 会返回空对象，不会抛出错误
        directoryLoader({
          directory: path.join(process.cwd(), "config"),
          include: /\.(json|yml|yaml)$/,
        }),
        // 2. 远程配置源（如果需要，可以在这里添加）
        // remoteLoader("https://config-server.com/api/config", {
        //   requestConfig: {
        //     headers: { Authorization: "Bearer token" },
        //   },
        // }),
        // 3. 进程环境变量（作为最后的 fallback）
        // 注意：这里只加载进程环境变量，不加载 .env 文件
        // .env 文件应该只在没有其他配置源时才使用
        dotenvLoader({
          separator: "__", // 支持嵌套配置：REDIS__HOST, LOGGING__LEVEL
          envFilePath: ".env", // .env 文件路径（但只在没有其他配置源时使用）
          ignoreEnvFile: true, // 忽略 .env 文件，只使用进程环境变量
          // 如果需要使用 .env 文件作为 fallback，可以设置 ignoreEnvFile: false
          // 但建议只在没有配置文件时使用 .env
          ignoreEnvVars: false, // 不忽略进程环境变量
          enableExpandVariables: true, // 支持 ${VAR} 和 ${VAR:-DEFAULT} 语法
        }),
      ],
    }),

    // Fastify 专用日志模块（零开销，复用 Fastify Pino）
    // 启用企业级功能：上下文注入、敏感信息脱敏、性能监控、美化输出
    // 注意：详细配置在 AppConfig.logging 中定义，可通过环境变量覆盖
    // 环境变量格式：LOGGING__LEVEL=info, LOGGING__PRETTY_PRINT=true
    // 注意：由于 FastifyLoggingModule 不支持 forRootAsync，配置会在运行时通过 AppConfig 获取
    // 这里使用默认配置，实际配置会从 AppConfig 中读取并通过环境变量覆盖
    FastifyLoggingModule.forRoot({
      config: {
        // 默认值，会被环境变量覆盖（通过 dotenvLoader）
        level: "info",
        prettyPrint: false,
        timestamp: true,
        enabled: true,

        // 启用请求上下文自动注入
        context: {
          enabled: true,
          includeRequestDetails: true,
          includeUserInfo: false,
        },

        // 启用敏感信息脱敏
        sanitizer: {
          enabled: true,
          sensitiveFields: [
            "password",
            "token",
            "secret",
            "apiKey",
            "api_key",
            "authorization",
            "creditCard",
            "credit_card",
            "ssn",
            "socialSecurityNumber",
          ],
          placeholder: "***",
        },

        // 启用性能监控
        performance: {
          enabled: true,
          trackLogWriteTime: true,
        },

        // 错误处理配置
        errorHandling: {
          fallbackToConsole: false,
          silentFailures: false,
        },
      },
    }),

    // 注意：速率限制、Helmet、CORS 已在 EnterpriseFastifyAdapter 中配置
    // 详见 src/main.ts

    // 压缩模块 - 响应压缩
    CompressionModule.forRoot({
      global: true,
      threshold: 1024, // 1KB
      encodings: ["br", "gzip", "deflate"],
    }),

    // Prometheus Metrics 模块 - 性能监控
    // 注意：详细配置在 AppConfig.metrics 中定义，可通过环境变量覆盖
    // 环境变量格式：METRICS__PATH=/metrics
    // 注意：由于 MetricsModule 支持 forRootAsync，我们可以从 AppConfig 获取配置
    MetricsModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (appConfig: AppConfig) => ({
        defaultLabels: {
          app: "fastify-api",
          environment: appConfig.NODE_ENV || "development",
        },
        path: appConfig.metrics?.path || "/metrics",
        enableDefaultMetrics: appConfig.metrics?.enableDefaultMetrics ?? true,
      }),
    }),
  ],
})
export class AppModule {}

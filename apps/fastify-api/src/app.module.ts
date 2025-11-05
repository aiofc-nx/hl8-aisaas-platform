import {
  CompressionModule,
  FastifyLoggingModule,
  MetricsModule,
} from "@hl8/nestjs-fastify";
import { TypedConfigModule, dotenvLoader } from "@hl8/config";
import { Module } from "@nestjs/common";
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
    TypedConfigModule.forRoot({
      schema: AppConfig,
      isGlobal: true,
      load: [
        dotenvLoader({
          separator: "__", // 支持嵌套配置：REDIS__HOST
          envFilePath: ".env", // 使用单个文件路径
          // 当 .env 缺失时不报错，使用进程环境变量启动
          ignoreEnvFile: true,
          enableExpandVariables: true, // 支持 ${VAR} 语法
        }),
      ],
    }),

    // Fastify 专用日志模块（零开销，复用 Fastify Pino）
    // 启用企业级功能：上下文注入、敏感信息脱敏、性能监控、美化输出
    // 注意：详细配置在 AppConfig.logging 中定义，可通过环境变量覆盖
    // 环境变量格式：LOGGING__LEVEL=info, LOGGING__PRETTY_PRINT=true
    FastifyLoggingModule.forRoot({
      config: {
        level:
          (process.env.LOGGING__LEVEL as
            | "fatal"
            | "error"
            | "warn"
            | "info"
            | "debug"
            | "trace") || "info",
        // 开发环境启用美化输出，生产环境使用 JSON 格式
        prettyPrint:
          process.env.NODE_ENV === "development" ||
          process.env.LOGGING__PRETTY_PRINT === "true",
        timestamp: true,
        enabled: true,

        // 启用请求上下文自动注入
        context: {
          enabled: true,
          includeRequestDetails: true, // 包含请求详情（method、url、ip 等）
          includeUserInfo: false, // 不包含用户信息（需要时可通过中间件设置）
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
          fallbackToConsole: false, // 不降级到控制台
          silentFailures: false, // 记录日志写入失败
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
    MetricsModule.forRoot({
      defaultLabels: {
        app: "fastify-api",
        environment: process.env.NODE_ENV || "development",
      },

      path: process.env.METRICS__PATH || "/metrics",
      enableDefaultMetrics: true,
    }),
  ],
})
export class AppModule {}

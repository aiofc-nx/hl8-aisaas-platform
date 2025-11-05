import {
  createFastifyLoggerConfig,
  EnterpriseFastifyAdapter,
} from "@hl8/nestjs-fastify";
import { NestFactory } from "@nestjs/core";
import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module.js";
import { bootstrap } from "./bootstrap.js";
import { setupSwagger } from "./swagger.js";

/**
 * Main entry point to bootstrap the NestJS Fastify application.
 *
 * @description 使用 @hl8/nestjs-fastify 的 EnterpriseFastifyAdapter
 * 提供企业级功能：CORS、安全头、性能监控、健康检查、速率限制、熔断器
 *
 * @returns {Promise<void>} A promise that resolves when the application has started.
 */
const main = async (): Promise<void> => {
  // 注意：在模块创建之前，无法使用 AppConfig 注入配置
  // 这里使用 process.env 作为初始化配置，实际配置会在模块创建后通过 AppConfig 统一管理
  // 这些值会被配置文件和环境变量覆盖（通过 dotenvLoader）
  const nodeEnv = process.env.NODE_ENV || "development";
  const logLevel = process.env.LOG_LEVEL || process.env.LOGGING__LEVEL || "info";
  const isDevelopment = nodeEnv === "development";

  // 使用企业级 Fastify 适配器
  const adapter = new EnterpriseFastifyAdapter({
    // Fastify 基础配置
    fastifyOptions: {
      // 日志配置：FastifyLoggingModule 会在应用启动后接管并扩展日志功能
      // 这里只提供基础配置，详细配置（上下文注入、脱敏、性能监控等）在 app.module.ts 中
      // 注意：实际配置会从 AppConfig 中读取，这里只是初始化配置
      logger: (() => {
        if (isDevelopment) {
          // 开发环境：使用 pino-pretty 美化输出
          return createFastifyLoggerConfig({
            level: logLevel,
            prettyPrint: true,
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          });
        }

        // 生产环境：JSON 格式
        return createFastifyLoggerConfig({
          level: logLevel,
          prettyPrint: false,
        });
      })(),
      trustProxy: true,
    },
    // CORS 配置（暂时禁用，避免冲突 - NestJS 可能已经注册）
    enableCors: false,
    // corsOptions: {
    //   origin: true,
    //   credentials: true,
    // },
    // 性能监控
    enablePerformanceMonitoring: true,
    // 健康检查（暂时禁用，避免路由冲突）
    enableHealthCheck: false,
    // healthCheckPath: '/health',
    // 安全配置
    enableSecurity: true,
    // 限流（生产环境启用）
    // 注意：实际配置应该从 AppConfig 中读取，但由于在模块创建前，这里使用环境变量
    // 建议在应用启动后通过 AppConfig 获取配置并重新设置
    enableRateLimit: nodeEnv === "production",
    rateLimitOptions: {
      timeWindow: 60000, // 1分钟
      max: 100, // 100次请求
    },
    // 熔断器（生产环境启用）
    // 注意：同上，实际配置应该从 AppConfig 中读取
    enableCircuitBreaker: nodeEnv === "production",
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
    {
      // 禁用 NestJS 内置日志，使用 FastifyLoggingModule 的日志
      logger: false,
    },
  );

  // 设置 Swagger API 文档
  await setupSwagger(app);

  await bootstrap(app);
};

/**
 * Invokes the main bootstrap function and handles any errors.
 *
 * @returns {void}
 */
main().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});

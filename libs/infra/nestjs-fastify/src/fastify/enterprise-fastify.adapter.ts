/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 企业级 Fastify 适配器
 *
 * @description 整合所有企业级功能的 Fastify 适配器
 *
 * ## 业务规则
 *
 * ### 默认启用的功能
 * - CORS 支持
 * - 安全头（Helmet）
 * - 性能监控
 * - 健康检查端点
 *
 * ### 可选功能
 * - 限流（基于 IP）
 * - 熔断器（自动故障保护）
 *
 * ## 使用场景
 *
 * 1. **生产环境**：需要完整的企业级功能
 * 2. **开发环境**：可以禁用部分功能以简化调试
 * 3. **测试环境**：可以模拟各种场景
 *
 * @example
 * ```typescript
 * // 基本使用（所有默认功能）
 * const app = await NestFactory.create<NestFastifyApplication>(
 *   AppModule,
 *   new EnterpriseFastifyAdapter()
 * );
 *
 * // 自定义配置
 * const app = await NestFactory.create<NestFastifyApplication>(
 *   AppModule,
 *   new EnterpriseFastifyAdapter({
 *     fastifyOptions: {
 *       logger: true,
 *       trustProxy: true,
 *     },
 *     enableRateLimit: true,
 *     rateLimitOptions: {
 *       timeWindow: 60000, // 1分钟
 *       max: 100, // 100次请求
 *     },
 *     enableCircuitBreaker: true,
 *   })
 * );
 * ```
 *
 * @since 0.2.0
 */

import fastifyCors from "@fastify/cors";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { requestIdPlugin } from "../plugins/request-id.plugin.js";
import { RequestIdStrategy } from "../utils/request-id.generator.js";

/**
 * 企业级 Fastify 适配器选项
 */
export interface EnterpriseFastifyAdapterOptions {
  /** Fastify 实例选项 */
  fastifyOptions?: {
    logger?: boolean | any;
    trustProxy?: boolean;
    bodyLimit?: number;
    connectionTimeout?: number;
    keepAliveTimeout?: number;
  };

  /** 是否启用 CORS（默认启用） */
  enableCors?: boolean;
  /** CORS 选项 */
  corsOptions?: {
    origin?: string | string[] | boolean;
    methods?: string[];
    allowedHeaders?: string[];
    exposedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
  };

  /** 是否启用限流（默认禁用） */
  enableRateLimit?: boolean;
  /** 限流选项 */
  rateLimitOptions?: {
    timeWindow?: number;
    max?: number;
  };

  /** 是否启用熔断器（默认禁用） */
  enableCircuitBreaker?: boolean;
  /** 熔断器选项 */
  circuitBreakerOptions?: {
    threshold?: number;
    timeout?: number;
    resetTimeout?: number;
  };

  /** 是否启用安全头（默认启用） */
  enableSecurity?: boolean;
  /** 安全选项 */
  securityOptions?: {
    enableHelmet?: boolean;
    enableCsrf?: boolean;
    enableXssFilter?: boolean;
  };

  /** 是否启用性能监控（默认启用） */
  enablePerformanceMonitoring?: boolean;

  /** 是否启用健康检查端点（默认启用） */
  enableHealthCheck?: boolean;
  /** 健康检查路径 */
  healthCheckPath?: string;

  /** 是否启用请求 ID（默认启用） */
  enableRequestId?: boolean;
  /** 请求 ID 选项 */
  requestIdOptions?: {
    strategy?: RequestIdStrategy;
    headerName?: string;
    generateOnMissing?: boolean;
    includeInResponse?: boolean;
    includeInLogs?: boolean;
    prefix?: string;
  };
}

/**
 * 企业级 Fastify 适配器
 *
 * @description 整合 CORS、安全、监控、限流、熔断等企业级功能
 */
export class EnterpriseFastifyAdapter extends FastifyAdapter {
  private adapterOptions: EnterpriseFastifyAdapterOptions;
  private requestStats: Map<string, number> = new Map();
  private circuitBreakerState: Map<string, CircuitBreakerState> = new Map();

  /**
   * 创建企业级 Fastify 适配器
   *
   * @param options - 适配器选项
   *
   * @example
   * ```typescript
   * new EnterpriseFastifyAdapter({
   *   enableRateLimit: true,
   *   rateLimitOptions: {
   *     timeWindow: 60000,
   *     max: 100,
   *   },
   * })
   * ```
   */
  constructor(options: EnterpriseFastifyAdapterOptions = {}) {
    super(options.fastifyOptions);

    // 设置默认值
    this.adapterOptions = {
      enableCors: options.enableCors !== false,
      enableSecurity: options.enableSecurity !== false,
      enablePerformanceMonitoring:
        options.enablePerformanceMonitoring !== false,
      enableHealthCheck: options.enableHealthCheck !== false,
      healthCheckPath: options.healthCheckPath || "/health",
      enableRequestId: options.enableRequestId !== false,
      requestIdOptions: {
        strategy: RequestIdStrategy.UUID,
        headerName: "X-Request-Id",
        generateOnMissing: true,
        includeInResponse: true,
        includeInLogs: true,
        ...options.requestIdOptions,
      },
      ...options,
    };
  }

  /**
   * 初始化适配器
   *
   * @description 注册所有企业级功能
   */
  async init() {
    await super.init();

    const instance = this.getInstance<FastifyInstance>();

    // 1. 注册请求 ID 插件
    if (this.adapterOptions.enableRequestId) {
      await this.registerRequestId(instance);
    }

    // 2. 注册 CORS
    if (this.adapterOptions.enableCors) {
      await this.registerCors(instance);
    }

    // 2. 注册安全功能
    if (this.adapterOptions.enableSecurity) {
      await this.registerSecurity(instance);
    }

    // 3. 注册性能监控
    if (this.adapterOptions.enablePerformanceMonitoring) {
      this.registerPerformanceMonitoring(instance);
    }

    // 4. 注册限流
    if (this.adapterOptions.enableRateLimit) {
      this.registerRateLimit(instance);
    }

    // 5. 注册熔断器
    if (this.adapterOptions.enableCircuitBreaker) {
      this.registerCircuitBreaker(instance);
    }

    // 6. 注册健康检查
    if (this.adapterOptions.enableHealthCheck) {
      this.registerHealthCheck(instance);
    }
  }

  /**
   * 注册 CORS 支持
   *
   * @param instance - Fastify 实例
   * @private
   */
  private async registerCors(instance: FastifyInstance): Promise<void> {
    const defaultCorsOptions = {
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      exposedHeaders: ["X-Request-Id"],
      maxAge: 86400, // 24 hours
    };

    await instance.register(fastifyCors as any, {
      ...defaultCorsOptions,
      ...this.adapterOptions.corsOptions,
    });
  }

  /**
   * 注册安全功能
   *
   * @param instance - Fastify 实例
   * @private
   */
  private async registerSecurity(instance: FastifyInstance): Promise<void> {
    // 安全头配置（简化实现，生产环境建议安装 @fastify/helmet）
    instance.addHook("onSend", async (request, reply) => {
      reply.header("X-Content-Type-Options", "nosniff");
      reply.header("X-Frame-Options", "DENY");
      reply.header("X-XSS-Protection", "1; mode=block");
    });
  }

  /**
   * 注册性能监控
   *
   * @param instance - Fastify 实例
   * @private
   */
  private registerPerformanceMonitoring(instance: FastifyInstance): void {
    // 请求开始时记录时间
    instance.addHook("onRequest", async (request: any) => {
      request.startTime = Date.now();
    });

    // 响应结束时计算耗时
    instance.addHook(
      "onResponse",
      async (request: any, reply: FastifyReply) => {
        const duration = Date.now() - (request.startTime || Date.now());

        // 记录性能指标
        if (instance.log) {
          instance.log.info({
            type: "performance",
            method: request.method,
            url: request.url,
            statusCode: reply.statusCode,
            duration,
            timestamp: new Date().toISOString(),
          });
        }
      },
    );
  }

  /**
   * 注册限流功能
   *
   * @param instance - Fastify 实例
   * @private
   */
  private registerRateLimit(instance: FastifyInstance): void {
    const options = this.adapterOptions.rateLimitOptions || {};
    const timeWindow = options.timeWindow || 60000; // 默认 1分钟
    const max = options.max || 100; // 默认 100 次请求

    instance.addHook(
      "onRequest",
      async (request: FastifyRequest, reply: FastifyReply) => {
        const key = `${request.ip}`;

        const now = Date.now();
        const windowKey = `${key}:${Math.floor(now / timeWindow)}`;

        const count = this.requestStats.get(windowKey) || 0;

        if (count >= max) {
          reply.code(429).send({
            statusCode: 429,
            error: "Too Many Requests",
            message: "请求过于频繁，请稍后再试",
          });
          return;
        }

        this.requestStats.set(windowKey, count + 1);

        // 清理过期的统计数据
        setTimeout(() => {
          this.requestStats.delete(windowKey);
        }, timeWindow * 2);
      },
    );
  }

  /**
   * 注册熔断器
   *
   * @param instance - Fastify 实例
   * @private
   */
  private registerCircuitBreaker(instance: FastifyInstance): void {
    const options = this.adapterOptions.circuitBreakerOptions || {};
    const threshold = options.threshold || 5; // 默认失败5次触发熔断
    const resetTimeout = options.resetTimeout || 60000; // 默认 1 分钟后重置

    instance.addHook(
      "onError",
      async (request: FastifyRequest, _reply: FastifyReply, _error: Error) => {
        const route = `${request.method}:${request.url}`;
        let state = this.circuitBreakerState.get(route);

        if (!state) {
          state = { failures: 0, state: "CLOSED", lastFailure: Date.now() };
          this.circuitBreakerState.set(route, state);
        }

        state.failures += 1;
        state.lastFailure = Date.now();

        if (state.failures >= threshold && state.state === "CLOSED") {
          state.state = "OPEN";
          instance.log?.warn(`熔断器打开: ${route}`);

          // 自动重置熔断器
          setTimeout(() => {
            state!.state = "HALF_OPEN";
            state!.failures = 0;
            instance.log?.info(`熔断器进入半开状态: ${route}`);
          }, resetTimeout);
        }
      },
    );

    instance.addHook(
      "onRequest",
      async (request: FastifyRequest, reply: FastifyReply) => {
        const route = `${request.method}:${request.url}`;
        const state = this.circuitBreakerState.get(route);

        if (state && state.state === "OPEN") {
          reply.code(503).send({
            statusCode: 503,
            error: "Service Unavailable",
            message: "服务暂时不可用，请稍后再试",
          });
        }
      },
    );
  }

  /**
   * 注册请求 ID 插件
   *
   * @param instance - Fastify 实例
   * @private
   */
  private async registerRequestId(instance: FastifyInstance): Promise<void> {
    const options = this.adapterOptions.requestIdOptions || {};
    await instance.register(requestIdPlugin, options);
  }

  /**
   * 注册健康检查端点
   *
   * @param instance - Fastify 实例
   * @private
   */
  private registerHealthCheck(instance: FastifyInstance): void {
    instance.get(this.adapterOptions.healthCheckPath!, async () => {
      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      };
    });
  }
}

/**
 * 熔断器状态
 *
 * @private
 */
interface CircuitBreakerState {
  failures: number;
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  lastFailure: number;
}

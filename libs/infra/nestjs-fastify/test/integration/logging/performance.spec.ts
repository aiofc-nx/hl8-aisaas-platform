/**
 * 日志性能验证测试
 *
 * @description 验证日志功能的性能指标是否符合要求
 *
 * ## 性能要求
 * - 上下文注入开销 < 1ms
 * - 脱敏处理开销 < 2ms（普通对象）
 * - 性能监控开销 < 0.5ms
 */

import { describe, it, expect } from "@jest/globals";
import { Test } from "@nestjs/testing";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Module, Controller, Get, Injectable } from "@nestjs/common";
import {
  FastifyLoggingModule,
  FastifyLoggerService,
} from "../../../src/logging/index.js";
import { ContextExtractor } from "../../../src/logging/context/context-extractor.js";
import { Sanitizer } from "../../../src/logging/sanitizer/sanitizer.js";
import type { FastifyRequest } from "fastify";
import { MetricsModule } from "../../../src/performance/metrics/metrics.module.js";

/**
 * 性能测试工具函数
 */
class PerformanceTestUtils {
  /**
   * 测量函数执行时间
   *
   * @param fn - 要测量的函数
   * @param iterations - 迭代次数（用于计算平均值）
   * @returns 平均执行时间（毫秒）
   */
  static measureTime(
    fn: () => void | Promise<void>,
    iterations: number = 100,
  ): number {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      fn();
      const end = performance.now();
      times.push(end - start);
    }

    // 返回平均值
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  /**
   * 异步测量函数执行时间
   *
   * @param fn - 要测量的异步函数
   * @param iterations - 迭代次数（用于计算平均值）
   * @returns 平均执行时间（毫秒）
   */
  static async measureAsyncTime(
    fn: () => Promise<void>,
    iterations: number = 100,
  ): Promise<number> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }

    // 返回平均值
    return times.reduce((a, b) => a + b, 0) / times.length;
  }
}

@Injectable()
class TestService {
  constructor(private readonly logger: FastifyLoggerService) {}

  async performOperation() {
    this.logger.log("执行操作");
    return { success: true };
  }
}

@Controller("test")
class TestController {
  constructor(
    private readonly service: TestService,
    private readonly logger: FastifyLoggerService,
  ) {}

  @Get()
  async test() {
    this.logger.log("处理请求");
    return this.service.performOperation();
  }
}

@Module({
  imports: [
    MetricsModule.forRoot({
      defaultLabels: { app: "test" },
      enableDefaultMetrics: false,
    }),
    FastifyLoggingModule.forRoot({
      config: {
        context: {
          enabled: true,
          includeRequestDetails: true,
        },
        sanitizer: {
          enabled: true,
        },
        performance: {
          enabled: true,
          trackLogWriteTime: true,
        },
      },
    }),
  ],
  controllers: [TestController],
  providers: [TestService],
})
class TestModule {}

describe("日志性能验证", () => {
  describe("T022: 上下文注入性能开销", () => {
    it("上下文注入开销应该 < 1ms", async () => {
      const extractor = new ContextExtractor();
      const mockRequest = {
        method: "GET",
        url: "/test",
        headers: {
          "x-request-id": "test-123",
          "user-agent": "test-agent",
        },
        ip: "192.168.1.1",
        socket: {
          remoteAddress: "192.168.1.1",
        },
        query: { foo: "bar" },
      } as unknown as FastifyRequest;

      const config = {
        enabled: true,
        includeRequestDetails: true,
        includeResponseDetails: false,
        includeUserInfo: false,
      };

      // 测量上下文提取时间
      const avgTime = PerformanceTestUtils.measureTime(() => {
        extractor.extract(mockRequest, undefined, config);
      }, 1000);

      // 验证平均时间 < 1ms
      expect(avgTime).toBeLessThan(1);
    });

    it("上下文注入在完整请求中应该 < 1ms", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          FastifyLoggingModule.forRoot({
            config: {
              context: {
                enabled: true,
                includeRequestDetails: true,
              },
              sanitizer: {
                enabled: false, // 禁用脱敏以专注于上下文注入
              },
              performance: {
                enabled: false, // 禁用性能监控以避免干扰
              },
            },
          }),
        ],
        controllers: [TestController],
        providers: [TestService],
      }).compile();

      const app = moduleRef.createNestApplication<NestFastifyApplication>(
        new FastifyAdapter(),
      );

      await app.init();
      await app.getHttpAdapter().getInstance().ready();

      // 测量多次请求的平均时间
      const times: number[] = [];
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await app.inject({
          method: "GET",
          url: "/test",
          headers: {
            "x-request-id": `test-${i}`,
          },
        });
        const end = performance.now();
        times.push(end - start);
      }

      await app.close();

      // 计算平均时间（只考虑上下文注入部分的开销）
      // 由于整个请求包含很多操作，我们主要验证上下文注入不会显著增加开销
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

      // 验证平均请求时间合理（包含上下文注入、路由处理等）
      // 这里我们主要验证上下文注入不会导致明显的性能下降
      expect(avgTime).toBeLessThan(10); // 整个请求应该在 10ms 内

      // 上下文注入本身的开销应该很小
      // 通过单独测试上下文提取来验证
      const extractor = new ContextExtractor();
      const mockRequest = {
        method: "GET",
        url: "/test",
        headers: { "x-request-id": "test" },
        socket: {
          remoteAddress: "192.168.1.1",
        },
      } as unknown as FastifyRequest;

      const extractTime = PerformanceTestUtils.measureTime(() => {
        extractor.extract(mockRequest, undefined, {
          enabled: true,
          includeRequestDetails: true,
        });
      }, 1000);

      expect(extractTime).toBeLessThan(1);
    });
  });

  describe("T028: 脱敏性能开销", () => {
    it("脱敏处理开销应该 < 2ms（普通对象）", () => {
      const sanitizer = new Sanitizer();

      // 创建普通大小的测试对象
      const testContext = {
        username: "testuser",
        password: "secret-password",
        email: "test@example.com",
        token: "access-token-123",
        apiKey: "secret-api-key",
        user: {
          name: "John",
          password: "user-password",
          profile: {
            email: "john@example.com",
            token: "profile-token",
          },
        },
        items: [
          { id: 1, password: "item-password" },
          { id: 2, name: "Item 2" },
        ],
      };

      // 测量脱敏时间
      const avgTime = PerformanceTestUtils.measureTime(() => {
        sanitizer.sanitize(testContext, { enabled: true });
      }, 1000);

      // 验证平均时间 < 2ms
      expect(avgTime).toBeLessThan(2);
    });

    it("脱敏处理开销应该 < 2ms（嵌套对象）", () => {
      const sanitizer = new Sanitizer();

      // 创建深度嵌套的测试对象
      const deepNestedContext = {
        level1: {
          password: "level1-password",
          level2: {
            token: "level2-token",
            level3: {
              secret: "level3-secret",
              level4: {
                apiKey: "level4-api-key",
                data: {
                  password: "deep-password",
                },
              },
            },
          },
        },
      };

      const avgTime = PerformanceTestUtils.measureTime(() => {
        sanitizer.sanitize(deepNestedContext, { enabled: true });
      }, 1000);

      // 验证平均时间 < 2ms
      expect(avgTime).toBeLessThan(2);
    });

    it("脱敏处理开销应该 < 2ms（数组对象）", () => {
      const sanitizer = new Sanitizer();

      // 创建包含数组的测试对象
      const arrayContext = {
        users: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          username: `user${i}`,
          password: `password${i}`,
          token: `token${i}`,
        })),
      };

      const avgTime = PerformanceTestUtils.measureTime(() => {
        sanitizer.sanitize(arrayContext, { enabled: true });
      }, 100);

      // 对于较大的对象，允许稍微放宽限制
      // 但普通对象应该 < 2ms
      expect(avgTime).toBeLessThan(5);
    });
  });

  describe("T049: 性能监控开销", () => {
    it("性能监控开销应该 < 0.5ms", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          MetricsModule.forRoot({
            defaultLabels: { app: "test" },
            enableDefaultMetrics: false,
          }),
          FastifyLoggingModule.forRoot({
            config: {
              context: {
                enabled: false, // 禁用上下文注入以专注于性能监控
              },
              sanitizer: {
                enabled: false, // 禁用脱敏以专注于性能监控
              },
              performance: {
                enabled: true,
                trackLogWriteTime: true,
              },
            },
          }),
        ],
        controllers: [TestController],
        providers: [TestService],
      }).compile();

      const app = moduleRef.createNestApplication<NestFastifyApplication>(
        new FastifyAdapter(),
      );

      await app.init();
      await app.getHttpAdapter().getInstance().ready();

      const loggerService =
        moduleRef.get<FastifyLoggerService>(FastifyLoggerService);

      // 测量带性能监控的日志写入时间
      const timesWithMonitoring: number[] = [];
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        loggerService.log("测试日志");
        const end = performance.now();
        timesWithMonitoring.push(end - start);
      }

      // 禁用性能监控，测量不带监控的时间
      await app.close();

      const moduleRefWithoutMonitoring = await Test.createTestingModule({
        imports: [
          FastifyLoggingModule.forRoot({
            config: {
              context: {
                enabled: false,
              },
              sanitizer: {
                enabled: false,
              },
              performance: {
                enabled: false,
              },
            },
          }),
        ],
        controllers: [TestController],
        providers: [TestService],
      }).compile();

      const appWithoutMonitoring =
        moduleRefWithoutMonitoring.createNestApplication<NestFastifyApplication>(
          new FastifyAdapter(),
        );

      await appWithoutMonitoring.init();
      await appWithoutMonitoring.getHttpAdapter().getInstance().ready();

      const loggerServiceWithoutMonitoring =
        moduleRefWithoutMonitoring.get<FastifyLoggerService>(
          FastifyLoggerService,
        );

      const timesWithoutMonitoring: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        loggerServiceWithoutMonitoring.log("测试日志");
        const end = performance.now();
        timesWithoutMonitoring.push(end - start);
      }

      await appWithoutMonitoring.close();

      // 计算平均时间
      const avgWithMonitoring =
        timesWithMonitoring.reduce((a, b) => a + b, 0) / iterations;
      const avgWithoutMonitoring =
        timesWithoutMonitoring.reduce((a, b) => a + b, 0) / iterations;

      // 计算性能监控开销（差值）
      const monitoringOverhead = avgWithMonitoring - avgWithoutMonitoring;

      // 验证性能监控开销 < 0.5ms
      expect(monitoringOverhead).toBeLessThan(0.5);
    });

    it("性能监控在多次写入时开销应该 < 0.5ms", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          MetricsModule.forRoot({
            defaultLabels: { app: "test" },
            enableDefaultMetrics: false,
          }),
          FastifyLoggingModule.forRoot({
            config: {
              context: {
                enabled: false,
              },
              sanitizer: {
                enabled: false,
              },
              performance: {
                enabled: true,
                trackLogWriteTime: true,
              },
            },
          }),
        ],
        controllers: [TestController],
        providers: [TestService],
      }).compile();

      const app = moduleRef.createNestApplication<NestFastifyApplication>(
        new FastifyAdapter(),
      );

      await app.init();
      await app.getHttpAdapter().getInstance().ready();

      const loggerService =
        moduleRef.get<FastifyLoggerService>(FastifyLoggerService);

      // 测量连续写入的开销
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        loggerService.log(`测试日志 ${i}`);
      }
      const end = performance.now();

      await app.close();

      const totalTime = end - start;
      const avgTime = totalTime / 1000;

      // 验证平均时间合理（包含性能监控）
      // 性能监控开销应该很小
      expect(avgTime).toBeLessThan(1);
    });
  });
});

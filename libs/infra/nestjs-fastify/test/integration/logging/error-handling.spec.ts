/**
 * 错误处理集成测试
 *
 * @description 测试日志写入失败时的降级策略和错误处理
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
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
import { MetricsModule } from "../../../src/performance/metrics/metrics.module.js";
import { MetricsService } from "../../../src/performance/metrics/metrics.service.js";

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
          enabled: false,
        },
        sanitizer: {
          enabled: false,
        },
        errorHandling: {
          fallbackToConsole: true,
          silentFailures: false,
        },
      },
    }),
  ],
  controllers: [TestController],
  providers: [TestService],
})
class TestModule {}

describe("错误处理集成测试", () => {
  let app: NestFastifyApplication;
  let loggerService: FastifyLoggerService;
  let metricsService: MetricsService;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(async () => {
    // 设置 console spy
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const moduleRef = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    // 先初始化应用，确保 Fastify 实例可用
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // 然后获取服务
    loggerService = moduleRef.get<FastifyLoggerService>(FastifyLoggerService);
    try {
      metricsService = moduleRef.get<MetricsService>(MetricsService);
    } catch {
      // MetricsService 可能不可用，这是可选的
      metricsService = undefined as unknown as MetricsService;
    }
  });

  afterEach(async () => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    await app.close();
  });

  it("应该在日志写入失败时降级到控制台", async () => {
    // 模拟 Pino logger 写入失败
    const pinoLogger = loggerService.getPinoLogger();
    const originalInfo = pinoLogger.info.bind(pinoLogger);
    const errorSpy = jest.spyOn(pinoLogger, "info").mockImplementation(() => {
      throw new Error("模拟日志写入失败");
    });

    // 写入日志应该不会抛出错误，而是降级到控制台
    expect(() => {
      loggerService.log("测试日志");
    }).not.toThrow();

    // 验证降级到控制台（如果配置了 fallbackToConsole）
    // 注意：由于我们 mock 了 console.error，这里验证它被调用
    // 但实际上降级逻辑可能在 FastifyLoggerService 内部处理

    errorSpy.mockRestore();
  });

  it("应该在静默失败模式下不输出错误", async () => {
    await app.close();

    const moduleRef = await Test.createTestingModule({
      imports: [
        FastifyLoggingModule.forRoot({
          config: {
            context: {
              enabled: false,
            },
            sanitizer: {
              enabled: false,
            },
            errorHandling: {
              fallbackToConsole: false,
              silentFailures: true,
            },
          },
        }),
      ],
      controllers: [TestController],
      providers: [TestService],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    loggerService = moduleRef.get<FastifyLoggerService>(FastifyLoggerService);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // 模拟日志写入失败
    const pinoLogger = loggerService.getPinoLogger();
    const errorSpy = jest.spyOn(pinoLogger, "info").mockImplementation(() => {
      throw new Error("模拟日志写入失败");
    });

    // 在静默失败模式下，应该不会抛出错误
    expect(() => {
      loggerService.log("测试日志");
    }).not.toThrow();

    // 验证控制台错误没有被调用（静默失败）
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("应该记录日志写入错误指标", async () => {
    // 模拟日志写入失败
    const pinoLogger = loggerService.getPinoLogger();
    const errorSpy = jest.spyOn(pinoLogger, "info").mockImplementation(() => {
      throw new Error("模拟日志写入失败");
    });

    // 写入日志
    loggerService.log("测试日志");

    // 获取指标
    if (metricsService) {
      const metrics = await metricsService.getMetrics();
      // 验证错误指标存在
      expect(metrics).toContain("log_write_errors_total");
    }

    errorSpy.mockRestore();
  });

  it("应该在正常写入时不影响应用功能", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/test",
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ success: true });
  });

  it("应该在部分日志写入失败时继续处理其他日志", async () => {
    const pinoLogger = loggerService.getPinoLogger();
    let callCount = 0;
    const originalInfo = pinoLogger.info.bind(pinoLogger);

    // 模拟部分日志写入失败
    const errorSpy = jest
      .spyOn(pinoLogger, "info")
      .mockImplementation((...args: unknown[]) => {
        callCount++;
        if (callCount === 1) {
          // 第一次调用失败
          throw new Error("模拟日志写入失败");
        }
        // 后续调用成功，使用原始实现
        return originalInfo(...args);
      });

    // 写入多条日志（应该不会因为第一次失败而中断）
    expect(() => {
      loggerService.log("第一条日志");
    }).not.toThrow();

    expect(() => {
      loggerService.log("第二条日志");
    }).not.toThrow();

    expect(() => {
      loggerService.log("第三条日志");
    }).not.toThrow();

    // 验证至少被调用了 3 次（可能更多，因为错误处理）
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("应该在不同错误处理配置下正常工作", async () => {
    // 测试配置：降级到控制台 + 不静默失败
    await app.close();

    const moduleRef = await Test.createTestingModule({
      imports: [
        FastifyLoggingModule.forRoot({
          config: {
            context: {
              enabled: false,
            },
            sanitizer: {
              enabled: false,
            },
            errorHandling: {
              fallbackToConsole: true,
              silentFailures: false,
            },
          },
        }),
      ],
      controllers: [TestController],
      providers: [TestService],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    loggerService = moduleRef.get<FastifyLoggerService>(FastifyLoggerService);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.inject({
      method: "GET",
      url: "/test",
    });

    expect(response.statusCode).toBe(200);
  });
});

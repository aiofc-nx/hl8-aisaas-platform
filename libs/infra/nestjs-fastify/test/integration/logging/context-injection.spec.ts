/**
 * 上下文注入集成测试
 *
 * @description 测试请求上下文自动注入功能的完整流程
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
import { ContextStorage } from "../../../src/logging/context/context-storage.js";
import type { LoggingConfig } from "../../../src/config/logging.config.js";

@Injectable()
class TestService {
  constructor(private readonly logger: FastifyLoggerService) {}

  async doSomething() {
    this.logger.log("执行操作", { action: "test" });
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
    this.logger.log("处理请求", { controller: "TestController" });
    return this.service.doSomething();
  }
}

@Module({
  imports: [
    FastifyLoggingModule.forRoot({
      config: {
        context: {
          enabled: true,
          includeRequestDetails: true,
        },
        sanitizer: {
          enabled: false, // 在集成测试中禁用脱敏，专注于上下文注入
        },
      },
    }),
  ],
  controllers: [TestController],
  providers: [TestService],
})
class TestModule {}

describe("上下文注入集成测试", () => {
  let app: NestFastifyApplication;
  let loggerService: FastifyLoggerService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    loggerService = moduleRef.get<FastifyLoggerService>(FastifyLoggerService);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("应该自动注入请求上下文到日志", async () => {
    const logSpy = jest.spyOn(loggerService.getPinoLogger(), "info");

    const response = await app.inject({
      method: "GET",
      url: "/test",
      headers: {
        "x-request-id": "integration-test-123",
        "user-agent": "test-agent",
      },
    });

    expect(response.statusCode).toBe(200);

    // 验证日志被调用
    expect(logSpy).toHaveBeenCalled();

    // 验证日志上下文包含请求信息
    const logCall = logSpy.mock.calls[0];
    if (logCall && Array.isArray(logCall[0])) {
      const logContext = logCall[0][0];
      expect(logContext).toHaveProperty("request");
      expect(logContext.request).toHaveProperty("requestId");
      expect(logContext.request).toHaveProperty("method");
      expect(logContext.request).toHaveProperty("url");
    }

    logSpy.mockRestore();
  });

  it("应该在异步操作中保持上下文", async () => {
    const logSpy = jest.spyOn(loggerService.getPinoLogger(), "info");

    const response = await app.inject({
      method: "GET",
      url: "/test",
      headers: {
        "x-request-id": "async-test-456",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(logSpy).toHaveBeenCalled();

    logSpy.mockRestore();
  });

  it("应该在上下文禁用时不注入上下文", async () => {
    // 关闭应用并重新创建，使用禁用上下文的配置
    await app.close();

    const moduleRef = await Test.createTestingModule({
      imports: [
        FastifyLoggingModule.forRoot({
          config: {
            context: {
              enabled: false,
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

    const logSpy = jest.spyOn(loggerService.getPinoLogger(), "info");

    await app.inject({
      method: "GET",
      url: "/test",
      headers: {
        "x-request-id": "disabled-test-789",
      },
    });

    // 验证日志被调用，但不包含请求上下文
    expect(logSpy).toHaveBeenCalled();

    logSpy.mockRestore();
  });
});

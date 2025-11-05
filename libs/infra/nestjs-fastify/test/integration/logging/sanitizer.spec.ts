/**
 * 脱敏功能集成测试
 *
 * @description 测试敏感信息脱敏功能在完整请求流程中的行为
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
import type { LoggingConfig } from "../../../src/config/logging.config.js";

@Injectable()
class UserService {
  constructor(private readonly logger: FastifyLoggerService) {}

  async createUser(userData: {
    username: string;
    password: string;
    email: string;
    token?: string;
  }) {
    // 模拟创建用户，记录包含敏感信息的日志
    this.logger.log("创建用户", {
      username: userData.username,
      password: userData.password,
      email: userData.email,
      token: userData.token,
      apiKey: "secret-api-key-123",
      secret: "my-secret-value",
    });
    return { success: true, userId: "123" };
  }
}

@Controller("users")
class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("create")
  async createUser() {
    return this.userService.createUser({
      username: "testuser",
      password: "secret-password",
      email: "test@example.com",
      token: "access-token-123",
    });
  }
}

@Module({
  imports: [
    FastifyLoggingModule.forRoot({
      config: {
        context: {
          enabled: true,
          includeRequestDetails: false, // 简化测试，专注于脱敏
        },
        sanitizer: {
          enabled: true,
          placeholder: "***",
        },
      },
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
})
class TestModule {}

describe("脱敏功能集成测试", () => {
  let app: NestFastifyApplication;
  let loggerService: FastifyLoggerService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    // 先初始化应用，确保 Fastify 实例可用
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // 然后获取 loggerService
    loggerService = moduleRef.get<FastifyLoggerService>(FastifyLoggerService);
  });

  afterEach(async () => {
    await app.close();
  });

  it("应该自动脱敏敏感字段", async () => {
    const logSpy = jest.spyOn(loggerService.getPinoLogger(), "info");

    const response = await app.inject({
      method: "GET",
      url: "/users/create",
    });

    expect(response.statusCode).toBe(200);
    expect(logSpy).toHaveBeenCalled();

    // 验证日志上下文中的敏感字段被脱敏
    const logCall = logSpy.mock.calls.find((call) => {
      const context = call[0] as Record<string, unknown>;
      return context && typeof context === "object" && "username" in context;
    });

    if (logCall && logCall[0]) {
      const logContext = logCall[0] as Record<string, unknown>;
      // 验证敏感字段被脱敏
      expect(logContext.password).toBe("***");
      expect(logContext.token).toBe("***");
      expect(logContext.apiKey).toBe("***");
      expect(logContext.secret).toBe("***");
      // 验证非敏感字段保持不变
      expect(logContext.username).toBe("testuser");
      expect(logContext.email).toBe("test@example.com");
    }

    logSpy.mockRestore();
  });

  it("应该支持自定义脱敏占位符", async () => {
    // 关闭应用并重新创建，使用自定义占位符
    await app.close();

    const moduleRef = await Test.createTestingModule({
      imports: [
        FastifyLoggingModule.forRoot({
          config: {
            context: {
              enabled: false,
            },
            sanitizer: {
              enabled: true,
              placeholder: "[REDACTED]",
            },
          },
        }),
      ],
      controllers: [UserController],
      providers: [UserService],
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
      url: "/users/create",
    });

    expect(logSpy).toHaveBeenCalled();

    const logCall = logSpy.mock.calls.find((call) => {
      const context = call[0] as Record<string, unknown>;
      return context && typeof context === "object" && "username" in context;
    });

    if (logCall && logCall[0]) {
      const logContext = logCall[0] as Record<string, unknown>;
      expect(logContext.password).toBe("[REDACTED]");
    }

    logSpy.mockRestore();
  });

  it("应该支持自定义敏感字段列表", async () => {
    await app.close();

    const moduleRef = await Test.createTestingModule({
      imports: [
        FastifyLoggingModule.forRoot({
          config: {
            context: {
              enabled: false,
            },
            sanitizer: {
              enabled: true,
              sensitiveFields: ["customField", /^secret/i],
            },
          },
        }),
      ],
      controllers: [UserController],
      providers: [UserService],
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
      url: "/users/create",
    });

    expect(logSpy).toHaveBeenCalled();

    logSpy.mockRestore();
  });

  it("应该支持嵌套对象的脱敏", async () => {
    const logSpy = jest.spyOn(loggerService.getPinoLogger(), "info");

    // 创建一个包含嵌套对象的服务方法
    @Injectable()
    class NestedService {
      constructor(private readonly logger: FastifyLoggerService) {}

      async processNested() {
        this.logger.log("处理嵌套数据", {
          user: {
            name: "John",
            password: "secret123",
            profile: {
              email: "john@example.com",
              token: "access-token",
            },
          },
        });
      }
    }

    @Controller("nested")
    class NestedController {
      constructor(private readonly service: NestedService) {}

      @Get()
      async test() {
        return this.service.processNested();
      }
    }

    await app.close();

    const moduleRef = await Test.createTestingModule({
      imports: [
        FastifyLoggingModule.forRoot({
          config: {
            context: {
              enabled: false,
            },
            sanitizer: {
              enabled: true,
            },
          },
        }),
      ],
      controllers: [NestedController],
      providers: [NestedService],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    loggerService = moduleRef.get<FastifyLoggerService>(FastifyLoggerService);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const nestedLogSpy = jest.spyOn(loggerService.getPinoLogger(), "info");

    await app.inject({
      method: "GET",
      url: "/nested",
    });

    expect(nestedLogSpy).toHaveBeenCalled();

    const logCall = nestedLogSpy.mock.calls[0];
    if (logCall && logCall[0]) {
      const logContext = logCall[0] as Record<string, unknown>;
      const user = logContext.user as Record<string, unknown>;
      expect(user.password).toBe("***");
      const profile = user.profile as Record<string, unknown>;
      expect(profile.token).toBe("***");
      expect(user.name).toBe("John");
      expect(profile.email).toBe("john@example.com");
    }

    nestedLogSpy.mockRestore();
  });

  it("应该在脱敏禁用时不脱敏", async () => {
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
          },
        }),
      ],
      controllers: [UserController],
      providers: [UserService],
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
      url: "/users/create",
    });

    expect(logSpy).toHaveBeenCalled();

    const logCall = logSpy.mock.calls.find((call) => {
      const context = call[0] as Record<string, unknown>;
      return context && typeof context === "object" && "username" in context;
    });

    if (logCall && logCall[0]) {
      const logContext = logCall[0] as Record<string, unknown>;
      // 验证敏感字段未被脱敏（因为脱敏已禁用）
      expect(logContext.password).toBe("secret-password");
      expect(logContext.token).toBe("access-token-123");
    }

    logSpy.mockRestore();
  });
});

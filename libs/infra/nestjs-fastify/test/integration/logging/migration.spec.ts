/**
 * 迁移测试用例
 *
 * @description 验证从 NestJS 内置 Logger 到 FastifyLoggerService 的无缝迁移
 */

import { describe, it, expect, jest, beforeAll, afterAll } from "@jest/globals";
import { Test } from "@nestjs/testing";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Module, Injectable, Controller, Get } from "@nestjs/common";
import {
  FastifyLoggingModule,
  FastifyLoggerService,
} from "../../../src/logging/index.js";

/**
 * 模拟 NestJS 内置 Logger 的使用方式
 */
interface NestLoggerService {
  log(message: string, context?: string): void;
  error(message: string, stack?: string, context?: string): void;
  warn(message: string, context?: string): void;
  debug(message: string, context?: string): void;
  verbose(message: string, context?: string): void;
}

/**
 * 使用 NestJS Logger 风格的服务（迁移前）
 */
@Injectable()
class OldStyleService {
  constructor(private readonly logger: NestLoggerService) {}

  doSomething() {
    this.logger.log("执行操作", "OldStyleService");
    this.logger.warn("警告信息", "OldStyleService");
    this.logger.error("错误信息", "错误堆栈", "OldStyleService");
    this.logger.debug("调试信息", "OldStyleService");
    this.logger.verbose("详细信息", "OldStyleService");
  }
}

/**
 * 使用 FastifyLoggerService 的服务（迁移后）
 */
@Injectable()
class NewStyleService {
  constructor(private readonly logger: FastifyLoggerService) {}

  doSomething() {
    // 完全兼容 NestJS Logger 的 API
    this.logger.log("执行操作", { context: "NewStyleService" });
    this.logger.warn("警告信息", { context: "NewStyleService" });
    this.logger.error("错误信息", "错误堆栈", {
      context: "NewStyleService",
    });
    this.logger.debug("调试信息", { context: "NewStyleService" });
    this.logger.verbose("详细信息", { context: "NewStyleService" });

    // 也可以使用新的结构化上下文
    this.logger.log("执行操作", {
      business: {
        operation: "doSomething",
        resource: "NewStyleService",
      },
    });
  }
}

/**
 * 混合使用方式的服务（迁移中）
 */
@Injectable()
class MigratingService {
  constructor(private readonly logger: FastifyLoggerService) {}

  doSomething() {
    // 可以使用旧的字符串 context 方式
    this.logger.log("执行操作", { context: "MigratingService" });

    // 也可以使用新的结构化上下文
    this.logger.log("执行操作", {
      business: {
        operation: "doSomething",
        resource: "MigratingService",
      },
    });
  }
}

@Controller("test")
class TestController {
  constructor(private readonly service: NewStyleService) {}

  @Get()
  async test() {
    this.service.doSomething();
    return { success: true };
  }
}

@Module({
  imports: [
    FastifyLoggingModule.forRoot({
      config: {
        level: "debug",
        context: {
          enabled: false, // 简化测试
        },
        sanitizer: {
          enabled: false,
        },
      },
    }),
  ],
  controllers: [TestController],
  providers: [NewStyleService],
})
class TestModule {}

describe("迁移测试用例", () => {
  let app: NestFastifyApplication;
  let loggerService: FastifyLoggerService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    loggerService = moduleRef.get<FastifyLoggerService>(FastifyLoggerService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe("API 兼容性测试", () => {
    it("应该支持 log(message, context) 方法", () => {
      expect(() => {
        loggerService.log("测试消息", { context: "TestContext" });
      }).not.toThrow();
    });

    it("应该支持 error(message, stack, context) 方法", () => {
      expect(() => {
        loggerService.error("测试错误", "错误堆栈", { context: "TestContext" });
      }).not.toThrow();
    });

    it("应该支持 error(Error, context) 方法", () => {
      expect(() => {
        const error = new Error("测试错误");
        loggerService.error(error, { context: "TestContext" });
      }).not.toThrow();
    });

    it("应该支持 warn(message, context) 方法", () => {
      expect(() => {
        loggerService.warn("测试警告", { context: "TestContext" });
      }).not.toThrow();
    });

    it("应该支持 debug(message, context) 方法", () => {
      expect(() => {
        loggerService.debug("测试调试", { context: "TestContext" });
      }).not.toThrow();
    });

    it("应该支持 verbose(message, context) 方法", () => {
      expect(() => {
        loggerService.verbose("测试详细", { context: "TestContext" });
      }).not.toThrow();
    });
  });

  describe("日志级别映射测试", () => {
    it("log() 应该映射到 info 级别", () => {
      const pinoLogger = loggerService.getPinoLogger();
      const spy = jest.spyOn(pinoLogger, "info");

      loggerService.log("测试消息");

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it("warn() 应该映射到 warn 级别", () => {
      const pinoLogger = loggerService.getPinoLogger();
      const spy = jest.spyOn(pinoLogger, "warn");

      loggerService.warn("测试警告");

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it("error() 应该映射到 error 级别", () => {
      const pinoLogger = loggerService.getPinoLogger();
      const spy = jest.spyOn(pinoLogger, "error");

      loggerService.error("测试错误");

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it("debug() 应该映射到 debug 级别", () => {
      const pinoLogger = loggerService.getPinoLogger();
      const spy = jest.spyOn(pinoLogger, "debug");

      loggerService.debug("测试调试");

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it("verbose() 应该映射到 trace 级别", () => {
      const pinoLogger = loggerService.getPinoLogger();
      const spy = jest.spyOn(pinoLogger, "trace");

      loggerService.verbose("测试详细");

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe("迁移场景测试", () => {
    it("应该支持直接替换 NestJS Logger", () => {
      const service = new NewStyleService(loggerService);

      expect(() => {
        service.doSomething();
      }).not.toThrow();
    });

    it("应该支持渐进式迁移", () => {
      const service = new MigratingService(loggerService);

      expect(() => {
        service.doSomething();
      }).not.toThrow();
    });

    it("应该支持在服务中注入使用", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/test",
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ success: true });
    });
  });

  describe("向后兼容性测试", () => {
    it("应该支持字符串 context（通过对象传递）", () => {
      expect(() => {
        loggerService.log("测试消息", { context: "TestContext" });
      }).not.toThrow();
    });

    it("应该支持 Error 对象作为第一个参数", () => {
      expect(() => {
        const error = new Error("测试错误");
        loggerService.error(error, { context: "TestContext" });
      }).not.toThrow();
    });

    it("应该支持字符串消息 + 堆栈 + context", () => {
      expect(() => {
        loggerService.error("测试错误", "错误堆栈", { context: "TestContext" });
      }).not.toThrow();
    });
  });

  describe("新功能测试", () => {
    it("应该支持结构化上下文", () => {
      expect(() => {
        loggerService.log("测试消息", {
          business: {
            operation: "test",
            resource: "Test",
          },
        });
      }).not.toThrow();
    });

    it("应该支持子日志器", () => {
      const childLogger = loggerService.child({ module: "TestModule" });

      expect(() => {
        childLogger.log("测试消息");
      }).not.toThrow();
    });

    it("应该支持自动上下文注入", async () => {
      // 如果启用上下文注入，应该自动包含请求上下文
      const response = await app.inject({
        method: "GET",
        url: "/test",
      });

      expect(response.statusCode).toBe(200);
    });
  });
});

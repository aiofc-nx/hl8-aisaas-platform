/**
 * 向后兼容性测试
 *
 * @description 验证 FastifyLoggerService 与 NestJS Logger 的 API 兼容性
 */

import { describe, it, expect, jest, beforeAll, afterAll } from "@jest/globals";
import { Test } from "@nestjs/testing";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Module, Injectable } from "@nestjs/common";
import {
  FastifyLoggingModule,
  FastifyLoggerService,
} from "../../../src/logging/index.js";
import type { LoggerService } from "@nestjs/common";

/**
 * 模拟使用 NestJS Logger 的旧代码
 */
interface OldLoggerAPI {
  log(message: string, context?: string): void;
  error(message: string, stack?: string, context?: string): void;
  error(message: Error, context?: string): void;
  warn(message: string, context?: string): void;
  debug(message: string, context?: string): void;
  verbose(message: string, context?: string): void;
}

@Module({
  imports: [
    FastifyLoggingModule.forRoot({
      config: {
        level: "debug",
        context: {
          enabled: false,
        },
        sanitizer: {
          enabled: false,
        },
      },
    }),
  ],
})
class TestModule {}

describe("向后兼容性测试", () => {
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

  describe("API 兼容性", () => {
    it("应该实现 LoggerService 接口", () => {
      // FastifyLoggerService 应该实现 NestJS LoggerService
      expect(loggerService).toBeInstanceOf(FastifyLoggerService);
      expect(typeof loggerService.log).toBe("function");
      expect(typeof loggerService.error).toBe("function");
      expect(typeof loggerService.warn).toBe("function");
      expect(typeof loggerService.debug).toBe("function");
      expect(typeof loggerService.verbose).toBe("function");
    });

    it("应该支持 log(message, context) 方法", () => {
      expect(() => {
        loggerService.log("测试消息", { context: "TestContext" });
      }).not.toThrow();
    });

    it("应该支持 error(message, stack, context) 方法", () => {
      expect(() => {
        loggerService.error("测试错误", "错误堆栈", {
          context: "TestContext",
        });
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

  describe("方法签名兼容性", () => {
    it("log 方法应该接受字符串消息和可选上下文", () => {
      // 无上下文
      expect(() => loggerService.log("消息")).not.toThrow();

      // 有上下文
      expect(() => loggerService.log("消息", {})).not.toThrow();

      // Error 对象
      expect(() => loggerService.log(new Error("错误"))).not.toThrow();
    });

    it("error 方法应该支持所有重载", () => {
      // 字符串消息
      expect(() => loggerService.error("错误")).not.toThrow();

      // 字符串消息 + 堆栈
      expect(() => loggerService.error("错误", "堆栈")).not.toThrow();

      // 字符串消息 + 堆栈 + 上下文
      expect(() =>
        loggerService.error("错误", "堆栈", { context: "Test" }),
      ).not.toThrow();

      // Error 对象
      expect(() => loggerService.error(new Error("错误"))).not.toThrow();

      // Error 对象 + 上下文
      expect(() =>
        loggerService.error(new Error("错误"), { context: "Test" }),
      ).not.toThrow();
    });

    it("warn 方法应该接受字符串消息和可选上下文", () => {
      expect(() => loggerService.warn("警告")).not.toThrow();
      expect(() => loggerService.warn("警告", {})).not.toThrow();
      expect(() => loggerService.warn(new Error("警告"))).not.toThrow();
    });

    it("debug 方法应该接受字符串消息和可选上下文", () => {
      expect(() => loggerService.debug("调试")).not.toThrow();
      expect(() => loggerService.debug("调试", {})).not.toThrow();
      expect(() => loggerService.debug(new Error("调试"))).not.toThrow();
    });

    it("verbose 方法应该接受字符串消息和可选上下文", () => {
      expect(() => loggerService.verbose("详细")).not.toThrow();
      expect(() => loggerService.verbose("详细", {})).not.toThrow();
      expect(() => loggerService.verbose(new Error("详细"))).not.toThrow();
    });
  });

  describe("日志级别映射兼容性", () => {
    it("应该正确映射所有日志级别", () => {
      const pinoLogger = loggerService.getPinoLogger();

      const traceSpy = jest.spyOn(pinoLogger, "trace");
      loggerService.verbose("详细");
      expect(traceSpy).toHaveBeenCalled();
      traceSpy.mockRestore();

      const debugSpy = jest.spyOn(pinoLogger, "debug");
      loggerService.debug("调试");
      expect(debugSpy).toHaveBeenCalled();
      debugSpy.mockRestore();

      const infoSpy = jest.spyOn(pinoLogger, "info");
      loggerService.log("信息");
      expect(infoSpy).toHaveBeenCalled();
      infoSpy.mockRestore();

      const warnSpy = jest.spyOn(pinoLogger, "warn");
      loggerService.warn("警告");
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();

      const errorSpy = jest.spyOn(pinoLogger, "error");
      loggerService.error("错误");
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe("直接替换兼容性", () => {
    it("应该可以直接替换 NestJS Logger", () => {
      // 模拟旧代码直接使用 LoggerService 类型
      const logger: LoggerService = loggerService;

      expect(() => {
        logger.log("测试");
        logger.warn("测试");
        logger.error("测试");
        logger.debug("测试");
        logger.verbose("测试");
      }).not.toThrow();
    });

    it("应该可以在依赖注入中直接替换", () => {
      // 模拟使用旧 API 的代码
      const logger: OldLoggerAPI = loggerService as unknown as OldLoggerAPI;

      expect(() => {
        logger.log("消息", "OldAPIService");
        logger.warn("警告", "OldAPIService");
        logger.error("错误", "堆栈信息", "OldAPIService");
        logger.debug("调试", "OldAPIService");
        logger.verbose("详细", "OldAPIService");

        // Error 对象方式
        const error = new Error("测试错误");
        logger.error(error, "OldAPIService");
      }).not.toThrow();
    });
  });

  describe("配置兼容性", () => {
    it("应该支持最小配置", () => {
      expect(() => {
        FastifyLoggingModule.forRoot({
          config: {
            level: "info",
          },
        });
      }).not.toThrow();
    });

    it("应该支持空配置", () => {
      expect(() => {
        FastifyLoggingModule.forRoot();
      }).not.toThrow();
    });

    it("应该支持逐步启用新功能", () => {
      expect(() => {
        FastifyLoggingModule.forRoot({
          config: {
            level: "info",
            context: {
              enabled: false, // 禁用上下文注入
            },
            sanitizer: {
              enabled: false, // 禁用脱敏
            },
            performance: {
              enabled: false, // 禁用性能监控
            },
          },
        });
      }).not.toThrow();
    });
  });
});

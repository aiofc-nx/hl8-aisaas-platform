/**
 * @fileoverview RateLimitGuard 单元测试
 */

import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RateLimitGuard } from "./rate-limit.guard";
import type { RateLimitOptions } from "./types/rate-limit-options";

describe("RateLimitGuard", () => {
  let guard: RateLimitGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RateLimitGuard(reflector);
  });

  const createMockContext = (options?: RateLimitOptions): ExecutionContext => {
    const mockRequest = {
      ip: "192.168.1.1",
      headers: {},
    };

    const headerCalls: Array<[string, string]> = [];
    const mockResponse = {
      header: (name: string, value: string) => {
        headerCalls.push([name, value]);
        return mockResponse;
      },
      headerCalls, // 暴露调用记录供测试使用
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    // Mock reflector.get to return options
    if (options !== undefined) {
      reflector.get = (() => options) as any;
    } else {
      reflector.get = (() => undefined) as any;
    }

    return mockContext;
  };

  describe("基础功能", () => {
    it("应该正确创建守卫实例", () => {
      expect(guard).toBeDefined();
    });

    it("应该在没有限流配置时放行", async () => {
      const context = createMockContext(undefined);
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });
  });

  describe("限流检查", () => {
    it("应该允许未超限的请求", async () => {
      const options: RateLimitOptions = {
        max: 100,
        timeWindow: 60000,
      };

      const context = createMockContext(options);
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe("响应头", () => {
    it("应该添加限流响应头", async () => {
      const options: RateLimitOptions = {
        max: 100,
        timeWindow: 60000,
        addHeaders: true,
      };

      const context = createMockContext(options);
      const response = context.switchToHttp().getResponse() as any;

      await guard.canActivate(context);

      const calls = response.headerCalls;
      expect(calls.some(([name]) => name === "X-RateLimit-Limit")).toBe(true);
      expect(calls.some(([name]) => name === "X-RateLimit-Remaining")).toBe(
        true,
      );
      expect(calls.some(([name]) => name === "X-RateLimit-Reset")).toBe(true);
    });

    it("应该在配置 addHeaders 为 false 时不添加响应头", async () => {
      const options: RateLimitOptions = {
        max: 100,
        timeWindow: 60000,
        addHeaders: false,
      };

      const context = createMockContext(options);
      const response = context.switchToHttp().getResponse() as any;

      await guard.canActivate(context);

      expect(response.headerCalls.length).toBe(0);
    });
  });
});

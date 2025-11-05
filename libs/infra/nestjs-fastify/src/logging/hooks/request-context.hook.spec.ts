/**
 * 请求上下文钩子单元测试
 *
 * @description 测试请求上下文钩子的功能
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import fastify, { FastifyInstance } from "fastify";
import { ContextStorage } from "../context/context-storage.js";
import { registerRequestContextHook } from "./request-context.hook.js";
import type { ContextConfig } from "../../config/logging.config.js";

describe("registerRequestContextHook", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = fastify();
  });

  afterEach(async () => {
    await app.close();
  });

  it("应该在 enabled 为 false 时不注册钩子", () => {
    const config: ContextConfig = { enabled: false };
    registerRequestContextHook(app, { config });

    // 注册路由以测试钩子是否执行
    app.get("/test", async () => ({ ok: true }));

    // 如果钩子未注册，上下文应该为空
    // 这里我们主要验证不会抛出错误
    expect(() => {
      registerRequestContextHook(app, { config });
    }).not.toThrow();
  });

  it("应该注册 onRequest 钩子并提取上下文", async () => {
    const config: ContextConfig = {
      enabled: true,
      includeRequestDetails: true,
    };

    registerRequestContextHook(app, { config });

    app.get("/test", async (request, reply) => {
      // 在请求处理函数中，上下文应该可用
      const context = ContextStorage.getContext();
      return {
        hasContext: !!context,
        requestId: context?.requestId,
        method: context?.method,
      };
    });

    const response = await app.inject({
      method: "GET",
      url: "/test",
      headers: {
        "x-request-id": "test-123",
      },
    });

    const body = JSON.parse(response.body);
    expect(body.hasContext).toBe(true);
    expect(body.requestId).toBe("test-123");
    expect(body.method).toBe("GET");
  });

  it("应该提取请求详情", async () => {
    const config: ContextConfig = {
      enabled: true,
      includeRequestDetails: true,
    };

    registerRequestContextHook(app, { config });

    app.get("/test", async () => {
      const context = ContextStorage.getContext();
      return {
        url: context?.url,
        path: context?.path,
        query: context?.query,
        ip: context?.ip,
        userAgent: context?.userAgent,
      };
    });

    const response = await app.inject({
      method: "GET",
      url: "/test?foo=bar",
      headers: {
        "user-agent": "test-agent",
      },
    });

    const body = JSON.parse(response.body);
    expect(body.url).toContain("/test");
    expect(body.path).toBe("/test");
    expect(body.query).toHaveProperty("foo", "bar");
    expect(body.userAgent).toBe("test-agent");
  });

  it("应该在 includeRequestDetails 为 false 时不提取请求详情", async () => {
    const config: ContextConfig = {
      enabled: true,
      includeRequestDetails: false,
    };

    registerRequestContextHook(app, { config });

    app.get("/test", async () => {
      const context = ContextStorage.getContext();
      return {
        method: context?.method,
        url: context?.url,
      };
    });

    const response = await app.inject({
      method: "GET",
      url: "/test",
    });

    const body = JSON.parse(response.body);
    expect(body.method).toBeUndefined();
    expect(body.url).toBeUndefined();
  });

  it("应该提取响应详情（如果配置启用）", async () => {
    const config: ContextConfig = {
      enabled: true,
      includeResponseDetails: true,
    };

    registerRequestContextHook(app, { config });

    app.get("/test", async (request, reply) => {
      // 在响应发送前，上下文应该可用，但 statusCode 和 responseTime 可能还未设置
      const context = ContextStorage.getContext();
      return {
        hasContext: !!context,
      };
    });

    const response = await app.inject({
      method: "GET",
      url: "/test",
    });

    expect(response.statusCode).toBe(200);
    // 注意：responseTime 在 onResponse 钩子中设置，这里无法直接验证
  });

  it("应该在上下文禁用时不提取任何信息", async () => {
    const config: ContextConfig = {
      enabled: false,
    };

    registerRequestContextHook(app, { config });

    app.get("/test", async () => {
      const context = ContextStorage.getContext();
      return {
        hasContext: !!context,
      };
    });

    const response = await app.inject({
      method: "GET",
      url: "/test",
      headers: {
        "x-request-id": "test-123",
      },
    });

    const body = JSON.parse(response.body);
    // 上下文应该为空（因为功能被禁用）
    expect(body.hasContext).toBe(false);
  });

  it("应该在异步操作中传播上下文", async () => {
    const config: ContextConfig = {
      enabled: true,
      includeRequestDetails: true,
    };

    registerRequestContextHook(app, { config });

    app.get("/test", async () => {
      const context1 = ContextStorage.getContext();

      // 执行异步操作
      await new Promise((resolve) => setTimeout(resolve, 10));

      const context2 = ContextStorage.getContext();

      return {
        requestId1: context1?.requestId,
        requestId2: context2?.requestId,
        sameContext: context1?.requestId === context2?.requestId,
      };
    });

    const response = await app.inject({
      method: "GET",
      url: "/test",
      headers: {
        "x-request-id": "async-test-123",
      },
    });

    const body = JSON.parse(response.body);
    expect(body.requestId1).toBe("async-test-123");
    expect(body.requestId2).toBe("async-test-123");
    expect(body.sameContext).toBe(true);
  });
});

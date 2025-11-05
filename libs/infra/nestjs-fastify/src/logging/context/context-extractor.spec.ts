/**
 * ContextExtractor 单元测试
 *
 * @description 测试上下文提取服务的功能
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import type { FastifyRequest, FastifyReply } from "fastify";
import { ContextExtractor } from "./context-extractor.js";
import type { ContextConfig } from "../../config/logging.config.js";

describe("ContextExtractor", () => {
  let extractor: ContextExtractor;
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    extractor = new ContextExtractor();
    mockRequest = {
      method: "GET",
      url: "/test?foo=bar",
      query: { foo: "bar" },
      ip: "192.168.1.1",
      headers: {
        "user-agent": "test-agent",
        "x-request-id": "req-123",
        "x-trace-id": "trace-456",
        "x-span-id": "span-789",
        "x-user-id": "user-123",
      },
      socket: {
        remoteAddress: "192.168.1.1",
      } as any,
    } as Partial<FastifyRequest>;

    mockReply = {
      statusCode: 200,
    } as Partial<FastifyReply>;
  });

  describe("extract", () => {
    it("应该提取请求 ID", () => {
      const context = extractor.extract(
        mockRequest as FastifyRequest,
        undefined,
        { enabled: true },
      );

      expect(context.requestId).toBe("req-123");
    });

    it("应该优先使用 req.requestId", () => {
      (mockRequest as any).requestId = "direct-123";
      const context = extractor.extract(
        mockRequest as FastifyRequest,
        undefined,
        { enabled: true },
      );

      expect(context.requestId).toBe("direct-123");
    });

    it("应该提取 traceId 和 spanId", () => {
      const context = extractor.extract(
        mockRequest as FastifyRequest,
        undefined,
        { enabled: true },
      );

      expect(context.traceId).toBe("trace-456");
      expect(context.spanId).toBe("span-789");
    });

    it("应该提取请求详情", () => {
      const context = extractor.extract(
        mockRequest as FastifyRequest,
        undefined,
        { enabled: true, includeRequestDetails: true },
      );

      expect(context.method).toBe("GET");
      expect(context.url).toBe("/test?foo=bar");
      expect(context.path).toBe("/test");
      expect(context.query).toEqual({ foo: "bar" });
      expect(context.ip).toBe("192.168.1.1");
      expect(context.userAgent).toBe("test-agent");
    });

    it("应该在 includeRequestDetails 为 false 时不提取请求详情", () => {
      const context = extractor.extract(
        mockRequest as FastifyRequest,
        undefined,
        { enabled: true, includeRequestDetails: false },
      );

      expect(context.method).toBeUndefined();
      expect(context.url).toBeUndefined();
      expect(context.path).toBeUndefined();
    });

    it("应该提取响应详情", () => {
      const context = extractor.extract(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply,
        { enabled: true, includeResponseDetails: true },
      );

      expect(context.statusCode).toBe(200);
    });

    it("应该在 includeResponseDetails 为 false 时不提取响应详情", () => {
      const context = extractor.extract(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply,
        { enabled: true, includeResponseDetails: false },
      );

      expect(context.statusCode).toBeUndefined();
    });

    it("应该提取用户信息", () => {
      const context = extractor.extract(
        mockRequest as FastifyRequest,
        undefined,
        { enabled: true, includeUserInfo: true },
      );

      expect(context.userId).toBe("user-123");
    });

    it("应该在 includeUserInfo 为 false 时不提取用户信息", () => {
      const context = extractor.extract(
        mockRequest as FastifyRequest,
        undefined,
        { enabled: true, includeUserInfo: false },
      );

      expect(context.userId).toBeUndefined();
      expect(context.sessionId).toBeUndefined();
    });

    it("应该在 enabled 为 false 时返回空上下文", () => {
      const context = extractor.extract(
        mockRequest as FastifyRequest,
        undefined,
        { enabled: false },
      );

      expect(context).toEqual({});
    });

    it("应该处理没有请求头的情况", () => {
      const minimalRequest = {
        method: "GET",
        url: "/test",
        headers: {},
        socket: { remoteAddress: "192.168.1.1" } as any,
      } as FastifyRequest;

      const context = extractor.extract(minimalRequest, undefined, {
        enabled: true,
      });

      expect(context.requestId).toBeUndefined();
      expect(context.method).toBe("GET");
    });
  });
});

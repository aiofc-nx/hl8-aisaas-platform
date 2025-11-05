/**
 * 上下文提取性能测试
 *
 * @description 验证上下文提取性能开销 < 1ms
 */

import { describe, it, expect } from "@jest/globals";
import { ContextExtractor } from "./context-extractor.js";
import type { FastifyRequest } from "fastify";
import type { ContextConfig } from "../../config/logging.config.js";

/**
 * 创建模拟的 FastifyRequest 对象
 */
function createMockRequest(): FastifyRequest {
  return {
    id: "test-123",
    method: "GET",
    url: "/api/users?page=1&limit=10",
    headers: {
      "x-request-id": "test-123",
      "user-agent": "Mozilla/5.0",
      "x-forwarded-for": "192.168.1.1",
    },
    ip: "192.168.1.1",
    hostname: "example.com",
    protocol: "http",
    query: { page: "1", limit: "10" },
    params: {},
    body: {},
    raw: {} as any,
    server: {} as any,
    socket: {} as any,
    log: {} as any,
    requestId: "test-123",
  } as FastifyRequest;
}

describe("上下文提取性能测试", () => {
  const extractor = new ContextExtractor();
  const config: ContextConfig = {
    enabled: true,
    includeRequestDetails: true,
    includeUserInfo: false,
  };

  it("上下文提取性能开销应该 < 1ms", () => {
    const request = createMockRequest();
    const iterations = 1000;

    // 预热
    for (let i = 0; i < 100; i++) {
      extractor.extract(request, undefined, config);
    }

    // 性能测试
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      extractor.extract(request, undefined, config);
    }
    const end = performance.now();

    const avgTime = (end - start) / iterations;

    console.log(
      `上下文提取平均耗时: ${avgTime.toFixed(4)}ms (${iterations} 次迭代)`,
    );

    // 验证平均耗时 < 1ms
    expect(avgTime).toBeLessThan(1);
  });

  it("上下文提取性能开销应该 < 1ms（包含用户信息）", () => {
    const request = createMockRequest();
    const configWithUser: ContextConfig = {
      enabled: true,
      includeRequestDetails: true,
      includeUserInfo: true,
    };

    // 扩展请求对象以包含用户信息
    (request as any).user = { id: "user-123", email: "test@example.com" };
    (request as any).userId = "user-123";

    const iterations = 1000;

    // 预热
    for (let i = 0; i < 100; i++) {
      extractor.extract(request, undefined, configWithUser);
    }

    // 性能测试
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      extractor.extract(request, undefined, configWithUser);
    }
    const end = performance.now();

    const avgTime = (end - start) / iterations;

    console.log(
      `上下文提取（含用户信息）平均耗时: ${avgTime.toFixed(4)}ms (${iterations} 次迭代)`,
    );

    // 验证平均耗时 < 1ms
    expect(avgTime).toBeLessThan(1);
  });

  it("上下文提取性能开销应该 < 1ms（仅基本上下文）", () => {
    const request = createMockRequest();
    const minimalConfig: ContextConfig = {
      enabled: true,
      includeRequestDetails: false,
      includeUserInfo: false,
    };

    const iterations = 1000;

    // 预热
    for (let i = 0; i < 100; i++) {
      extractor.extract(request, undefined, minimalConfig);
    }

    // 性能测试
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      extractor.extract(request, undefined, minimalConfig);
    }
    const end = performance.now();

    const avgTime = (end - start) / iterations;

    console.log(
      `上下文提取（仅基本）平均耗时: ${avgTime.toFixed(4)}ms (${iterations} 次迭代)`,
    );

    // 验证平均耗时 < 1ms
    expect(avgTime).toBeLessThan(1);
  });
});

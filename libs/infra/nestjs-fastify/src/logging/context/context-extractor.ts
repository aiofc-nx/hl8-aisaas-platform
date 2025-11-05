/**
 * 上下文提取服务
 *
 * @description 从 Fastify 请求对象中提取请求上下文信息
 *
 * ## 业务规则
 *
 * ### 提取规则
 * - requestId: 优先从 req.requestId 提取，其次从 X-Request-Id 头提取
 * - traceId: 从 X-Trace-Id 头提取（分布式追踪）
 * - spanId: 从 X-Span-Id 头提取（分布式追踪）
 * - method、url、path、query、ip、userAgent: 从 Fastify 请求对象提取
 * - statusCode、responseTime: 从响应对象提取（如果可用）
 * - userId、sessionId: 从请求头或认证信息提取（如果配置启用）
 *
 * ### 性能要求
 * - 上下文提取开销 < 0.5ms
 * - 避免深度复制大对象
 *
 * @since 1.0.0
 */

import type { FastifyRequest, FastifyReply } from "fastify";
import type { RequestContext } from "./request-context.types.js";
import type { ContextConfig } from "../../config/logging.config.js";

/**
 * Fastify 请求对象扩展接口
 *
 * @description 扩展 FastifyRequest 以支持自定义属性
 * 某些插件或中间件可能会在请求对象上添加 requestId 等属性
 * 使用接口扩展而不是 any 类型，提供类型安全
 */
interface ExtendedFastifyRequest extends FastifyRequest {
  /** 请求 ID（可能由插件或中间件设置） */
  requestId?: string;
  /** 用户信息（可能由认证中间件设置） */
  user?: { id?: string };
  /** 用户 ID（直接属性形式） */
  userId?: string;
  /** 会话信息（可能由会话中间件设置） */
  session?: { id?: string };
  /** 会话 ID（直接属性形式） */
  sessionId?: string;
}

/**
 * 上下文提取服务
 *
 * @description 从 Fastify 请求对象中提取请求上下文信息
 *
 * @class ContextExtractor
 */
export class ContextExtractor {
  /**
   * 从 Fastify 请求对象中提取请求上下文
   *
   * @description 根据配置提取相应的上下文信息
   *
   * ## 业务规则
   *
   * ### 提取优先级
   * 1. requestId: req.requestId > X-Request-Id 头
   * 2. traceId: X-Trace-Id 头
   * 3. spanId: X-Span-Id 头
   * 4. HTTP 信息: 从请求对象直接提取
   * 5. 用户信息: 从请求头或认证信息提取（如果配置启用）
   *
   * ### 性能优化
   * - 使用对象引用，避免深度复制
   * - 仅在配置启用时提取相应字段
   *
   * @param request - Fastify 请求对象
   * @param reply - Fastify 响应对象（可选，用于提取响应信息）
   * @param config - 上下文配置
   * @returns 请求上下文
   *
   * @example
   * ```typescript
   * const extractor = new ContextExtractor();
   * const context = extractor.extract(request, reply, {
   *   enabled: true,
   *   includeRequestDetails: true,
   *   includeResponseDetails: true,
   *   includeUserInfo: false,
   * });
   * ```
   */
  extract(
    request: FastifyRequest,
    reply?: FastifyReply,
    config?: ContextConfig,
  ): RequestContext {
    const context: RequestContext = {};

    // 如果上下文功能未启用，返回空上下文
    if (config?.enabled === false) {
      return context;
    }

    // 提取请求标识
    // 使用类型断言访问可能由插件或中间件添加的自定义属性
    // 这些属性不在 FastifyRequest 标准类型中，但实际运行时可能存在
    const extendedRequest = request as ExtendedFastifyRequest;
    context.requestId =
      extendedRequest.requestId ||
      this.extractHeader(request, "x-request-id") ||
      this.extractHeader(request, "X-Request-Id");

    context.traceId =
      this.extractHeader(request, "x-trace-id") ||
      this.extractHeader(request, "X-Trace-Id");

    context.spanId =
      this.extractHeader(request, "x-span-id") ||
      this.extractHeader(request, "X-Span-Id");

    // 提取请求详情（如果配置启用）
    if (config?.includeRequestDetails !== false) {
      context.method = request.method;
      context.url = request.url;
      context.path = this.extractPath(request.url);
      context.query = request.query as Record<string, unknown>;
      context.ip =
        request.ip ||
        (request.headers["x-forwarded-for"] as string)?.split(",")[0] ||
        (request.socket.remoteAddress as string);
      context.userAgent = request.headers["user-agent"] as string;
    }

    // 提取响应详情（如果配置启用且响应对象可用）
    if (config?.includeResponseDetails && reply) {
      context.statusCode = reply.statusCode;
      // responseTime 需要在响应完成后计算，这里暂时不设置
    }

    // 提取用户信息（如果配置启用）
    if (config?.includeUserInfo) {
      // 使用扩展接口访问可能由认证中间件添加的用户信息
      const extendedRequest = request as ExtendedFastifyRequest;
      context.userId =
        this.extractHeader(request, "x-user-id") ||
        this.extractHeader(request, "X-User-Id") ||
        extendedRequest.user?.id ||
        extendedRequest.userId;

      context.sessionId =
        this.extractHeader(request, "x-session-id") ||
        this.extractHeader(request, "X-Session-Id") ||
        extendedRequest.session?.id ||
        extendedRequest.sessionId;
    }

    return context;
  }

  /**
   * 提取请求头
   *
   * @description 从请求头中提取指定字段的值
   *
   * @param request - Fastify 请求对象
   * @param headerName - 请求头名称（不区分大小写）
   * @returns 请求头值或 undefined
   *
   * @private
   */
  private extractHeader(
    request: FastifyRequest,
    headerName: string,
  ): string | undefined {
    const header = request.headers[headerName.toLowerCase()];
    if (typeof header === "string") {
      return header;
    }
    if (Array.isArray(header) && header.length > 0) {
      return header[0];
    }
    return undefined;
  }

  /**
   * 提取请求路径（不含查询参数）
   *
   * @description 从完整 URL 中提取路径部分
   *
   * @param url - 完整 URL
   * @returns 路径部分（不含查询参数）
   *
   * @private
   */
  private extractPath(url: string): string {
    try {
      const urlObj = new URL(url, "http://localhost");
      return urlObj.pathname;
    } catch {
      // 如果 URL 解析失败，尝试手动提取
      const queryIndex = url.indexOf("?");
      return queryIndex >= 0 ? url.substring(0, queryIndex) : url;
    }
  }
}

/**
 * 请求上下文钩子
 *
 * @description Fastify 钩子，用于自动提取和存储请求上下文
 *
 * ## 业务规则
 *
 * ### 钩子执行时机
 * - onRequest: 在请求开始时提取上下文并存储到 AsyncLocalStorage
 * - onResponse: 在响应完成时更新响应信息（statusCode、responseTime）
 * - onError: 在错误发生时仍可访问上下文
 *
 * ### 上下文生命周期
 * - 在 onRequest 中设置上下文
 * - 在整个请求生命周期中自动传播
 * - 请求结束后 AsyncLocalStorage 自动清理
 *
 * @since 1.0.0
 */

import type { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { ContextStorage } from "../context/context-storage.js";
import { ContextExtractor } from "../context/context-extractor.js";
import type { ContextConfig } from "../../config/logging.config.js";
import type { RequestContext } from "../context/request-context.types.js";

/**
 * Fastify 响应对象扩展接口
 *
 * @description 扩展 FastifyReply 以支持存储请求上下文
 * 用于在 onResponse 钩子中访问请求上下文
 * 使用接口扩展而不是 any 类型，提供类型安全
 */
interface ExtendedFastifyReply extends FastifyReply {
  /** 请求上下文（由 onRequest 钩子设置） */
  __requestContext?: RequestContext;
}

/**
 * 请求上下文管理器
 *
 * @description 使用 WeakMap 存储请求对象与上下文的关联
 * 用于在 onResponse 钩子中访问和更新上下文
 */
const requestContextMap = new WeakMap<FastifyRequest, RequestContext>();

/**
 * 请求上下文钩子选项
 *
 * @interface RequestContextHookOptions
 */
export interface RequestContextHookOptions {
  /** 上下文配置 */
  config?: ContextConfig;
}

/**
 * 注册请求上下文钩子
 *
 * @description 在 Fastify 实例上注册请求上下文钩子
 * 自动提取和存储请求上下文到 AsyncLocalStorage
 *
 * ## 业务规则
 *
 * ### 钩子注册
 * - onRequest: 提取请求上下文并存储
 * - onResponse: 更新响应信息（如果配置启用）
 *
 * ### 性能要求
 * - 上下文提取开销 < 0.5ms
 * - 上下文存储开销 < 0.1ms
 * - 总开销 < 1ms
 *
 * @param fastify - Fastify 实例
 * @param options - 钩子选项
 *
 * @example
 * ```typescript
 * registerRequestContextHook(fastify, {
 *   config: {
 *     enabled: true,
 *     includeRequestDetails: true,
 *     includeResponseDetails: true,
 *   },
 * });
 * ```
 */
export function registerRequestContextHook(
  fastify: FastifyInstance,
  options: RequestContextHookOptions = {},
): void {
  const extractor = new ContextExtractor();
  const config = options.config;

  // 如果上下文功能未启用，不注册钩子
  if (config?.enabled === false) {
    return;
  }

  // 记录请求开始时间（用于计算响应时间）
  const requestStartTimes = new WeakMap<FastifyRequest, number>();

  // Fastify 请求对象扩展接口
  // 用于在请求对象上存储上下文，作为 AsyncLocalStorage 的回退机制
  interface ExtendedFastifyRequest extends FastifyRequest {
    /** 请求上下文（由 onRequest 钩子设置） */
    __requestContext?: RequestContext;
  }

  // onRequest 钩子：提取请求上下文并设置到 AsyncLocalStorage
  // 使用 enterWith() 方法确保上下文在整个请求生命周期中可用
  // 包括路由处理函数、中间件、后续的异步操作等
  fastify.addHook(
    "onRequest",
    async (request: FastifyRequest, reply: FastifyReply) => {
      // 记录请求开始时间
      requestStartTimes.set(request, Date.now());

      // 提取请求上下文
      const context = extractor.extract(request, undefined, config);

      // 存储上下文到 WeakMap 和回复对象（用于在 onResponse 中访问）
      requestContextMap.set(request, context);
      // 使用扩展接口设置请求上下文，避免使用 any 类型
      (reply as ExtendedFastifyReply).__requestContext = context;
      // 同时存储到 request 对象上（作为回退机制）
      (request as ExtendedFastifyRequest).__requestContext = context;

      // 使用 enterWith() 在当前异步上下文中设置上下文
      // 这确保上下文在整个请求处理链中可用，包括路由处理函数
      // enterWith() 不会在函数返回时自动清理上下文，会在后续异步操作中自动传播
      ContextStorage.enterWith(context);
    },
  );

  // preHandler 钩子：在路由处理函数执行前再次设置上下文
  // 确保路由处理函数及其异步操作可以访问上下文
  // 这是因为 Fastify 的路由处理函数可能在一个新的异步上下文中执行
  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, _reply: FastifyReply) => {
      // 从 WeakMap 或 request 对象获取上下文
      const context =
        requestContextMap.get(request) ||
        (request as ExtendedFastifyRequest).__requestContext;

      if (context) {
        // 再次使用 enterWith() 设置上下文，确保路由处理函数可以访问
        ContextStorage.enterWith(context);
      }
    },
  );

  // onResponse 钩子：更新响应信息
  if (config?.includeResponseDetails) {
    fastify.addHook(
      "onResponse",
      async (request: FastifyRequest, reply: FastifyReply) => {
        const startTime = requestStartTimes.get(request);
        if (startTime) {
          const responseTime = Date.now() - startTime;
          // 使用扩展接口访问请求上下文，避免使用 any 类型
          const extendedReply = reply as ExtendedFastifyReply;
          const context =
            requestContextMap.get(request) || extendedReply.__requestContext;

          if (context) {
            context.statusCode = reply.statusCode;
            context.responseTime = responseTime;
          }

          // 清理开始时间记录
          requestStartTimes.delete(request);
        }
      },
    );
  }
}

/**
 * 创建请求上下文包装器
 *
 * @description 包装请求处理函数，自动设置和清理上下文
 * 使用泛型和 unknown 类型替代 any，提供更好的类型安全
 *
 * @param handler - 请求处理函数
 * @param context - 请求上下文
 * @returns 包装后的处理函数
 *
 * @example
 * ```typescript
 * const wrappedHandler = wrapWithContext(handler, context);
 * ```
 */
export function wrapWithContext<T extends (...args: unknown[]) => unknown>(
  handler: T,
  context: RequestContext,
): T {
  return ((...args: Parameters<T>) => {
    return ContextStorage.run(context, () => handler(...args) as ReturnType<T>);
  }) as T;
}

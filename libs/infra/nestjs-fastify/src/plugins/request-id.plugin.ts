/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 请求 ID 插件
 *
 * @description 为 Fastify 应用自动生成和管理请求 ID
 * 支持从请求头中提取现有 ID 或生成新的 ID
 *
 * ## 业务规则
 *
 * ### ID 生成规则
 * - 优先使用请求头中的 `X-Request-Id`
 * - 如果不存在或无效，自动生成新的 ID
 * - 支持多种生成策略（UUID、ULID、时间戳等）
 * - 确保每个请求都有唯一的 ID
 *
 * ### 响应头规则
 * - 自动在响应头中添加 `X-Request-Id`
 * - 便于客户端追踪请求
 * - 支持跨服务请求追踪
 *
 * @example
 * ```typescript
 * // 注册插件
 * await fastify.register(requestIdPlugin, {
 *   strategy: RequestIdStrategy.UUID,
 *   headerName: 'X-Request-Id',
 *   generateOnMissing: true
 * });
 * ```
 *
 * @since 1.0.0
 */
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import {
  RequestIdGenerator,
  RequestIdGeneratorOptions,
} from "../utils/request-id.generator.js";

/**
 * 请求 ID 插件选项
 */
export interface RequestIdPluginOptions extends RequestIdGeneratorOptions {
  /** 请求头名称 */
  headerName?: string;
  /** 是否在缺失时自动生成 */
  generateOnMissing?: boolean;
  /** 是否在响应头中包含 ID */
  includeInResponse?: boolean;
  /** 是否在日志中包含 ID */
  includeInLogs?: boolean;
}

/**
 * 请求 ID 插件
 *
 * @description Fastify 插件，自动处理请求 ID
 * @param fastify Fastify 实例
 * @param options 插件选项
 */
export const requestIdPlugin: FastifyPluginAsync<
  RequestIdPluginOptions
> = async (fastify, options = {}) => {
  const {
    headerName = "X-Request-Id",
    generateOnMissing = true,
    includeInResponse = true,
    includeInLogs = true,
    ...generatorOptions
  } = options;

  // 添加请求 ID 到请求对象
  fastify.addHook(
    "onRequest",
    async (request: FastifyRequest, _reply: FastifyReply) => {
      // 尝试从请求头中提取现有 ID
      let requestId = RequestIdGenerator.extractFromHeaders(request.headers);

      // 如果不存在或无效，且允许自动生成
      if (!requestId && generateOnMissing) {
        requestId = RequestIdGenerator.generate(generatorOptions);
      }

      // 将 ID 添加到请求对象
      if (requestId) {
        (request as any).requestId = requestId;

        // 在日志中包含请求 ID
        if (includeInLogs) {
          request.log = request.log.child({ requestId });
        }
      }
    },
  );

  // 在响应头中添加请求 ID
  if (includeInResponse) {
    fastify.addHook(
      "onSend",
      async (request: FastifyRequest, reply: FastifyReply, payload) => {
        const requestId = (request as any).requestId;
        if (requestId) {
          reply.header(headerName, requestId);
        }
        return payload;
      },
    );
  }

  // 添加装饰器方法
  fastify.decorate(
    "generateRequestId",
    (options?: RequestIdGeneratorOptions) => {
      return RequestIdGenerator.generate(options);
    },
  );

  // 添加验证方法
  fastify.decorate("validateRequestId", (id: string) => {
    return RequestIdGenerator.isValid(id);
  });
};

/**
 * 请求 ID 装饰器类型
 */
declare module "fastify" {
  interface FastifyInstance {
    generateRequestId(options?: RequestIdGeneratorOptions): string;
    validateRequestId(id: string): boolean;
  }

  interface FastifyRequest {
    requestId?: string;
  }
}

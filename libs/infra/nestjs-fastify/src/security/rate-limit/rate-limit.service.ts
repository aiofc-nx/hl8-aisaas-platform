/**
 * @fileoverview 速率限制服务
 *
 * @description
 * 封装 @fastify/rate-limit 插件，提供速率限制功能：
 * - IP 级别限流
 * - 自定义键生成
 *
 * ## 业务规则
 *
 * ### 限流策略
 * 1. **IP 策略**: 基于 req.ip 限流
 * 2. **自定义策略**: 使用 keyGenerator 函数
 *
 * ### Redis 存储
 * - 键格式: `ratelimit:{strategy}:{key}`
 * - TTL: timeWindow * 2（确保窗口过期后清理）
 * - 原子操作: INCR + EXPIRE
 *
 * ### 错误处理
 * - Redis 连接失败时，根据 skipOnError 决定是否降级
 * - 降级策略: 使用内存存储或直接放行
 *
 * @module security/rate-limit
 */

import { Injectable, Logger } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import type { Redis } from "ioredis";
import type {
  RateLimitOptions,
  RateLimitStatus,
} from "./types/rate-limit-options.js";

/**
 * 速率限制服务
 *
 * @description
 * 核心限流服务，提供限流检查和键生成功能
 *
 * ## 使用场景
 *
 * ### 场景 1: 全局限流
 * ```typescript
 * const service = new RateLimitService({
 *   max: 1000,
 *   timeWindow: 60000,
 *   strategy: 'ip',
 * });
 * ```
 *
 * ### 场景 2: 自定义限流
 * ```typescript
 * const service = new RateLimitService({
 *   max: 100,
 *   timeWindow: 60000,
 *   strategy: 'custom',
 *   keyGenerator: (req) => `${req.headers['x-api-key']}:${req.routerPath}`,
 * });
 * ```
 *
 * ## 注意事项
 *
 * - Redis 连接错误时会记录日志但不抛出异常（如果 skipOnError 为 true）
 * - 内存存储不支持分布式场景，仅用于开发和测试
 * - 键生成需要保证唯一性，避免不同用户共享限流计数
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MyController {
 *   constructor(private readonly rateLimitService: RateLimitService) {}
 *
 *   async handleRequest(req: FastifyRequest) {
 *     const status = await this.rateLimitService.check(req);
 *     if (!status.allowed) {
 *       throw new TooManyRequestsException();
 *     }
 *     // 处理请求...
 *   }
 * }
 * ```
 */
@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly memoryStore = new Map<
    string,
    { count: number; expireAt: number }
  >();

  constructor(private readonly options: RateLimitOptions) {
    this.logger.log(
      `速率限制服务已初始化，策略: ${options.strategy || "ip"}, 限制: ${options.max}/${options.timeWindow}ms`,
    );
  }

  /**
   * 检查请求是否超出速率限制
   *
   * @description
   * 执行限流检查，返回当前限流状态
   *
   * ## 业务逻辑
   *
   * 1. **生成限流键**: 根据策略生成唯一键
   * 2. **查询计数器**: 从 Redis 或内存获取当前计数
   * 3. **增加计数**: 如果未超限，增加计数
   * 4. **返回状态**: 返回是否允许和剩余配额
   *
   * ## 异常处理
   *
   * - Redis 错误: 根据 skipOnError 决定是否降级
   * - 键生成错误: 记录日志，使用默认键（IP）
   *
   * @param req - Fastify 请求对象
   * @returns 限流状态
   *
   * @throws {Error} 当 Redis 错误且 skipOnError 为 false 时
   *
   * @example
   * ```typescript
   * const status = await service.check(req);
   * if (!status.allowed) {
   *   throw new HttpException('请求过于频繁', 429);
   * }
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Fastify request 扩展属性动态，宪章 IX 允许（第三方集成）
  async check(req: FastifyRequest<any>): Promise<RateLimitStatus> {
    try {
      // 生成限流键
      const key = this.generateKey(req);
      this.logger.debug(`检查速率限制，键: ${key}`);

      // 使用 Redis 或内存存储
      const status = this.options.redis
        ? await this.checkWithRedis(key)
        : await this.checkWithMemory(key);

      this.logger.debug(`速率限制检查结果: ${JSON.stringify(status)}`);
      return status;
    } catch (error) {
      this.logger.error(
        `速率限制检查失败: ${(error as Error).message}`,
        (error as Error).stack,
      );

      // 根据 skipOnError 决定是否放行
      if (this.options.skipOnError) {
        this.logger.warn("速率限制检查失败，降级放行");
        return {
          allowed: true,
          remaining: this.options.max,
          total: this.options.max,
          ttl: this.options.timeWindow,
        };
      }

      throw error;
    }
  }

  /**
   * 生成限流键
   *
   * @description
   * 根据配置的策略生成唯一限流键
   *
   * ## 键格式
   *
   * - IP 策略: `ratelimit:ip:{ip}`
   * - 自定义策略: `ratelimit:custom:{keyGenerator(req)}`
   *
   * @param req - Fastify 请求对象
   * @returns 限流键
   *
   * @example
   * ```typescript
   * // IP 策略
   * const key = service.generateKey(req); // 'ratelimit:ip:192.168.1.1'
   *
   * // 自定义策略
   * const key = service.generateKey(req); // 'ratelimit:custom:api-key-123:/users'
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Fastify request 扩展属性动态，宪章 IX 允许（第三方集成）
  generateKey(req: FastifyRequest<any>): string {
    const strategy = this.options.strategy || "ip";

    try {
      switch (strategy) {
        case "ip":
          return `ratelimit:ip:${req.ip}`;

        case "custom": {
          if (!this.options.keyGenerator) {
            this.logger.warn("自定义键生成函数不存在，降级为 IP 策略");
            return `ratelimit:ip:${req.ip}`;
          }
          const customKey = this.options.keyGenerator(req);
          return `ratelimit:custom:${customKey}`;
        }

        default:
          this.logger.warn(`未知策略 ${strategy}，降级为 IP 策略`);
          return `ratelimit:ip:${req.ip}`;
      }
    } catch (error) {
      this.logger.error(
        `键生成失败: ${(error as Error).message}`,
        (error as Error).stack,
      );
      // 降级为 IP 策略
      return `ratelimit:ip:${req.ip}`;
    }
  }

  /**
   * 使用 Redis 检查限流
   *
   * @description
   * 使用 Redis INCR 和 EXPIRE 原子操作实现限流
   *
   * ## 业务逻辑
   *
   * 1. **INCR 键**: 增加计数器
   * 2. **检查首次**: 如果是首次，设置过期时间
   * 3. **检查超限**: 如果超出限制，返回不允许
   * 4. **返回状态**: 返回剩余配额和 TTL
   *
   * ## Redis 命令
   *
   * ```redis
   * INCR ratelimit:ip:192.168.1.1
   * TTL ratelimit:ip:192.168.1.1
   * EXPIRE ratelimit:ip:192.168.1.1 120  # timeWindow * 2
   * ```
   *
   * @param key - 限流键
   * @returns 限流状态
   *
   * @private
   */
  private async checkWithRedis(key: string): Promise<RateLimitStatus> {
    const redis = this.options.redis as Redis;

    // INCR 计数器
    const count = await redis.incr(key);

    // 如果是首次，设置过期时间
    if (count === 1) {
      await redis.pexpire(key, this.options.timeWindow * 2);
    }

    // 获取剩余时间
    const ttl = await redis.pttl(key);

    // 检查是否超限
    const allowed = count <= this.options.max;

    return {
      allowed,
      remaining: Math.max(0, this.options.max - count),
      total: this.options.max,
      ttl: ttl > 0 ? ttl : this.options.timeWindow,
      key,
    };
  }

  /**
   * 使用内存检查限流
   *
   * @description
   * 使用 Map 存储限流计数器（仅用于开发和测试）
   *
   * ## 业务逻辑
   *
   * 1. **查询计数器**: 从 Map 获取
   * 2. **检查过期**: 如果过期，重置计数
   * 3. **增加计数**: 如果未超限，增加计数
   * 4. **返回状态**: 返回剩余配额
   *
   * ## 注意事项
   *
   * - 内存存储不支持分布式场景
   * - 进程重启后数据丢失
   * - 仅用于开发和测试
   *
   * @param key - 限流键
   * @returns 限流状态
   *
   * @private
   */
  private async checkWithMemory(key: string): Promise<RateLimitStatus> {
    const now = Date.now();
    const entry = this.memoryStore.get(key);

    // 如果不存在或已过期，创建新条目
    if (!entry || entry.expireAt < now) {
      this.memoryStore.set(key, {
        count: 1,
        expireAt: now + this.options.timeWindow,
      });

      return {
        allowed: true,
        remaining: this.options.max - 1,
        total: this.options.max,
        ttl: this.options.timeWindow,
        key,
      };
    }

    // 增加计数
    entry.count++;

    // 检查是否超限
    const allowed = entry.count <= this.options.max;

    return {
      allowed,
      remaining: Math.max(0, this.options.max - entry.count),
      total: this.options.max,
      ttl: entry.expireAt - now,
      key,
    };
  }

  /**
   * 清理内存存储（仅用于测试）
   *
   * @description
   * 清理内存中的限流计数器
   *
   * @internal
   */
  clearMemoryStore(): void {
    this.memoryStore.clear();
    this.logger.debug("内存存储已清理");
  }

  /**
   * 获取当前限流状态（不增加计数）
   *
   * @description
   * 查询当前限流状态，不会增加计数器
   *
   * @param req - Fastify 请求对象
   * @returns 限流状态
   *
   * @example
   * ```typescript
   * const status = await service.getStatus(req);
   * console.log(`剩余配额: ${status.remaining}`);
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Fastify request 扩展属性动态，宪章 IX 允许（第三方集成）
  async getStatus(req: FastifyRequest<any>): Promise<RateLimitStatus> {
    const key = this.generateKey(req);

    if (this.options.redis) {
      const redis = this.options.redis as Redis;
      const count = await redis.get(key);
      const ttl = await redis.pttl(key);

      return {
        allowed: !count || parseInt(count, 10) < this.options.max,
        remaining: Math.max(
          0,
          this.options.max - (count ? parseInt(count, 10) : 0),
        ),
        total: this.options.max,
        ttl: ttl > 0 ? ttl : this.options.timeWindow,
        key,
      };
    }

    const entry = this.memoryStore.get(key);
    if (!entry || entry.expireAt < Date.now()) {
      return {
        allowed: true,
        remaining: this.options.max,
        total: this.options.max,
        ttl: this.options.timeWindow,
        key,
      };
    }

    return {
      allowed: entry.count < this.options.max,
      remaining: Math.max(0, this.options.max - entry.count),
      total: this.options.max,
      ttl: entry.expireAt - Date.now(),
      key,
    };
  }
}

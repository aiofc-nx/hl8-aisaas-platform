/**
 * @fileoverview 速率限制守卫
 *
 * @description
 * NestJS Guard，用于执行速率限制检查
 *
 * ## 业务规则
 *
 * ### 限流检查流程
 * 1. **读取元数据**: 从装饰器获取限流配置
 * 2. **创建服务实例**: 基于配置创建 RateLimitService
 * 3. **执行检查**: 调用 service.check(req)
 * 4. **处理结果**:
 *    - 允许: 添加响应头，返回 true
 *    - 拒绝: 抛出 429 异常
 *
 * ### 响应头规则
 * - X-RateLimit-Limit: 总限制数
 * - X-RateLimit-Remaining: 剩余请求数
 * - X-RateLimit-Reset: 重置时间（Unix 时间戳）
 * - Retry-After: 剩余秒数（仅在超限时）
 *
 * ### 优先级规则
 * - 方法级别元数据 > 控制器级别元数据 > 全局配置
 *
 * @module security/rate-limit
 */

import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { FastifyReply, FastifyRequest } from "fastify";
import { RateLimitService } from "./rate-limit.service.js";
import type {
  RATE_LIMIT_METADATA_KEY,
  RateLimitOptions,
} from "./types/rate-limit-options.js";

/**
 * 速率限制守卫
 *
 * @description
 * 实现 NestJS CanActivate 接口，在请求处理前执行限流检查
 *
 * ## 使用场景
 *
 * ### 场景 1: 全局守卫
 * ```typescript
 * @Module({
 *   providers: [
 *     {
 *       provide: APP_GUARD,
 *       useClass: RateLimitGuard,
 *     },
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * ### 场景 2: 控制器守卫
 * ```typescript
 * @Controller('users')
 * @UseGuards(RateLimitGuard)
 * export class UserController {}
 * ```
 *
 * ### 场景 3: 方法守卫
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Post()
 *   @UseGuards(RateLimitGuard)
 *   @RateLimit({ max: 10, timeWindow: 60000 })
 *   create() {}
 * }
 * ```
 *
 * ## 注意事项
 *
 * - 必须配合 @RateLimit 装饰器使用
 * - 如果没有元数据，直接放行
 * - 响应头仅在配置 addHeaders 为 true 时添加
 * - 超限时抛出 HttpException(429)
 *
 * @example
 * ```typescript
 * // app.module.ts
 * @Module({
 *   providers: [
 *     {
 *       provide: APP_GUARD,
 *       useClass: RateLimitGuard,
 *     },
 *   ],
 * })
 * export class AppModule {}
 *
 * // user.controller.ts
 * @Controller('users')
 * @RateLimit({ max: 100, timeWindow: 60000 })
 * export class UserController {
 *   @Post()
 *   @RateLimit({ max: 10, timeWindow: 60000 })
 *   create() {
 *     // 限流: 10 次/分钟
 *   }
 * }
 * ```
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(private readonly reflector: Reflector) {}

  /**
   * 执行限流检查
   *
   * @description
   * CanActivate 接口的核心方法，返回 true 允许请求，false 或抛出异常拒绝请求
   *
   * ## 业务逻辑
   *
   * 1. **获取元数据**:
   *    - 先检查方法级别
   *    - 再检查控制器级别
   *    - 使用第一个找到的配置
   *
   * 2. **验证配置**:
   *    - 如果没有配置，直接放行
   *    - 如果配置无效，记录警告并放行
   *
   * 3. **创建服务**:
   *    - 基于配置创建 RateLimitService 实例
   *    - 服务实例不缓存（每次请求创建）
   *
   * 4. **执行检查**:
   *    - 调用 service.check(req)
   *    - 获取限流状态
   *
   * 5. **处理结果**:
   *    - 允许: 添加响应头，返回 true
   *    - 拒绝: 添加响应头，抛出 429 异常
   *
   * ## 异常处理
   *
   * - 元数据读取错误: 记录日志，放行
   * - 服务创建错误: 记录日志，放行
   * - 限流检查错误: 根据 skipOnError 决定
   *
   * @param context - 执行上下文
   * @returns 是否允许请求
   *
   * @throws {HttpException} 当超出速率限制时抛出 429 Too Many Requests
   *
   * @example
   * ```typescript
   * // 内部调用示例（由 NestJS 框架调用）
   * const guard = new RateLimitGuard(reflector);
   * const canActivate = await guard.canActivate(context);
   * if (!canActivate) {
   *   throw new HttpException('Too Many Requests', 429);
   * }
   * ```
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // 获取限流配置（方法优先于控制器）
      const options = this.getOptions(context);

      // 如果没有配置，直接放行
      if (!options) {
        this.logger.debug("未找到速率限制配置，放行");
        return true;
      }

      // 获取请求和响应对象
      const request = context.switchToHttp().getRequest<FastifyRequest>();
      const response = context.switchToHttp().getResponse<FastifyReply>();

      // 创建限流服务
      const service = new RateLimitService(options);

      // 执行限流检查
      const status = await service.check(request);

      // 添加响应头
      if (options.addHeaders !== false) {
        this.addHeaders(response, status, options);
      }

      // 检查是否超限
      if (!status.allowed) {
        this.logger.warn(
          `速率限制超出: key=${status.key}, ` +
            `limit=${status.total}, ` +
            `remaining=${status.remaining}, ` +
            `ttl=${status.ttl}ms`,
        );

        throw new HttpException(
          options.errorMessage || "请求过于频繁，请稍后再试",
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      this.logger.debug(
        `速率限制检查通过: key=${status.key}, remaining=${status.remaining}/${status.total}`,
      );

      return true;
    } catch (error) {
      // 如果是 HttpException，直接抛出
      if (error instanceof HttpException) {
        throw error;
      }

      // 其他错误记录日志并放行（降级策略）
      this.logger.error(
        `速率限制检查失败: ${(error as Error).message}`,
        (error as Error).stack,
      );

      return true;
    }
  }

  /**
   * 获取限流配置
   *
   * @description
   * 从装饰器元数据中提取限流配置
   *
   * ## 优先级规则
   *
   * 1. **方法级别**: 从方法装饰器获取
   * 2. **控制器级别**: 从类装饰器获取
   * 3. **使用第一个**: 不合并，完全覆盖
   *
   * @param context - 执行上下文
   * @returns 限流配置或 undefined
   *
   * @private
   */
  private getOptions(context: ExecutionContext): RateLimitOptions | undefined {
    // 方法级别元数据
    const methodOptions = this.reflector.get<RateLimitOptions>(
      "rate-limit:options" as typeof RATE_LIMIT_METADATA_KEY,
      context.getHandler(),
    );

    if (methodOptions) {
      this.logger.debug("使用方法级别限流配置");
      return methodOptions;
    }

    // 控制器级别元数据
    const classOptions = this.reflector.get<RateLimitOptions>(
      "rate-limit:options" as typeof RATE_LIMIT_METADATA_KEY,
      context.getClass(),
    );

    if (classOptions) {
      this.logger.debug("使用控制器级别限流配置");
      return classOptions;
    }

    return undefined;
  }

  /**
   * 添加速率限制响应头
   *
   * @description
   * 在响应中添加标准的速率限制头，符合 RFC 6585 标准
   *
   * ## 响应头规范
   *
   * ### 标准头
   * - `X-RateLimit-Limit`: 时间窗口内的总限制数
   * - `X-RateLimit-Remaining`: 剩余可用请求数
   * - `X-RateLimit-Reset`: 限制重置的时间（Unix 时间戳）
   *
   * ### 超限头
   * - `Retry-After`: 重试前需要等待的秒数（仅在超限时）
   *
   * ## 计算规则
   *
   * ### Reset 时间
   * - 当前时间 + TTL
   * - 单位：秒（Unix 时间戳）
   *
   * ### Retry-After
   * - TTL 转换为秒
   * - 向上取整
   *
   * @param response - Fastify 响应对象
   * @param status - 限流状态
   * @param options - 限流配置
   *
   * @private
   *
   * @example
   * ```
   * X-RateLimit-Limit: 100
   * X-RateLimit-Remaining: 95
   * X-RateLimit-Reset: 1697000000
   * Retry-After: 30
   * ```
   */
  private addHeaders(
    response: FastifyReply,
    status: { allowed: boolean; remaining: number; total: number; ttl: number },
    _options: RateLimitOptions,
  ): void {
    // 标准限流头
    response.header("X-RateLimit-Limit", status.total.toString());
    response.header("X-RateLimit-Remaining", status.remaining.toString());

    // 计算重置时间（Unix 时间戳，秒）
    const resetTime = Math.ceil(Date.now() / 1000 + status.ttl / 1000);
    response.header("X-RateLimit-Reset", resetTime.toString());

    // 如果超限，添加 Retry-After
    if (!status.allowed) {
      const retryAfter = Math.ceil(status.ttl / 1000);
      response.header("Retry-After", retryAfter.toString());
    }
  }
}

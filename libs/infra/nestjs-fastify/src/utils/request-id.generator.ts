/**
 * 请求 ID 生成器
 *
 * @description 提供自定义的请求 ID 生成功能，支持多种生成策略
 *
 * ## 业务规则
 *
 * ### 生成策略
 * - UUID v4: 标准 UUID 格式，全局唯一
 * - ULID: 时间排序的 ID，性能更好
 * - 自定义前缀: 支持业务前缀标识
 * - 时间戳: 基于时间戳的 ID
 *
 * ### 性能考虑
 * - 生成速度要快，不能影响请求性能
 * - 支持高并发场景
 * - 内存占用要小
 *
 * @example
 * ```typescript
 * // 使用默认 UUID 生成器
 * const requestId = RequestIdGenerator.generate();
 *
 * // 使用自定义前缀
 * const requestId = RequestIdGenerator.generate('api');
 *
 * // 使用 ULID 生成器
 * const requestId = RequestIdGenerator.generateULID();
 * ```
 *
 * @since 1.0.0
 */
import { randomBytes, randomUUID } from "crypto";

/**
 * 请求 ID 生成策略
 */
export enum RequestIdStrategy {
  /** UUID v4 格式 */
  UUID = "uuid",
  /** ULID 格式 */
  ULID = "ulid",
  /** 时间戳 + 随机数 */
  TIMESTAMP = "timestamp",
  /** 自定义前缀 + UUID */
  PREFIXED = "prefixed",
}

/**
 * 请求 ID 生成器配置
 */
export interface RequestIdGeneratorOptions {
  /** 生成策略 */
  strategy?: RequestIdStrategy;
  /** 自定义前缀 */
  prefix?: string;
  /** 是否包含时间戳 */
  includeTimestamp?: boolean;
  /** 随机数长度 */
  randomLength?: number;
}

/**
 * 请求 ID 生成器类
 *
 * @description 提供多种请求 ID 生成策略
 * @class RequestIdGenerator
 * @since 1.0.0
 */
export class RequestIdGenerator {
  private static readonly DEFAULT_OPTIONS: Required<RequestIdGeneratorOptions> =
    {
      strategy: RequestIdStrategy.UUID,
      prefix: "",
      includeTimestamp: false,
      randomLength: 8,
    };

  /**
   * 生成请求 ID
   *
   * @param options 生成选项
   * @returns 请求 ID 字符串
   */
  static generate(options?: RequestIdGeneratorOptions): string {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    switch (opts.strategy) {
      case RequestIdStrategy.UUID:
        return this.generateUUID(opts);
      case RequestIdStrategy.ULID:
        return this.generateULID();
      case RequestIdStrategy.TIMESTAMP:
        return this.generateTimestamp(opts);
      case RequestIdStrategy.PREFIXED:
        return this.generatePrefixed(opts);
      default:
        return this.generateUUID(opts);
    }
  }

  /**
   * 生成 UUID v4 格式的请求 ID
   *
   * @param options 生成选项
   * @returns UUID 字符串
   * @private
   */
  private static generateUUID(
    options: Required<RequestIdGeneratorOptions>,
  ): string {
    const uuid = randomUUID();
    return options.prefix ? `${options.prefix}-${uuid}` : uuid;
  }

  /**
   * 生成 ULID 格式的请求 ID
   *
   * @returns ULID 字符串
   * @private
   */
  private static generateULID(): string {
    // ULID 实现：时间戳(10位) + 随机数(16位)
    const timestamp = Date.now().toString(36).padStart(10, "0");
    const random = randomBytes(8).toString("hex");
    return `${timestamp}${random}`;
  }

  /**
   * 生成基于时间戳的请求 ID
   *
   * @param options 生成选项
   * @returns 时间戳 ID 字符串
   * @private
   */
  private static generateTimestamp(
    options: Required<RequestIdGeneratorOptions>,
  ): string {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(options.randomLength).toString("hex");
    const id = `${timestamp}-${random}`;
    return options.prefix ? `${options.prefix}-${id}` : id;
  }

  /**
   * 生成带前缀的请求 ID
   *
   * @param options 生成选项
   * @returns 前缀 ID 字符串
   * @private
   */
  private static generatePrefixed(
    options: Required<RequestIdGeneratorOptions>,
  ): string {
    const uuid = randomUUID();
    return `${options.prefix}-${uuid}`;
  }

  /**
   * 快速生成请求 ID（默认配置）
   *
   * @returns 请求 ID 字符串
   */
  static quick(): string {
    return this.generate();
  }

  /**
   * 生成带业务前缀的请求 ID
   *
   * @param prefix 业务前缀
   * @returns 带前缀的请求 ID
   */
  static withPrefix(prefix: string): string {
    return this.generate({ strategy: RequestIdStrategy.PREFIXED, prefix });
  }

  /**
   * 生成 ULID 格式的请求 ID
   *
   * @returns ULID 字符串
   */
  static ulid(): string {
    return this.generateULID();
  }

  /**
   * 验证请求 ID 格式
   *
   * @param id 请求 ID
   * @returns 是否为有效格式
   */
  static isValid(id: string): boolean {
    if (!id || typeof id !== "string") {
      return false;
    }

    // UUID 格式验证
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(id)) {
      return true;
    }

    // ULID 格式验证
    const ulidRegex = /^[0-9a-z]{26}$/i;
    if (ulidRegex.test(id)) {
      return true;
    }

    // 时间戳格式验证
    const timestampRegex = /^[0-9a-z]+-[0-9a-f]+$/i;
    if (timestampRegex.test(id)) {
      return true;
    }

    // 前缀格式验证
    const prefixedRegex =
      /^[a-z0-9-]+-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (prefixedRegex.test(id)) {
      return true;
    }

    return false;
  }

  /**
   * 从请求头中提取请求 ID
   *
   * @param headers 请求头
   * @returns 请求 ID 或 null
   */
  static extractFromHeaders(
    headers: Record<string, string | string[] | undefined>,
  ): string | null {
    const requestId =
      headers["x-request-id"] ||
      headers["x-request-id"] ||
      headers["request-id"];

    if (typeof requestId === "string" && this.isValid(requestId)) {
      return requestId;
    }

    return null;
  }
}

/**
 * @fileoverview 邮箱格式无效异常
 * @description 当邮箱地址格式不符合要求时抛出此异常
 */

/**
 * 邮箱格式无效异常
 * @description 表示邮箱地址格式无效的错误
 * @example
 * ```typescript
 * throw new InvalidEmailError("invalid-email");
 * ```
 */
export class InvalidEmailError extends Error {
  /**
   * 构造函数
   * @param email 无效的邮箱地址
   */
  constructor(email?: string) {
    const message = email ? `邮箱格式无效: ${email}` : "邮箱格式无效";
    super(message);
    this.name = "InvalidEmailError";
    Object.setPrototypeOf(this, InvalidEmailError.prototype);
  }
}

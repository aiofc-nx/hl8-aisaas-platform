/**
 * @fileoverview 邮箱已存在异常
 * @description 当尝试使用已存在的邮箱地址创建用户时抛出此异常
 */

/**
 * 邮箱已存在异常
 * @description 表示邮箱地址已存在的错误
 * @example
 * ```typescript
 * throw new EmailAlreadyExistsError("test@example.com");
 * ```
 */
export class EmailAlreadyExistsError extends Error {
  /**
   * 构造函数
   * @param email 已存在的邮箱地址
   */
  constructor(email: string) {
    super(`邮箱已存在: ${email}`);
    this.name = "EmailAlreadyExistsError";
    Object.setPrototypeOf(this, EmailAlreadyExistsError.prototype);
  }
}

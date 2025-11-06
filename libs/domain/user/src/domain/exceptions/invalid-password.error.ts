/**
 * @fileoverview 密码不符合安全策略异常
 * @description 当密码不符合安全策略要求时抛出此异常
 */

/**
 * 密码不符合安全策略异常
 * @description 表示密码不符合安全策略的错误
 * @example
 * ```typescript
 * throw new InvalidPasswordError();
 * ```
 */
export class InvalidPasswordError extends Error {
  /**
   * 构造函数
   * @param message 可选的错误消息
   */
  constructor(message = "密码不符合安全策略") {
    super(message);
    this.name = "InvalidPasswordError";
    Object.setPrototypeOf(this, InvalidPasswordError.prototype);
  }
}

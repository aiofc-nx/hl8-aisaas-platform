/**
 * @fileoverview 用户名格式无效异常
 * @description 当用户名格式不符合要求时抛出此异常
 */

/**
 * 用户名格式无效异常
 * @description 表示用户名格式无效的错误
 * @example
 * ```typescript
 * throw new InvalidUsernameError("invalid-username");
 * ```
 */
export class InvalidUsernameError extends Error {
  /**
   * 构造函数
   * @param username 无效的用户名
   */
  constructor(username?: string) {
    const message = username ? `用户名格式无效: ${username}` : "用户名格式无效";
    super(message);
    this.name = "InvalidUsernameError";
    Object.setPrototypeOf(this, InvalidUsernameError.prototype);
  }
}

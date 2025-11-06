/**
 * @fileoverview 用户名已存在异常
 * @description 当尝试使用已存在的用户名创建用户时抛出此异常
 */

/**
 * 用户名已存在异常
 * @description 表示用户名已存在的错误
 * @example
 * ```typescript
 * throw new UsernameAlreadyExistsError("testuser");
 * ```
 */
export class UsernameAlreadyExistsError extends Error {
  /**
   * 构造函数
   * @param username 已存在的用户名
   */
  constructor(username: string) {
    super(`用户名已存在: ${username}`);
    this.name = "UsernameAlreadyExistsError";
    Object.setPrototypeOf(this, UsernameAlreadyExistsError.prototype);
  }
}

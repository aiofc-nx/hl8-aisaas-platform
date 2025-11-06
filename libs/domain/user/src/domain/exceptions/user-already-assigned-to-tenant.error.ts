/**
 * @fileoverview 用户已分配到租户异常
 * @description 当尝试将已分配到租户的用户再次分配到同一租户时抛出此异常
 */

/**
 * 用户已分配到租户异常
 * @description 表示用户已分配到租户的错误
 * @example
 * ```typescript
 * throw new UserAlreadyAssignedToTenantError();
 * ```
 */
export class UserAlreadyAssignedToTenantError extends Error {
  /**
   * 构造函数
   * @param message 可选的错误消息
   */
  constructor(message = "用户已分配到租户") {
    super(message);
    this.name = "UserAlreadyAssignedToTenantError";
    Object.setPrototypeOf(this, UserAlreadyAssignedToTenantError.prototype);
  }
}

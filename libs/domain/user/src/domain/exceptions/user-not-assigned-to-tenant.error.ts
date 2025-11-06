/**
 * @fileoverview 用户未分配到租户异常
 * @description 当用户未分配到租户但尝试进行需要租户分配的操作时抛出此异常
 */

/**
 * 用户未分配到租户异常
 * @description 表示用户未分配到租户的错误
 * @example
 * ```typescript
 * throw new UserNotAssignedToTenantError();
 * ```
 */
export class UserNotAssignedToTenantError extends Error {
  /**
   * 构造函数
   * @param message 可选的错误消息
   */
  constructor(message = "用户未分配到租户") {
    super(message);
    this.name = "UserNotAssignedToTenantError";
    Object.setPrototypeOf(this, UserNotAssignedToTenantError.prototype);
  }
}

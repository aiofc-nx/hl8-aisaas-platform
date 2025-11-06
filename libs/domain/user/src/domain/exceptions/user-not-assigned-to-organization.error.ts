/**
 * @fileoverview 用户未分配到组织异常
 * @description 当用户未分配到组织但尝试进行需要组织分配的操作时抛出此异常
 */

/**
 * 用户未分配到组织异常
 * @description 表示用户未分配到组织的错误
 * @example
 * ```typescript
 * throw new UserNotAssignedToOrganizationError();
 * ```
 */
export class UserNotAssignedToOrganizationError extends Error {
  /**
   * 构造函数
   * @param message 可选的错误消息
   */
  constructor(message = "用户未分配到组织") {
    super(message);
    this.name = "UserNotAssignedToOrganizationError";
    Object.setPrototypeOf(this, UserNotAssignedToOrganizationError.prototype);
  }
}

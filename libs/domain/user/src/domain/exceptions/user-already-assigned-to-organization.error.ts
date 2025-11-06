/**
 * @fileoverview 用户已分配到组织异常
 * @description 当尝试将已分配到组织的用户再次分配到同一组织时抛出此异常
 */

/**
 * 用户已分配到组织异常
 * @description 表示用户已分配到组织的错误
 * @example
 * ```typescript
 * throw new UserAlreadyAssignedToOrganizationError();
 * ```
 */
export class UserAlreadyAssignedToOrganizationError extends Error {
  /**
   * 构造函数
   * @param message 可选的错误消息
   */
  constructor(message = "用户已分配到组织") {
    super(message);
    this.name = "UserAlreadyAssignedToOrganizationError";
    Object.setPrototypeOf(
      this,
      UserAlreadyAssignedToOrganizationError.prototype,
    );
  }
}

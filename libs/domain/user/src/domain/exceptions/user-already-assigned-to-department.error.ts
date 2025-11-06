/**
 * @fileoverview 用户已分配到部门异常
 * @description 当尝试将已分配到部门的用户再次分配到同一部门时抛出此异常
 */

/**
 * 用户已分配到部门异常
 * @description 表示用户已分配到部门的错误
 * @example
 * ```typescript
 * throw new UserAlreadyAssignedToDepartmentError();
 * ```
 */
export class UserAlreadyAssignedToDepartmentError extends Error {
  /**
   * 构造函数
   * @param message 可选的错误消息
   */
  constructor(message = "用户已分配到部门") {
    super(message);
    this.name = "UserAlreadyAssignedToDepartmentError";
    Object.setPrototypeOf(this, UserAlreadyAssignedToDepartmentError.prototype);
  }
}

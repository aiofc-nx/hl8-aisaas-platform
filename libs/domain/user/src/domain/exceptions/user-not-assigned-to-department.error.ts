/**
 * @fileoverview 用户未分配到部门异常
 * @description 当用户未分配到部门但尝试进行需要部门分配的操作时抛出此异常
 */

/**
 * 用户未分配到部门异常
 * @description 表示用户未分配到部门的错误
 * @example
 * ```typescript
 * throw new UserNotAssignedToDepartmentError();
 * ```
 */
export class UserNotAssignedToDepartmentError extends Error {
  /**
   * 构造函数
   * @param message 可选的错误消息
   */
  constructor(message = "用户未分配到部门") {
    super(message);
    this.name = "UserNotAssignedToDepartmentError";
    Object.setPrototypeOf(this, UserNotAssignedToDepartmentError.prototype);
  }
}

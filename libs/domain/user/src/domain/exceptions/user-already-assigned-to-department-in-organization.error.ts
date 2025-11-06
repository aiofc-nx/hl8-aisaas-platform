/**
 * @fileoverview 用户在同一组织内已属于某个部门异常
 * @description 当尝试将用户在同一组织内分配到另一个部门时抛出此异常（用户在同一组织内只能属于一个部门）
 */

/**
 * 用户在同一组织内已属于某个部门异常
 * @description 表示用户在同一组织内已属于某个部门的错误
 * @example
 * ```typescript
 * throw new UserAlreadyAssignedToDepartmentInOrganizationError();
 * ```
 */
export class UserAlreadyAssignedToDepartmentInOrganizationError extends Error {
  /**
   * 构造函数
   * @param message 可选的错误消息
   */
  constructor(message = "用户在同一组织内已属于某个部门") {
    super(message);
    this.name = "UserAlreadyAssignedToDepartmentInOrganizationError";
    Object.setPrototypeOf(
      this,
      UserAlreadyAssignedToDepartmentInOrganizationError.prototype,
    );
  }
}

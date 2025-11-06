/**
 * @fileoverview 无效的状态转换异常
 * @description 当尝试进行无效的用户状态转换时抛出此异常
 */

/**
 * 无效的状态转换异常
 * @description 表示用户状态转换无效的错误
 * @example
 * ```typescript
 * throw new InvalidStatusTransitionError("从禁用状态不能直接激活");
 * ```
 */
export class InvalidStatusTransitionError extends Error {
  /**
   * 构造函数
   * @param message 可选的错误消息
   */
  constructor(message = "无效的状态转换") {
    super(message);
    this.name = "InvalidStatusTransitionError";
    Object.setPrototypeOf(this, InvalidStatusTransitionError.prototype);
  }
}

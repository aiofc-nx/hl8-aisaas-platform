/**
 * @fileoverview 无效的用户来源异常
 * @description 当用户来源无效或不允许进行某些操作时抛出此异常
 */

/**
 * 无效的用户来源异常
 * @description 表示用户来源无效的错误
 * @example
 * ```typescript
 * throw new InvalidUserSourceError("系统用户不能分配到租户");
 * ```
 */
export class InvalidUserSourceError extends Error {
  /**
   * 构造函数
   * @param message 可选的错误消息
   */
  constructor(message = "无效的用户来源") {
    super(message);
    this.name = "InvalidUserSourceError";
    Object.setPrototypeOf(this, InvalidUserSourceError.prototype);
  }
}

/**
 * @fileoverview 昵称已存在异常
 * @description 当尝试使用已存在的昵称创建或更新用户时抛出此异常
 */

/**
 * 昵称已存在异常
 * @description 表示昵称已存在的错误
 * @example
 * ```typescript
 * throw new NicknameAlreadyExistsError("testnickname");
 * ```
 */
export class NicknameAlreadyExistsError extends Error {
  /**
   * 构造函数
   * @param nickname 已存在的昵称
   */
  constructor(nickname: string) {
    super(`昵称已存在: ${nickname}`);
    this.name = "NicknameAlreadyExistsError";
    Object.setPrototypeOf(this, NicknameAlreadyExistsError.prototype);
  }
}

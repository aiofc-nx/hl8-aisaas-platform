/**
 * @fileoverview 昵称格式无效异常
 * @description 当昵称格式不符合要求时抛出此异常
 */

/**
 * 昵称格式无效异常
 * @description 表示昵称格式无效的错误（长度必须在 1-50 字符之间，不能为空字符串）
 * @example
 * ```typescript
 * throw new InvalidNicknameError("invalid-nickname");
 * ```
 */
export class InvalidNicknameError extends Error {
  /**
   * 构造函数
   * @param nickname 无效的昵称
   */
  constructor(nickname?: string) {
    const message = nickname
      ? `昵称格式无效: ${nickname}（长度必须在 1-50 字符之间，不能为空字符串）`
      : "昵称格式无效（长度必须在 1-50 字符之间，不能为空字符串）";
    super(message);
    this.name = "InvalidNicknameError";
    Object.setPrototypeOf(this, InvalidNicknameError.prototype);
  }
}

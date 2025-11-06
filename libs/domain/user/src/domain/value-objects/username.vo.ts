/**
 * @fileoverview 用户名值对象
 * @description 封装用户名的验证和格式化逻辑
 */

import { ValueObject } from "@hl8/shared";
import { InvalidUsernameError } from "../exceptions/invalid-username.error.js";

/**
 * 用户名值对象
 * @description 封装用户名的验证和格式化逻辑
 * @remarks
 * 用户名值对象具有以下特征：
 * - 长度限制：3-30 字符
 * - 格式限制：仅允许字母、数字和下划线
 * - 自动标准化（去除首尾空格）
 *
 * @example
 * ```typescript
 * const username = new Username("  Test_User_123  ");
 * console.log(username.getValue()); // "Test_User_123"
 * ```
 */
export class Username extends ValueObject<string> {
  /**
   * 验证用户名
   * @param value 用户名
   * @throws {InvalidUsernameError} 当用户名格式无效时抛出异常
   */
  protected validateValue(value: string): void {
    if (!value || typeof value !== "string") {
      throw new InvalidUsernameError();
    }

    // 验证时考虑 trim 后的值（因为标准化会 trim）
    const trimmed = value.trim();
    if (!trimmed) {
      throw new InvalidUsernameError();
    }

    // 长度限制：3-30 字符
    if (trimmed.length < 3 || trimmed.length > 30) {
      throw new InvalidUsernameError(trimmed);
    }

    // 格式限制：仅允许字母、数字和下划线
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(trimmed)) {
      throw new InvalidUsernameError(trimmed);
    }
  }

  /**
   * 标准化用户名
   * @param value 原始用户名
   * @returns 标准化后的用户名（去除首尾空格）
   */
  protected normalizeValue(value: string): string {
    return value.trim();
  }

  /**
   * 克隆用户名值对象
   * @returns 新的 Username 实例
   */
  clone(): Username {
    return new Username(this._value);
  }

  /**
   * 获取用户名
   * @returns 用户名字符串
   */
  getValue(): string {
    return this.value;
  }
}

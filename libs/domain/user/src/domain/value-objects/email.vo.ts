/**
 * @fileoverview 邮箱值对象
 * @description 封装邮箱地址的验证和格式化逻辑，确保邮箱格式正确
 */

import { ValueObject } from "@hl8/shared";
import { InvalidEmailError } from "../exceptions/invalid-email.error.js";

/**
 * 邮箱值对象
 * @description 封装邮箱地址的验证和格式化逻辑
 * @remarks
 * 邮箱值对象具有以下特征：
 * - 验证邮箱格式（RFC 5322 正则表达式）
 * - 限制长度（最大 100 字符）
 * - 自动标准化（转小写、去除空格）
 * - 提供域名提取功能
 *
 * @example
 * ```typescript
 * const email = new Email("  User@Example.COM  ");
 * console.log(email.getValue()); // "user@example.com"
 * console.log(email.getDomain()); // "example.com"
 * ```
 */
export class Email extends ValueObject<string> {
  /**
   * 验证邮箱地址
   * @param value 邮箱地址
   * @throws {InvalidEmailError} 当邮箱格式无效时抛出异常
   */
  protected validateValue(value: string): void {
    if (!value || typeof value !== "string") {
      throw new InvalidEmailError();
    }

    // 验证时考虑 trim 后的值（因为标准化会 trim）
    const trimmed = value.trim();
    if (!trimmed) {
      throw new InvalidEmailError();
    }

    // 长度限制：最大 100 字符
    if (trimmed.length > 100) {
      throw new InvalidEmailError(trimmed);
    }

    // RFC 5322 简化版邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      throw new InvalidEmailError(trimmed);
    }
  }

  /**
   * 标准化邮箱地址
   * @param value 原始邮箱地址
   * @returns 标准化后的邮箱地址（转小写、去除首尾空格）
   */
  protected normalizeValue(value: string): string {
    return value.trim().toLowerCase();
  }

  /**
   * 克隆邮箱值对象
   * @returns 新的 Email 实例
   */
  clone(): Email {
    return new Email(this._value);
  }

  /**
   * 获取邮箱地址
   * @returns 邮箱地址字符串
   */
  getValue(): string {
    return this.value;
  }

  /**
   * 获取邮箱域名
   * @returns 邮箱域名
   * @example
   * ```typescript
   * const email = new Email("test@example.com");
   * console.log(email.getDomain()); // "example.com"
   * ```
   */
  getDomain(): string {
    return this._value.split("@")[1] || "";
  }
}

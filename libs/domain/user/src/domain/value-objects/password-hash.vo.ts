/**
 * @fileoverview 密码哈希值对象
 * @description 封装密码的哈希和验证逻辑
 */

import { ValueObject } from "@hl8/shared";
import { InvalidPasswordError } from "../exceptions/invalid-password.error.js";

/**
 * 密码哈希值对象
 * @description 封装密码的哈希和验证逻辑
 * @remarks
 * 密码哈希值对象具有以下特征：
 * - 存储密码哈希值（不存储明文密码）
 * - 验证密码安全策略（最小长度 8 字符，必须包含大小写字母、数字和特殊字符）
 * - 提供密码验证接口（需要基础设施层支持）
 * - 支持系统用户无密码哈希
 *
 * **注意**：密码哈希的实际实现需要基础设施层支持（如 bcrypt），
 * 领域层只定义接口和验证逻辑。`fromPlainText` 和 `verify` 方法
 * 在领域层会抛出错误，需要基础设施层提供实现。
 *
 * @example
 * ```typescript
 * // 创建系统用户密码哈希（无密码）
 * const systemHash = PasswordHash.system();
 *
 * // 从明文密码创建（需要基础设施层支持）
 * // const hash = PasswordHash.fromPlainText("Password123!");
 * ```
 */
export class PasswordHash extends ValueObject<string> {
  /**
   * 验证密码哈希值
   * @param value 密码哈希值
   * @throws {Error} 当哈希值无效时抛出异常
   */
  protected validateValue(value: string): void {
    // 允许空字符串（系统用户）
    if (value === "") {
      return;
    }
    // 检查类型和空值
    if (typeof value !== "string" || !value) {
      throw new Error("密码哈希值不能为空");
    }
    // 其他验证逻辑可以在这里添加（如哈希格式验证）
  }

  /**
   * 克隆密码哈希值对象
   * @returns 新的 PasswordHash 实例
   */
  clone(): PasswordHash {
    return new PasswordHash(this._value);
  }

  /**
   * 从明文密码创建密码哈希
   * @param password 明文密码
   * @returns 密码哈希值对象
   * @throws {InvalidPasswordError} 当密码不符合安全策略时抛出异常
   * @throws {Error} 表示需要基础设施层支持
   * @description
   * 此方法需要基础设施层支持（如 bcrypt）。
   * 在领域层，此方法会先验证密码安全策略，然后抛出错误提示需要基础设施层实现。
   *
   * 密码安全策略：
   * - 最小长度 8 字符
   * - 必须包含大小写字母
   * - 必须包含数字
   * - 必须包含特殊字符
   */
  static fromPlainText(password: string): PasswordHash {
    // 验证密码安全策略
    PasswordHash.validatePasswordPolicy(password);

    // 抛出错误提示需要基础设施层支持
    throw new Error("密码哈希功能需要基础设施层支持（如 bcrypt）");
  }

  /**
   * 验证密码安全策略
   * @param password 明文密码
   * @throws {InvalidPasswordError} 当密码不符合安全策略时抛出异常
   * @internal
   */
  private static validatePasswordPolicy(password: string): void {
    if (!password || typeof password !== "string") {
      throw new InvalidPasswordError("密码不能为空");
    }

    // 最小长度 8 字符
    if (password.length < 8) {
      throw new InvalidPasswordError("密码长度必须至少 8 字符");
    }

    // 必须包含大小写字母、数字和特殊字符
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

    if (!hasUpperCase) {
      throw new InvalidPasswordError("密码必须包含至少一个大写字母");
    }

    if (!hasLowerCase) {
      throw new InvalidPasswordError("密码必须包含至少一个小写字母");
    }

    if (!hasNumber) {
      throw new InvalidPasswordError("密码必须包含至少一个数字");
    }

    if (!hasSpecialChar) {
      throw new InvalidPasswordError("密码必须包含至少一个特殊字符");
    }
  }

  /**
   * 创建系统用户密码哈希（无密码）
   * @returns 空密码哈希值对象（表示系统用户无密码）
   */
  static system(): PasswordHash {
    return new PasswordHash("");
  }

  /**
   * 验证密码
   * @param password 明文密码
   * @returns 密码是否匹配
   * @throws {Error} 表示需要基础设施层支持
   * @description
   * 此方法需要基础设施层支持（如 bcrypt.compare）。
   * 在领域层，此方法会抛出错误提示需要基础设施层实现。
   */
  verify(_password: string): boolean {
    // 系统用户密码哈希为空，直接返回 false
    if (this._value === "") {
      return false;
    }

    // 抛出错误提示需要基础设施层支持
    throw new Error("密码验证功能需要基础设施层支持（如 bcrypt.compare）");
  }

  /**
   * 获取密码哈希值
   * @returns 密码哈希值字符串
   */
  getValue(): string {
    return this.value;
  }

  /**
   * 检查是否为系统用户密码哈希（无密码）
   * @returns 是否为系统用户密码哈希
   */
  isSystem(): boolean {
    return this._value === "";
  }
}

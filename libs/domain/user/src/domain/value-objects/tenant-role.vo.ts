/**
 * @fileoverview 租户角色值对象
 * @description 封装租户角色的业务规则
 */

import { ValueObject } from "@hl8/shared";

/**
 * 租户角色值对象
 * @description 封装租户角色的业务规则
 * @remarks
 * 租户角色值对象具有以下特征：
 * - 表示用户在租户中的角色
 * - 角色值应该是字符串（如 "owner", "admin", "member" 等）
 * - 角色值不能为空
 *
 * @example
 * ```typescript
 * const role = new TenantRole("admin");
 * console.log(role.getValue()); // "admin"
 * ```
 */
export class TenantRole extends ValueObject<string> {
  /**
   * 构造函数
   * @param value 角色值
   */
  constructor(value: string) {
    super(value);
  }

  /**
   * 验证角色值
   * @param value 角色值
   * @throws {Error} 当角色值无效时抛出异常
   */
  protected validateValue(value: string): void {
    if (!value || typeof value !== "string") {
      throw new Error("租户角色不能为空");
    }

    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error("租户角色不能为空");
    }

    // 角色值长度限制：1-50 字符
    if (trimmed.length < 1 || trimmed.length > 50) {
      throw new Error("租户角色长度必须在 1-50 字符之间");
    }
  }

  /**
   * 标准化角色值
   * @param value 原始角色值
   * @returns 标准化后的角色值（去除首尾空格，转小写）
   */
  protected normalizeValue(value: string): string {
    return value.trim().toLowerCase();
  }

  /**
   * 克隆租户角色值对象
   * @returns 新的 TenantRole 实例
   */
  clone(): TenantRole {
    return new TenantRole(this._value);
  }

  /**
   * 获取角色值
   * @returns 角色值字符串
   */
  getValue(): string {
    return this.value;
  }
}

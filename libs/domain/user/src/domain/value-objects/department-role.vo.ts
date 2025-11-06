/**
 * @fileoverview 部门角色值对象
 * @description 封装部门角色的业务规则
 */

import { ValueObject } from "@hl8/shared";

/**
 * 部门角色值对象
 * @description 封装部门角色的业务规则
 * @remarks
 * 部门角色值对象具有以下特征：
 * - 表示用户在部门中的角色
 * - 角色值应该是字符串（如 "manager", "member", "lead" 等）
 * - 角色值不能为空
 *
 * @example
 * ```typescript
 * const role = new DepartmentRole("manager");
 * console.log(role.getValue()); // "manager"
 * ```
 */
export class DepartmentRole extends ValueObject<string> {
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
      throw new Error("部门角色不能为空");
    }

    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error("部门角色不能为空");
    }

    // 角色值长度限制：1-50 字符
    if (trimmed.length < 1 || trimmed.length > 50) {
      throw new Error("部门角色长度必须在 1-50 字符之间");
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
   * 克隆部门角色值对象
   * @returns 新的 DepartmentRole 实例
   */
  clone(): DepartmentRole {
    return new DepartmentRole(this._value);
  }

  /**
   * 获取角色值
   * @returns 角色值字符串
   */
  getValue(): string {
    return this.value;
  }
}

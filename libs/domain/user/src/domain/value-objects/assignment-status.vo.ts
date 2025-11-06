/**
 * @fileoverview 分配状态值对象
 * @description 封装分配状态的业务规则
 */

import { ValueObject } from "@hl8/shared";
import { AssignmentStatusEnum } from "./assignment-status.enum.js";

/**
 * 分配状态值对象
 * @description 封装分配状态的业务规则
 * @remarks
 * 分配状态值对象具有以下特征：
 * - 管理分配的生命周期状态（活跃、已撤销、已过期）
 * - 支持状态转换
 * - 记录状态原因和时间
 *
 * @example
 * ```typescript
 * // 创建活跃状态
 * const status = AssignmentStatus.active();
 *
 * // 撤销
 * const revoked = status.revoke("用户离职");
 * ```
 */
export class AssignmentStatus extends ValueObject<AssignmentStatusEnum> {
  /**
   * 构造函数
   * @param value 分配状态枚举值
   */
  constructor(value: AssignmentStatusEnum) {
    super(value);
  }

  /**
   * 验证状态值
   * @param value 状态值
   * @throws {Error} 当状态值无效时抛出异常
   */
  protected validateValue(value: AssignmentStatusEnum): void {
    if (!value || !Object.values(AssignmentStatusEnum).includes(value)) {
      throw new Error(`无效的分配状态: ${value}`);
    }
  }

  /**
   * 克隆分配状态值对象
   * @returns 新的 AssignmentStatus 实例
   */
  clone(): AssignmentStatus {
    return new AssignmentStatus(this._value);
  }

  /**
   * 获取状态值
   * @returns 状态枚举值
   */
  getValue(): AssignmentStatusEnum {
    return this.value;
  }

  /**
   * 创建活跃状态
   * @returns 活跃状态的分配状态值对象
   */
  static active(): AssignmentStatus {
    return new AssignmentStatus(AssignmentStatusEnum.ACTIVE);
  }

  /**
   * 创建已撤销状态
   * @returns 已撤销状态的分配状态值对象
   */
  static revoked(): AssignmentStatus {
    return new AssignmentStatus(AssignmentStatusEnum.REVOKED);
  }

  /**
   * 创建已过期状态
   * @returns 已过期状态的分配状态值对象
   */
  static expired(): AssignmentStatus {
    return new AssignmentStatus(AssignmentStatusEnum.EXPIRED);
  }

  /**
   * 检查是否为活跃状态
   * @returns 是否为活跃状态
   */
  isActive(): boolean {
    return this._value === AssignmentStatusEnum.ACTIVE;
  }

  /**
   * 检查是否为已撤销状态
   * @returns 是否为已撤销状态
   */
  isRevoked(): boolean {
    return this._value === AssignmentStatusEnum.REVOKED;
  }

  /**
   * 检查是否为已过期状态
   * @returns 是否为已过期状态
   */
  isExpired(): boolean {
    return this._value === AssignmentStatusEnum.EXPIRED;
  }

  /**
   * 撤销状态
   * @returns 已撤销状态的分配状态值对象
   */
  revoke(): AssignmentStatus {
    return AssignmentStatus.revoked();
  }

  /**
   * 过期状态
   * @returns 已过期状态的分配状态值对象
   */
  expire(): AssignmentStatus {
    return AssignmentStatus.expired();
  }
}

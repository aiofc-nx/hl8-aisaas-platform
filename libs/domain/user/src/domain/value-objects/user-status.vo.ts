/**
 * @fileoverview 用户状态值对象
 * @description 封装用户状态的业务规则和状态转换逻辑
 */

import { ValueObject } from "@hl8/shared";
import { UserStatusEnum } from "./user-status.enum.js";
import { InvalidStatusTransitionError } from "../exceptions/invalid-status-transition.error.js";

/**
 * 用户状态值对象的值类型
 * @description 包含状态枚举值和可选的原因、锁定到期时间
 */
interface UserStatusValue {
  status: UserStatusEnum;
  reason?: string;
  lockedUntil?: Date;
}

/**
 * 用户状态值对象
 * @description 封装用户状态的业务规则和状态转换逻辑
 * @remarks
 * 用户状态值对象具有以下特征：
 * - 管理用户生命周期状态（待激活、活跃、禁用、锁定、过期）
 * - 支持状态转换（激活、禁用、锁定、解锁）
 * - 记录状态原因和锁定到期时间
 * - 验证状态转换的有效性
 *
 * @example
 * ```typescript
 * // 创建待激活状态
 * const status = UserStatus.pendingActivation();
 *
 * // 激活用户
 * const activated = status.activate();
 *
 * // 禁用用户
 * const disabled = activated.disable("违规操作");
 * ```
 */
export class UserStatus extends ValueObject<UserStatusValue> {
  /**
   * 构造函数
   * @param value 用户状态值
   */
  constructor(value: UserStatusValue) {
    super(value);
  }

  /**
   * 验证状态值
   * @param value 状态值
   * @throws {Error} 当状态值无效时抛出异常
   */
  protected validateValue(value: UserStatusValue): void {
    if (!value || !value.status) {
      throw new Error("用户状态不能为空");
    }

    // 验证状态枚举值
    if (!Object.values(UserStatusEnum).includes(value.status)) {
      throw new Error(`无效的用户状态: ${value.status}`);
    }

    // 锁定状态应该设置锁定到期时间或原因
    if (
      value.status === UserStatusEnum.LOCKED &&
      !value.lockedUntil &&
      !value.reason
    ) {
      // 允许锁定状态只设置到期时间或原因，或者两者都设置
      // 这里不做强制要求
    }
  }

  /**
   * 比较两个状态值是否相等
   * @param a 第一个状态值
   * @param b 第二个状态值
   * @returns 是否相等
   */
  protected compareValues(a: UserStatusValue, b: UserStatusValue): boolean {
    if (a.status !== b.status) return false;
    if (a.reason !== b.reason) return false;
    if (a.lockedUntil?.getTime() !== b.lockedUntil?.getTime()) return false;
    return true;
  }

  /**
   * 克隆状态值对象
   * @returns 新的 UserStatus 实例
   */
  clone(): UserStatus {
    return new UserStatus({
      status: this._value.status,
      reason: this._value.reason,
      lockedUntil: this._value.lockedUntil
        ? new Date(this._value.lockedUntil.getTime())
        : undefined,
    });
  }

  /**
   * 创建活跃状态
   * @returns 活跃状态的 UserStatus 实例
   */
  static active(): UserStatus {
    return new UserStatus({
      status: UserStatusEnum.ACTIVE,
    });
  }

  /**
   * 创建待激活状态
   * @returns 待激活状态的 UserStatus 实例
   */
  static pendingActivation(): UserStatus {
    return new UserStatus({
      status: UserStatusEnum.PENDING_ACTIVATION,
    });
  }

  /**
   * 创建禁用状态
   * @param reason 禁用原因（可选）
   * @returns 禁用状态的 UserStatus 实例
   */
  static disabled(reason?: string): UserStatus {
    return new UserStatus({
      status: UserStatusEnum.DISABLED,
      reason,
    });
  }

  /**
   * 创建锁定状态
   * @param lockedUntil 锁定到期时间（可选）
   * @param reason 锁定原因（可选）
   * @returns 锁定状态的 UserStatus 实例
   */
  static locked(lockedUntil?: Date, reason?: string): UserStatus {
    return new UserStatus({
      status: UserStatusEnum.LOCKED,
      lockedUntil,
      reason,
    });
  }

  /**
   * 创建过期状态
   * @returns 过期状态的 UserStatus 实例
   */
  static expired(): UserStatus {
    return new UserStatus({
      status: UserStatusEnum.EXPIRED,
    });
  }

  /**
   * 激活用户
   * @returns 新的活跃状态
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出异常
   */
  activate(): UserStatus {
    if (this._value.status === UserStatusEnum.PENDING_ACTIVATION) {
      return UserStatus.active();
    }

    if (this._value.status === UserStatusEnum.DISABLED) {
      throw new InvalidStatusTransitionError(
        "禁用状态不能直接激活，需要先恢复",
      );
    }

    if (this._value.status === UserStatusEnum.EXPIRED) {
      throw new InvalidStatusTransitionError("过期状态不能直接激活");
    }

    // 如果已经是活跃状态，返回自身（幂等）
    if (this._value.status === UserStatusEnum.ACTIVE) {
      return this;
    }

    // 其他状态不能直接激活
    throw new InvalidStatusTransitionError(
      `不能从 ${this._value.status} 状态直接激活`,
    );
  }

  /**
   * 禁用用户
   * @param reason 禁用原因（可选）
   * @returns 新的禁用状态
   */
  disable(reason?: string): UserStatus {
    return UserStatus.disabled(reason);
  }

  /**
   * 锁定用户
   * @param lockedUntil 锁定到期时间（可选）
   * @param reason 锁定原因（可选）
   * @returns 新的锁定状态
   */
  lock(lockedUntil?: Date, reason?: string): UserStatus {
    return UserStatus.locked(lockedUntil, reason);
  }

  /**
   * 解锁用户
   * @returns 新的活跃状态
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出异常
   */
  unlock(): UserStatus {
    if (this._value.status === UserStatusEnum.LOCKED) {
      return UserStatus.active();
    }

    // 如果已经是活跃状态，返回自身（幂等）
    if (this._value.status === UserStatusEnum.ACTIVE) {
      return this;
    }

    throw new InvalidStatusTransitionError(
      `不能从 ${this._value.status} 状态解锁`,
    );
  }

  /**
   * 检查用户是否可用
   * @returns 用户是否可用（只有活跃状态可用）
   */
  isAvailable(): boolean {
    return this._value.status === UserStatusEnum.ACTIVE;
  }

  /**
   * 检查锁定是否已过期
   * @returns 锁定是否已过期
   */
  isLockExpired(): boolean {
    if (this._value.status !== UserStatusEnum.LOCKED) {
      return false;
    }

    if (!this._value.lockedUntil) {
      return false; // 如果没有设置到期时间，认为未过期
    }

    return new Date() > this._value.lockedUntil;
  }

  /**
   * 获取状态值
   * @returns 状态枚举值
   */
  getValue(): UserStatusEnum {
    return this._value.status;
  }

  /**
   * 获取状态原因
   * @returns 状态原因（如果存在）
   */
  getReason(): string | undefined {
    return this._value.reason;
  }

  /**
   * 获取锁定到期时间
   * @returns 锁定到期时间（如果存在）
   */
  getLockedUntil(): Date | undefined {
    return this._value.lockedUntil;
  }
}

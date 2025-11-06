/**
 * @fileoverview 用户状态枚举
 * @description 定义用户的所有可能状态
 */

/**
 * 用户状态枚举
 * @description 表示用户的生命周期状态
 */
export enum UserStatusEnum {
  /**
   * 待激活
   * @description 用户已创建但尚未激活
   */
  PENDING_ACTIVATION = "PENDING_ACTIVATION",

  /**
   * 活跃
   * @description 用户已激活，可以正常使用系统
   */
  ACTIVE = "ACTIVE",

  /**
   * 禁用
   * @description 用户已被禁用，无法使用系统
   */
  DISABLED = "DISABLED",

  /**
   * 锁定
   * @description 用户已被锁定，可能有时效性
   */
  LOCKED = "LOCKED",

  /**
   * 过期
   * @description 用户账户已过期
   */
  EXPIRED = "EXPIRED",
}

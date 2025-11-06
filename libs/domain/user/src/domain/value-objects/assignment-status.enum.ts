/**
 * @fileoverview 分配状态枚举
 * @description 定义用户分配的状态枚举值
 */

/**
 * 分配状态枚举
 * @description 定义用户分配的状态
 * @remarks
 * - ACTIVE: 活跃状态，分配有效
 * - REVOKED: 已撤销，分配被手动撤销
 * - EXPIRED: 已过期，分配已过期
 */
export enum AssignmentStatusEnum {
  /**
   * 活跃状态
   * @description 分配有效，用户可以正常使用
   */
  ACTIVE = "ACTIVE",

  /**
   * 已撤销
   * @description 分配被手动撤销
   */
  REVOKED = "REVOKED",

  /**
   * 已过期
   * @description 分配已过期
   */
  EXPIRED = "EXPIRED",
}

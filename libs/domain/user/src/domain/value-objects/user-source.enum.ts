/**
 * @fileoverview 用户来源枚举
 * @description 定义用户的所有可能来源
 */

/**
 * 用户来源枚举
 * @description 表示用户的来源类型
 */
export enum UserSourceEnum {
  /**
   * 平台用户
   * @description 通过平台注册的用户
   */
  PLATFORM = "PLATFORM",

  /**
   * 租户用户
   * @description 通过租户注册的用户
   */
  TENANT = "TENANT",

  /**
   * 系统用户
   * @description 系统内置用户，用于系统操作
   */
  SYSTEM = "SYSTEM",
}

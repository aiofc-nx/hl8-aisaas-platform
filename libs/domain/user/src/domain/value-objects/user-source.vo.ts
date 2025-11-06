/**
 * @fileoverview 用户来源值对象
 * @description 封装用户来源的业务规则
 */

import { ValueObject } from "@hl8/shared";
import { UserSourceEnum } from "./user-source.enum.js";

/**
 * 用户来源值对象
 * @description 封装用户来源的业务规则
 * @remarks
 * 用户来源值对象具有以下特征：
 * - 表示用户的来源类型（平台、租户、系统）
 * - 提供工厂方法创建不同类型的来源
 * - 提供判断方法检查来源类型
 *
 * @example
 * ```typescript
 * // 创建平台用户来源
 * const source = UserSource.platform();
 * console.log(source.isPlatform()); // true
 * ```
 */
export class UserSource extends ValueObject<UserSourceEnum> {
  /**
   * 构造函数
   * @param value 用户来源枚举值
   */
  constructor(value: UserSourceEnum) {
    super(value);
  }

  /**
   * 验证来源值
   * @param value 来源值
   * @throws {Error} 当来源值无效时抛出异常
   */
  protected validateValue(value: UserSourceEnum): void {
    if (!value || !Object.values(UserSourceEnum).includes(value)) {
      throw new Error(`无效的用户来源: ${value}`);
    }
  }

  /**
   * 克隆来源值对象
   * @returns 新的 UserSource 实例
   */
  clone(): UserSource {
    return new UserSource(this._value);
  }

  /**
   * 创建平台用户来源
   * @returns 平台用户来源的 UserSource 实例
   */
  static platform(): UserSource {
    return new UserSource(UserSourceEnum.PLATFORM);
  }

  /**
   * 创建租户用户来源
   * @returns 租户用户来源的 UserSource 实例
   */
  static tenant(): UserSource {
    return new UserSource(UserSourceEnum.TENANT);
  }

  /**
   * 创建系统用户来源
   * @returns 系统用户来源的 UserSource 实例
   */
  static system(): UserSource {
    return new UserSource(UserSourceEnum.SYSTEM);
  }

  /**
   * 检查是否为平台用户
   * @returns 是否为平台用户
   */
  isPlatform(): boolean {
    return this._value === UserSourceEnum.PLATFORM;
  }

  /**
   * 检查是否为租户用户
   * @returns 是否为租户用户
   */
  isTenant(): boolean {
    return this._value === UserSourceEnum.TENANT;
  }

  /**
   * 检查是否为系统用户
   * @returns 是否为系统用户
   */
  isSystem(): boolean {
    return this._value === UserSourceEnum.SYSTEM;
  }

  /**
   * 获取来源值
   * @returns 来源枚举值
   */
  getValue(): UserSourceEnum {
    return this.value;
  }
}

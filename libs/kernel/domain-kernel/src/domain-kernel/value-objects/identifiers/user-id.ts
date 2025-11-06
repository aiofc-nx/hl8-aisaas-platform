/**
 * @fileoverview 用户标识符值对象
 * @description 封装租户内用户的唯一标识符，支持多租户用户管理
 */

import { UuidGenerator } from "../../../utils/uuid-generator.js";
import { TenantId } from "./tenant-id.js";

/**
 * 用户标识符值对象
 * @description 封装用户的唯一标识符，包含租户关联
 * @remarks
 * 用户标识符用于在多租户架构中唯一标识用户。
 * 用户首先属于平台（平台用户），但使用时必须知道是哪个租户的用户。
 *
 * 用户标识符特性：
 * - value: UUID v4格式的用户标识符
 * - tenantId: 所属租户ID（必需），用于租户级数据隔离
 * - 同一用户在不同租户中可能有不同的角色和权限
 *
 * 使用场景：
 * - 用户实体的唯一标识
 * - 用户与租户的关联关系
 * - 用户权限和角色的分配
 * - 审计追踪中的用户引用
 *
 * 注意事项：
 * - 用户ID必须包含租户ID，确保数据隔离
 * - 同一用户在不同租户中的ID值相同，但UserId实例不同（tenantId不同）
 * - 唯一性约束必须包含租户ID
 *
 * @example
 * ```typescript
 * const tenantId = TenantId.generate();
 * const userId = UserId.generate(tenantId);
 *
 * class User extends MultiLevelIsolatedEntity {
 *   constructor(
 *     tenantId: TenantId,
 *     organizationId: OrganizationId | null,
 *     departmentId: DepartmentId | null,
 *     email: string,
 *     createdBy: UserId
 *   ) {
 *     super(tenantId, organizationId, departmentId, undefined, createdBy);
 *     this._email = email;
 *   }
 * }
 * ```
 */
export class UserId {
  private readonly _value: string;
  private readonly _tenantId: TenantId;

  /**
   * 创建用户标识符
   * @param tenantId 所属租户ID（必需）
   * @param value UUID v4字符串，如果未提供则自动生成
   * @throws {Error} 当提供的值不是有效的UUID v4时抛出异常
   * @throws {Error} 当租户ID无效时抛出异常
   */
  constructor(tenantId: TenantId, value?: string) {
    if (!tenantId) {
      throw new Error("租户ID不能为空");
    }

    if (!tenantId.isValid()) {
      throw new Error("租户ID无效");
    }

    if (value !== undefined && value !== null) {
      if (!UuidGenerator.validate(value)) {
        throw new Error(`无效的用户标识符格式: ${value}`);
      }
      this._value = value;
    } else {
      this._value = UuidGenerator.generate();
    }

    this._tenantId = tenantId;
  }

  /**
   * 获取标识符值
   * @returns UUID字符串
   */
  public get value(): string {
    return this._value;
  }

  /**
   * 获取所属租户ID
   * @returns 租户标识符
   */
  public get tenantId(): TenantId {
    return this._tenantId;
  }

  /**
   * 比较两个用户标识符是否相等
   * @param other 要比较的另一个用户标识符
   * @returns 是否相等
   * @description 同时比较值和租户ID
   */
  public equals(other: UserId | null | undefined): boolean {
    if (!other) {
      return false;
    }

    if (!(other instanceof UserId)) {
      return false;
    }

    return (
      this._value === other._value && this._tenantId.equals(other._tenantId)
    );
  }

  /**
   * 检查是否属于指定租户
   * @param tenantId 租户标识符
   * @returns 是否属于该租户
   */
  public belongsTo(tenantId: TenantId): boolean {
    return this._tenantId.equals(tenantId);
  }

  /**
   * 转换为字符串表示
   * @returns UUID字符串
   */
  public toString(): string {
    return this._value;
  }

  /**
   * 转换为JSON表示
   * @returns JSON对象
   */
  public toJSON(): object {
    return {
      value: this._value,
      tenantId: this._tenantId.toJSON(),
    };
  }

  /**
   * 验证标识符是否有效
   * @returns 是否有效
   */
  public isValid(): boolean {
    return UuidGenerator.validate(this._value) && this._tenantId.isValid();
  }

  /**
   * 创建用户标识符的副本
   * @returns 新的用户标识符实例
   */
  public clone(): UserId {
    return new UserId(this._tenantId, this._value);
  }

  /**
   * 从字符串创建用户标识符
   * @param tenantId 租户标识符
   * @param value UUID字符串
   * @returns 用户标识符实例
   * @throws {Error} 当字符串不是有效的UUID时抛出异常
   */
  public static fromString(tenantId: TenantId, value: string): UserId {
    return new UserId(tenantId, value);
  }

  /**
   * 生成新的用户标识符
   * @param tenantId 租户标识符
   * @returns 新的用户标识符实例
   */
  public static generate(tenantId: TenantId): UserId {
    return new UserId(tenantId);
  }

  /**
   * 比较两个用户标识符
   * @param a 第一个用户标识符
   * @param b 第二个用户标识符
   * @returns 比较结果：负数表示a小于b，0表示相等，正数表示a大于b
   * @description 首先比较租户ID，然后比较值
   */
  public static compare(a: UserId, b: UserId): number {
    const tenantCompare = TenantId.compare(a._tenantId, b._tenantId);
    if (tenantCompare !== 0) {
      return tenantCompare;
    }
    return a._value.localeCompare(b._value);
  }

  /**
   * 获取标识符的哈希值
   * @returns 哈希值
   * @description 基于值和租户ID计算哈希值
   */
  public hashCode(): number {
    let hash = 0;
    const combined = `${this._tenantId.value}:${this._value}`;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash;
  }
}

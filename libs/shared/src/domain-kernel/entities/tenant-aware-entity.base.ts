/**
 * @fileoverview 租户感知实体基类
 * @description 提供租户级数据隔离的基础功能，所有多租户业务实体应继承此类
 */

import { AuditableEntity } from "./auditable-entity.base.js";
import { EntityId } from "../value-objects/identifiers/entity-id.js";
import { TenantId } from "../value-objects/identifiers/tenant-id.js";
import { UserId } from "../value-objects/identifiers/user-id.js";

/**
 * 租户感知实体基类
 * @description 继承自AuditableEntity，添加了租户级数据隔离功能
 * @remarks
 * 租户感知实体用于支持多租户架构中的数据隔离。
 * 租户隔离是SAAS平台的基础安全要求，确保不同租户之间的数据完全隔离。
 *
 * 租户隔离特性：
 * - tenantId: 租户ID，所有业务表必须包含（必填）
 * - 租户ID在实体创建时设置，且不可修改（确保数据隔离的完整性）
 * - 支持租户级查询和过滤
 *
 * 使用场景：
 * - 所有需要租户级隔离的业务实体
 * - 多租户SAAS平台的核心实体
 * - 需要保证租户数据安全隔离的实体
 *
 * 注意事项：
 * - 租户ID必须在创建时设置，创建后不可修改
 * - 所有查询操作必须包含租户ID过滤条件
 * - 唯一性约束必须包含租户ID
 *
 * @example
 * ```typescript
 * class User extends TenantAwareEntity {
 *   private _email: string;
 *
 *   constructor(tenantId: TenantId, email: string, createdBy: UserId) {
 *     super(tenantId, undefined, undefined, undefined, undefined, undefined, createdBy);
 *     this._email = email;
 *   }
 *
 *   get email(): string {
 *     return this._email;
 *   }
 * }
 *
 * const tenantId = TenantId.generate();
 * const creatorId = UserId.generate(tenantId);
 * const user = new User(tenantId, "test@example.com", creatorId);
 * console.log(user.tenantId); // 租户ID
 * ```
 */
export abstract class TenantAwareEntity extends AuditableEntity {
  /**
   * 租户ID
   * @description 实体所属的租户标识符，用于租户级数据隔离，创建后不可修改
   */
  protected readonly _tenantId: TenantId;

  /**
   * 创建租户感知实体
   * @param tenantId 租户ID，必填
   * @param id 实体标识符，如果未提供则自动生成
   * @param createdAt 创建时间，如果未提供则使用当前时间
   * @param updatedAt 更新时间，如果未提供则使用创建时间
   * @param version 版本号，如果未提供则默认为1
   * @param deletedAt 删除时间，如果未提供则默认为null（未删除）
   * @param createdBy 创建者ID，如果未提供则默认为null
   * @param updatedBy 更新者ID，如果未提供则默认为null
   * @param deletedBy 删除者ID，如果未提供则默认为null
   * @param isActive 激活状态，如果未提供则默认为true（激活）
   * @param activatedAt 激活时间，如果未提供则使用创建时间
   * @param activatedBy 激活者ID，如果未提供则默认为null
   * @param deactivatedAt 失活时间，如果未提供则默认为null（未失活）
   * @param deactivatedBy 失活者ID，如果未提供则默认为null
   * @description 初始化租户感知实体实例，必须提供租户ID
   * @throws {Error} 当租户ID未提供时抛出异常
   */
  constructor(
    tenantId: TenantId,
    id?: EntityId,
    createdAt?: Date,
    updatedAt?: Date,
    version?: number,
    deletedAt?: Date | null,
    createdBy?: UserId | null,
    updatedBy?: UserId | null,
    deletedBy?: UserId | null,
    isActive?: boolean,
    activatedAt?: Date,
    activatedBy?: UserId | null,
    deactivatedAt?: Date | null,
    deactivatedBy?: UserId | null,
  ) {
    super(
      id,
      createdAt,
      updatedAt,
      version,
      deletedAt,
      createdBy,
      updatedBy,
      deletedBy,
      isActive,
      activatedAt,
      activatedBy,
      deactivatedAt,
      deactivatedBy,
    );

    if (!tenantId) {
      throw new Error("租户ID不能为空，所有业务实体必须属于某个租户");
    }

    this._tenantId = tenantId;
  }

  /**
   * 获取租户ID
   * @returns 租户ID
   * @description 返回实体所属的租户ID，用于查询和过滤
   */
  public get tenantId(): TenantId {
    return this._tenantId;
  }

  /**
   * 检查实体是否属于指定租户
   * @param tenantId 要检查的租户ID
   * @returns 如果实体属于指定租户则返回true，否则返回false
   * @description 验证实体是否属于指定的租户，用于数据隔离验证
   *
   * @example
   * ```typescript
   * const tenantId = TenantId.generate();
   * const creatorId = UserId.generate(tenantId);
   * const user = new User(tenantId, "test@example.com", creatorId);
   * console.log(user.belongsToTenant(tenantId)); // true
   * console.log(user.belongsToTenant(TenantId.generate())); // false
   * ```
   */
  public belongsToTenant(tenantId: TenantId): boolean {
    return this._tenantId.equals(tenantId);
  }

  /**
   * 转换为JSON表示
   * @returns 实体的JSON表示，包含租户ID和所有审计字段
   * @description 返回实体的JSON可序列化表示，包含租户ID和所有继承的字段
   */
  public override toJSON(): {
    id: string;
    tenantId: string;
    createdAt: string;
    createdBy: string | null;
    updatedAt: string;
    updatedBy: string | null;
    version: number;
    isActive: boolean;
    activatedAt: string;
    activatedBy: string | null;
    deactivatedAt: string | null;
    deactivatedBy: string | null;
    deletedAt: string | null;
    deletedBy: string | null;
  } {
    return {
      ...super.toJSON(),
      tenantId: this._tenantId.value,
    };
  }
}

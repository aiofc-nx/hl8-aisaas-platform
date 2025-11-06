/**
 * @fileoverview 多层级隔离实体基类
 * @description 提供租户、组织、部门三级数据隔离的基础功能，支持多层级数据隔离机制
 */

import { TenantAwareEntity } from "./tenant-aware-entity.base.js";
import { EntityId } from "../value-objects/identifiers/entity-id.js";
import { TenantId } from "../value-objects/identifiers/tenant-id.js";
import { OrganizationId } from "../value-objects/identifiers/organization-id.js";
import { DepartmentId } from "../value-objects/identifiers/department-id.js";
import { UserId } from "../value-objects/identifiers/user-id.js";

/**
 * 多层级隔离实体基类
 * @description 继承自TenantAwareEntity，添加了组织级和部门级数据隔离功能
 * @remarks
 * 多层级隔离实体用于支持多租户架构中的多层级数据隔离机制。
 * 支持三层数据隔离：
 * 1. **租户级隔离（必须）**：通过 tenantId 实现租户间的数据隔离
 * 2. **组织级隔离（可选）**：通过 organizationId 实现组织间的数据隔离
 * 3. **部门级隔离（可选）**：通过 departmentId 实现部门间的数据隔离
 *
 * 多层级隔离特性：
 * - tenantId: 租户ID（必填，继承自TenantAwareEntity）
 * - organizationId: 组织ID（可选），用于组织级数据隔离
 * - departmentId: 部门ID（可选），用于部门级数据隔离
 * - 支持层级继承：父部门可以查看子部门的数据
 *
 * 使用场景：
 * - 需要组织级隔离的业务实体（如用户、资源等）
 * - 需要部门级隔离的业务实体（如项目、任务等）
 * - 需要多层级数据访问控制的实体
 *
 * 注意事项：
 * - 租户ID是必填的，创建后不可修改
 * - 组织ID和部门ID是可选的，可以为null
 * - 如果设置了部门ID，应该同时设置组织ID（部门属于组织）
 * - 查询时需要考虑多层级过滤条件
 * - 唯一性约束必须包含租户ID，可选包含组织ID
 *
 * @example
 * ```typescript
 * class User extends MultiLevelIsolatedEntity {
 *   private _email: string;
 *
 *   constructor(
 *     tenantId: TenantId,
 *     organizationId: OrganizationId | null,
 *     departmentId: DepartmentId | null,
 *     email: string,
 *     createdBy: UserId
 *   ) {
 *     super(tenantId, organizationId, departmentId, undefined, undefined, undefined, undefined, undefined, createdBy);
 *     this._email = email;
 *   }
 *
 *   get email(): string {
 *     return this._email;
 *   }
 * }
 *
 * const tenantId = TenantId.generate();
 * const orgId = OrganizationId.generate(tenantId);
 * const deptId = DepartmentId.generate(orgId);
 * const creatorId = UserId.generate(tenantId);
 * const user = new User(tenantId, orgId, deptId, "test@example.com", creatorId);
 * console.log(user.tenantId); // 租户ID
 * console.log(user.organizationId); // 组织ID
 * console.log(user.departmentId); // 部门ID
 * ```
 */
export abstract class MultiLevelIsolatedEntity extends TenantAwareEntity {
  /**
   * 组织ID
   * @description 实体所属的组织标识符，用于组织级数据隔离，null表示不属于任何组织
   */
  protected _organizationId: OrganizationId | null;

  /**
   * 部门ID
   * @description 实体所属的部门标识符，用于部门级数据隔离，null表示不属于任何部门
   */
  protected _departmentId: DepartmentId | null;

  /**
   * 创建多层级隔离实体
   * @param tenantId 租户ID（TenantId），必填
   * @param organizationId 组织ID（OrganizationId），可选，如果提供则启用组织级隔离
   * @param departmentId 部门ID（DepartmentId），可选，如果提供则启用部门级隔离
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
   * @description 初始化多层级隔离实体实例，必须提供租户ID，组织和部门ID可选
   * @throws {Error} 当租户ID未提供时抛出异常
   * @throws {Error} 当提供了部门ID但未提供组织ID时抛出异常（部门必须属于组织）
   */
  constructor(
    tenantId: TenantId,
    organizationId?: OrganizationId | null,
    departmentId?: DepartmentId | null,
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
      tenantId,
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

    // 验证：如果提供了部门ID，必须同时提供组织ID
    if (departmentId !== null && departmentId !== undefined) {
      if (organizationId === null || organizationId === undefined) {
        throw new Error(
          "部门必须属于某个组织，如果提供了部门ID，必须同时提供组织ID",
        );
      }
    }

    this._organizationId = organizationId ?? null;
    this._departmentId = departmentId ?? null;
  }

  /**
   * 获取组织ID
   * @returns 组织ID，如果未设置则返回null
   */
  public get organizationId(): OrganizationId | null {
    return this._organizationId;
  }

  /**
   * 获取部门ID
   * @returns 部门ID，如果未设置则返回null
   */
  public get departmentId(): DepartmentId | null {
    return this._departmentId;
  }

  /**
   * 设置组织ID
   * @param organizationId 组织ID（OrganizationId），如果设置为null则清除组织关联
   * @param updatedBy 更新者ID，如果提供则记录更新者信息
   * @description 更新实体的组织ID，用于组织级数据隔离
   * @remarks
   * 如果实体当前有部门ID，且新的组织ID为null，则同时清除部门ID。
   * 如果实体当前有部门ID，但新的组织ID与部门所属的组织不一致，需要验证。
   *
   * @throws {Error} 当清除组织ID但实体有部门ID时抛出异常（部门必须属于组织）
   */
  public setOrganizationId(
    organizationId: OrganizationId | null,
    updatedBy?: UserId | null,
  ): void {
    // 如果清除组织ID，必须同时清除部门ID
    if (organizationId === null && this._departmentId !== null) {
      this._departmentId = null;
    }

    this._organizationId = organizationId;
    this.markAsUpdated(updatedBy);
  }

  /**
   * 设置部门ID
   * @param departmentId 部门ID（DepartmentId），如果设置为null则清除部门关联
   * @param updatedBy 更新者ID，如果提供则记录更新者信息
   * @description 更新实体的部门ID，用于部门级数据隔离
   * @remarks
   * 设置部门ID时，必须确保实体已经设置了组织ID（部门必须属于组织）。
   * 同时验证部门ID所属的组织必须与实体的组织ID一致。
   *
   * @throws {Error} 当设置部门ID但实体没有组织ID时抛出异常
   * @throws {Error} 当部门ID所属的组织与实体的组织ID不一致时抛出异常
   */
  public setDepartmentId(
    departmentId: DepartmentId | null,
    updatedBy?: UserId | null,
  ): void {
    // 如果设置部门ID，必须确保有组织ID
    if (departmentId !== null && this._organizationId === null) {
      throw new Error("部门必须属于某个组织，设置部门ID前必须先设置组织ID");
    }

    // 验证部门ID所属的组织必须与实体的组织ID一致
    if (
      departmentId !== null &&
      this._organizationId !== null &&
      !departmentId.belongsTo(this._organizationId)
    ) {
      throw new Error("部门ID所属的组织必须与实体的组织ID一致");
    }
    this._departmentId = departmentId;
    this.markAsUpdated(updatedBy);
  }

  /**
   * 检查实体是否属于指定组织
   * @param organizationId 要检查的组织ID（OrganizationId）
   * @returns 如果实体属于指定组织则返回true，否则返回false
   * @description 验证实体是否属于指定的组织，用于组织级数据隔离验证
   */
  public belongsToOrganization(organizationId: OrganizationId): boolean {
    if (this._organizationId === null) {
      return false;
    }
    return this._organizationId.equals(organizationId);
  }

  /**
   * 检查实体是否属于指定部门
   * @param departmentId 要检查的部门ID（DepartmentId）
   * @returns 如果实体属于指定部门则返回true，否则返回false
   * @description 验证实体是否属于指定的部门，用于部门级数据隔离验证
   */
  public belongsToDepartment(departmentId: DepartmentId): boolean {
    if (this._departmentId === null) {
      return false;
    }
    return this._departmentId.equals(departmentId);
  }

  /**
   * 检查实体是否属于指定的组织和部门
   * @param organizationId 要检查的组织ID（OrganizationId）
   * @param departmentId 要检查的部门ID（DepartmentId）
   * @returns 如果实体同时属于指定的组织和部门则返回true，否则返回false
   * @description 验证实体是否同时属于指定的组织和部门
   */
  public belongsToOrganizationAndDepartment(
    organizationId: OrganizationId,
    departmentId: DepartmentId,
  ): boolean {
    return (
      this.belongsToOrganization(organizationId) &&
      this.belongsToDepartment(departmentId)
    );
  }

  /**
   * 检查实体是否属于组织（无论是否属于部门）
   * @param organizationId 要检查的组织ID（OrganizationId）
   * @returns 如果实体属于指定组织则返回true，否则返回false
   * @description 检查实体是否属于指定组织，不考虑部门归属
   */
  public isInOrganization(organizationId: OrganizationId): boolean {
    return this.belongsToOrganization(organizationId);
  }

  /**
   * 检查实体是否属于部门（无论是否属于组织）
   * @param departmentId 要检查的部门ID（DepartmentId）
   * @returns 如果实体属于指定部门则返回true，否则返回false
   * @description 检查实体是否属于指定部门，不考虑组织归属
   */
  public isInDepartment(departmentId: DepartmentId): boolean {
    return this.belongsToDepartment(departmentId);
  }

  /**
   * 检查实体是否有组织关联
   * @returns 如果实体已关联组织则返回true，否则返回false
   */
  public hasOrganization(): boolean {
    return this._organizationId !== null;
  }

  /**
   * 检查实体是否有部门关联
   * @returns 如果实体已关联部门则返回true，否则返回false
   */
  public hasDepartment(): boolean {
    return this._departmentId !== null;
  }

  /**
   * 清除组织关联
   * @param updatedBy 更新者ID，如果提供则记录更新者信息
   * @description 清除实体的组织关联，同时会清除部门关联
   * @remarks
   * 清除组织关联时，会自动清除部门关联（因为部门必须属于组织）。
   */
  public clearOrganization(updatedBy?: UserId | null): void {
    this._organizationId = null;
    this._departmentId = null; // 清除组织时同时清除部门
    this.markAsUpdated(updatedBy);
  }

  /**
   * 清除部门关联
   * @param updatedBy 更新者ID，如果提供则记录更新者信息
   * @description 清除实体的部门关联，保留组织关联
   */
  public clearDepartment(updatedBy?: UserId | null): void {
    this._departmentId = null;
    this.markAsUpdated(updatedBy);
  }

  /**
   * 转换为JSON表示
   * @returns 实体的JSON表示，包含多层级隔离字段和所有审计字段
   * @description 返回实体的JSON可序列化表示，包含租户ID、组织ID、部门ID和所有继承的字段
   */
  public override toJSON(): {
    id: string;
    tenantId: string;
    organizationId: string | null;
    departmentId: string | null;
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
      organizationId: this._organizationId?.value ?? null,
      departmentId: this._departmentId?.value ?? null,
    };
  }
}

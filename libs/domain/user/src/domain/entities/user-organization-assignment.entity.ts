/**
 * @fileoverview 用户组织分配聚合根
 * @description 管理用户与组织的分配关系
 */

import {
  AggregateRoot,
  EntityId,
  UserId,
  TenantId,
  OrganizationId,
} from "@hl8/shared";
import { OrganizationRole } from "../value-objects/organization-role.vo.js";
import { AssignmentStatus } from "../value-objects/assignment-status.vo.js";

/**
 * 创建用户组织分配的参数接口
 */
export interface CreateUserOrganizationAssignmentParams {
  /**
   * 用户ID
   */
  userId: UserId;

  /**
   * 租户ID
   */
  tenantId: TenantId;

  /**
   * 组织ID
   */
  organizationId: OrganizationId;

  /**
   * 在组织中的角色
   */
  role: OrganizationRole;

  /**
   * 分配人ID
   */
  assignedBy: UserId;

  /**
   * 过期时间（可选）
   */
  expiresAt?: Date;
}

/**
 * 用户组织分配聚合根
 * @description 管理用户与组织的分配关系
 * @remarks
 * 用户组织分配聚合根具有以下特征：
 * - 管理用户与组织的分配关系
 * - 支持分配的有效期管理
 * - 支持手动撤销分配
 * - 发布领域事件以支持事件驱动架构
 *
 * 业务规则：
 * - 用户可以同时属于多个组织
 * - 组织分配必须基于租户分配存在（验证在应用层进行）
 * - 用户在不同组织中的角色相互独立
 * - 分配可以设置有效期
 * - 过期后自动失效
 * - 可以手动撤销分配
 *
 * @example
 * ```typescript
 * // 创建分配
 * const assignment = UserOrganizationAssignment.create({
 *   userId: userId,
 *   tenantId: tenantId,
 *   organizationId: organizationId,
 *   role: new OrganizationRole("admin"),
 *   assignedBy: assignedBy,
 * });
 *
 * // 撤销分配
 * assignment.revoke(revokedBy, "用户离职");
 *
 * // 检查有效性
 * if (assignment.isValid()) {
 *   // 分配有效
 * }
 * ```
 */
export class UserOrganizationAssignment extends AggregateRoot {
  /**
   * 用户ID
   */
  private readonly _userId: UserId;

  /**
   * 租户ID
   */
  private readonly _tenantId: TenantId;

  /**
   * 组织ID
   */
  private readonly _organizationId: OrganizationId;

  /**
   * 在组织中的角色
   */
  private _role: OrganizationRole;

  /**
   * 分配状态
   */
  private _status: AssignmentStatus;

  /**
   * 分配时间
   */
  private readonly _assignedAt: Date;

  /**
   * 分配人ID
   */
  private readonly _assignedBy: UserId;

  /**
   * 过期时间（可选）
   */
  private readonly _expiresAt: Date | null;

  /**
   * 撤销时间
   */
  private _revokedAt: Date | null;

  /**
   * 撤销人ID
   */
  private _revokedBy: UserId | null;

  /**
   * 撤销原因
   */
  private _revokeReason: string | null;

  /**
   * 私有构造函数
   * @description 使用静态工厂方法创建分配实例
   */
  private constructor(
    id: EntityId,
    userId: UserId,
    tenantId: TenantId,
    organizationId: OrganizationId,
    role: OrganizationRole,
    status: AssignmentStatus,
    assignedAt: Date,
    assignedBy: UserId,
    expiresAt: Date | null,
    revokedAt: Date | null,
    revokedBy: UserId | null,
    revokeReason: string | null,
    createdBy: UserId | null,
  ) {
    super(id, undefined, undefined, undefined, undefined, createdBy);
    this._userId = userId;
    this._tenantId = tenantId;
    this._organizationId = organizationId;
    this._role = role;
    this._status = status;
    this._assignedAt = assignedAt;
    this._assignedBy = assignedBy;
    this._expiresAt = expiresAt;
    this._revokedAt = revokedAt;
    this._revokedBy = revokedBy;
    this._revokeReason = revokeReason;
  }

  /**
   * 创建用户组织分配
   * @param params 创建分配的参数
   * @returns 用户组织分配聚合根实例
   * @description
   * 创建用户组织分配，包括：
   * - 设置状态为活跃
   * - 设置分配时间
   *
   * 注意：组织分配必须基于租户分配存在的验证应该在应用层进行，
   * 领域层不直接依赖 UserTenantAssignment 聚合根。
   */
  static create(
    params: CreateUserOrganizationAssignmentParams,
  ): UserOrganizationAssignment {
    const id = EntityId.generate();
    const assignedAt = new Date();

    const assignment = new UserOrganizationAssignment(
      id,
      params.userId,
      params.tenantId,
      params.organizationId,
      params.role,
      AssignmentStatus.active(),
      assignedAt,
      params.assignedBy,
      params.expiresAt || null,
      null, // revokedAt
      null, // revokedBy
      null, // revokeReason
      params.assignedBy, // createdBy
    );

    return assignment;
  }

  /**
   * 撤销分配
   * @param revokedBy 撤销人ID
   * @param reason 撤销原因（可选）
   * @description
   * 撤销用户组织分配。
   * 如果分配已经被撤销，则视为无操作（幂等）。
   */
  revoke(revokedBy: UserId, reason?: string): void {
    // 如果已经撤销，幂等处理
    if (this._status.isRevoked()) {
      return;
    }

    // 更新状态
    this._status = this._status.revoke();

    // 设置撤销信息
    this._revokedAt = new Date();
    this._revokedBy = revokedBy;
    this._revokeReason = reason || null;

    // 更新审计字段
    this.markAsUpdated(revokedBy);
  }

  /**
   * 检查分配是否有效
   * @returns 分配是否有效
   * @description
   * 分配有效需要满足以下条件：
   * - 状态为活跃（ACTIVE）
   * - 未过期（expiresAt 为 null 或 expiresAt > 当前时间）
   * - 未撤销（revokedAt 为 null）
   */
  isValid(): boolean {
    // 检查状态
    if (!this._status.isActive()) {
      return false;
    }

    // 检查是否已撤销
    if (this._revokedAt !== null) {
      return false;
    }

    // 检查是否过期
    if (this._expiresAt !== null) {
      const now = new Date();
      if (now > this._expiresAt) {
        return false;
      }
    }

    return true;
  }

  /**
   * 获取用户ID
   * @returns 用户ID
   */
  getUserId(): UserId {
    return this._userId;
  }

  /**
   * 获取租户ID
   * @returns 租户ID
   */
  getTenantId(): TenantId {
    return this._tenantId;
  }

  /**
   * 获取组织ID
   * @returns 组织ID
   */
  getOrganizationId(): OrganizationId {
    return this._organizationId;
  }

  /**
   * 获取角色
   * @returns 组织角色值对象
   */
  getRole(): OrganizationRole {
    return this._role;
  }

  /**
   * 获取状态
   * @returns 分配状态值对象
   */
  getStatus(): AssignmentStatus {
    return this._status;
  }

  /**
   * 获取分配时间
   * @returns 分配时间
   */
  getAssignedAt(): Date {
    return this._assignedAt;
  }

  /**
   * 获取分配人ID
   * @returns 分配人ID
   */
  getAssignedBy(): UserId {
    return this._assignedBy;
  }

  /**
   * 获取过期时间
   * @returns 过期时间，如果未设置则返回 null
   */
  getExpiresAt(): Date | null {
    return this._expiresAt;
  }

  /**
   * 获取撤销时间
   * @returns 撤销时间，如果未撤销则返回 null
   */
  getRevokedAt(): Date | null {
    return this._revokedAt;
  }

  /**
   * 获取撤销人ID
   * @returns 撤销人ID，如果未撤销则返回 null
   */
  getRevokedBy(): UserId | null {
    return this._revokedBy;
  }

  /**
   * 获取撤销原因
   * @returns 撤销原因，如果未撤销或未提供原因则返回 null
   */
  getRevokeReason(): string | null {
    return this._revokeReason;
  }

  /**
   * 克隆用户组织分配聚合根
   * @returns 新的 UserOrganizationAssignment 实例
   * @description
   * 创建用户组织分配聚合根的副本。
   * 注意：领域事件不会被复制，因为克隆通常用于测试或重建场景。
   */
  clone(): UserOrganizationAssignment {
    return new UserOrganizationAssignment(
      this.id,
      this._userId.clone(),
      this._tenantId.clone(),
      this._organizationId.clone(),
      this._role.clone(),
      this._status.clone(),
      new Date(this._assignedAt.getTime()),
      this._assignedBy.clone(),
      this._expiresAt ? new Date(this._expiresAt.getTime()) : null,
      this._revokedAt ? new Date(this._revokedAt.getTime()) : null,
      this._revokedBy ? this._revokedBy.clone() : null,
      this._revokeReason,
      this.createdBy,
    );
  }
}

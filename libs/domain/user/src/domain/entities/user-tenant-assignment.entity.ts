/**
 * @fileoverview 用户租户分配聚合根
 * @description 管理用户与租户的分配关系
 */

import { AggregateRoot, EntityId, UserId, TenantId } from "@hl8/shared";
import { TenantRole } from "../value-objects/tenant-role.vo.js";
import { AssignmentStatus } from "../value-objects/assignment-status.vo.js";
import { UserAssignedToTenantEvent } from "../events/user-assigned-to-tenant.event.js";
import { UserUnassignedFromTenantEvent } from "../events/user-unassigned-from-tenant.event.js";

/**
 * 创建用户租户分配的参数接口
 */
export interface CreateUserTenantAssignmentParams {
  /**
   * 用户ID
   */
  userId: UserId;

  /**
   * 租户ID
   */
  tenantId: TenantId;

  /**
   * 在租户中的角色（单个角色，向后兼容）
   * @deprecated 使用 roles 替代
   */
  role?: TenantRole;

  /**
   * 在租户中的角色列表（支持多角色）
   */
  roles?: TenantRole[];

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
 * 用户租户分配聚合根
 * @description 管理用户与租户的分配关系
 * @remarks
 * 用户租户分配聚合根具有以下特征：
 * - 管理用户与租户的分配关系
 * - 支持分配的有效期管理
 * - 支持手动撤销分配
 * - 发布领域事件以支持事件驱动架构
 *
 * 业务规则：
 * - 只有平台用户可以被分配到租户
 * - 系统用户不能分配到租户
 * - 一个平台用户可以属于多个租户
 * - 用户在不同租户中的角色相互独立
 * - 用户离开租户后仍然是平台用户
 * - 分配可以设置有效期
 * - 过期后自动失效
 * - 可以手动撤销分配
 *
 * @example
 * ```typescript
 * // 创建分配
 * const assignment = UserTenantAssignment.create({
 *   userId: userId,
 *   tenantId: tenantId,
 *   role: new TenantRole("admin"),
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
export class UserTenantAssignment extends AggregateRoot {
  /**
   * 用户ID
   */
  private readonly _userId: UserId;

  /**
   * 租户ID
   */
  private readonly _tenantId: TenantId;

  /**
   * 在租户中的角色列表（支持多角色）
   */
  private _roles: TenantRole[];

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
    roles: TenantRole[],
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
    this._roles = roles;
    this._status = status;
    this._assignedAt = assignedAt;
    this._assignedBy = assignedBy;
    this._expiresAt = expiresAt;
    this._revokedAt = revokedAt;
    this._revokedBy = revokedBy;
    this._revokeReason = revokeReason;
  }

  /**
   * 创建用户租户分配
   * @param params 创建分配的参数
   * @returns 用户租户分配聚合根实例
   * @description
   * 创建用户租户分配，包括：
   * - 设置状态为活跃
   * - 设置分配时间
   * - 支持多角色
   * - 发布 UserAssignedToTenantEvent 领域事件
   *
   * 注意：用户来源验证（只有平台用户可以被分配）应该在应用层进行，
   * 领域层不直接依赖 User 聚合根。
   */
  static create(
    params: CreateUserTenantAssignmentParams,
  ): UserTenantAssignment {
    const id = EntityId.generate();
    const assignedAt = new Date();

    // 处理角色：优先使用 roles，如果没有则使用 role（向后兼容）
    let roles: TenantRole[];
    if (params.roles !== undefined) {
      // 如果明确提供了 roles 参数
      if (params.roles.length === 0) {
        throw new Error("角色列表不能为空");
      }
      roles = params.roles;
    } else if (params.role) {
      // 向后兼容：使用单个 role
      roles = [params.role];
    } else {
      throw new Error("必须提供至少一个角色（role 或 roles）");
    }

    const assignment = new UserTenantAssignment(
      id,
      params.userId,
      params.tenantId,
      roles,
      AssignmentStatus.active(),
      assignedAt,
      params.assignedBy,
      params.expiresAt || null,
      null, // revokedAt
      null, // revokedBy
      null, // revokeReason
      params.assignedBy, // createdBy
    );

    // 发布领域事件（使用第一个角色作为主要角色，保持向后兼容）
    assignment.addDomainEvent(
      new UserAssignedToTenantEvent(
        id,
        id.value,
        params.userId.value,
        params.tenantId.value,
        roles[0].getValue(),
      ),
    );

    return assignment;
  }

  /**
   * 撤销分配
   * @param revokedBy 撤销人ID
   * @param reason 撤销原因（可选）
   * @description
   * 撤销用户租户分配。
   * 如果分配已经被撤销，则视为无操作（幂等）。
   * 撤销后会发布 UserUnassignedFromTenantEvent 领域事件。
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

    // 发布领域事件
    this.addDomainEvent(
      new UserUnassignedFromTenantEvent(
        this.id,
        this.id.value,
        this._userId.value,
        this._tenantId.value,
        reason,
      ),
    );
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
   * 获取角色列表
   * @returns 租户角色值对象数组
   */
  getRoles(): TenantRole[] {
    return [...this._roles]; // 返回副本，防止外部修改
  }

  /**
   * 获取第一个角色（向后兼容）
   * @returns 租户角色值对象
   * @deprecated 使用 getRoles() 获取所有角色
   */
  getRole(): TenantRole {
    return this._roles[0];
  }

  /**
   * 添加角色
   * @param role 要添加的角色
   * @param updatedBy 更新人ID
   * @description 添加新角色到角色列表，如果角色已存在则不添加
   */
  addRole(role: TenantRole, updatedBy: UserId): void {
    // 检查角色是否已存在
    const roleExists = this._roles.some((r) => r.equals(role));
    if (roleExists) {
      return; // 幂等：角色已存在，不添加
    }

    this._roles.push(role);
    this.markAsUpdated(updatedBy);
  }

  /**
   * 移除角色
   * @param role 要移除的角色
   * @param updatedBy 更新人ID
   * @description 从角色列表中移除指定角色，如果角色不存在则不操作
   * @throws {Error} 当尝试移除最后一个角色时抛出异常
   */
  removeRole(role: TenantRole, updatedBy: UserId): void {
    // 检查是否至少保留一个角色
    if (this._roles.length <= 1) {
      throw new Error("至少需要保留一个角色");
    }

    // 移除角色
    const index = this._roles.findIndex((r) => r.equals(role));
    if (index !== -1) {
      this._roles.splice(index, 1);
      this.markAsUpdated(updatedBy);
    }
  }

  /**
   * 检查是否具有指定角色
   * @param role 要检查的角色
   * @returns 是否具有该角色
   */
  hasRole(role: TenantRole): boolean {
    return this._roles.some((r) => r.equals(role));
  }

  /**
   * 检查是否具有指定角色值
   * @param roleValue 角色值字符串
   * @returns 是否具有该角色
   */
  hasRoleValue(roleValue: string): boolean {
    return this._roles.some((r) => r.getValue() === roleValue);
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
   * 克隆用户租户分配聚合根
   * @returns 新的 UserTenantAssignment 实例
   * @description
   * 创建用户租户分配聚合根的副本。
   * 注意：领域事件不会被复制，因为克隆通常用于测试或重建场景。
   */
  clone(): UserTenantAssignment {
    return new UserTenantAssignment(
      this.id,
      this._userId.clone(),
      this._tenantId.clone(),
      this._roles.map((r) => r.clone()), // 克隆角色数组
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

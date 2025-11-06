/**
 * @fileoverview 用户组织分配 Repository 接口
 * @description 定义用户组织分配聚合的持久化操作接口
 */

import { EntityId, UserId, TenantId, OrganizationId } from "@hl8/shared";
import { UserOrganizationAssignment } from "../entities/user-organization-assignment.entity.js";

/**
 * 用户组织分配 Repository 接口
 * @description 定义用户组织分配聚合的持久化操作接口
 * @remarks
 * Repository 接口定义在领域层，实现应该在基础设施层。
 * 这遵循了依赖倒置原则（DIP），领域层不依赖基础设施层。
 *
 * @example
 * ```typescript
 * // 在基础设施层实现
 * class UserOrganizationAssignmentRepository implements IUserOrganizationAssignmentRepository {
 *   async findById(id: EntityId): Promise<UserOrganizationAssignment | null> {
 *     // 实现数据库查询逻辑
 *   }
 * }
 * ```
 */
export interface IUserOrganizationAssignmentRepository {
  /**
   * 根据ID查找分配
   * @param id 分配ID
   * @returns 分配聚合根，如果不存在则返回 null
   */
  findById(id: EntityId): Promise<UserOrganizationAssignment | null>;

  /**
   * 查找用户的所有有效组织分配
   * @param userId 用户ID
   * @param tenantId 租户ID
   * @returns 用户的所有有效组织分配列表
   * @description
   * 查找用户在指定租户下的所有有效（活跃且未过期）组织分配。
   * 有效分配需要满足以下条件：
   * - 状态为活跃（ACTIVE）
   * - 未过期（expiresAt 为 null 或 expiresAt > 当前时间）
   * - 未撤销（revokedAt 为 null）
   */
  findActiveByUser(
    userId: UserId,
    tenantId: TenantId,
  ): Promise<UserOrganizationAssignment[]>;

  /**
   * 查找用户和组织的有效分配
   * @param userId 用户ID
   * @param tenantId 租户ID
   * @param organizationId 组织ID
   * @returns 用户和组织的有效分配，如果不存在则返回 null
   * @description
   * 查找用户和组织的有效（活跃且未过期）分配。
   * 有效分配需要满足以下条件：
   * - 状态为活跃（ACTIVE）
   * - 未过期（expiresAt 为 null 或 expiresAt > 当前时间）
   * - 未撤销（revokedAt 为 null）
   */
  findActiveByUserAndOrganization(
    userId: UserId,
    tenantId: TenantId,
    organizationId: OrganizationId,
  ): Promise<UserOrganizationAssignment | null>;

  /**
   * 保存分配（创建或更新）
   * @param assignment 分配聚合根
   * @returns 保存后的分配聚合根
   */
  save(
    assignment: UserOrganizationAssignment,
  ): Promise<UserOrganizationAssignment>;

  /**
   * 删除分配
   * @param id 分配ID
   * @returns 是否删除成功
   */
  delete(id: EntityId): Promise<boolean>;
}

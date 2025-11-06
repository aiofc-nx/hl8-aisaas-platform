/**
 * @fileoverview 用户分配领域服务
 * @description 处理跨聚合的用户分配业务逻辑
 */

import { UserId, TenantId, OrganizationId, DepartmentId } from "@hl8/shared";
import { IUserTenantAssignmentRepository } from "../repositories/user-tenant-assignment.repository.js";
import { IUserOrganizationAssignmentRepository } from "../repositories/user-organization-assignment.repository.js";
import { IUserDepartmentAssignmentRepository } from "../repositories/user-department-assignment.repository.js";
import { UserOrganizationAssignment } from "../entities/user-organization-assignment.entity.js";
import { UserDepartmentAssignment } from "../entities/user-department-assignment.entity.js";
import { OrganizationRole } from "../value-objects/organization-role.vo.js";
import { DepartmentRole } from "../value-objects/department-role.vo.js";
import { UserNotAssignedToTenantError } from "../exceptions/user-not-assigned-to-tenant.error.js";
import { UserAlreadyAssignedToOrganizationError } from "../exceptions/user-already-assigned-to-organization.error.js";
import { UserNotAssignedToOrganizationError } from "../exceptions/user-not-assigned-to-organization.error.js";
import { UserAlreadyAssignedToDepartmentInOrganizationError } from "../exceptions/user-already-assigned-to-department-in-organization.error.js";

/**
 * 分配用户到组织的参数接口
 */
export interface AssignUserToOrganizationParams {
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
 * 分配用户到部门的参数接口
 */
export interface AssignUserToDepartmentParams {
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
   * 部门ID
   */
  departmentId: DepartmentId;

  /**
   * 在部门中的角色
   */
  role: DepartmentRole;

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
 * 调整用户在组织内的部门的参数接口
 */
export interface ChangeUserDepartmentInOrganizationParams {
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
   * 新的部门ID
   */
  departmentId: DepartmentId;

  /**
   * 在部门中的角色
   */
  role: DepartmentRole;

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
 * 用户分配领域服务
 * @description 处理跨聚合的用户分配业务逻辑
 * @remarks
 * 领域服务用于处理跨聚合的业务逻辑。
 * 此服务负责管理用户在租户、组织、部门层级中的分配关系。
 *
 * 业务规则：
 * - 组织分配必须基于租户分配存在
 * - 部门分配必须基于组织分配存在
 * - 用户在同一组织内只能属于一个部门
 * - 调整部门时需要先撤销旧的部门分配
 *
 * @example
 * ```typescript
 * // 创建服务实例
 * const assignmentService = new UserAssignmentDomainService(
 *   tenantAssignmentRepo,
 *   organizationAssignmentRepo,
 *   departmentAssignmentRepo
 * );
 *
 * // 分配用户到组织
 * const orgAssignment = await assignmentService.assignUserToOrganization({
 *   userId: userId,
 *   tenantId: tenantId,
 *   organizationId: organizationId,
 *   role: new OrganizationRole("admin"),
 *   assignedBy: assignedBy,
 * });
 *
 * // 分配用户到部门
 * const deptAssignment = await assignmentService.assignUserToDepartment({
 *   userId: userId,
 *   tenantId: tenantId,
 *   organizationId: organizationId,
 *   departmentId: departmentId,
 *   role: new DepartmentRole("manager"),
 *   assignedBy: assignedBy,
 * });
 * ```
 */
export class UserAssignmentDomainService {
  /**
   * 构造函数
   * @param tenantAssignmentRepo 用户租户分配 Repository 接口
   * @param organizationAssignmentRepo 用户组织分配 Repository 接口
   * @param departmentAssignmentRepo 用户部门分配 Repository 接口
   */
  constructor(
    private readonly tenantAssignmentRepo: IUserTenantAssignmentRepository,
    private readonly organizationAssignmentRepo: IUserOrganizationAssignmentRepository,
    private readonly departmentAssignmentRepo: IUserDepartmentAssignmentRepository,
  ) {}

  /**
   * 分配用户到组织
   * @param params 分配参数
   * @returns 用户组织分配聚合根
   * @throws {UserNotAssignedToTenantError} 当用户未分配到租户时抛出异常
   * @throws {UserAlreadyAssignedToOrganizationError} 当用户已分配到组织时抛出异常
   * @description
   * 分配用户到组织，需要满足以下条件：
   * 1. 用户必须已分配到租户（验证租户分配存在）
   * 2. 用户不能已分配到该组织（验证组织分配不存在）
   *
   * 业务规则：
   * - 组织分配必须基于租户分配存在
   * - 用户可以同时属于多个组织
   */
  async assignUserToOrganization(
    params: AssignUserToOrganizationParams,
  ): Promise<UserOrganizationAssignment> {
    // 验证用户已分配到租户
    const tenantAssignment =
      await this.tenantAssignmentRepo.findActiveByUserAndTenant(
        params.userId,
        params.tenantId,
      );

    if (!tenantAssignment) {
      throw new UserNotAssignedToTenantError(
        `用户 ${params.userId.value} 未分配到租户 ${params.tenantId.value}`,
      );
    }

    // 验证用户未分配到该组织
    const existingAssignment =
      await this.organizationAssignmentRepo.findActiveByUserAndOrganization(
        params.userId,
        params.tenantId,
        params.organizationId,
      );

    if (existingAssignment) {
      throw new UserAlreadyAssignedToOrganizationError(
        `用户 ${params.userId.value} 已分配到组织 ${params.organizationId.value}`,
      );
    }

    // 创建组织分配
    const assignment = UserOrganizationAssignment.create({
      userId: params.userId,
      tenantId: params.tenantId,
      organizationId: params.organizationId,
      role: params.role,
      assignedBy: params.assignedBy,
      expiresAt: params.expiresAt,
    });

    // 保存分配
    return await this.organizationAssignmentRepo.save(assignment);
  }

  /**
   * 分配用户到部门
   * @param params 分配参数
   * @returns 用户部门分配实体
   * @throws {UserNotAssignedToOrganizationError} 当用户未分配到组织时抛出异常
   * @throws {UserAlreadyAssignedToDepartmentInOrganizationError} 当用户已在组织内分配到部门时抛出异常
   * @description
   * 分配用户到部门，需要满足以下条件：
   * 1. 用户必须已分配到组织（验证组织分配存在）
   * 2. 用户不能已在组织内分配到部门（验证部门分配不存在）
   *
   * 业务规则：
   * - 部门分配必须基于组织分配存在
   * - 用户在同一组织内只能属于一个部门
   */
  async assignUserToDepartment(
    params: AssignUserToDepartmentParams,
  ): Promise<UserDepartmentAssignment> {
    // 验证用户已分配到组织
    const orgAssignment =
      await this.organizationAssignmentRepo.findActiveByUserAndOrganization(
        params.userId,
        params.tenantId,
        params.organizationId,
      );

    if (!orgAssignment) {
      throw new UserNotAssignedToOrganizationError(
        `用户 ${params.userId.value} 未分配到组织 ${params.organizationId.value}`,
      );
    }

    // 验证用户未在组织内分配到部门
    const existingAssignment =
      await this.departmentAssignmentRepo.findByUserAndOrganization(
        params.userId,
        params.tenantId,
        params.organizationId,
      );

    if (existingAssignment) {
      throw new UserAlreadyAssignedToDepartmentInOrganizationError(
        `用户 ${params.userId.value} 已在组织 ${params.organizationId.value} 内分配到部门`,
      );
    }

    // 创建部门分配
    const assignment = UserDepartmentAssignment.create({
      userId: params.userId,
      tenantId: params.tenantId,
      organizationId: params.organizationId,
      departmentId: params.departmentId,
      role: params.role,
      assignedBy: params.assignedBy,
      expiresAt: params.expiresAt,
    });

    // 保存分配
    return await this.departmentAssignmentRepo.save(assignment);
  }

  /**
   * 调整用户在组织内的部门
   * @param params 调整参数
   * @returns Promise<void>
   * @throws {UserNotAssignedToOrganizationError} 当用户未分配到组织时抛出异常
   * @description
   * 调整用户在组织内的部门，需要满足以下条件：
   * 1. 用户必须已分配到组织（验证组织分配存在）
   * 2. 如果用户已分配到部门，先撤销旧的部门分配
   * 3. 创建新的部门分配
   *
   * 业务规则：
   * - 用户在同一组织内只能属于一个部门
   * - 调整部门时需要先撤销旧的部门分配
   */
  async changeUserDepartmentInOrganization(
    params: ChangeUserDepartmentInOrganizationParams,
  ): Promise<void> {
    // 验证用户已分配到组织
    const orgAssignment =
      await this.organizationAssignmentRepo.findActiveByUserAndOrganization(
        params.userId,
        params.tenantId,
        params.organizationId,
      );

    if (!orgAssignment) {
      throw new UserNotAssignedToOrganizationError(
        `用户 ${params.userId.value} 未分配到组织 ${params.organizationId.value}`,
      );
    }

    // 查找现有的部门分配
    const existingAssignment =
      await this.departmentAssignmentRepo.findByUserAndOrganization(
        params.userId,
        params.tenantId,
        params.organizationId,
      );

    // 如果存在旧的部门分配，先撤销
    if (existingAssignment && existingAssignment.isValid()) {
      existingAssignment.revoke(params.assignedBy, "调整部门");
      await this.departmentAssignmentRepo.save(existingAssignment);
    }

    // 创建新的部门分配
    const newAssignment = UserDepartmentAssignment.create({
      userId: params.userId,
      tenantId: params.tenantId,
      organizationId: params.organizationId,
      departmentId: params.departmentId,
      role: params.role,
      assignedBy: params.assignedBy,
      expiresAt: params.expiresAt,
    });

    // 保存新的部门分配
    await this.departmentAssignmentRepo.save(newAssignment);
  }
}

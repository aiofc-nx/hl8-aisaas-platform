/**
 * @fileoverview UserOrganizationAssignment 聚合根单元测试
 * @description 测试用户组织分配的创建、撤销、有效性检查等场景
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { EntityId, UserId, TenantId, OrganizationId } from "@hl8/shared";
import { UserOrganizationAssignment } from "./user-organization-assignment.entity.js";
import { OrganizationRole } from "../value-objects/organization-role.vo.js";
import { AssignmentStatus } from "../value-objects/assignment-status.vo.js";

describe("UserOrganizationAssignment", () => {
  let testTenantId: TenantId;
  let testUserId: UserId;
  let testOrganizationId: OrganizationId;
  let testAssignedBy: UserId;
  let testRole: OrganizationRole;

  beforeEach(() => {
    testTenantId = TenantId.generate();
    testUserId = UserId.generate(testTenantId);
    testOrganizationId = OrganizationId.generate(testTenantId);
    testAssignedBy = UserId.generate(testTenantId);
    testRole = new OrganizationRole("member");
  });

  describe("create", () => {
    it("应该创建用户组织分配", () => {
      const assignment = UserOrganizationAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      expect(assignment.id).toBeInstanceOf(EntityId);
      expect(assignment.getUserId()).toEqual(testUserId);
      expect(assignment.getTenantId()).toEqual(testTenantId);
      expect(assignment.getOrganizationId()).toEqual(testOrganizationId);
      expect(assignment.getRole().getValue()).toBe("member");
      expect(assignment.getStatus().isActive()).toBe(true);
      expect(assignment.getAssignedBy()).toEqual(testAssignedBy);
    });

    it("应该创建带过期时间的分配", () => {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天后
      const assignment = UserOrganizationAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        role: testRole,
        assignedBy: testAssignedBy,
        expiresAt: expiresAt,
      });

      expect(assignment.getExpiresAt()).toEqual(expiresAt);
    });

    it("应该设置审计字段", () => {
      const assignment = UserOrganizationAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      expect(assignment.createdAt).toBeInstanceOf(Date);
      expect(assignment.createdBy).toEqual(testAssignedBy);
      expect(assignment.version).toBe(1);
    });
  });

  describe("revoke", () => {
    it("应该撤销分配", () => {
      const assignment = UserOrganizationAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      const initialVersion = assignment.version;
      const revokedBy = UserId.generate(testTenantId);
      const reason = "用户离职";

      assignment.revoke(revokedBy, reason);

      expect(assignment.getStatus().isRevoked()).toBe(true);
      expect(assignment.getRevokedAt()).toBeInstanceOf(Date);
      expect(assignment.getRevokedBy()).toEqual(revokedBy);
      expect(assignment.getRevokeReason()).toBe(reason);
      expect(assignment.version).toBe(initialVersion + 1);
    });

    it("应该允许撤销时不提供原因", () => {
      const assignment = UserOrganizationAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      const revokedBy = UserId.generate(testTenantId);
      assignment.revoke(revokedBy);

      expect(assignment.getStatus().isRevoked()).toBe(true);
      expect(assignment.getRevokeReason()).toBeNull();
    });

    it("应该允许重复撤销（幂等）", () => {
      const assignment = UserOrganizationAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      const revokedBy = UserId.generate(testTenantId);
      assignment.revoke(revokedBy, "用户离职");
      const versionAfterFirstRevoke = assignment.version;
      const firstRevokedAt = assignment.getRevokedAt();

      // 再次撤销应该不抛异常，也不更新状态
      assignment.revoke(revokedBy, "再次撤销");

      expect(assignment.getStatus().isRevoked()).toBe(true);
      expect(assignment.version).toBe(versionAfterFirstRevoke); // 版本号不变
      expect(assignment.getRevokedAt()).toEqual(firstRevokedAt); // 撤销时间不变
    });
  });

  describe("isValid", () => {
    it("应该返回 true 当分配状态为活跃且未过期", () => {
      const assignment = UserOrganizationAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      expect(assignment.isValid()).toBe(true);
    });

    it("应该返回 true 当分配状态为活跃且未过期（有过期时间但未过期）", () => {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天后
      const assignment = UserOrganizationAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        role: testRole,
        assignedBy: testAssignedBy,
        expiresAt: expiresAt,
      });

      expect(assignment.isValid()).toBe(true);
    });

    it("应该返回 false 当分配状态为已撤销", () => {
      const assignment = UserOrganizationAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      const revokedBy = UserId.generate(testTenantId);
      assignment.revoke(revokedBy, "用户离职");

      expect(assignment.isValid()).toBe(false);
    });

    it("应该返回 false 当分配已过期", () => {
      const expiresAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1天前
      const assignment = UserOrganizationAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        role: testRole,
        assignedBy: testAssignedBy,
        expiresAt: expiresAt,
      });

      expect(assignment.isValid()).toBe(false);
    });
  });

  describe("基本属性", () => {
    it("应该返回用户ID", () => {
      const assignment = UserOrganizationAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      expect(assignment.getUserId()).toEqual(testUserId);
    });

    it("应该返回租户ID", () => {
      const assignment = UserOrganizationAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      expect(assignment.getTenantId()).toEqual(testTenantId);
    });

    it("应该返回组织ID", () => {
      const assignment = UserOrganizationAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      expect(assignment.getOrganizationId()).toEqual(testOrganizationId);
    });

    it("应该返回角色", () => {
      const assignment = UserOrganizationAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      expect(assignment.getRole()).toBeInstanceOf(OrganizationRole);
      expect(assignment.getRole().getValue()).toBe("member");
    });

    it("应该返回状态", () => {
      const assignment = UserOrganizationAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      expect(assignment.getStatus()).toBeInstanceOf(AssignmentStatus);
      expect(assignment.getStatus().isActive()).toBe(true);
    });
  });
});

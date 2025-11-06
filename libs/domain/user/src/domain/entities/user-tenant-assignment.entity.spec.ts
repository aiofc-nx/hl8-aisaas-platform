/**
 * @fileoverview UserTenantAssignment 聚合根单元测试
 * @description 测试用户租户分配的创建、撤销、有效性检查等场景
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { EntityId, UserId, TenantId } from "@hl8/shared";
import { UserTenantAssignment } from "./user-tenant-assignment.entity.js";
import { TenantRole } from "../value-objects/tenant-role.vo.js";
import { AssignmentStatus } from "../value-objects/assignment-status.vo.js";
import { UserAssignedToTenantEvent } from "../events/user-assigned-to-tenant.event.js";
import { UserUnassignedFromTenantEvent } from "../events/user-unassigned-from-tenant.event.js";
import { InvalidUserSourceError } from "../exceptions/invalid-user-source.error.js";
import { UserAlreadyAssignedToTenantError } from "../exceptions/user-already-assigned-to-tenant.error.js";
import { User } from "./user.entity.js";
import { Username } from "../value-objects/username.vo.js";
import { Email } from "../value-objects/email.vo.js";

describe("UserTenantAssignment", () => {
  let testTenantId: TenantId;
  let testUserId: UserId;
  let testAssignedBy: UserId;
  let testRole: TenantRole;

  beforeEach(() => {
    testTenantId = TenantId.generate();
    testUserId = UserId.generate(testTenantId);
    testAssignedBy = UserId.generate(testTenantId);
    testRole = new TenantRole("member");
  });

  describe("create", () => {
    it("应该创建用户租户分配", () => {
      const assignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      expect(assignment.id).toBeInstanceOf(EntityId);
      expect(assignment.getUserId()).toEqual(testUserId);
      expect(assignment.getTenantId()).toEqual(testTenantId);
      expect(assignment.getRole().getValue()).toBe("member");
      expect(assignment.getRoles()).toHaveLength(1);
      expect(assignment.getRoles()[0].getValue()).toBe("member");
      expect(assignment.getStatus().isActive()).toBe(true);
      expect(assignment.getAssignedBy()).toEqual(testAssignedBy);
      expect(assignment.getExpiresAt()).toBeNull();
      expect(assignment.getRevokedAt()).toBeNull();
      expect(assignment.getRevokedBy()).toBeNull();
      expect(assignment.getRevokeReason()).toBeNull();
    });

    it("应该创建带多个角色的用户租户分配", () => {
      const roles = [
        new TenantRole("admin"),
        new TenantRole("member"),
        new TenantRole("viewer"),
      ];
      const assignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        roles: roles,
        assignedBy: testAssignedBy,
      });

      expect(assignment.getRoles()).toHaveLength(3);
      expect(assignment.getRoles()[0].getValue()).toBe("admin");
      expect(assignment.getRoles()[1].getValue()).toBe("member");
      expect(assignment.getRoles()[2].getValue()).toBe("viewer");
      // 向后兼容：getRole() 返回第一个角色
      expect(assignment.getRole().getValue()).toBe("admin");
    });

    it("应该在没有提供角色时抛出异常", () => {
      expect(() => {
        UserTenantAssignment.create({
          userId: testUserId,
          tenantId: testTenantId,
          assignedBy: testAssignedBy,
        });
      }).toThrow("必须提供至少一个角色（role 或 roles）");
    });

    it("应该在提供空角色列表时抛出异常", () => {
      expect(() => {
        UserTenantAssignment.create({
          userId: testUserId,
          tenantId: testTenantId,
          roles: [],
          assignedBy: testAssignedBy,
        });
      }).toThrow("角色列表不能为空");
    });

    it("应该创建带过期时间的分配", () => {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天后
      const assignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        role: testRole,
        assignedBy: testAssignedBy,
        expiresAt: expiresAt,
      });

      expect(assignment.getExpiresAt()).toEqual(expiresAt);
    });

    it("应该发布 UserAssignedToTenantEvent 领域事件", () => {
      const assignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      const events = assignment.getDomainEvents();
      expect(events.length).toBe(1);
      expect(events[0]).toBeInstanceOf(UserAssignedToTenantEvent);
      const assignedEvent = events[0] as UserAssignedToTenantEvent;
      expect(assignedEvent.eventType).toBe("UserAssignedToTenant");
      expect(assignedEvent.userId).toBe(testUserId.value);
      expect(assignedEvent.tenantId).toBe(testTenantId.value);
      expect(assignedEvent.role).toBe("member");
    });

    it("应该设置审计字段", () => {
      const assignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
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
      const assignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
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
      const assignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      const revokedBy = UserId.generate(testTenantId);
      assignment.revoke(revokedBy);

      expect(assignment.getStatus().isRevoked()).toBe(true);
      expect(assignment.getRevokeReason()).toBeNull();
    });

    it("应该发布 UserUnassignedFromTenantEvent 领域事件", () => {
      const assignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      const revokedBy = UserId.generate(testTenantId);
      assignment.revoke(revokedBy, "用户离职");

      const events = assignment.getDomainEvents();
      const unassignedEvent = events.find(
        (e) => e instanceof UserUnassignedFromTenantEvent,
      ) as UserUnassignedFromTenantEvent;
      expect(unassignedEvent).toBeDefined();
      expect(unassignedEvent.eventType).toBe("UserUnassignedFromTenant");
      expect(unassignedEvent.userId).toBe(testUserId.value);
      expect(unassignedEvent.tenantId).toBe(testTenantId.value);
      expect(unassignedEvent.reason).toBe("用户离职");
    });

    it("应该允许重复撤销（幂等）", () => {
      const assignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
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
      const assignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      expect(assignment.isValid()).toBe(true);
    });

    it("应该返回 true 当分配状态为活跃且未过期（有过期时间但未过期）", () => {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天后
      const assignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        role: testRole,
        assignedBy: testAssignedBy,
        expiresAt: expiresAt,
      });

      expect(assignment.isValid()).toBe(true);
    });

    it("应该返回 false 当分配状态为已撤销", () => {
      const assignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      const revokedBy = UserId.generate(testTenantId);
      assignment.revoke(revokedBy, "用户离职");

      expect(assignment.isValid()).toBe(false);
    });

    it("应该返回 false 当分配已过期", () => {
      const expiresAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1天前
      const assignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        role: testRole,
        assignedBy: testAssignedBy,
        expiresAt: expiresAt,
      });

      expect(assignment.isValid()).toBe(false);
    });
  });

  describe("基本属性", () => {
    it("应该返回用户ID", () => {
      const assignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      expect(assignment.getUserId()).toEqual(testUserId);
    });

    it("应该返回租户ID", () => {
      const assignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      expect(assignment.getTenantId()).toEqual(testTenantId);
    });

    it("应该返回角色", () => {
      const assignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      expect(assignment.getRole()).toBeInstanceOf(TenantRole);
      expect(assignment.getRole().getValue()).toBe("member");
    });

    it("应该返回状态", () => {
      const assignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      expect(assignment.getStatus()).toBeInstanceOf(AssignmentStatus);
      expect(assignment.getStatus().isActive()).toBe(true);
    });

    it("应该返回分配时间", () => {
      const assignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      expect(assignment.getAssignedAt()).toBeInstanceOf(Date);
    });

    it("应该返回分配人", () => {
      const assignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      expect(assignment.getAssignedBy()).toEqual(testAssignedBy);
    });
  });

  describe("多角色管理", () => {
    it("应该添加角色", () => {
      const assignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      const newRole = new TenantRole("admin");
      const updatedBy = UserId.generate(testTenantId);
      assignment.addRole(newRole, updatedBy);

      expect(assignment.getRoles()).toHaveLength(2);
      expect(assignment.hasRole(newRole)).toBe(true);
      expect(assignment.hasRoleValue("admin")).toBe(true);
    });

    it("应该允许重复添加相同角色（幂等）", () => {
      const assignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      const updatedBy = UserId.generate(testTenantId);
      assignment.addRole(testRole, updatedBy); // 添加已存在的角色

      expect(assignment.getRoles()).toHaveLength(1); // 角色数量不变
    });

    it("应该移除角色", () => {
      const roles = [
        new TenantRole("admin"),
        new TenantRole("member"),
      ];
      const assignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        roles: roles,
        assignedBy: testAssignedBy,
      });

      const updatedBy = UserId.generate(testTenantId);
      assignment.removeRole(new TenantRole("admin"), updatedBy);

      expect(assignment.getRoles()).toHaveLength(1);
      expect(assignment.hasRoleValue("admin")).toBe(false);
      expect(assignment.hasRoleValue("member")).toBe(true);
    });

    it("应该在尝试移除最后一个角色时抛出异常", () => {
      const assignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        role: testRole,
        assignedBy: testAssignedBy,
      });

      const updatedBy = UserId.generate(testTenantId);
      expect(() => {
        assignment.removeRole(testRole, updatedBy);
      }).toThrow("至少需要保留一个角色");
    });

    it("应该检查是否具有指定角色", () => {
      const roles = [
        new TenantRole("admin"),
        new TenantRole("member"),
      ];
      const assignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        roles: roles,
        assignedBy: testAssignedBy,
      });

      expect(assignment.hasRole(new TenantRole("admin"))).toBe(true);
      expect(assignment.hasRole(new TenantRole("member"))).toBe(true);
      expect(assignment.hasRole(new TenantRole("viewer"))).toBe(false);
      expect(assignment.hasRoleValue("admin")).toBe(true);
      expect(assignment.hasRoleValue("viewer")).toBe(false);
    });
  });
});

/**
 * @fileoverview UserAssignmentDomainService 单元测试
 * @description 测试用户分配领域服务的跨聚合业务逻辑
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { UserId, TenantId, OrganizationId, DepartmentId } from "@hl8/shared";
import { UserAssignmentDomainService } from "./user-assignment.service.js";
import { IUserTenantAssignmentRepository } from "../repositories/user-tenant-assignment.repository.js";
import { IUserOrganizationAssignmentRepository } from "../repositories/user-organization-assignment.repository.js";
import { IUserDepartmentAssignmentRepository } from "../repositories/user-department-assignment.repository.js";
import { UserTenantAssignment } from "../entities/user-tenant-assignment.entity.js";
import { UserOrganizationAssignment } from "../entities/user-organization-assignment.entity.js";
import { UserDepartmentAssignment } from "../entities/user-department-assignment.entity.js";
import { TenantRole } from "../value-objects/tenant-role.vo.js";
import { OrganizationRole } from "../value-objects/organization-role.vo.js";
import { DepartmentRole } from "../value-objects/department-role.vo.js";
import { UserNotAssignedToTenantError } from "../exceptions/user-not-assigned-to-tenant.error.js";
import { UserAlreadyAssignedToOrganizationError } from "../exceptions/user-already-assigned-to-organization.error.js";
import { UserAlreadyAssignedToDepartmentInOrganizationError } from "../exceptions/user-already-assigned-to-department-in-organization.error.js";

describe("UserAssignmentDomainService", () => {
  let service: UserAssignmentDomainService;
  let mockTenantAssignmentRepo: jest.Mocked<IUserTenantAssignmentRepository>;
  let mockOrganizationAssignmentRepo: jest.Mocked<IUserOrganizationAssignmentRepository>;
  let mockDepartmentAssignmentRepo: jest.Mocked<IUserDepartmentAssignmentRepository>;
  let testTenantId: TenantId;
  let testUserId: UserId;
  let testOrganizationId: OrganizationId;
  let testDepartmentId: DepartmentId;
  let testAssignedBy: UserId;

  beforeEach(() => {
    testTenantId = TenantId.generate();
    testUserId = UserId.generate(testTenantId);
    testOrganizationId = OrganizationId.generate(testTenantId);
    testDepartmentId = DepartmentId.generate(testOrganizationId);
    testAssignedBy = UserId.generate(testTenantId);

    mockTenantAssignmentRepo = {
      findById: jest.fn(),
      findActiveByUser: jest.fn(),
      findActiveByUserAndTenant: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IUserTenantAssignmentRepository>;

    mockOrganizationAssignmentRepo = {
      findById: jest.fn(),
      findActiveByUser: jest.fn(),
      findActiveByUserAndOrganization: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IUserOrganizationAssignmentRepository>;

    mockDepartmentAssignmentRepo = {
      findById: jest.fn(),
      findByUserAndOrganization: jest.fn(),
      findActiveByUser: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IUserDepartmentAssignmentRepository>;

    service = new UserAssignmentDomainService(
      mockTenantAssignmentRepo,
      mockOrganizationAssignmentRepo,
      mockDepartmentAssignmentRepo,
    );
  });

  describe("assignUserToOrganization", () => {
    it("应该分配用户到组织", async () => {
      // 模拟用户已分配到租户
      const tenantAssignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        role: new TenantRole("member"),
        assignedBy: testAssignedBy,
      });
      mockTenantAssignmentRepo.findActiveByUserAndTenant.mockResolvedValue(
        tenantAssignment,
      );

      // 模拟组织分配不存在
      mockOrganizationAssignmentRepo.findActiveByUserAndOrganization.mockResolvedValue(
        null,
      );

      const role = new OrganizationRole("admin");
      // Mock save 方法返回保存后的分配
      const savedAssignment = UserOrganizationAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        role: role,
        assignedBy: testAssignedBy,
      });
      mockOrganizationAssignmentRepo.save.mockResolvedValue(savedAssignment);

      const result = await service.assignUserToOrganization({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        role: role,
        assignedBy: testAssignedBy,
      });

      expect(result).toBeInstanceOf(UserOrganizationAssignment);
      expect(result.getUserId()).toEqual(testUserId);
      expect(result.getTenantId()).toEqual(testTenantId);
      expect(result.getOrganizationId()).toEqual(testOrganizationId);
      expect(result.getRole().getValue()).toBe("admin");
      expect(
        mockTenantAssignmentRepo.findActiveByUserAndTenant,
      ).toHaveBeenCalledWith(testUserId, testTenantId);
      expect(
        mockOrganizationAssignmentRepo.findActiveByUserAndOrganization,
      ).toHaveBeenCalledWith(testUserId, testTenantId, testOrganizationId);
    });

    it("应该抛出异常当用户未分配到租户", async () => {
      // 模拟用户未分配到租户
      mockTenantAssignmentRepo.findActiveByUserAndTenant.mockResolvedValue(
        null,
      );

      const role = new OrganizationRole("admin");
      await expect(
        service.assignUserToOrganization({
          userId: testUserId,
          tenantId: testTenantId,
          organizationId: testOrganizationId,
          role: role,
          assignedBy: testAssignedBy,
        }),
      ).rejects.toThrow(UserNotAssignedToTenantError);
    });

    it("应该抛出异常当用户已分配到组织", async () => {
      // 模拟用户已分配到租户
      const tenantAssignment = UserTenantAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        role: new TenantRole("member"),
        assignedBy: testAssignedBy,
      });
      mockTenantAssignmentRepo.findActiveByUserAndTenant.mockResolvedValue(
        tenantAssignment,
      );

      // 模拟组织分配已存在
      const existingOrgAssignment = UserOrganizationAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        role: new OrganizationRole("member"),
        assignedBy: testAssignedBy,
      });
      mockOrganizationAssignmentRepo.findActiveByUserAndOrganization.mockResolvedValue(
        existingOrgAssignment,
      );

      const role = new OrganizationRole("admin");
      await expect(
        service.assignUserToOrganization({
          userId: testUserId,
          tenantId: testTenantId,
          organizationId: testOrganizationId,
          role: role,
          assignedBy: testAssignedBy,
        }),
      ).rejects.toThrow(UserAlreadyAssignedToOrganizationError);
    });
  });

  describe("assignUserToDepartment", () => {
    it("应该分配用户到部门", async () => {
      // 模拟用户已分配到组织
      const orgAssignment = UserOrganizationAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        role: new OrganizationRole("member"),
        assignedBy: testAssignedBy,
      });
      mockOrganizationAssignmentRepo.findActiveByUserAndOrganization.mockResolvedValue(
        orgAssignment,
      );

      // 模拟部门分配不存在
      mockDepartmentAssignmentRepo.findByUserAndOrganization.mockResolvedValue(
        null,
      );

      const role = new DepartmentRole("manager");
      // Mock save 方法返回保存后的分配
      const savedAssignment = UserDepartmentAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        departmentId: testDepartmentId,
        role: role,
        assignedBy: testAssignedBy,
      });
      mockDepartmentAssignmentRepo.save.mockResolvedValue(savedAssignment);

      const result = await service.assignUserToDepartment({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        departmentId: testDepartmentId,
        role: role,
        assignedBy: testAssignedBy,
      });

      expect(result).toBeInstanceOf(UserDepartmentAssignment);
      expect(result.getUserId()).toEqual(testUserId);
      expect(result.getOrganizationId()).toEqual(testOrganizationId);
      expect(result.getDepartmentId()).toEqual(testDepartmentId);
      expect(result.getRole().getValue()).toBe("manager");
      expect(
        mockOrganizationAssignmentRepo.findActiveByUserAndOrganization,
      ).toHaveBeenCalledWith(testUserId, testTenantId, testOrganizationId);
      expect(
        mockDepartmentAssignmentRepo.findByUserAndOrganization,
      ).toHaveBeenCalledWith(testUserId, testTenantId, testOrganizationId);
    });

    it("应该抛出异常当用户未分配到组织", async () => {
      // 模拟用户未分配到组织
      mockOrganizationAssignmentRepo.findActiveByUserAndOrganization.mockResolvedValue(
        null,
      );

      const role = new DepartmentRole("manager");
      await expect(
        service.assignUserToDepartment({
          userId: testUserId,
          tenantId: testTenantId,
          organizationId: testOrganizationId,
          departmentId: testDepartmentId,
          role: role,
          assignedBy: testAssignedBy,
        }),
      ).rejects.toThrow();
    });

    it("应该抛出异常当用户已在组织内分配到部门", async () => {
      // 模拟用户已分配到组织
      const orgAssignment = UserOrganizationAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        role: new OrganizationRole("member"),
        assignedBy: testAssignedBy,
      });
      mockOrganizationAssignmentRepo.findActiveByUserAndOrganization.mockResolvedValue(
        orgAssignment,
      );

      // 模拟部门分配已存在
      const existingDeptAssignment = UserDepartmentAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        departmentId: testDepartmentId,
        role: new DepartmentRole("member"),
        assignedBy: testAssignedBy,
      });
      mockDepartmentAssignmentRepo.findByUserAndOrganization.mockResolvedValue(
        existingDeptAssignment,
      );

      const role = new DepartmentRole("manager");
      await expect(
        service.assignUserToDepartment({
          userId: testUserId,
          tenantId: testTenantId,
          organizationId: testOrganizationId,
          departmentId: testDepartmentId,
          role: role,
          assignedBy: testAssignedBy,
        }),
      ).rejects.toThrow(UserAlreadyAssignedToDepartmentInOrganizationError);
    });
  });

  describe("changeUserDepartmentInOrganization", () => {
    it("应该调整用户在组织内的部门", async () => {
      // 模拟用户已分配到组织
      const orgAssignment = UserOrganizationAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        role: new OrganizationRole("member"),
        assignedBy: testAssignedBy,
      });
      mockOrganizationAssignmentRepo.findActiveByUserAndOrganization.mockResolvedValue(
        orgAssignment,
      );

      // 模拟存在旧的部门分配
      const oldDepartmentId = DepartmentId.generate(testOrganizationId);
      const oldDeptAssignment = UserDepartmentAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        departmentId: oldDepartmentId,
        role: new DepartmentRole("member"),
        assignedBy: testAssignedBy,
      });
      mockDepartmentAssignmentRepo.findByUserAndOrganization.mockResolvedValue(
        oldDeptAssignment,
      );

      const newRole = new DepartmentRole("manager");
      await service.changeUserDepartmentInOrganization({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        departmentId: testDepartmentId,
        role: newRole,
        assignedBy: testAssignedBy,
      });

      // 应该撤销旧的部门分配
      expect(oldDeptAssignment.getStatus().isRevoked()).toBe(true);
      expect(mockDepartmentAssignmentRepo.save).toHaveBeenCalledWith(
        oldDeptAssignment,
      );
    });

    it("应该创建新的部门分配当用户未分配到部门", async () => {
      // 模拟用户已分配到组织
      const orgAssignment = UserOrganizationAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        role: new OrganizationRole("member"),
        assignedBy: testAssignedBy,
      });
      mockOrganizationAssignmentRepo.findActiveByUserAndOrganization.mockResolvedValue(
        orgAssignment,
      );

      // 模拟部门分配不存在
      mockDepartmentAssignmentRepo.findByUserAndOrganization.mockResolvedValue(
        null,
      );

      const role = new DepartmentRole("manager");
      // Mock save 方法
      const newAssignment = UserDepartmentAssignment.create({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        departmentId: testDepartmentId,
        role: role,
        assignedBy: testAssignedBy,
      });
      mockDepartmentAssignmentRepo.save.mockResolvedValue(newAssignment);

      await service.changeUserDepartmentInOrganization({
        userId: testUserId,
        tenantId: testTenantId,
        organizationId: testOrganizationId,
        departmentId: testDepartmentId,
        role: role,
        assignedBy: testAssignedBy,
      });

      // 应该创建新的部门分配
      expect(mockDepartmentAssignmentRepo.save).toHaveBeenCalled();
    });

    it("应该抛出异常当用户未分配到组织", async () => {
      // 模拟用户未分配到组织
      mockOrganizationAssignmentRepo.findActiveByUserAndOrganization.mockResolvedValue(
        null,
      );

      const role = new DepartmentRole("manager");
      await expect(
        service.changeUserDepartmentInOrganization({
          userId: testUserId,
          tenantId: testTenantId,
          organizationId: testOrganizationId,
          departmentId: testDepartmentId,
          role: role,
          assignedBy: testAssignedBy,
        }),
      ).rejects.toThrow();
    });
  });
});

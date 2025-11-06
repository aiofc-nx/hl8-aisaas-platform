/**
 * @fileoverview 多层级隔离实体基类测试
 * @description 测试MultiLevelIsolatedEntity基类的各种功能
 */

import { MultiLevelIsolatedEntity } from "./multi-level-isolated-entity.base.js";
import { EntityId } from "../value-objects/identifiers/entity-id.js";
import { TenantId } from "../value-objects/identifiers/tenant-id.js";
import { OrganizationId } from "../value-objects/identifiers/organization-id.js";
import { DepartmentId } from "../value-objects/identifiers/department-id.js";
import { UserId } from "../value-objects/identifiers/user-id.js";

/**
 * 测试用的多层级隔离实体类
 */
class TestMultiLevelIsolatedEntity extends MultiLevelIsolatedEntity {
  private _name: string;

  constructor(
    tenantId: TenantId,
    organizationId?: OrganizationId | null,
    departmentId?: DepartmentId | null,
    id?: EntityId,
    name?: string,
    createdBy?: UserId,
  ) {
    super(
      tenantId,
      organizationId,
      departmentId,
      id,
      undefined,
      undefined,
      undefined,
      undefined,
      createdBy,
    );
    this._name = name || "测试实体";
  }

  get name(): string {
    return this._name;
  }

  clone(): MultiLevelIsolatedEntity {
    return new TestMultiLevelIsolatedEntity(
      this.tenantId,
      this.organizationId,
      this.departmentId,
      this.id,
      this._name,
      this.createdBy,
    );
  }
}

describe("MultiLevelIsolatedEntity", () => {
  // 测试用的租户ID
  const testTenantId = TenantId.generate();

  // 辅助函数：生成测试用的UserId
  const createTestUserId = (tenantId: TenantId = testTenantId): UserId => {
    return UserId.generate(tenantId);
  };
  describe("构造函数", () => {
    it("应该能够创建多层级隔离实体（仅租户）", () => {
      const tenantId = TenantId.generate();
      const entity = new TestMultiLevelIsolatedEntity(tenantId);

      expect(entity.id).toBeDefined();
      expect(entity.tenantId).toBe(tenantId);
      expect(entity.organizationId).toBeNull();
      expect(entity.departmentId).toBeNull();
    });

    it("应该能够创建多层级隔离实体（租户+组织）", () => {
      const tenantId = TenantId.generate();
      const orgId = OrganizationId.generate(tenantId);
      const entity = new TestMultiLevelIsolatedEntity(tenantId, orgId);

      expect(entity.tenantId).toBe(tenantId);
      expect(entity.organizationId).toBe(orgId);
      expect(entity.departmentId).toBeNull();
    });

    it("应该能够创建多层级隔离实体（租户+组织+部门）", () => {
      const tenantId = TenantId.generate();
      const orgId = OrganizationId.generate(tenantId);
      const deptId = DepartmentId.generate(orgId);
      const entity = new TestMultiLevelIsolatedEntity(tenantId, orgId, deptId);

      expect(entity.tenantId).toBe(tenantId);
      expect(entity.organizationId).toBe(orgId);
      expect(entity.departmentId).toBe(deptId);
    });

    it("应该要求租户ID不能为空", () => {
      expect(() => {
        new TestMultiLevelIsolatedEntity(null as any);
      }).toThrow("租户ID不能为空");
    });

    it("应该禁止在没有组织ID的情况下设置部门ID", () => {
      const tenantId = TenantId.generate();
      const orgId = OrganizationId.generate(tenantId);
      const deptId = DepartmentId.generate(orgId);

      expect(() => {
        new TestMultiLevelIsolatedEntity(tenantId, null, deptId);
      }).toThrow("部门必须属于某个组织");
    });
  });

  describe("组织ID和部门ID管理", () => {
    describe("setOrganizationId", () => {
      it("应该能够设置组织ID", () => {
        const tenantId = TenantId.generate();
        const entity = new TestMultiLevelIsolatedEntity(tenantId);
        const orgId = OrganizationId.generate(tenantId);
        const updatedBy = createTestUserId(tenantId);

        entity.setOrganizationId(orgId, updatedBy);

        expect(entity.organizationId).toBe(orgId);
        expect(entity.updatedBy).toBe(updatedBy);
      });

      it("应该能够清除组织ID", () => {
        const tenantId = TenantId.generate();
        const orgId = OrganizationId.generate(tenantId);
        const entity = new TestMultiLevelIsolatedEntity(tenantId, orgId);

        entity.setOrganizationId(null);

        expect(entity.organizationId).toBeNull();
      });

      it("清除组织ID时应该同时清除部门ID", () => {
        const tenantId = TenantId.generate();
        const orgId = OrganizationId.generate(tenantId);
        const deptId = DepartmentId.generate(orgId);
        const entity = new TestMultiLevelIsolatedEntity(
          tenantId,
          orgId,
          deptId,
        );

        expect(entity.departmentId).toBe(deptId);

        entity.setOrganizationId(null);

        expect(entity.organizationId).toBeNull();
        expect(entity.departmentId).toBeNull();
      });
    });

    describe("setDepartmentId", () => {
      it("应该能够设置部门ID", () => {
        const tenantId = TenantId.generate();
        const orgId = OrganizationId.generate(tenantId);
        const entity = new TestMultiLevelIsolatedEntity(tenantId, orgId);
        const deptId = DepartmentId.generate(orgId);
        const updatedBy = createTestUserId(tenantId);

        entity.setDepartmentId(deptId, updatedBy);

        expect(entity.departmentId).toBe(deptId);
        expect(entity.updatedBy).toBe(updatedBy);
      });

      it("应该能够清除部门ID", () => {
        const tenantId = TenantId.generate();
        const orgId = OrganizationId.generate(tenantId);
        const deptId = DepartmentId.generate(orgId);
        const entity = new TestMultiLevelIsolatedEntity(
          tenantId,
          orgId,
          deptId,
        );

        entity.setDepartmentId(null);

        expect(entity.departmentId).toBeNull();
        expect(entity.organizationId).toBe(orgId); // 组织ID应该保留
      });

      it("应该禁止在没有组织ID的情况下设置部门ID", () => {
        const tenantId = TenantId.generate();
        const entity = new TestMultiLevelIsolatedEntity(tenantId);
        const orgId = OrganizationId.generate(tenantId);
        const deptId = DepartmentId.generate(orgId);

        expect(() => {
          entity.setDepartmentId(deptId);
        }).toThrow("部门必须属于某个组织");
      });
    });
  });

  describe("归属验证方法", () => {
    describe("belongsToOrganization", () => {
      it("应该正确识别属于指定组织的实体", () => {
        const tenantId = TenantId.generate();
        const orgId = OrganizationId.generate(tenantId);
        const entity = new TestMultiLevelIsolatedEntity(tenantId, orgId);

        expect(entity.belongsToOrganization(orgId)).toBe(true);
      });

      it("应该正确识别不属于指定组织的实体", () => {
        const tenantId = TenantId.generate();
        const orgId1 = OrganizationId.generate(tenantId);
        const orgId2 = OrganizationId.generate(tenantId);
        const entity = new TestMultiLevelIsolatedEntity(tenantId, orgId1);

        expect(entity.belongsToOrganization(orgId2)).toBe(false);
      });

      it("应该对没有组织的实体返回false", () => {
        const tenantId = TenantId.generate();
        const entity = new TestMultiLevelIsolatedEntity(tenantId);
        const orgId = OrganizationId.generate(tenantId);

        expect(entity.belongsToOrganization(orgId)).toBe(false);
      });
    });

    describe("belongsToDepartment", () => {
      it("应该正确识别属于指定部门的实体", () => {
        const tenantId = TenantId.generate();
        const orgId = OrganizationId.generate(tenantId);
        const deptId = DepartmentId.generate(orgId);
        const entity = new TestMultiLevelIsolatedEntity(
          tenantId,
          orgId,
          deptId,
        );

        expect(entity.belongsToDepartment(deptId)).toBe(true);
      });

      it("应该正确识别不属于指定部门的实体", () => {
        const tenantId = TenantId.generate();
        const orgId = OrganizationId.generate(tenantId);
        const deptId1 = DepartmentId.generate(orgId);
        const deptId2 = DepartmentId.generate(orgId);
        const entity = new TestMultiLevelIsolatedEntity(
          tenantId,
          orgId,
          deptId1,
        );

        expect(entity.belongsToDepartment(deptId2)).toBe(false);
      });

      it("应该对没有部门的实体返回false", () => {
        const tenantId = TenantId.generate();
        const entity = new TestMultiLevelIsolatedEntity(tenantId);
        const orgId = OrganizationId.generate(tenantId);
        const deptId = DepartmentId.generate(orgId);

        expect(entity.belongsToDepartment(deptId)).toBe(false);
      });
    });

    describe("belongsToOrganizationAndDepartment", () => {
      it("应该正确识别同时属于指定组织和部门的实体", () => {
        const tenantId = TenantId.generate();
        const orgId = OrganizationId.generate(tenantId);
        const deptId = DepartmentId.generate(orgId);
        const entity = new TestMultiLevelIsolatedEntity(
          tenantId,
          orgId,
          deptId,
        );

        expect(entity.belongsToOrganizationAndDepartment(orgId, deptId)).toBe(
          true,
        );
      });

      it("应该对组织不匹配的实体返回false", () => {
        const tenantId = TenantId.generate();
        const orgId1 = OrganizationId.generate(tenantId);
        const orgId2 = OrganizationId.generate(tenantId);
        const deptId = DepartmentId.generate(orgId1);
        const entity = new TestMultiLevelIsolatedEntity(
          tenantId,
          orgId1,
          deptId,
        );

        expect(entity.belongsToOrganizationAndDepartment(orgId2, deptId)).toBe(
          false,
        );
      });

      it("应该对部门不匹配的实体返回false", () => {
        const tenantId = TenantId.generate();
        const orgId = OrganizationId.generate(tenantId);
        const deptId1 = DepartmentId.generate(orgId);
        const deptId2 = DepartmentId.generate(orgId);
        const entity = new TestMultiLevelIsolatedEntity(
          tenantId,
          orgId,
          deptId1,
        );

        expect(entity.belongsToOrganizationAndDepartment(orgId, deptId2)).toBe(
          false,
        );
      });
    });

    describe("isInOrganization和isInDepartment", () => {
      it("isInOrganization应该与belongsToOrganization行为一致", () => {
        const tenantId = TenantId.generate();
        const orgId = OrganizationId.generate(tenantId);
        const entity = new TestMultiLevelIsolatedEntity(tenantId, orgId);

        expect(entity.isInOrganization(orgId)).toBe(true);
        expect(entity.isInOrganization(OrganizationId.generate(tenantId))).toBe(
          false,
        );
      });

      it("isInDepartment应该与belongsToDepartment行为一致", () => {
        const tenantId = TenantId.generate();
        const orgId = OrganizationId.generate(tenantId);
        const deptId = DepartmentId.generate(orgId);
        const entity = new TestMultiLevelIsolatedEntity(
          tenantId,
          orgId,
          deptId,
        );

        expect(entity.isInDepartment(deptId)).toBe(true);
        expect(entity.isInDepartment(DepartmentId.generate(orgId))).toBe(false);
      });
    });
  });

  describe("hasOrganization和hasDepartment", () => {
    it("hasOrganization应该正确识别有关联组织的实体", () => {
      const tenantId = TenantId.generate();
      const orgId = OrganizationId.generate(tenantId);
      const entity = new TestMultiLevelIsolatedEntity(tenantId, orgId);

      expect(entity.hasOrganization()).toBe(true);
    });

    it("hasOrganization应该正确识别没有关联组织的实体", () => {
      const tenantId = TenantId.generate();
      const entity = new TestMultiLevelIsolatedEntity(tenantId);

      expect(entity.hasOrganization()).toBe(false);
    });

    it("hasDepartment应该正确识别有关联部门的实体", () => {
      const tenantId = TenantId.generate();
      const orgId = OrganizationId.generate(tenantId);
      const deptId = DepartmentId.generate(orgId);
      const entity = new TestMultiLevelIsolatedEntity(tenantId, orgId, deptId);

      expect(entity.hasDepartment()).toBe(true);
    });

    it("hasDepartment应该正确识别没有关联部门的实体", () => {
      const tenantId = TenantId.generate();
      const entity = new TestMultiLevelIsolatedEntity(tenantId);

      expect(entity.hasDepartment()).toBe(false);
    });
  });

  describe("clearOrganization和clearDepartment", () => {
    it("clearOrganization应该清除组织并同时清除部门", () => {
      const tenantId = TenantId.generate();
      const orgId = OrganizationId.generate(tenantId);
      const deptId = DepartmentId.generate(orgId);
      const entity = new TestMultiLevelIsolatedEntity(tenantId, orgId, deptId);
      const updatedBy = UserId.generate(tenantId);

      entity.clearOrganization(updatedBy);

      expect(entity.organizationId).toBeNull();
      expect(entity.departmentId).toBeNull();
      expect(entity.updatedBy).toBe(updatedBy);
    });

    it("clearDepartment应该只清除部门，保留组织", () => {
      const tenantId = TenantId.generate();
      const orgId = OrganizationId.generate(tenantId);
      const deptId = DepartmentId.generate(orgId);
      const entity = new TestMultiLevelIsolatedEntity(tenantId, orgId, deptId);
      const updatedBy = UserId.generate(tenantId);

      entity.clearDepartment(updatedBy);

      expect(entity.departmentId).toBeNull();
      expect(entity.organizationId).toBe(orgId);
      expect(entity.updatedBy).toBe(updatedBy);
    });
  });

  describe("toJSON", () => {
    it("应该包含多层级隔离字段在JSON中", () => {
      const tenantId = TenantId.generate();
      const orgId = OrganizationId.generate(tenantId);
      const deptId = DepartmentId.generate(orgId);
      const entity = new TestMultiLevelIsolatedEntity(tenantId, orgId, deptId);

      const json = entity.toJSON();

      expect(json).toHaveProperty("tenantId");
      expect(json).toHaveProperty("organizationId");
      expect(json).toHaveProperty("departmentId");
      expect(json.tenantId).toBe(tenantId.value);
      expect(json.organizationId).toBe(orgId.value);
      expect(json.departmentId).toBe(deptId.value);
    });

    it("应该正确处理null值", () => {
      const tenantId = TenantId.generate();
      const entity = new TestMultiLevelIsolatedEntity(tenantId);

      const json = entity.toJSON();

      expect(json.organizationId).toBeNull();
      expect(json.departmentId).toBeNull();
    });
  });

  describe("继承TenantAwareEntity的功能", () => {
    it("应该继承租户隔离功能", () => {
      const tenantId = TenantId.generate();
      const entity = new TestMultiLevelIsolatedEntity(tenantId);

      expect(entity.belongsToTenant(tenantId)).toBe(true);
    });

    it("应该继承AuditableEntity的所有功能", () => {
      const tenantId = TenantId.generate();
      const createdBy = UserId.generate(tenantId);
      const entity = new TestMultiLevelIsolatedEntity(
        tenantId,
        undefined,
        undefined,
        undefined,
        "测试",
        createdBy,
      );

      expect(entity.createdBy).toBe(createdBy);
      expect(entity.isActive()).toBe(true);
      expect(entity.version).toBe(1);
    });
  });
});

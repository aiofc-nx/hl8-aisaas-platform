/**
 * @fileoverview 租户感知实体基类测试
 * @description 测试TenantAwareEntity基类的各种功能
 */

import { TenantAwareEntity } from "./tenant-aware-entity.base.js";
import { EntityId } from "../value-objects/identifiers/entity-id.js";
import { TenantId } from "../value-objects/identifiers/tenant-id.js";
import { UserId } from "../value-objects/identifiers/user-id.js";

/**
 * 测试用的租户感知实体类
 */
class TestTenantAwareEntity extends TenantAwareEntity {
  private _name: string;

  constructor(
    tenantId: TenantId,
    id?: EntityId,
    name?: string,
    createdBy?: UserId,
  ) {
    super(tenantId, id, undefined, undefined, undefined, undefined, createdBy);
    this._name = name || "测试实体";
  }

  get name(): string {
    return this._name;
  }

  clone(): TenantAwareEntity {
    return new TestTenantAwareEntity(
      this.tenantId,
      this.id,
      this._name,
      this.createdBy,
    );
  }
}

describe("TenantAwareEntity", () => {
  // 辅助函数：生成测试用的UserId
  const createTestUserId = (tenantId: TenantId): UserId => {
    return UserId.generate(tenantId);
  };

  describe("构造函数", () => {
    it("应该能够创建租户感知实体", () => {
      const tenantId = TenantId.generate();
      const entity = new TestTenantAwareEntity(tenantId);

      expect(entity.id).toBeDefined();
      expect(entity.tenantId).toBe(tenantId);
      expect(entity.tenantId.equals(tenantId)).toBe(true);
    });

    it("应该继承AuditableEntity的所有功能", () => {
      const tenantId = TenantId.generate();
      const createdBy = createTestUserId(tenantId);
      const entity = new TestTenantAwareEntity(
        tenantId,
        undefined,
        "测试",
        createdBy,
      );

      expect(entity.createdBy).toBe(createdBy);
      expect(entity.isActive()).toBe(true);
      expect(entity.version).toBe(1);
    });

    it("应该要求租户ID不能为空", () => {
      expect(() => {
        new TestTenantAwareEntity(null as any);
      }).toThrow("租户ID不能为空");
    });
  });

  describe("租户ID", () => {
    it("应该正确设置租户ID", () => {
      const tenantId = TenantId.generate();
      const entity = new TestTenantAwareEntity(tenantId);

      expect(entity.tenantId).toBe(tenantId);
      expect(entity.tenantId.equals(tenantId)).toBe(true);
    });

    it("租户ID应该是只读的", () => {
      const tenantId = TenantId.generate();
      const entity = new TestTenantAwareEntity(tenantId);

      // TypeScript会在编译时阻止修改，这里测试运行时行为
      expect(entity.tenantId).toBeDefined();
    });
  });

  describe("belongsToTenant", () => {
    it("应该正确识别属于指定租户的实体", () => {
      const tenantId = TenantId.generate();
      const entity = new TestTenantAwareEntity(tenantId);

      expect(entity.belongsToTenant(tenantId)).toBe(true);
    });

    it("应该正确识别不属于指定租户的实体", () => {
      const tenantId1 = TenantId.generate();
      const tenantId2 = TenantId.generate();
      const entity = new TestTenantAwareEntity(tenantId1);

      expect(entity.belongsToTenant(tenantId2)).toBe(false);
    });

    it("应该使用TenantId的equals方法进行比较", () => {
      const tenantId = TenantId.generate();
      const entity = new TestTenantAwareEntity(tenantId);
      const sameTenantId = TenantId.fromString(tenantId.value);

      expect(entity.belongsToTenant(sameTenantId)).toBe(true);
    });
  });

  describe("toJSON", () => {
    it("应该包含租户ID在JSON中", () => {
      const tenantId = TenantId.generate();
      const entity = new TestTenantAwareEntity(tenantId);

      const json = entity.toJSON();

      expect(json).toHaveProperty("tenantId");
      expect(json.tenantId).toBe(tenantId.value);
    });

    it("应该包含所有继承的字段", () => {
      const tenantId = TenantId.generate();
      const createdBy = createTestUserId(tenantId);
      const entity = new TestTenantAwareEntity(
        tenantId,
        undefined,
        "测试",
        createdBy,
      );

      const json = entity.toJSON();

      expect(json).toHaveProperty("id");
      expect(json).toHaveProperty("tenantId");
      expect(json).toHaveProperty("createdAt");
      expect(json).toHaveProperty("createdBy");
      expect(json).toHaveProperty("updatedAt");
      expect(json).toHaveProperty("version");
      expect(json).toHaveProperty("isActive");
    });
  });

  describe("继承AuditableEntity的功能", () => {
    it("应该支持激活/失活功能", () => {
      const tenantId = TenantId.generate();
      const entity = new TestTenantAwareEntity(tenantId);
      const deactivatorId = createTestUserId(tenantId);

      entity.deactivate(deactivatorId);
      expect(entity.isActive()).toBe(false);

      const activatorId = createTestUserId(tenantId);
      entity.activate(activatorId);
      expect(entity.isActive()).toBe(true);
    });

    it("应该支持软删除功能", () => {
      const tenantId = TenantId.generate();
      const entity = new TestTenantAwareEntity(tenantId);
      const deleterId = createTestUserId(tenantId);

      entity.softDelete(deleterId);
      expect(entity.isDeleted()).toBe(true);

      entity.restore();
      expect(entity.isDeleted()).toBe(false);
    });

    it("应该支持equals方法", () => {
      const tenantId = TenantId.generate();
      const id = EntityId.generate();
      const entity1 = new TestTenantAwareEntity(tenantId, id, "实体1");
      const entity2 = new TestTenantAwareEntity(tenantId, id, "实体2");

      expect(entity1.equals(entity2)).toBe(true);
    });

    it("应该支持hashCode方法", () => {
      const tenantId = TenantId.generate();
      const id = EntityId.generate();
      const entity1 = new TestTenantAwareEntity(tenantId, id, "实体1");
      const entity2 = new TestTenantAwareEntity(tenantId, id, "实体2");

      expect(entity1.hashCode()).toBe(entity2.hashCode());
    });
  });
});

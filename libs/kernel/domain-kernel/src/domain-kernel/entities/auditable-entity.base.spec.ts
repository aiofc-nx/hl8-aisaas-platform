/**
 * @fileoverview 可审计实体基类测试
 * @description 测试AuditableEntity基类的各种功能
 */

import { AuditableEntity } from "./auditable-entity.base.js";
import { EntityId } from "../value-objects/identifiers/entity-id.js";
import { UserId } from "../value-objects/identifiers/user-id.js";
import { TenantId } from "../value-objects/identifiers/tenant-id.js";

/**
 * 测试用的可审计实体类
 */
class TestAuditableEntity extends AuditableEntity {
  private _name: string;

  constructor(
    id?: EntityId,
    name?: string,
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
    this._name = name || "测试实体";
  }

  get name(): string {
    return this._name;
  }

  updateName(newName: string, updatedBy?: UserId): void {
    this._name = newName;
    this.markAsUpdated(updatedBy);
  }

  clone(): AuditableEntity {
    return new TestAuditableEntity(
      this.id,
      this._name,
      this.createdAt,
      this.updatedAt,
      this.version,
      this.deletedAt,
      this.createdBy,
      this.updatedBy,
      this.deletedBy,
      this.isActive(),
      this.activatedAt,
      this.activatedBy,
      this.deactivatedAt,
      this.deactivatedBy,
    );
  }
}

describe("AuditableEntity", () => {
  // 测试用的租户ID
  const testTenantId = TenantId.generate();

  // 辅助函数：生成测试用的UserId
  const createTestUserId = (): UserId => {
    return UserId.generate(testTenantId);
  };

  describe("构造函数", () => {
    it("应该自动设置创建时间和更新时间", () => {
      const before = new Date();
      const entity = new TestAuditableEntity();
      const after = new Date();

      expect(entity.createdAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(entity.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(entity.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(entity.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("应该使用提供的创建时间", () => {
      const createdAt = new Date("2025-01-01T00:00:00.000Z");
      const entity = new TestAuditableEntity(undefined, undefined, createdAt);

      expect(entity.createdAt.getTime()).toBe(createdAt.getTime());
      expect(entity.updatedAt.getTime()).toBe(createdAt.getTime());
    });

    it("应该设置初始版本号为1", () => {
      const entity = new TestAuditableEntity();

      expect(entity.version).toBe(1);
    });

    it("应该使用提供的版本号", () => {
      const entity = new TestAuditableEntity(
        undefined,
        undefined,
        undefined,
        undefined,
        5,
      );

      expect(entity.version).toBe(5);
    });

    it("应该使用提供的更新时间", () => {
      const createdAt = new Date("2025-01-01T00:00:00.000Z");
      const updatedAt = new Date("2025-01-02T00:00:00.000Z");
      const entity = new TestAuditableEntity(
        undefined,
        undefined,
        createdAt,
        updatedAt,
      );

      expect(entity.createdAt.getTime()).toBe(createdAt.getTime());
      expect(entity.updatedAt.getTime()).toBe(updatedAt.getTime());
    });

    it("应该默认删除时间为null", () => {
      const entity = new TestAuditableEntity();

      expect(entity.deletedAt).toBeNull();
      expect(entity.isDeleted()).toBe(false);
    });

    it("应该使用提供的删除时间", () => {
      const deletedAt = new Date("2025-01-03T00:00:00.000Z");
      const entity = new TestAuditableEntity(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        deletedAt,
      );

      expect(entity.deletedAt?.getTime()).toBe(deletedAt.getTime());
      expect(entity.isDeleted()).toBe(true);
    });

    it("应该默认用户追踪字段为null", () => {
      const entity = new TestAuditableEntity();

      expect(entity.createdBy).toBeNull();
      expect(entity.updatedBy).toBeNull();
      expect(entity.deletedBy).toBeNull();
    });

    it("应该使用提供的创建者ID", () => {
      const createdBy = createTestUserId();
      const entity = new TestAuditableEntity(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        createdBy,
      );

      expect(entity.createdBy).toBe(createdBy);
      expect(entity.createdBy?.equals(createdBy)).toBe(true);
    });

    it("应该使用提供的更新者ID", () => {
      const updatedBy = createTestUserId();
      const entity = new TestAuditableEntity(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        updatedBy,
      );

      expect(entity.updatedBy).toBe(updatedBy);
      expect(entity.updatedBy?.equals(updatedBy)).toBe(true);
    });

    it("应该使用提供的删除者ID", () => {
      const deletedBy = createTestUserId();
      const entity = new TestAuditableEntity(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        deletedBy,
      );

      expect(entity.deletedBy).toBe(deletedBy);
      expect(entity.deletedBy?.equals(deletedBy)).toBe(true);
    });

    it("应该默认激活状态为true", () => {
      const entity = new TestAuditableEntity();

      expect(entity.isActive()).toBe(true);
    });

    it("应该使用提供的激活状态", () => {
      const entity = new TestAuditableEntity(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        false,
      );

      expect(entity.isActive()).toBe(false);
    });

    it("应该使用提供的激活时间", () => {
      const activatedAt = new Date("2025-01-02T00:00:00.000Z");
      const entity = new TestAuditableEntity(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        true,
        activatedAt,
      );

      expect(entity.activatedAt.getTime()).toBe(activatedAt.getTime());
    });

    it("应该使用提供的激活者ID", () => {
      const activatedBy = createTestUserId();
      const entity = new TestAuditableEntity(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        true,
        undefined,
        activatedBy,
      );

      expect(entity.activatedBy).toBe(activatedBy);
      expect(entity.activatedBy?.equals(activatedBy)).toBe(true);
    });

    it("应该使用提供的失活时间", () => {
      const deactivatedAt = new Date("2025-01-03T00:00:00.000Z");
      const entity = new TestAuditableEntity(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        false,
        undefined,
        undefined,
        deactivatedAt,
      );

      expect(entity.deactivatedAt?.getTime()).toBe(deactivatedAt.getTime());
    });

    it("应该使用提供的失活者ID", () => {
      const deactivatedBy = createTestUserId();
      const entity = new TestAuditableEntity(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        false,
        undefined,
        undefined,
        undefined,
        deactivatedBy,
      );

      expect(entity.deactivatedBy).toBe(deactivatedBy);
      expect(entity.deactivatedBy?.equals(deactivatedBy)).toBe(true);
    });
  });

  describe("markAsUpdated", () => {
    it("应该更新更新时间", async () => {
      const entity = new TestAuditableEntity();
      const originalUpdatedAt = entity.updatedAt;

      // 等待一小段时间确保时间不同
      await new Promise((resolve) => setTimeout(resolve, 10));

      entity.updateName("新名称");
      const newUpdatedAt = entity.updatedAt;

      expect(newUpdatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it("应该递增版本号", () => {
      const entity = new TestAuditableEntity();
      const originalVersion = entity.version;

      entity.updateName("新名称");

      expect(entity.version).toBe(originalVersion + 1);
    });

    it("应该能够多次递增版本号", () => {
      const entity = new TestAuditableEntity();

      entity.updateName("名称1");
      expect(entity.version).toBe(2);

      entity.updateName("名称2");
      expect(entity.version).toBe(3);

      entity.updateName("名称3");
      expect(entity.version).toBe(4);
    });

    it("应该记录更新者ID", () => {
      const entity = new TestAuditableEntity();
      const updatedBy = createTestUserId();

      entity.updateName("新名称", updatedBy);

      expect(entity.updatedBy).toBe(updatedBy);
      expect(entity.updatedBy?.equals(updatedBy)).toBe(true);
    });

    it("应该更新更新者ID", () => {
      const entity = new TestAuditableEntity();
      const updatedBy1 = createTestUserId();
      const updatedBy2 = createTestUserId();

      entity.updateName("名称1", updatedBy1);
      expect(entity.updatedBy?.equals(updatedBy1)).toBe(true);

      entity.updateName("名称2", updatedBy2);
      expect(entity.updatedBy?.equals(updatedBy2)).toBe(true);
    });

    it("不提供更新者ID时不应改变existing updatedBy", () => {
      const entity = new TestAuditableEntity();
      const updatedBy = createTestUserId();

      entity.updateName("名称1", updatedBy);
      expect(entity.updatedBy?.equals(updatedBy)).toBe(true);

      entity.updateName("名称2");
      expect(entity.updatedBy?.equals(updatedBy)).toBe(true);
    });
  });

  describe("isModified", () => {
    it("应该正确识别未修改的实体", () => {
      const entity = new TestAuditableEntity();

      expect(entity.isModified()).toBe(false);
    });

    it("应该正确识别已修改的实体", async () => {
      const entity = new TestAuditableEntity();

      // 等待一小段时间确保时间不同
      await new Promise((resolve) => setTimeout(resolve, 10));

      entity.updateName("新名称");

      expect(entity.isModified()).toBe(true);
    });
  });

  describe("getAge", () => {
    it("应该返回实体的存活时间", async () => {
      const entity = new TestAuditableEntity();
      const age1 = entity.getAge();

      // 等待一小段时间
      await new Promise((resolve) => setTimeout(resolve, 10));

      const age2 = entity.getAge();

      expect(age2).toBeGreaterThan(age1);
    });
  });

  describe("getTimeSinceLastUpdate", () => {
    it("应该返回自上次更新以来的时间", async () => {
      const entity = new TestAuditableEntity();
      const time1 = entity.getTimeSinceLastUpdate();

      // 等待一小段时间
      await new Promise((resolve) => setTimeout(resolve, 10));

      const time2 = entity.getTimeSinceLastUpdate();

      expect(time2).toBeGreaterThan(time1);
    });

    it("应该在更新后重置时间", async () => {
      const entity = new TestAuditableEntity();

      // 等待一小段时间
      await new Promise((resolve) => setTimeout(resolve, 10));

      const timeBeforeUpdate = entity.getTimeSinceLastUpdate();
      entity.updateName("新名称");

      // 更新后应该重新开始计时
      await new Promise((resolve) => setTimeout(resolve, 5));

      const timeAfterUpdate = entity.getTimeSinceLastUpdate();

      expect(timeAfterUpdate).toBeLessThan(timeBeforeUpdate);
    });
  });

  describe("软删除功能", () => {
    describe("softDelete", () => {
      it("应该标记实体为已删除", () => {
        const entity = new TestAuditableEntity();
        expect(entity.isDeleted()).toBe(false);

        entity.softDelete();

        expect(entity.isDeleted()).toBe(true);
        expect(entity.deletedAt).not.toBeNull();
      });

      it("应该设置删除时间", async () => {
        const entity = new TestAuditableEntity();
        const before = new Date();

        // 等待一小段时间确保时间不同
        await new Promise((resolve) => setTimeout(resolve, 10));

        entity.softDelete();
        const after = new Date();

        expect(entity.deletedAt).not.toBeNull();
        if (entity.deletedAt) {
          expect(entity.deletedAt.getTime()).toBeGreaterThanOrEqual(
            before.getTime(),
          );
          expect(entity.deletedAt.getTime()).toBeLessThanOrEqual(
            after.getTime(),
          );
        }
      });

      it("应该更新更新时间", async () => {
        const entity = new TestAuditableEntity();
        const originalUpdatedAt = entity.updatedAt;

        // 等待一小段时间确保时间不同
        await new Promise((resolve) => setTimeout(resolve, 10));

        entity.softDelete();

        expect(entity.updatedAt.getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      });

      it("应该递增版本号", () => {
        const entity = new TestAuditableEntity();
        const originalVersion = entity.version;

        entity.softDelete();

        expect(entity.version).toBe(originalVersion + 1);
      });

      it("重复调用不应改变删除时间", async () => {
        const entity = new TestAuditableEntity();

        entity.softDelete();
        const firstDeletedAt = entity.deletedAt;

        // 等待一小段时间
        await new Promise((resolve) => setTimeout(resolve, 10));

        entity.softDelete();
        const secondDeletedAt = entity.deletedAt;

        expect(firstDeletedAt).toEqual(secondDeletedAt);
      });

      it("应该记录删除者ID", () => {
        const entity = new TestAuditableEntity();
        const deletedBy = createTestUserId();

        entity.softDelete(deletedBy);

        expect(entity.deletedBy).toBe(deletedBy);
        expect(entity.deletedBy?.equals(deletedBy)).toBe(true);
        expect(entity.updatedBy).toBe(deletedBy);
      });

      it("应该更新updatedBy为删除者ID", () => {
        const entity = new TestAuditableEntity();
        const deletedBy = createTestUserId();

        entity.softDelete(deletedBy);

        expect(entity.updatedBy?.equals(deletedBy)).toBe(true);
      });
    });

    describe("restore", () => {
      it("应该恢复已删除的实体", () => {
        const entity = new TestAuditableEntity();
        entity.softDelete();

        expect(entity.isDeleted()).toBe(true);

        entity.restore();

        expect(entity.isDeleted()).toBe(false);
        expect(entity.deletedAt).toBeNull();
      });

      it("应该更新更新时间", async () => {
        const entity = new TestAuditableEntity();
        entity.softDelete();
        const deletedUpdatedAt = entity.updatedAt;

        // 等待一小段时间确保时间不同
        await new Promise((resolve) => setTimeout(resolve, 10));

        entity.restore();

        expect(entity.updatedAt.getTime()).toBeGreaterThan(
          deletedUpdatedAt.getTime(),
        );
      });

      it("应该递增版本号", () => {
        const entity = new TestAuditableEntity();
        entity.softDelete();
        const deletedVersion = entity.version;

        entity.restore();

        expect(entity.version).toBe(deletedVersion + 1);
      });

      it("对未删除的实体调用不应有任何效果", () => {
        const entity = new TestAuditableEntity();
        const originalVersion = entity.version;
        const originalUpdatedAt = entity.updatedAt;

        entity.restore();

        expect(entity.version).toBe(originalVersion);
        expect(entity.updatedAt.getTime()).toBe(originalUpdatedAt.getTime());
      });

      it("应该记录恢复者ID", () => {
        const entity = new TestAuditableEntity();
        entity.softDelete();
        const restoredBy = createTestUserId();

        entity.restore(restoredBy);

        expect(entity.updatedBy).toBe(restoredBy);
        expect(entity.updatedBy?.equals(restoredBy)).toBe(true);
      });

      it("应该清除删除者ID", () => {
        const entity = new TestAuditableEntity();
        const deletedBy = createTestUserId();
        entity.softDelete(deletedBy);

        expect(entity.deletedBy).toBe(deletedBy);

        entity.restore();

        expect(entity.deletedBy).toBeNull();
      });
    });

    describe("isDeleted", () => {
      it("应该正确识别未删除的实体", () => {
        const entity = new TestAuditableEntity();

        expect(entity.isDeleted()).toBe(false);
      });

      it("应该正确识别已删除的实体", () => {
        const entity = new TestAuditableEntity();
        entity.softDelete();

        expect(entity.isDeleted()).toBe(true);
      });
    });

    describe("getTimeSinceDeleted", () => {
      it("应该返回null对于未删除的实体", () => {
        const entity = new TestAuditableEntity();

        expect(entity.getTimeSinceDeleted()).toBeNull();
      });

      it("应该返回自删除以来的时间", async () => {
        const entity = new TestAuditableEntity();
        entity.softDelete();

        const time1 = entity.getTimeSinceDeleted();

        // 等待一小段时间
        await new Promise((resolve) => setTimeout(resolve, 10));

        const time2 = entity.getTimeSinceDeleted();

        expect(time1).not.toBeNull();
        expect(time2).not.toBeNull();
        if (time1 !== null && time2 !== null) {
          expect(time2).toBeGreaterThan(time1);
        }
      });
    });
  });

  describe("激活/失活功能", () => {
    describe("activate", () => {
      it("应该激活实体", () => {
        const entity = new TestAuditableEntity(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          false,
        );
        expect(entity.isActive()).toBe(false);

        entity.activate();

        expect(entity.isActive()).toBe(true);
        expect(entity.deactivatedAt).toBeNull();
        expect(entity.deactivatedBy).toBeNull();
      });

      it("应该设置激活时间", async () => {
        const entity = new TestAuditableEntity(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          false,
        );
        const before = new Date();

        await new Promise((resolve) => setTimeout(resolve, 10));

        entity.activate();
        const after = new Date();

        expect(entity.activatedAt.getTime()).toBeGreaterThanOrEqual(
          before.getTime(),
        );
        expect(entity.activatedAt.getTime()).toBeLessThanOrEqual(
          after.getTime(),
        );
      });

      it("应该记录激活者ID", () => {
        const entity = new TestAuditableEntity(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          false,
        );
        const activatedBy = createTestUserId();

        entity.activate(activatedBy);

        expect(entity.activatedBy).toBe(activatedBy);
        expect(entity.activatedBy?.equals(activatedBy)).toBe(true);
        expect(entity.updatedBy).toBe(activatedBy);
      });

      it("应该更新更新时间", async () => {
        const entity = new TestAuditableEntity(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          false,
        );
        const originalUpdatedAt = entity.updatedAt;

        await new Promise((resolve) => setTimeout(resolve, 10));

        entity.activate();

        expect(entity.updatedAt.getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      });

      it("应该递增版本号", () => {
        const entity = new TestAuditableEntity(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          false,
        );
        const originalVersion = entity.version;

        entity.activate();

        expect(entity.version).toBe(originalVersion + 1);
      });

      it("应该清除失活信息", () => {
        const entity = new TestAuditableEntity(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          false,
        );
        const deactivatedBy = createTestUserId();
        entity.deactivate(deactivatedBy);

        expect(entity.deactivatedAt).not.toBeNull();
        expect(entity.deactivatedBy).toBe(deactivatedBy);

        entity.activate();

        expect(entity.deactivatedAt).toBeNull();
        expect(entity.deactivatedBy).toBeNull();
      });
    });

    describe("deactivate", () => {
      it("应该失活实体", () => {
        const entity = new TestAuditableEntity();
        expect(entity.isActive()).toBe(true);

        entity.deactivate();

        expect(entity.isActive()).toBe(false);
      });

      it("应该设置失活时间", async () => {
        const entity = new TestAuditableEntity();
        const before = new Date();

        await new Promise((resolve) => setTimeout(resolve, 10));

        entity.deactivate();
        const after = new Date();

        expect(entity.deactivatedAt).not.toBeNull();
        if (entity.deactivatedAt) {
          expect(entity.deactivatedAt.getTime()).toBeGreaterThanOrEqual(
            before.getTime(),
          );
          expect(entity.deactivatedAt.getTime()).toBeLessThanOrEqual(
            after.getTime(),
          );
        }
      });

      it("应该记录失活者ID", () => {
        const entity = new TestAuditableEntity();
        const deactivatedBy = createTestUserId();

        entity.deactivate(deactivatedBy);

        expect(entity.deactivatedBy).toBe(deactivatedBy);
        expect(entity.deactivatedBy?.equals(deactivatedBy)).toBe(true);
        expect(entity.updatedBy).toBe(deactivatedBy);
      });

      it("应该更新更新时间", async () => {
        const entity = new TestAuditableEntity();
        const originalUpdatedAt = entity.updatedAt;

        await new Promise((resolve) => setTimeout(resolve, 10));

        entity.deactivate();

        expect(entity.updatedAt.getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      });

      it("应该递增版本号", () => {
        const entity = new TestAuditableEntity();
        const originalVersion = entity.version;

        entity.deactivate();

        expect(entity.version).toBe(originalVersion + 1);
      });

      it("重复调用应该更新失活时间", async () => {
        const entity = new TestAuditableEntity();
        entity.deactivate();
        const firstDeactivatedAt = entity.deactivatedAt;

        await new Promise((resolve) => setTimeout(resolve, 10));

        entity.deactivate();
        const secondDeactivatedAt = entity.deactivatedAt;

        expect(secondDeactivatedAt?.getTime()).toBeGreaterThan(
          firstDeactivatedAt?.getTime() || 0,
        );
      });
    });

    describe("isActive", () => {
      it("应该正确识别激活的实体", () => {
        const entity = new TestAuditableEntity();

        expect(entity.isActive()).toBe(true);
      });

      it("应该正确识别失活的实体", () => {
        const entity = new TestAuditableEntity();
        entity.deactivate();

        expect(entity.isActive()).toBe(false);
      });
    });

    describe("getTimeSinceActivated", () => {
      it("应该返回自激活以来的时间", async () => {
        const entity = new TestAuditableEntity();
        const time1 = entity.getTimeSinceActivated();

        await new Promise((resolve) => setTimeout(resolve, 10));

        const time2 = entity.getTimeSinceActivated();

        expect(time2).toBeGreaterThan(time1);
      });

      it("应该在激活后重置时间", async () => {
        const entity = new TestAuditableEntity(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          false,
        );

        await new Promise((resolve) => setTimeout(resolve, 10));

        const timeBeforeActivate = entity.getTimeSinceActivated();
        entity.activate();

        await new Promise((resolve) => setTimeout(resolve, 5));

        const timeAfterActivate = entity.getTimeSinceActivated();

        expect(timeAfterActivate).toBeLessThan(timeBeforeActivate);
      });
    });

    describe("getTimeSinceDeactivated", () => {
      it("应该返回null对于未失活的实体", () => {
        const entity = new TestAuditableEntity();

        expect(entity.getTimeSinceDeactivated()).toBeNull();
      });

      it("应该返回自失活以来的时间", async () => {
        const entity = new TestAuditableEntity();
        entity.deactivate();

        const time1 = entity.getTimeSinceDeactivated();

        await new Promise((resolve) => setTimeout(resolve, 10));

        const time2 = entity.getTimeSinceDeactivated();

        expect(time1).not.toBeNull();
        expect(time2).not.toBeNull();
        if (time1 !== null && time2 !== null) {
          expect(time2).toBeGreaterThan(time1);
        }
      });
    });
  });

  describe("toJSON", () => {
    it("应该返回包含审计字段和用户追踪的JSON对象", () => {
      const createdAt = new Date("2025-01-01T00:00:00.000Z");
      const updatedAt = new Date("2025-01-02T00:00:00.000Z");
      const createdBy = createTestUserId();
      const entity = new TestAuditableEntity(
        EntityId.generate(),
        "测试实体",
        createdAt,
        updatedAt,
        3,
        undefined,
        createdBy,
      );

      const json = entity.toJSON();

      expect(json).toHaveProperty("id");
      expect(json).toHaveProperty("createdAt");
      expect(json).toHaveProperty("createdBy");
      expect(json).toHaveProperty("updatedAt");
      expect(json).toHaveProperty("updatedBy");
      expect(json).toHaveProperty("version");
      expect(json).toHaveProperty("isActive");
      expect(json).toHaveProperty("activatedAt");
      expect(json).toHaveProperty("activatedBy");
      expect(json).toHaveProperty("deactivatedAt");
      expect(json).toHaveProperty("deactivatedBy");
      expect(json).toHaveProperty("deletedAt");
      expect(json).toHaveProperty("deletedBy");

      expect(json.createdAt).toBe(createdAt.toISOString());
      expect(json.createdBy).toBe(createdBy.value);
      expect(json.updatedAt).toBe(updatedAt.toISOString());
      expect(json.updatedBy).toBeNull();
      expect(json.version).toBe(3);
      expect(json.isActive).toBe(true);
      expect(json.activatedAt).toBe(createdAt.toISOString());
      expect(json.activatedBy).toBeNull();
      expect(json.deactivatedAt).toBeNull();
      expect(json.deactivatedBy).toBeNull();
      expect(json.deletedAt).toBeNull();
      expect(json.deletedBy).toBeNull();
    });

    it("应该包含删除时间在JSON中", () => {
      const createdAt = new Date("2025-01-01T00:00:00.000Z");
      const deletedAt = new Date("2025-01-03T00:00:00.000Z");
      const deletedBy = createTestUserId();
      const entity = new TestAuditableEntity(
        EntityId.generate(),
        "测试实体",
        createdAt,
        undefined,
        2,
        deletedAt,
        undefined,
        undefined,
        deletedBy,
      );

      const json = entity.toJSON();

      expect(json.deletedAt).toBe(deletedAt.toISOString());
      expect(json.deletedBy).toBe(deletedBy.value);
    });

    it("应该包含激活/失活状态在JSON中", () => {
      const createdAt = new Date("2025-01-01T00:00:00.000Z");
      const activatedAt = new Date("2025-01-02T00:00:00.000Z");
      const deactivatedAt = new Date("2025-01-03T00:00:00.000Z");
      const activatedBy = createTestUserId();
      const deactivatedBy = createTestUserId();
      const entity = new TestAuditableEntity(
        EntityId.generate(),
        "测试实体",
        createdAt,
        undefined,
        2,
        undefined,
        undefined,
        undefined,
        undefined,
        false,
        activatedAt,
        activatedBy,
        deactivatedAt,
        deactivatedBy,
      );

      const json = entity.toJSON();

      expect(json.isActive).toBe(false);
      expect(json.activatedAt).toBe(activatedAt.toISOString());
      expect(json.activatedBy).toBe(activatedBy.value);
      expect(json.deactivatedAt).toBe(deactivatedAt.toISOString());
      expect(json.deactivatedBy).toBe(deactivatedBy.value);
    });
  });

  describe("继承Entity的功能", () => {
    it("应该继承equals方法", () => {
      const id = EntityId.generate();
      const entity1 = new TestAuditableEntity(id, "实体1");
      const entity2 = new TestAuditableEntity(id, "实体2");

      expect(entity1.equals(entity2)).toBe(true);
    });

    it("应该继承hashCode方法", () => {
      const id = EntityId.generate();
      const entity1 = new TestAuditableEntity(id, "实体1");
      const entity2 = new TestAuditableEntity(id, "实体2");

      expect(entity1.hashCode()).toBe(entity2.hashCode());
    });

    it("应该继承toString方法", () => {
      const entity = new TestAuditableEntity(EntityId.generate(), "测试实体");

      const str = entity.toString();

      expect(str).toContain("TestAuditableEntity");
      expect(str).toContain(entity.id.toString());
    });
  });
});

/**
 * @fileoverview 用户标识符值对象测试
 * @description 测试UserId值对象的各种功能
 */

import { UserId } from "./user-id.js";
import { TenantId } from "./tenant-id.js";
import { EntityId } from "./entity-id.js";

describe("UserId", () => {
  let tenantId: TenantId;

  beforeEach(() => {
    tenantId = TenantId.generate();
  });

  describe("构造函数", () => {
    it("应该能够自动生成UUID", () => {
      const userId = new UserId(tenantId);

      expect(userId.value).toBeDefined();
      expect(userId.isValid()).toBe(true);
      expect(userId.tenantId).toBe(tenantId);
    });

    it("应该能够从字符串创建", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const userId = new UserId(tenantId, uuid);

      expect(userId.value).toBe(uuid);
      expect(userId.isValid()).toBe(true);
      expect(userId.tenantId).toBe(tenantId);
    });

    it("应该拒绝无效的UUID格式", () => {
      expect(() => {
        new UserId(tenantId, "invalid-uuid");
      }).toThrow("无效的用户标识符格式");
    });

    it("应该要求租户ID不能为空", () => {
      expect(() => {
        new UserId(null as any);
      }).toThrow("租户ID不能为空");
    });

    it("应该要求租户ID有效", () => {
      // 创建一个有效的TenantId
      const validTenantId = TenantId.generate();
      expect(validTenantId.isValid()).toBe(true);
    });
  });

  describe("value属性", () => {
    it("应该返回UUID字符串", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const userId = new UserId(tenantId, uuid);

      expect(userId.value).toBe(uuid);
      expect(typeof userId.value).toBe("string");
    });
  });

  describe("tenantId属性", () => {
    it("应该返回租户ID", () => {
      const userId = UserId.generate(tenantId);

      expect(userId.tenantId).toBe(tenantId);
      expect(userId.tenantId.equals(tenantId)).toBe(true);
    });
  });

  describe("equals方法", () => {
    it("应该正确识别相等的用户ID", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const userId1 = new UserId(tenantId, uuid);
      const userId2 = new UserId(tenantId, uuid);

      expect(userId1.equals(userId2)).toBe(true);
    });

    it("应该正确识别不相等的用户ID", () => {
      const userId1 = UserId.generate(tenantId);
      const userId2 = UserId.generate(tenantId);

      expect(userId1.equals(userId2)).toBe(false);
    });

    it("应该对同一UUID但不同租户返回false", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const otherTenantId = TenantId.generate();
      const userId1 = new UserId(tenantId, uuid);
      const userId2 = new UserId(otherTenantId, uuid);

      expect(userId1.equals(userId2)).toBe(false);
    });

    it("应该对null返回false", () => {
      const userId = UserId.generate(tenantId);

      expect(userId.equals(null)).toBe(false);
      expect(userId.equals(undefined)).toBe(false);
    });

    it("应该对非UserId类型返回false", () => {
      const userId = UserId.generate(tenantId);
      const entityId = EntityId.generate();

      expect(userId.equals(entityId as any)).toBe(false);
    });
  });

  describe("belongsTo方法", () => {
    it("应该正确识别属于指定租户的用户", () => {
      const userId = UserId.generate(tenantId);

      expect(userId.belongsTo(tenantId)).toBe(true);
    });

    it("应该正确识别不属于指定租户的用户", () => {
      const userId = UserId.generate(tenantId);
      const otherTenantId = TenantId.generate();

      expect(userId.belongsTo(otherTenantId)).toBe(false);
    });
  });

  describe("toString方法", () => {
    it("应该返回UUID字符串", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const userId = new UserId(tenantId, uuid);

      expect(userId.toString()).toBe(uuid);
    });
  });

  describe("toJSON方法", () => {
    it("应该返回包含值和租户ID的对象", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const userId = new UserId(tenantId, uuid);

      const json = userId.toJSON() as any;

      expect(json).toHaveProperty("value");
      expect(json).toHaveProperty("tenantId");
      expect(json.value).toBe(uuid);
      expect(json.tenantId).toBe(tenantId.value);
    });
  });

  describe("isValid方法", () => {
    it("应该验证有效的用户ID", () => {
      const userId = UserId.generate(tenantId);

      expect(userId.isValid()).toBe(true);
    });
  });

  describe("clone方法", () => {
    it("应该创建新的实例", () => {
      const userId1 = UserId.generate(tenantId);
      const userId2 = userId1.clone();

      expect(userId1).not.toBe(userId2);
      expect(userId1.equals(userId2)).toBe(true);
      expect(userId1.value).toBe(userId2.value);
    });

    it("应该保留租户ID", () => {
      const userId1 = UserId.generate(tenantId);
      const userId2 = userId1.clone();

      expect(userId2.tenantId).toBe(tenantId);
      expect(userId2.tenantId.equals(tenantId)).toBe(true);
    });
  });

  describe("fromString静态方法", () => {
    it("应该从字符串创建用户ID", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const userId = UserId.fromString(tenantId, uuid);

      expect(userId.value).toBe(uuid);
      expect(userId.isValid()).toBe(true);
      expect(userId.tenantId).toBe(tenantId);
    });

    it("应该拒绝无效的UUID", () => {
      expect(() => {
        UserId.fromString(tenantId, "invalid-uuid");
      }).toThrow("无效的用户标识符格式");
    });
  });

  describe("generate静态方法", () => {
    it("应该生成新的用户ID", () => {
      const userId = UserId.generate(tenantId);

      expect(userId).toBeInstanceOf(UserId);
      expect(userId.isValid()).toBe(true);
      expect(userId.tenantId).toBe(tenantId);
    });

    it("应该生成不同的用户ID", () => {
      const userId1 = UserId.generate(tenantId);
      const userId2 = UserId.generate(tenantId);

      expect(userId1.equals(userId2)).toBe(false);
    });
  });

  describe("compare静态方法", () => {
    it("应该正确比较两个用户ID", () => {
      const userId1 = UserId.fromString(
        tenantId,
        "123e4567-e89b-12d3-a456-426614174000",
      );
      const userId2 = UserId.fromString(
        tenantId,
        "223e4567-e89b-12d3-a456-426614174000",
      );

      expect(UserId.compare(userId1, userId2)).toBeLessThan(0);
      expect(UserId.compare(userId2, userId1)).toBeGreaterThan(0);
      expect(UserId.compare(userId1, userId1)).toBe(0);
    });

    it("应该先比较租户ID", () => {
      const otherTenantId = TenantId.generate();
      const userId1 = UserId.generate(tenantId);
      const userId2 = UserId.generate(otherTenantId);

      const compare1 = UserId.compare(userId1, userId2);
      const compare2 = UserId.compare(userId2, userId1);

      expect(compare1 !== 0).toBe(true);
      expect(compare1 === -compare2).toBe(true);
    });
  });

  describe("hashCode方法", () => {
    it("应该为相同的用户ID生成相同的哈希值", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const userId1 = new UserId(tenantId, uuid);
      const userId2 = new UserId(tenantId, uuid);

      expect(userId1.hashCode()).toBe(userId2.hashCode());
    });

    it("应该为不同租户的用户ID生成不同的哈希值", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const otherTenantId = TenantId.generate();
      const userId1 = new UserId(tenantId, uuid);
      const userId2 = new UserId(otherTenantId, uuid);

      expect(userId1.hashCode()).not.toBe(userId2.hashCode());
    });
  });
});

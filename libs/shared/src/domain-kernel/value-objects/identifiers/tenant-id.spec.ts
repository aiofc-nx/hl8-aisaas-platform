/**
 * @fileoverview 租户标识符值对象测试
 * @description 测试TenantId值对象的各种功能
 */

import { TenantId } from "./tenant-id.js";
import { EntityId } from "./entity-id.js";

describe("TenantId", () => {
  describe("构造函数", () => {
    it("应该能够自动生成UUID", () => {
      const tenantId = new TenantId();

      expect(tenantId.value).toBeDefined();
      expect(tenantId.isValid()).toBe(true);
    });

    it("应该能够从字符串创建", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const tenantId = new TenantId(uuid);

      expect(tenantId.value).toBe(uuid);
      expect(tenantId.isValid()).toBe(true);
    });

    it("应该拒绝无效的UUID格式", () => {
      expect(() => {
        new TenantId("invalid-uuid");
      }).toThrow("无效的租户标识符格式");
    });
  });

  describe("value属性", () => {
    it("应该返回UUID字符串", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const tenantId = new TenantId(uuid);

      expect(tenantId.value).toBe(uuid);
      expect(typeof tenantId.value).toBe("string");
    });
  });

  describe("equals方法", () => {
    it("应该正确识别相等的租户ID", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const tenantId1 = new TenantId(uuid);
      const tenantId2 = new TenantId(uuid);

      expect(tenantId1.equals(tenantId2)).toBe(true);
    });

    it("应该正确识别不相等的租户ID", () => {
      const tenantId1 = TenantId.generate();
      const tenantId2 = TenantId.generate();

      expect(tenantId1.equals(tenantId2)).toBe(false);
    });

    it("应该对null返回false", () => {
      const tenantId = TenantId.generate();

      expect(tenantId.equals(null)).toBe(false);
      expect(tenantId.equals(undefined)).toBe(false);
    });

    it("应该对非TenantId类型返回false", () => {
      const tenantId = TenantId.generate();
      const entityId = EntityId.generate();

      expect(tenantId.equals(entityId as any)).toBe(false);
    });
  });

  describe("toString方法", () => {
    it("应该返回UUID字符串", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const tenantId = new TenantId(uuid);

      expect(tenantId.toString()).toBe(uuid);
    });
  });

  describe("toJSON方法", () => {
    it("应该返回UUID字符串", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const tenantId = new TenantId(uuid);

      expect(tenantId.toJSON()).toBe(uuid);
    });
  });

  describe("isValid方法", () => {
    it("应该验证有效UUID", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const tenantId = new TenantId(uuid);

      expect(tenantId.isValid()).toBe(true);
    });

    it("应该验证自动生成的UUID", () => {
      const tenantId = TenantId.generate();

      expect(tenantId.isValid()).toBe(true);
    });
  });

  describe("clone方法", () => {
    it("应该创建新的实例", () => {
      const tenantId1 = TenantId.generate();
      const tenantId2 = tenantId1.clone();

      expect(tenantId1).not.toBe(tenantId2);
      expect(tenantId1.equals(tenantId2)).toBe(true);
      expect(tenantId1.value).toBe(tenantId2.value);
    });
  });

  describe("fromString静态方法", () => {
    it("应该从字符串创建租户ID", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const tenantId = TenantId.fromString(uuid);

      expect(tenantId.value).toBe(uuid);
      expect(tenantId.isValid()).toBe(true);
    });

    it("应该拒绝无效的UUID", () => {
      expect(() => {
        TenantId.fromString("invalid-uuid");
      }).toThrow("无效的租户标识符格式");
    });
  });

  describe("generate静态方法", () => {
    it("应该生成新的租户ID", () => {
      const tenantId = TenantId.generate();

      expect(tenantId).toBeInstanceOf(TenantId);
      expect(tenantId.isValid()).toBe(true);
    });

    it("应该生成不同的租户ID", () => {
      const tenantId1 = TenantId.generate();
      const tenantId2 = TenantId.generate();

      expect(tenantId1.equals(tenantId2)).toBe(false);
    });
  });

  describe("isValid静态方法", () => {
    it("应该验证有效UUID", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";

      expect(TenantId.isValid(uuid)).toBe(true);
    });

    it("应该拒绝无效UUID", () => {
      expect(TenantId.isValid("invalid-uuid")).toBe(false);
    });
  });

  describe("compare静态方法", () => {
    it("应该正确比较两个租户ID", () => {
      const tenantId1 = TenantId.fromString(
        "123e4567-e89b-12d3-a456-426614174000",
      );
      const tenantId2 = TenantId.fromString(
        "223e4567-e89b-12d3-a456-426614174000",
      );

      expect(TenantId.compare(tenantId1, tenantId2)).toBeLessThan(0);
      expect(TenantId.compare(tenantId2, tenantId1)).toBeGreaterThan(0);
      expect(TenantId.compare(tenantId1, tenantId1)).toBe(0);
    });
  });

  describe("hashCode方法", () => {
    it("应该为相同的租户ID生成相同的哈希值", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const tenantId1 = new TenantId(uuid);
      const tenantId2 = new TenantId(uuid);

      expect(tenantId1.hashCode()).toBe(tenantId2.hashCode());
    });

    it("应该为不同的租户ID生成不同的哈希值（在大多数情况下）", () => {
      const tenantId1 = TenantId.generate();
      const tenantId2 = TenantId.generate();

      // 虽然理论上可能相同，但概率极低
      expect(tenantId1.hashCode()).not.toBe(tenantId2.hashCode());
    });
  });
});

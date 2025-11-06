/**
 * @fileoverview AssignmentStatus 值对象单元测试
 * @description 测试 AssignmentStatus 值对象的创建、状态转换等功能
 */

import { describe, it, expect } from "@jest/globals";
import { AssignmentStatus } from "./assignment-status.vo.js";
import { AssignmentStatusEnum } from "./assignment-status.enum.js";

describe("AssignmentStatus", () => {
  describe("工厂方法", () => {
    it("active 应该创建活跃状态", () => {
      const status = AssignmentStatus.active();
      expect(status.getValue()).toBe(AssignmentStatusEnum.ACTIVE);
      expect(status.isActive()).toBe(true);
    });

    it("revoked 应该创建已撤销状态", () => {
      const status = AssignmentStatus.revoked();
      expect(status.getValue()).toBe(AssignmentStatusEnum.REVOKED);
      expect(status.isRevoked()).toBe(true);
    });

    it("expired 应该创建已过期状态", () => {
      const status = AssignmentStatus.expired();
      expect(status.getValue()).toBe(AssignmentStatusEnum.EXPIRED);
      expect(status.isExpired()).toBe(true);
    });
  });

  describe("构造函数", () => {
    it("应该创建有效的分配状态", () => {
      const status = new AssignmentStatus(AssignmentStatusEnum.ACTIVE);
      expect(status.getValue()).toBe(AssignmentStatusEnum.ACTIVE);
    });

    it("应该对无效状态抛出异常", () => {
      expect(() => new AssignmentStatus("INVALID" as any)).toThrow(
        "无效的分配状态",
      );
    });
  });

  describe("状态检查方法", () => {
    it("isActive 应该正确判断活跃状态", () => {
      const status = AssignmentStatus.active();
      expect(status.isActive()).toBe(true);
      expect(status.isRevoked()).toBe(false);
      expect(status.isExpired()).toBe(false);
    });

    it("isRevoked 应该正确判断已撤销状态", () => {
      const status = AssignmentStatus.revoked();
      expect(status.isRevoked()).toBe(true);
      expect(status.isActive()).toBe(false);
      expect(status.isExpired()).toBe(false);
    });

    it("isExpired 应该正确判断已过期状态", () => {
      const status = AssignmentStatus.expired();
      expect(status.isExpired()).toBe(true);
      expect(status.isActive()).toBe(false);
      expect(status.isRevoked()).toBe(false);
    });
  });

  describe("状态转换方法", () => {
    it("revoke 应该转换为已撤销状态", () => {
      const status = AssignmentStatus.active();
      const revoked = status.revoke();
      expect(revoked.isRevoked()).toBe(true);
      expect(revoked).not.toBe(status); // 应该返回新实例
    });

    it("expire 应该转换为已过期状态", () => {
      const status = AssignmentStatus.active();
      const expired = status.expire();
      expect(expired.isExpired()).toBe(true);
      expect(expired).not.toBe(status); // 应该返回新实例
    });
  });

  describe("getValue", () => {
    it("应该返回状态枚举值", () => {
      const status = AssignmentStatus.active();
      expect(status.getValue()).toBe(AssignmentStatusEnum.ACTIVE);
    });
  });

  describe("equals", () => {
    it("应该认为相同状态值相等", () => {
      const status1 = AssignmentStatus.active();
      const status2 = AssignmentStatus.active();
      expect(status1.equals(status2)).toBe(true);
    });

    it("应该认为不同状态值不相等", () => {
      const status1 = AssignmentStatus.active();
      const status2 = AssignmentStatus.revoked();
      expect(status1.equals(status2)).toBe(false);
    });
  });

  describe("clone", () => {
    it("应该创建状态值的副本", () => {
      const status1 = AssignmentStatus.active();
      const status2 = status1.clone();
      expect(status2.getValue()).toBe(status1.getValue());
      expect(status2.equals(status1)).toBe(true);
      expect(status2).not.toBe(status1);
    });
  });
});

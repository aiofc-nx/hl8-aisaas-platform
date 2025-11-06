/**
 * @fileoverview TenantRole 值对象单元测试
 * @description 测试 TenantRole 值对象的验证、标准化等功能
 */

import { describe, it, expect } from "@jest/globals";
import { TenantRole } from "./tenant-role.vo.js";

describe("TenantRole", () => {
  describe("构造函数", () => {
    it("应该创建有效的租户角色", () => {
      const role = new TenantRole("admin");
      expect(role.getValue()).toBe("admin");
    });

    it("应该自动标准化角色值（转小写、去除空格）", () => {
      const role = new TenantRole("  ADMIN  ");
      expect(role.getValue()).toBe("admin");
    });

    it("应该对空字符串抛出异常", () => {
      expect(() => new TenantRole("")).toThrow("租户角色不能为空");
    });

    it("应该对空值抛出异常", () => {
      expect(() => new TenantRole(null as any)).toThrow();
      expect(() => new TenantRole(undefined as any)).toThrow();
    });

    it("应该对超过50字符的角色值抛出异常", () => {
      const longRole = "a".repeat(51);
      expect(() => new TenantRole(longRole)).toThrow(
        "租户角色长度必须在 1-50 字符之间",
      );
    });
  });

  describe("getValue", () => {
    it("应该返回角色值", () => {
      const role = new TenantRole("member");
      expect(role.getValue()).toBe("member");
    });
  });

  describe("equals", () => {
    it("应该认为相同角色值相等（标准化后）", () => {
      const role1 = new TenantRole("ADMIN");
      const role2 = new TenantRole("admin");
      expect(role1.equals(role2)).toBe(true);
    });

    it("应该认为不同角色值不相等", () => {
      const role1 = new TenantRole("admin");
      const role2 = new TenantRole("member");
      expect(role1.equals(role2)).toBe(false);
    });
  });

  describe("clone", () => {
    it("应该创建角色值的副本", () => {
      const role1 = new TenantRole("admin");
      const role2 = role1.clone();
      expect(role2.getValue()).toBe(role1.getValue());
      expect(role2.equals(role1)).toBe(true);
      expect(role2).not.toBe(role1);
    });
  });
});

/**
 * @fileoverview PasswordHash 值对象单元测试
 * @description 测试 PasswordHash 值对象的验证、工厂方法等功能
 */

import { describe, it, expect } from "@jest/globals";
import { PasswordHash } from "./password-hash.vo.js";
import { InvalidPasswordError } from "../exceptions/invalid-password.error.js";

describe("PasswordHash", () => {
  describe("构造函数", () => {
    it("应该创建有效的密码哈希值", () => {
      const hash = "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890";
      const passwordHash = new PasswordHash(hash);
      expect(passwordHash.getValue()).toBe(hash);
    });

    it("应该允许空字符串（用于系统用户）", () => {
      const hash = new PasswordHash("");
      expect(hash.getValue()).toBe("");
    });

    it("应该对空值抛出异常", () => {
      expect(() => new PasswordHash(null as any)).toThrow();
      expect(() => new PasswordHash(undefined as any)).toThrow();
    });
  });

  describe("工厂方法", () => {
    it("fromPlainText 应该抛出错误（需要基础设施层支持）", () => {
      // 注意：fromPlainText 需要基础设施层支持，这里只测试接口
      expect(() => PasswordHash.fromPlainText("Password123!")).toThrow(
        "密码哈希功能需要基础设施层支持",
      );
    });

    it("system 应该创建系统用户密码哈希", () => {
      const passwordHash = PasswordHash.system();
      expect(passwordHash.getValue()).toBe("");
      expect(passwordHash.isSystem()).toBe(true);
    });
  });

  describe("验证方法", () => {
    it("verify 应该抛出错误（需要基础设施层支持）", () => {
      const hash = "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890";
      const passwordHash = new PasswordHash(hash);
      expect(() => passwordHash.verify("Password123!")).toThrow(
        "密码验证功能需要基础设施层支持",
      );
    });
  });

  describe("isSystem", () => {
    it("应该正确判断系统用户密码哈希", () => {
      const systemHash = PasswordHash.system();
      expect(systemHash.isSystem()).toBe(true);

      const normalHash = new PasswordHash(
        "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890",
      );
      expect(normalHash.isSystem()).toBe(false);
    });
  });

  describe("getValue", () => {
    it("应该返回密码哈希值", () => {
      const hash = "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890";
      const passwordHash = new PasswordHash(hash);
      expect(passwordHash.getValue()).toBe(hash);
    });
  });

  describe("equals", () => {
    it("应该认为相同哈希值相等", () => {
      const hash = "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890";
      const passwordHash1 = new PasswordHash(hash);
      const passwordHash2 = new PasswordHash(hash);
      expect(passwordHash1.equals(passwordHash2)).toBe(true);
    });

    it("应该认为不同哈希值不相等", () => {
      const hash1 = "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890";
      const hash2 = "$2b$10$differenthashhere";
      const passwordHash1 = new PasswordHash(hash1);
      const passwordHash2 = new PasswordHash(hash2);
      expect(passwordHash1.equals(passwordHash2)).toBe(false);
    });
  });

  describe("clone", () => {
    it("应该创建密码哈希值的副本", () => {
      const hash = "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890";
      const passwordHash1 = new PasswordHash(hash);
      const passwordHash2 = passwordHash1.clone();
      expect(passwordHash2.getValue()).toBe(passwordHash1.getValue());
      expect(passwordHash2.equals(passwordHash1)).toBe(true);
      expect(passwordHash2).not.toBe(passwordHash1);
    });
  });
});

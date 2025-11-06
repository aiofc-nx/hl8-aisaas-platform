/**
 * @fileoverview Username 值对象单元测试
 * @description 测试 Username 值对象的验证、标准化、相等性等功能
 */

import { describe, it, expect } from "@jest/globals";
import { Username } from "./username.vo.js";
import { InvalidUsernameError } from "../exceptions/invalid-username.error.js";

describe("Username", () => {
  describe("构造函数", () => {
    it("应该创建有效的用户名", () => {
      const username = new Username("testuser");
      expect(username.getValue()).toBe("testuser");
    });

    it("应该标准化用户名（去除首尾空格）", () => {
      const username = new Username("  testuser  ");
      expect(username.getValue()).toBe("testuser");
    });

    it("应该对空字符串抛出异常", () => {
      expect(() => new Username("")).toThrow(InvalidUsernameError);
      expect(() => new Username("   ")).toThrow(InvalidUsernameError);
    });

    it("应该对长度小于 3 字符的用户名抛出异常", () => {
      expect(() => new Username("ab")).toThrow(InvalidUsernameError);
      expect(() => new Username("a")).toThrow(InvalidUsernameError);
    });

    it("应该对长度超过 30 字符的用户名抛出异常", () => {
      const longUsername = "a".repeat(31);
      expect(() => new Username(longUsername)).toThrow(InvalidUsernameError);
    });

    it("应该对包含非法字符的用户名抛出异常", () => {
      expect(() => new Username("test-user")).toThrow(InvalidUsernameError); // 包含连字符
      expect(() => new Username("test user")).toThrow(InvalidUsernameError); // 包含空格
      expect(() => new Username("test@user")).toThrow(InvalidUsernameError); // 包含特殊字符
    });

    it("应该接受只包含字母、数字和下划线的用户名", () => {
      expect(() => new Username("testuser")).not.toThrow();
      expect(() => new Username("test_user")).not.toThrow();
      expect(() => new Username("test123")).not.toThrow();
      expect(() => new Username("Test_User_123")).not.toThrow();
    });

    it("应该接受最小长度 3 字符的用户名", () => {
      expect(() => new Username("abc")).not.toThrow();
    });

    it("应该接受最大长度 30 字符的用户名", () => {
      const maxUsername = "a".repeat(30);
      expect(() => new Username(maxUsername)).not.toThrow();
    });
  });

  describe("getValue", () => {
    it("应该返回标准化后的用户名", () => {
      const username = new Username("  TestUser  ");
      expect(username.getValue()).toBe("TestUser");
    });
  });

  describe("equals", () => {
    it("应该认为标准化后相等的用户名相等", () => {
      const username1 = new Username("  testuser  ");
      const username2 = new Username("testuser");
      expect(username1.equals(username2)).toBe(true);
    });

    it("应该认为不同的用户名不相等", () => {
      const username1 = new Username("testuser1");
      const username2 = new Username("testuser2");
      expect(username1.equals(username2)).toBe(false);
    });

    it("应该认为与 null 不相等", () => {
      const username = new Username("testuser");
      expect(username.equals(null)).toBe(false);
    });
  });

  describe("toString", () => {
    it("应该返回用户名字符串", () => {
      const username = new Username("testuser");
      expect(username.toString()).toBe("testuser");
    });
  });

  describe("clone", () => {
    it("应该创建用户名的副本", () => {
      const username1 = new Username("testuser");
      const username2 = username1.clone();
      expect(username2.getValue()).toBe(username1.getValue());
      expect(username2.equals(username1)).toBe(true);
      expect(username2).not.toBe(username1);
    });
  });

  describe("hashCode", () => {
    it("应该为相同用户名返回相同哈希码", () => {
      const username1 = new Username("testuser");
      const username2 = new Username("testuser");
      expect(username1.hashCode()).toBe(username2.hashCode());
    });
  });
});

/**
 * @fileoverview Email 值对象单元测试
 * @description 测试 Email 值对象的验证、标准化、相等性等功能
 */

import { describe, it, expect } from "@jest/globals";
import { Email } from "./email.vo.js";
import { InvalidEmailError } from "../exceptions/invalid-email.error.js";

describe("Email", () => {
  describe("构造函数", () => {
    it("应该创建有效的邮箱地址", () => {
      const email = new Email("test@example.com");
      expect(email.getValue()).toBe("test@example.com");
    });

    it("应该标准化邮箱地址（转小写、去除空格）", () => {
      const email = new Email("  User@Example.COM  ");
      expect(email.getValue()).toBe("user@example.com");
    });

    it("应该对空字符串抛出异常", () => {
      expect(() => new Email("")).toThrow(InvalidEmailError);
      expect(() => new Email("   ")).toThrow(InvalidEmailError);
    });

    it("应该对无效格式抛出异常", () => {
      expect(() => new Email("invalid-email")).toThrow(InvalidEmailError);
      expect(() => new Email("invalid@")).toThrow(InvalidEmailError);
      expect(() => new Email("@example.com")).toThrow(InvalidEmailError);
    });

    it("应该对超过 100 字符的邮箱抛出异常", () => {
      const longEmail = "a".repeat(95) + "@example.com"; // 总共 108 字符
      expect(() => new Email(longEmail)).toThrow(InvalidEmailError);
    });
  });

  describe("getValue", () => {
    it("应该返回标准化后的邮箱地址", () => {
      const email = new Email("  Test@Example.COM  ");
      expect(email.getValue()).toBe("test@example.com");
    });
  });

  describe("getDomain", () => {
    it("应该返回邮箱域名", () => {
      const email = new Email("test@example.com");
      expect(email.getDomain()).toBe("example.com");
    });

    it("应该返回子域名", () => {
      const email = new Email("test@sub.example.com");
      expect(email.getDomain()).toBe("sub.example.com");
    });
  });

  describe("equals", () => {
    it("应该认为标准化后相等的邮箱地址相等", () => {
      const email1 = new Email("Test@Example.COM");
      const email2 = new Email("test@example.com");
      expect(email1.equals(email2)).toBe(true);
    });

    it("应该认为不同的邮箱地址不相等", () => {
      const email1 = new Email("test1@example.com");
      const email2 = new Email("test2@example.com");
      expect(email1.equals(email2)).toBe(false);
    });

    it("应该认为与 null 不相等", () => {
      const email = new Email("test@example.com");
      expect(email.equals(null)).toBe(false);
    });
  });

  describe("toString", () => {
    it("应该返回邮箱地址字符串", () => {
      const email = new Email("test@example.com");
      expect(email.toString()).toBe("test@example.com");
    });
  });

  describe("clone", () => {
    it("应该创建邮箱地址的副本", () => {
      const email1 = new Email("test@example.com");
      const email2 = email1.clone();
      expect(email2.getValue()).toBe(email1.getValue());
      expect(email2.equals(email1)).toBe(true);
      expect(email2).not.toBe(email1);
    });
  });

  describe("hashCode", () => {
    it("应该为相同邮箱返回相同哈希码", () => {
      const email1 = new Email("test@example.com");
      const email2 = new Email("test@example.com");
      expect(email1.hashCode()).toBe(email2.hashCode());
    });
  });

  describe("边界情况", () => {
    it("应该接受最大 100 字符的邮箱", () => {
      const maxEmail = "a".repeat(90) + "@example.com"; // 总共 102 字符，但域名部分合理
      // 注意：实际测试中需要确保总长度不超过 100
      const validEmail = "a".repeat(85) + "@ex.com"; // 总共 91 字符
      expect(() => new Email(validEmail)).not.toThrow();
    });
  });
});

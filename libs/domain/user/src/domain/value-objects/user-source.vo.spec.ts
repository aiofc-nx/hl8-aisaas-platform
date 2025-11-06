/**
 * @fileoverview UserSource 值对象单元测试
 * @description 测试 UserSource 值对象的工厂方法、判断方法等功能
 */

import { describe, it, expect } from "@jest/globals";
import { UserSource } from "./user-source.vo.js";
import { UserSourceEnum } from "./user-source.enum.js";

describe("UserSource", () => {
  describe("工厂方法", () => {
    it("应该创建平台用户来源", () => {
      const source = UserSource.platform();
      expect(source.getValue()).toBe(UserSourceEnum.PLATFORM);
      expect(source.isPlatform()).toBe(true);
      expect(source.isTenant()).toBe(false);
      expect(source.isSystem()).toBe(false);
    });

    it("应该创建租户用户来源", () => {
      const source = UserSource.tenant();
      expect(source.getValue()).toBe(UserSourceEnum.TENANT);
      expect(source.isPlatform()).toBe(false);
      expect(source.isTenant()).toBe(true);
      expect(source.isSystem()).toBe(false);
    });

    it("应该创建系统用户来源", () => {
      const source = UserSource.system();
      expect(source.getValue()).toBe(UserSourceEnum.SYSTEM);
      expect(source.isPlatform()).toBe(false);
      expect(source.isTenant()).toBe(false);
      expect(source.isSystem()).toBe(true);
    });
  });

  describe("判断方法", () => {
    it("isPlatform 应该正确判断平台用户", () => {
      const platformSource = UserSource.platform();
      expect(platformSource.isPlatform()).toBe(true);

      const tenantSource = UserSource.tenant();
      expect(tenantSource.isPlatform()).toBe(false);

      const systemSource = UserSource.system();
      expect(systemSource.isPlatform()).toBe(false);
    });

    it("isTenant 应该正确判断租户用户", () => {
      const platformSource = UserSource.platform();
      expect(platformSource.isTenant()).toBe(false);

      const tenantSource = UserSource.tenant();
      expect(tenantSource.isTenant()).toBe(true);

      const systemSource = UserSource.system();
      expect(systemSource.isTenant()).toBe(false);
    });

    it("isSystem 应该正确判断系统用户", () => {
      const platformSource = UserSource.platform();
      expect(platformSource.isSystem()).toBe(false);

      const tenantSource = UserSource.tenant();
      expect(tenantSource.isSystem()).toBe(false);

      const systemSource = UserSource.system();
      expect(systemSource.isSystem()).toBe(true);
    });
  });

  describe("equals", () => {
    it("应该认为相同来源值相等", () => {
      const source1 = UserSource.platform();
      const source2 = UserSource.platform();
      expect(source1.equals(source2)).toBe(true);
    });

    it("应该认为不同来源值不相等", () => {
      const source1 = UserSource.platform();
      const source2 = UserSource.tenant();
      expect(source1.equals(source2)).toBe(false);
    });

    it("应该认为与 null 不相等", () => {
      const source = UserSource.platform();
      expect(source.equals(null)).toBe(false);
    });
  });

  describe("clone", () => {
    it("应该创建来源值的副本", () => {
      const source1 = UserSource.platform();
      const source2 = source1.clone();
      expect(source2.getValue()).toBe(source1.getValue());
      expect(source2.equals(source1)).toBe(true);
      expect(source2).not.toBe(source1);
    });
  });
});

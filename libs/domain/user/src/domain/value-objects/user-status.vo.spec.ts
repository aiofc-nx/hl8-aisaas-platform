/**
 * @fileoverview UserStatus 值对象单元测试
 * @description 测试 UserStatus 值对象的状态转换、工厂方法等功能
 */

import { describe, it, expect } from "@jest/globals";
import { UserStatus } from "./user-status.vo.js";
import { UserStatusEnum } from "./user-status.enum.js";
import { InvalidStatusTransitionError } from "../exceptions/invalid-status-transition.error.js";

describe("UserStatus", () => {
  describe("工厂方法", () => {
    it("应该创建活跃状态", () => {
      const status = UserStatus.active();
      expect(status.getValue()).toBe(UserStatusEnum.ACTIVE);
    });

    it("应该创建待激活状态", () => {
      const status = UserStatus.pendingActivation();
      expect(status.getValue()).toBe(UserStatusEnum.PENDING_ACTIVATION);
    });

    it("应该创建禁用状态（带原因）", () => {
      const status = UserStatus.disabled("违规操作");
      expect(status.getValue()).toBe(UserStatusEnum.DISABLED);
      expect(status.getReason()).toBe("违规操作");
    });

    it("应该创建禁用状态（不带原因）", () => {
      const status = UserStatus.disabled();
      expect(status.getValue()).toBe(UserStatusEnum.DISABLED);
      expect(status.getReason()).toBeUndefined();
    });

    it("应该创建锁定状态（带到期时间和原因）", () => {
      const lockedUntil = new Date(Date.now() + 3600000); // 1小时后
      const status = UserStatus.locked(lockedUntil, "多次登录失败");
      expect(status.getValue()).toBe(UserStatusEnum.LOCKED);
      expect(status.getLockedUntil()).toEqual(lockedUntil);
      expect(status.getReason()).toBe("多次登录失败");
    });

    it("应该创建锁定状态（只带到期时间）", () => {
      const lockedUntil = new Date(Date.now() + 3600000);
      const status = UserStatus.locked(lockedUntil);
      expect(status.getValue()).toBe(UserStatusEnum.LOCKED);
      expect(status.getLockedUntil()).toEqual(lockedUntil);
    });

    it("应该创建锁定状态（只带原因）", () => {
      const status = UserStatus.locked(undefined, "违规操作");
      expect(status.getValue()).toBe(UserStatusEnum.LOCKED);
      expect(status.getReason()).toBe("违规操作");
    });

    it("应该创建过期状态", () => {
      const status = UserStatus.expired();
      expect(status.getValue()).toBe(UserStatusEnum.EXPIRED);
    });
  });

  describe("状态转换", () => {
    it("应该允许从待激活状态激活", () => {
      const status = UserStatus.pendingActivation();
      const activated = status.activate();
      expect(activated.getValue()).toBe(UserStatusEnum.ACTIVE);
    });

    it("应该允许从活跃状态禁用", () => {
      const status = UserStatus.active();
      const disabled = status.disable("违规操作");
      expect(disabled.getValue()).toBe(UserStatusEnum.DISABLED);
      expect(disabled.getReason()).toBe("违规操作");
    });

    it("应该允许从活跃状态锁定", () => {
      const status = UserStatus.active();
      const lockedUntil = new Date(Date.now() + 3600000);
      const locked = status.lock(lockedUntil, "多次登录失败");
      expect(locked.getValue()).toBe(UserStatusEnum.LOCKED);
      expect(locked.getLockedUntil()).toEqual(lockedUntil);
      expect(locked.getReason()).toBe("多次登录失败");
    });

    it("应该允许从锁定状态解锁", () => {
      const lockedUntil = new Date(Date.now() + 3600000);
      const status = UserStatus.locked(lockedUntil);
      const unlocked = status.unlock();
      expect(unlocked.getValue()).toBe(UserStatusEnum.ACTIVE);
    });

    it("应该禁止从禁用状态直接激活", () => {
      const status = UserStatus.disabled("违规操作");
      expect(() => status.activate()).toThrow(InvalidStatusTransitionError);
    });

    it("应该禁止从过期状态直接激活", () => {
      const status = UserStatus.expired();
      expect(() => status.activate()).toThrow(InvalidStatusTransitionError);
    });
  });

  describe("isAvailable", () => {
    it("应该认为活跃状态可用", () => {
      const status = UserStatus.active();
      expect(status.isAvailable()).toBe(true);
    });

    it("应该认为待激活状态不可用", () => {
      const status = UserStatus.pendingActivation();
      expect(status.isAvailable()).toBe(false);
    });

    it("应该认为禁用状态不可用", () => {
      const status = UserStatus.disabled();
      expect(status.isAvailable()).toBe(false);
    });

    it("应该认为锁定状态不可用", () => {
      const status = UserStatus.locked();
      expect(status.isAvailable()).toBe(false);
    });

    it("应该认为过期状态不可用", () => {
      const status = UserStatus.expired();
      expect(status.isAvailable()).toBe(false);
    });
  });

  describe("isLockExpired", () => {
    it("应该认为未锁定的状态锁定未过期", () => {
      const status = UserStatus.active();
      expect(status.isLockExpired()).toBe(false);
    });

    it("应该认为锁定状态且未设置到期时间时锁定未过期", () => {
      const status = UserStatus.locked();
      expect(status.isLockExpired()).toBe(false);
    });

    it("应该认为锁定状态且到期时间未到时锁定未过期", () => {
      const lockedUntil = new Date(Date.now() + 3600000); // 1小时后
      const status = UserStatus.locked(lockedUntil);
      expect(status.isLockExpired()).toBe(false);
    });

    it("应该认为锁定状态且到期时间已过时锁定已过期", () => {
      const lockedUntil = new Date(Date.now() - 3600000); // 1小时前
      const status = UserStatus.locked(lockedUntil);
      expect(status.isLockExpired()).toBe(true);
    });
  });

  describe("equals", () => {
    it("应该认为相同状态值相等", () => {
      const status1 = UserStatus.active();
      const status2 = UserStatus.active();
      expect(status1.equals(status2)).toBe(true);
    });

    it("应该认为不同状态值不相等", () => {
      const status1 = UserStatus.active();
      const status2 = UserStatus.disabled();
      expect(status1.equals(status2)).toBe(false);
    });
  });

  describe("clone", () => {
    it("应该创建状态值的副本", () => {
      const status1 = UserStatus.locked(new Date(Date.now() + 3600000), "原因");
      const status2 = status1.clone();
      expect(status2.getValue()).toBe(status1.getValue());
      expect(status2.getReason()).toBe(status1.getReason());
      expect(status2).not.toBe(status1);
    });
  });
});

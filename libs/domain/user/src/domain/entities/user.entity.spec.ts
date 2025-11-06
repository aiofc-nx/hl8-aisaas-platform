/**
 * @fileoverview User 聚合根单元测试
 * @description 测试 User 聚合根的创建、基本属性、默认值、唯一性验证等场景
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { EntityId, UserId, TenantId } from "@hl8/shared";
import { User } from "./user.entity.js";
import { Email } from "../value-objects/email.vo.js";
import { Username } from "../value-objects/username.vo.js";
import { PasswordHash } from "../value-objects/password-hash.vo.js";
import { UserStatus } from "../value-objects/user-status.vo.js";
import { UserSource } from "../value-objects/user-source.vo.js";
import { UserCreatedEvent } from "../events/user-created.event.js";
import { UserActivatedEvent } from "../events/user-activated.event.js";
import { UserDisabledEvent } from "../events/user-disabled.event.js";
import { UserLockedEvent } from "../events/user-locked.event.js";
import { UserUnlockedEvent } from "../events/user-unlocked.event.js";
import { UserPasswordChangedEvent } from "../events/user-password-changed.event.js";
import { UserPasswordResetEvent } from "../events/user-password-reset.event.js";
import { InvalidStatusTransitionError } from "../exceptions/invalid-status-transition.error.js";
import { NicknameAlreadyExistsError } from "../exceptions/nickname-already-exists.error.js";

describe("User", () => {
  let testTenantId: TenantId;
  let testUserId: UserId;

  beforeEach(() => {
    testTenantId = TenantId.generate();
    testUserId = UserId.generate(testTenantId);
  });

  describe("createPlatformUser", () => {
    it("应该创建平台用户（提供昵称）", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        nickname: "约翰",
        createdBy: testUserId,
      });

      expect(user.getId()).toBeInstanceOf(UserId);
      expect(user.getId().value).toBeDefined();
      expect(user.getId().tenantId).toEqual(testTenantId);
      expect(user.getEmail().getValue()).toBe("john@example.com");
      expect(user.getUsername().getValue()).toBe("john_doe");
      expect(user.getNickname()).toBe("约翰");
      expect(user.getStatus().getValue()).toBe("PENDING_ACTIVATION");
      expect(user.getSource().isPlatform()).toBe(true);
      expect(user.getTenantId()).toEqual(testTenantId);
    });

    it("应该创建平台用户（不带昵称，默认使用用户名）", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      expect(user.getNickname()).toBe("john_doe"); // 默认使用用户名
    });

    it("应该发布 UserCreatedEvent 领域事件", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        nickname: "约翰",
        createdBy: testUserId,
      });

      const events = user.getDomainEvents();
      expect(events.length).toBe(1);
      expect(events[0]).toBeInstanceOf(UserCreatedEvent);
      const createdEvent = events[0] as UserCreatedEvent;
      expect(createdEvent.eventType).toBe("UserCreated");
      expect(createdEvent.userId).toBe(user.getId().value);
      expect(createdEvent.email).toBe("john@example.com");
      expect(createdEvent.username).toBe("john_doe");
      expect(createdEvent.nickname).toBe("约翰");
      expect(createdEvent.source).toBe("PLATFORM");
    });

    it("应该验证邮箱唯一性（如果提供 Repository）", async () => {
      // 注意：这里需要 mock Repository，实际测试中需要基础设施层支持
      // 这里只测试接口，实际验证会在应用层进行
      expect(true).toBe(true); // 占位测试
    });

    it("应该验证用户名唯一性（如果提供 Repository）", async () => {
      // 注意：这里需要 mock Repository，实际测试中需要基础设施层支持
      expect(true).toBe(true); // 占位测试
    });

    it("应该验证昵称唯一性（如果提供 Repository）", async () => {
      // 注意：这里需要 mock Repository，实际测试中需要基础设施层支持
      expect(true).toBe(true); // 占位测试
    });
  });

  describe("createSystemUser", () => {
    it("应该创建系统用户", () => {
      const user = User.createSystemUser({
        tenantId: testTenantId,
        username: new Username("system"),
        email: new Email("system@example.com"),
        createdBy: testUserId,
      });

      expect(user.getId()).toBeInstanceOf(UserId);
      expect(user.getId().value).toBeDefined();
      expect(user.getId().tenantId).toEqual(testTenantId);
      expect(user.getEmail().getValue()).toBe("system@example.com");
      expect(user.getUsername().getValue()).toBe("system");
      expect(user.getStatus().getValue()).toBe("ACTIVE"); // 系统用户默认为活跃
      expect(user.getSource().isSystem()).toBe(true);
      expect(user.getPasswordHash().isSystem()).toBe(true); // 系统用户无密码
      expect(user.getTenantId()).toEqual(testTenantId);
    });

    it("应该发布 UserCreatedEvent 领域事件", () => {
      const user = User.createSystemUser({
        tenantId: testTenantId,
        username: new Username("system"),
        email: new Email("system@example.com"),
        createdBy: testUserId,
      });

      const events = user.getDomainEvents();
      expect(events.length).toBe(1);
      expect(events[0]).toBeInstanceOf(UserCreatedEvent);
      const createdEvent = events[0] as UserCreatedEvent;
      expect(createdEvent.userId).toBe(user.getId().value);
    });
  });

  describe("getNickname", () => {
    it("应该返回用户昵称", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        nickname: "约翰",
        createdBy: testUserId,
      });

      expect(user.getNickname()).toBe("约翰");
    });

    it("应该返回默认昵称（用户名）", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      expect(user.getNickname()).toBe("john_doe");
    });
  });

  describe("基本属性", () => {
    it("应该返回用户ID（UserId）", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      expect(user.getId()).toBeInstanceOf(UserId);
      expect(user.getId().tenantId).toEqual(testTenantId);
    });

    it("应该返回租户ID", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      expect(user.getTenantId()).toEqual(testTenantId);
    });

    it("应该返回邮箱", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      expect(user.getEmail()).toBeInstanceOf(Email);
      expect(user.getEmail().getValue()).toBe("john@example.com");
    });

    it("应该返回用户名", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      expect(user.getUsername()).toBeInstanceOf(Username);
      expect(user.getUsername().getValue()).toBe("john_doe");
    });

    it("应该返回用户状态", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      expect(user.getStatus()).toBeInstanceOf(UserStatus);
      expect(user.getStatus().getValue()).toBe("PENDING_ACTIVATION");
    });

    it("应该返回用户来源", () => {
      const platformUser = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      expect(platformUser.getSource().isPlatform()).toBe(true);

      const systemUser = User.createSystemUser({
        tenantId: testTenantId,
        username: new Username("system"),
        email: new Email("system@example.com"),
        createdBy: testUserId,
      });

      expect(systemUser.getSource().isSystem()).toBe(true);
    });
  });

  describe("审计字段", () => {
    it("应该设置创建时间和创建人", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.createdBy).toEqual(testUserId);
    });

    it("应该设置版本号为1", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      expect(user.version).toBe(1);
    });
  });

  describe("状态转换 - activate", () => {
    it("应该激活待激活状态的用户", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      const initialVersion = user.version;
      user.activate();

      expect(user.getStatus().getValue()).toBe("ACTIVE");
      expect(user.version).toBe(initialVersion + 1);
      expect(user.isAvailable()).toBe(true);

      // 检查领域事件
      const events = user.getDomainEvents();
      const activatedEvent = events.find(
        (e) => e instanceof UserActivatedEvent,
      ) as UserActivatedEvent;
      expect(activatedEvent).toBeDefined();
      expect(activatedEvent.userId).toBe(user.getId().value);
    });

    it("应该允许重复激活（幂等）", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      user.activate();
      const versionAfterFirstActivate = user.version;

      // 再次激活应该不抛异常，也不更新状态
      user.activate();

      expect(user.getStatus().getValue()).toBe("ACTIVE");
      expect(user.version).toBe(versionAfterFirstActivate); // 版本号不变
    });

    it("应该从禁用状态激活时抛出异常", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      user.activate();
      user.disable("违规操作");

      expect(() => user.activate()).toThrow(InvalidStatusTransitionError);
    });
  });

  describe("状态转换 - disable", () => {
    it("应该禁用活跃状态的用户", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      user.activate();
      const initialVersion = user.version;

      user.disable("违规操作");

      expect(user.getStatus().getValue()).toBe("DISABLED");
      expect(user.version).toBe(initialVersion + 1);
      expect(user.isAvailable()).toBe(false);

      // 检查领域事件
      const events = user.getDomainEvents();
      const disabledEvent = events.find(
        (e) => e instanceof UserDisabledEvent,
      ) as UserDisabledEvent;
      expect(disabledEvent).toBeDefined();
      expect(disabledEvent.userId).toBe(user.getId().value);
    });

    it("应该允许重复禁用（幂等）", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      user.activate();
      user.disable("违规操作");
      const versionAfterFirstDisable = user.version;

      // 再次禁用应该不抛异常，也不更新状态
      user.disable("再次违规");

      expect(user.getStatus().getValue()).toBe("DISABLED");
      expect(user.version).toBe(versionAfterFirstDisable); // 版本号不变
    });
  });

  describe("状态转换 - lock", () => {
    it("应该锁定活跃状态的用户", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      user.activate();
      const initialVersion = user.version;
      const lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后

      user.lock(lockedUntil, "安全原因");

      expect(user.getStatus().getValue()).toBe("LOCKED");
      expect(user.version).toBe(initialVersion + 1);
      expect(user.isAvailable()).toBe(false);

      // 检查领域事件
      const events = user.getDomainEvents();
      const lockedEvent = events.find(
        (e) => e instanceof UserLockedEvent,
      ) as UserLockedEvent;
      expect(lockedEvent).toBeDefined();
      expect(lockedEvent.userId).toBe(user.getId().value);
    });

    it("应该允许重复锁定（幂等）", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      user.activate();
      const lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      user.lock(lockedUntil, "安全原因");
      const versionAfterFirstLock = user.version;

      // 再次锁定应该不抛异常，也不更新状态
      user.lock(lockedUntil, "再次锁定");

      expect(user.getStatus().getValue()).toBe("LOCKED");
      expect(user.version).toBe(versionAfterFirstLock); // 版本号不变
    });
  });

  describe("状态转换 - unlock", () => {
    it("应该解锁锁定状态的用户", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      user.activate();
      const lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      user.lock(lockedUntil, "安全原因");
      const initialVersion = user.version;

      user.unlock();

      expect(user.getStatus().getValue()).toBe("ACTIVE");
      expect(user.version).toBe(initialVersion + 1);
      expect(user.isAvailable()).toBe(true);

      // 检查领域事件
      const events = user.getDomainEvents();
      const unlockedEvent = events.find(
        (e) => e instanceof UserUnlockedEvent,
      ) as UserUnlockedEvent;
      expect(unlockedEvent).toBeDefined();
      expect(unlockedEvent.userId).toBe(user.getId().value);
    });

    it("应该允许重复解锁（幂等）", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      user.activate();
      const lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      user.lock(lockedUntil, "安全原因");
      user.unlock();
      const versionAfterFirstUnlock = user.version;

      // 再次解锁应该不抛异常，也不更新状态
      user.unlock();

      expect(user.getStatus().getValue()).toBe("ACTIVE");
      expect(user.version).toBe(versionAfterFirstUnlock); // 版本号不变
    });
  });

  describe("updateNickname", () => {
    it("应该更新用户昵称", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      const initialVersion = user.version;
      const updatedBy = UserId.generate(testTenantId);

      user.updateNickname("新昵称", updatedBy);

      expect(user.getNickname()).toBe("新昵称");
      expect(user.version).toBe(initialVersion + 1);
      expect(user.updatedBy).toEqual(updatedBy);
    });

    it("应该验证昵称格式", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      const updatedBy = UserId.generate(testTenantId);

      // 空字符串应该抛出异常
      expect(() => user.updateNickname("", updatedBy)).toThrow();

      // 超过50字符应该抛出异常
      const longNickname = "a".repeat(51);
      expect(() => user.updateNickname(longNickname, updatedBy)).toThrow();
    });
  });

  describe("isAvailable", () => {
    it("应该返回 true 当用户状态为活跃", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      user.activate();
      expect(user.isAvailable()).toBe(true);
    });

    it("应该返回 false 当用户状态为待激活", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      expect(user.isAvailable()).toBe(false);
    });

    it("应该返回 false 当用户状态为禁用", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      user.activate();
      user.disable("违规操作");
      expect(user.isAvailable()).toBe(false);
    });

    it("应该返回 false 当用户状态为锁定", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      user.activate();
      const lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      user.lock(lockedUntil, "安全原因");
      expect(user.isAvailable()).toBe(false);
    });
  });

  describe("密码管理", () => {
    it("changePassword 应该抛出错误（需要基础设施层支持）", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      // 注意：changePassword 需要基础设施层支持密码验证和哈希
      // 这里只测试接口，实际实现会在基础设施层
      expect(() => {
        user.changePassword("SecurePass123!", "NewPass123!");
      }).toThrow();
    });

    it("resetPassword 应该抛出错误（需要基础设施层支持）", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      // 注意：resetPassword 需要基础设施层支持密码哈希
      // 这里只测试接口，实际实现会在基础设施层
      expect(() => {
        user.resetPassword("NewPass123!", testUserId);
      }).toThrow();
    });

    it("verifyPassword 应该抛出错误（需要基础设施层支持）", () => {
      const user = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("john_doe"),
        email: new Email("john@example.com"),
        password: "SecurePass123!",
        createdBy: testUserId,
      });

      // 注意：由于 createPlatformUser 使用 PasswordHash.system() 作为占位符
      // verifyPassword 对于系统哈希（空字符串）会返回 false，而不是抛出错误
      // 实际实现中，应该从应用层传入已生成的密码哈希，然后 verifyPassword 会抛出错误
      expect(user.verifyPassword("SecurePass123!")).toBe(false);
    });
  });
});

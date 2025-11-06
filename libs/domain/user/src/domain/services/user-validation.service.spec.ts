/**
 * @fileoverview UserValidationDomainService 单元测试
 * @description 测试用户验证领域服务的唯一性验证功能
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { UserId, TenantId } from "@hl8/shared";
import { UserValidationDomainService } from "./user-validation.service.js";
import { IUserRepository } from "../repositories/user.repository.js";
import { User } from "../entities/user.entity.js";
import { Email } from "../value-objects/email.vo.js";
import { Username } from "../value-objects/username.vo.js";

describe("UserValidationDomainService", () => {
  let service: UserValidationDomainService;
  let mockRepository: jest.Mocked<IUserRepository>;
  let testTenantId: TenantId;

  beforeEach(() => {
    testTenantId = TenantId.generate();
    mockRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      findByNickname: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      existsByEmail: jest.fn(),
      existsByUsername: jest.fn(),
      existsByNickname: jest.fn(),
    } as jest.Mocked<IUserRepository>;

    service = new UserValidationDomainService(mockRepository);
  });

  describe("isEmailUnique", () => {
    it("应该返回 true 当邮箱不存在", async () => {
      const email = new Email("test@example.com");
      mockRepository.existsByEmail.mockResolvedValue(false);

      const result = await service.isEmailUnique(email);

      expect(result).toBe(true);
      expect(mockRepository.existsByEmail).toHaveBeenCalledWith(email);
    });

    it("应该返回 false 当邮箱已存在", async () => {
      const email = new Email("existing@example.com");
      mockRepository.existsByEmail.mockResolvedValue(true);

      const result = await service.isEmailUnique(email);

      expect(result).toBe(false);
      expect(mockRepository.existsByEmail).toHaveBeenCalledWith(email);
    });

    it("应该返回 true 当邮箱存在但属于排除的用户", async () => {
      const email = new Email("test@example.com");
      // 先创建一个用户，使用它的ID作为排除的用户ID
      const existingUser = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("existing_user"),
        email: email,
        password: "SecurePass123!",
      });
      const excludeUserId = existingUser.getId(); // 使用现有用户的ID

      mockRepository.existsByEmail.mockResolvedValue(true);
      mockRepository.findByEmail.mockResolvedValue(existingUser);

      const result = await service.isEmailUnique(email, excludeUserId);

      // 找到的用户ID与排除的用户ID相同，应该返回 true（唯一）
      expect(result).toBe(true);
      expect(mockRepository.existsByEmail).toHaveBeenCalledWith(email);
      expect(mockRepository.findByEmail).toHaveBeenCalledWith(email);
    });

    it("应该返回 false 当邮箱存在且不属于排除的用户", async () => {
      const email = new Email("test@example.com");
      // 创建一个用户，使用不同的ID作为排除的用户ID
      const existingUser = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("existing_user"),
        email: email,
        password: "SecurePass123!",
      });
      // 生成一个不同的用户ID作为排除的用户ID
      const excludeUserId = UserId.generate(testTenantId);

      // 确保 existingUser 的 ID 与 excludeUserId 不同
      expect(existingUser.getId().value).not.toBe(excludeUserId.value);

      mockRepository.existsByEmail.mockResolvedValue(true);
      mockRepository.findByEmail.mockResolvedValue(existingUser);

      const result = await service.isEmailUnique(email, excludeUserId);

      // 找到的用户ID与排除的用户ID不同，应该返回 false（不唯一）
      expect(result).toBe(false);
      expect(mockRepository.existsByEmail).toHaveBeenCalledWith(email);
      expect(mockRepository.findByEmail).toHaveBeenCalledWith(email);
    });

    it("应该返回 true 当邮箱不存在且提供了排除的用户ID", async () => {
      const email = new Email("test@example.com");
      const excludeUserId = UserId.generate(testTenantId);

      mockRepository.existsByEmail.mockResolvedValue(false);

      const result = await service.isEmailUnique(email, excludeUserId);

      expect(result).toBe(true);
      expect(mockRepository.existsByEmail).toHaveBeenCalledWith(email);
      expect(mockRepository.findByEmail).not.toHaveBeenCalled();
    });
  });

  describe("isUsernameUnique", () => {
    it("应该返回 true 当用户名不存在", async () => {
      const username = new Username("test_user");
      mockRepository.existsByUsername.mockResolvedValue(false);

      const result = await service.isUsernameUnique(username);

      expect(result).toBe(true);
      expect(mockRepository.existsByUsername).toHaveBeenCalledWith(username);
    });

    it("应该返回 false 当用户名已存在", async () => {
      const username = new Username("existing_user");
      mockRepository.existsByUsername.mockResolvedValue(true);

      const result = await service.isUsernameUnique(username);

      expect(result).toBe(false);
      expect(mockRepository.existsByUsername).toHaveBeenCalledWith(username);
    });

    it("应该返回 true 当用户名存在但属于排除的用户", async () => {
      const username = new Username("test_user");
      // 先创建一个用户，使用它的ID作为排除的用户ID
      const existingUser = User.createPlatformUser({
        tenantId: testTenantId,
        username: username,
        email: new Email("test@example.com"),
        password: "SecurePass123!",
      });
      const excludeUserId = existingUser.getId(); // 使用现有用户的ID

      mockRepository.existsByUsername.mockResolvedValue(true);
      mockRepository.findByUsername.mockResolvedValue(existingUser);

      const result = await service.isUsernameUnique(username, excludeUserId);

      // 找到的用户ID与排除的用户ID相同，应该返回 true（唯一）
      expect(result).toBe(true);
      expect(mockRepository.existsByUsername).toHaveBeenCalledWith(username);
      expect(mockRepository.findByUsername).toHaveBeenCalledWith(username);
    });

    it("应该返回 false 当用户名存在且不属于排除的用户", async () => {
      const username = new Username("test_user");
      // 创建一个用户，使用不同的ID作为排除的用户ID
      const existingUser = User.createPlatformUser({
        tenantId: testTenantId,
        username: username,
        email: new Email("test@example.com"),
        password: "SecurePass123!",
      });
      // 生成一个不同的用户ID作为排除的用户ID
      const excludeUserId = UserId.generate(testTenantId);

      // 确保 existingUser 的 ID 与 excludeUserId 不同
      expect(existingUser.getId().value).not.toBe(excludeUserId.value);

      mockRepository.existsByUsername.mockResolvedValue(true);
      mockRepository.findByUsername.mockResolvedValue(existingUser);

      const result = await service.isUsernameUnique(username, excludeUserId);

      // 找到的用户ID与排除的用户ID不同，应该返回 false（不唯一）
      expect(result).toBe(false);
      expect(mockRepository.existsByUsername).toHaveBeenCalledWith(username);
      expect(mockRepository.findByUsername).toHaveBeenCalledWith(username);
    });
  });

  describe("isNicknameUnique", () => {
    it("应该返回 true 当昵称不存在", async () => {
      const nickname = "测试昵称";
      mockRepository.existsByNickname.mockResolvedValue(false);

      const result = await service.isNicknameUnique(nickname);

      expect(result).toBe(true);
      expect(mockRepository.existsByNickname).toHaveBeenCalledWith(nickname);
    });

    it("应该返回 false 当昵称已存在", async () => {
      const nickname = "已存在的昵称";
      mockRepository.existsByNickname.mockResolvedValue(true);

      const result = await service.isNicknameUnique(nickname);

      expect(result).toBe(false);
      expect(mockRepository.existsByNickname).toHaveBeenCalledWith(nickname);
    });

    it("应该返回 true 当昵称存在但属于排除的用户", async () => {
      const nickname = "测试昵称";
      // 先创建一个用户，使用它的ID作为排除的用户ID
      const existingUser = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("test_user"),
        email: new Email("test@example.com"),
        password: "SecurePass123!",
        nickname: nickname,
      });
      const excludeUserId = existingUser.getId(); // 使用现有用户的ID

      mockRepository.existsByNickname.mockResolvedValue(true);
      mockRepository.findByNickname.mockResolvedValue(existingUser);

      const result = await service.isNicknameUnique(nickname, excludeUserId);

      // 找到的用户ID与排除的用户ID相同，应该返回 true（唯一）
      expect(result).toBe(true);
      expect(mockRepository.existsByNickname).toHaveBeenCalledWith(nickname);
      expect(mockRepository.findByNickname).toHaveBeenCalledWith(nickname);
    });

    it("应该返回 false 当昵称存在且不属于排除的用户", async () => {
      const nickname = "测试昵称";
      // 创建一个用户，使用不同的ID作为排除的用户ID
      const existingUser = User.createPlatformUser({
        tenantId: testTenantId,
        username: new Username("test_user"),
        email: new Email("test@example.com"),
        password: "SecurePass123!",
        nickname: nickname,
      });
      // 生成一个不同的用户ID作为排除的用户ID
      const excludeUserId = UserId.generate(testTenantId);

      // 确保 existingUser 的 ID 与 excludeUserId 不同
      expect(existingUser.getId().value).not.toBe(excludeUserId.value);

      mockRepository.existsByNickname.mockResolvedValue(true);
      mockRepository.findByNickname.mockResolvedValue(existingUser);

      const result = await service.isNicknameUnique(nickname, excludeUserId);

      // 找到的用户ID与排除的用户ID不同，应该返回 false（不唯一）
      expect(result).toBe(false);
      expect(mockRepository.existsByNickname).toHaveBeenCalledWith(nickname);
      expect(mockRepository.findByNickname).toHaveBeenCalledWith(nickname);
    });

    it("应该返回 true 当昵称不存在且提供了排除的用户ID", async () => {
      const nickname = "测试昵称";
      const excludeUserId = UserId.generate(testTenantId);

      mockRepository.existsByNickname.mockResolvedValue(false);

      const result = await service.isNicknameUnique(nickname, excludeUserId);

      expect(result).toBe(true);
      expect(mockRepository.existsByNickname).toHaveBeenCalledWith(nickname);
      expect(mockRepository.findByNickname).not.toHaveBeenCalled();
    });
  });
});

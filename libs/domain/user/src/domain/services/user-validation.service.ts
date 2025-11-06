/**
 * @fileoverview 用户验证领域服务
 * @description 处理用户相关的验证逻辑，包括邮箱、用户名和昵称的唯一性验证
 */

import { UserId } from "@hl8/shared";
import { IUserRepository } from "../repositories/user.repository.js";
import { Email } from "../value-objects/email.vo.js";
import { Username } from "../value-objects/username.vo.js";

/**
 * 用户验证领域服务
 * @description 处理用户相关的验证逻辑，包括邮箱、用户名和昵称的唯一性验证
 * @remarks
 * 领域服务用于处理跨聚合的业务逻辑。
 * 此服务负责验证用户邮箱、用户名和昵称的唯一性。
 *
 * 唯一性验证规则：
 * - 邮箱必须在平台级别唯一
 * - 用户名必须在平台级别唯一
 * - 昵称必须在平台级别唯一
 * - 更新时，可以排除当前用户（通过 excludeUserId 参数）
 *
 * @example
 * ```typescript
 * // 创建服务实例
 * const validationService = new UserValidationDomainService(userRepository);
 *
 * // 验证邮箱唯一性（创建新用户）
 * const isEmailUnique = await validationService.isEmailUnique(
 *   new Email("test@example.com")
 * );
 *
 * // 验证邮箱唯一性（更新用户，排除当前用户）
 * const isEmailUniqueForUpdate = await validationService.isEmailUnique(
 *   new Email("test@example.com"),
 *   currentUserId
 * );
 * ```
 */
export class UserValidationDomainService {
  /**
   * 构造函数
   * @param userRepository 用户 Repository 接口
   */
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * 验证邮箱唯一性
   * @param email 邮箱地址
   * @param excludeUserId 排除的用户ID（用于更新场景，排除当前用户）
   * @returns 邮箱是否唯一
   * @description
   * 验证邮箱在平台级别是否唯一。
   * 如果提供了 excludeUserId，则排除该用户，用于更新场景。
   *
   * 验证逻辑：
   * 1. 检查邮箱是否存在
   * 2. 如果不存在，返回 true（唯一）
   * 3. 如果存在且未提供 excludeUserId，返回 false（不唯一）
   * 4. 如果存在且提供了 excludeUserId，检查找到的用户是否为排除的用户
   * 5. 如果是排除的用户，返回 true（唯一，因为是要更新的用户）
   * 6. 如果不是排除的用户，返回 false（不唯一）
   */
  async isEmailUnique(email: Email, excludeUserId?: UserId): Promise<boolean> {
    // 检查邮箱是否存在
    const exists = await this.userRepository.existsByEmail(email);

    // 如果不存在，返回 true（唯一）
    if (!exists) {
      return true;
    }

    // 如果存在但未提供排除的用户ID，返回 false（不唯一）
    if (!excludeUserId) {
      return false;
    }

    // 如果存在且提供了排除的用户ID，查找用户并比较ID
    const existingUser = await this.userRepository.findByEmail(email);

    // 如果找不到用户（理论上不应该发生），返回 false
    if (!existingUser) {
      return false;
    }

    // 如果找到的用户ID与排除的用户ID相同，返回 true（唯一，因为是要更新的用户）
    // 否则返回 false（不唯一）
    return existingUser.getId().value === excludeUserId.value;
  }

  /**
   * 验证用户名唯一性
   * @param username 用户名
   * @param excludeUserId 排除的用户ID（用于更新场景，排除当前用户）
   * @returns 用户名是否唯一
   * @description
   * 验证用户名在平台级别是否唯一。
   * 如果提供了 excludeUserId，则排除该用户，用于更新场景。
   *
   * 验证逻辑：
   * 1. 检查用户名是否存在
   * 2. 如果不存在，返回 true（唯一）
   * 3. 如果存在且未提供 excludeUserId，返回 false（不唯一）
   * 4. 如果存在且提供了 excludeUserId，检查找到的用户是否为排除的用户
   * 5. 如果是排除的用户，返回 true（唯一，因为是要更新的用户）
   * 6. 如果不是排除的用户，返回 false（不唯一）
   */
  async isUsernameUnique(
    username: Username,
    excludeUserId?: UserId,
  ): Promise<boolean> {
    // 检查用户名是否存在
    const exists = await this.userRepository.existsByUsername(username);

    // 如果不存在，返回 true（唯一）
    if (!exists) {
      return true;
    }

    // 如果存在但未提供排除的用户ID，返回 false（不唯一）
    if (!excludeUserId) {
      return false;
    }

    // 如果存在且提供了排除的用户ID，查找用户并比较ID
    const existingUser = await this.userRepository.findByUsername(username);

    // 如果找不到用户（理论上不应该发生），返回 false
    if (!existingUser) {
      return false;
    }

    // 如果找到的用户ID与排除的用户ID相同，返回 true（唯一，因为是要更新的用户）
    // 否则返回 false（不唯一）
    return existingUser.getId().value === excludeUserId.value;
  }

  /**
   * 验证昵称唯一性
   * @param nickname 昵称
   * @param excludeUserId 排除的用户ID（用于更新场景，排除当前用户）
   * @returns 昵称是否唯一
   * @description
   * 验证昵称在平台级别是否唯一。
   * 如果提供了 excludeUserId，则排除该用户，用于更新场景。
   *
   * 验证逻辑：
   * 1. 检查昵称是否存在
   * 2. 如果不存在，返回 true（唯一）
   * 3. 如果存在且未提供 excludeUserId，返回 false（不唯一）
   * 4. 如果存在且提供了 excludeUserId，检查找到的用户是否为排除的用户
   * 5. 如果是排除的用户，返回 true（唯一，因为是要更新的用户）
   * 6. 如果不是排除的用户，返回 false（不唯一）
   */
  async isNicknameUnique(
    nickname: string,
    excludeUserId?: UserId,
  ): Promise<boolean> {
    // 检查昵称是否存在
    const exists = await this.userRepository.existsByNickname(nickname);

    // 如果不存在，返回 true（唯一）
    if (!exists) {
      return true;
    }

    // 如果存在但未提供排除的用户ID，返回 false（不唯一）
    if (!excludeUserId) {
      return false;
    }

    // 如果存在且提供了排除的用户ID，查找用户并比较ID
    const existingUser = await this.userRepository.findByNickname(nickname);

    // 如果找不到用户（理论上不应该发生），返回 false
    if (!existingUser) {
      return false;
    }

    // 如果找到的用户ID与排除的用户ID相同，返回 true（唯一，因为是要更新的用户）
    // 否则返回 false（不唯一）
    return existingUser.getId().value === excludeUserId.value;
  }
}

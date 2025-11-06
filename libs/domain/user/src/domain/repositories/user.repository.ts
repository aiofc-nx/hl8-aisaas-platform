/**
 * @fileoverview 用户 Repository 接口
 * @description 定义用户聚合的持久化操作接口
 */

import { UserId } from "@hl8/shared";
import { User } from "../entities/user.entity.js";
import { Email } from "../value-objects/email.vo.js";
import { Username } from "../value-objects/username.vo.js";

/**
 * 用户 Repository 接口
 * @description 定义用户聚合的持久化操作接口
 * @remarks
 * Repository 接口定义在领域层，实现应该在基础设施层。
 * 这遵循了依赖倒置原则（DIP），领域层不依赖基础设施层。
 *
 * User 聚合根是平台级别的实体，使用 EntityId 作为唯一标识。
 * 在多租户场景中，查询时需要结合租户上下文进行数据隔离。
 *
 * @example
 * ```typescript
 * // 在基础设施层实现
 * class UserRepository implements IUserRepository {
 *   async findById(id: EntityId): Promise<User | null> {
 *     // 实现数据库查询逻辑（平台级别）
 *   }
 *
 *   async findByUserId(userId: UserId): Promise<User | null> {
 *     // 实现数据库查询逻辑（租户级别，需要数据隔离）
 *     // userId.value 对应 User.id.value，tenantId 用于数据隔离
 *   }
 * }
 * ```
 */
export interface IUserRepository {
  /**
   * 根据用户ID查找用户
   * @param userId 用户ID（包含租户信息）
   * @returns 用户聚合根，如果不存在或不属于指定租户则返回 null
   * @description 根据用户ID查找用户，需要数据隔离
   * @remarks
   * 此方法用于在租户上下文中查找用户，确保数据隔离。
   * userId.value 对应 User 内部的 UUID，tenantId 用于验证用户是否属于该租户。
   */
  findById(userId: UserId): Promise<User | null>;

  /**
   * 根据邮箱查找用户
   * @param email 邮箱地址
   * @returns 用户聚合根，如果不存在则返回 null
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * 根据用户名查找用户
   * @param username 用户名
   * @returns 用户聚合根，如果不存在则返回 null
   */
  findByUsername(username: Username): Promise<User | null>;

  /**
   * 根据昵称查找用户
   * @param nickname 昵称
   * @returns 用户聚合根，如果不存在则返回 null
   */
  findByNickname(nickname: string): Promise<User | null>;

  /**
   * 保存用户（创建或更新）
   * @param user 用户聚合根
   * @returns 保存后的用户聚合根
   */
  save(user: User): Promise<User>;

  /**
   * 删除用户
   * @param userId 用户ID（包含租户信息）
   * @returns 是否删除成功
   */
  delete(userId: UserId): Promise<boolean>;

  /**
   * 检查邮箱是否存在
   * @param email 邮箱地址
   * @returns 邮箱是否存在
   */
  existsByEmail(email: Email): Promise<boolean>;

  /**
   * 检查用户名是否存在
   * @param username 用户名
   * @returns 用户名是否存在
   */
  existsByUsername(username: Username): Promise<boolean>;

  /**
   * 检查昵称是否存在
   * @param nickname 昵称
   * @returns 昵称是否存在
   */
  existsByNickname(nickname: string): Promise<boolean>;
}

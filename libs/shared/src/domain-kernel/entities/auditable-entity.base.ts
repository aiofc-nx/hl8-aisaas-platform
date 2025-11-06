/**
 * @fileoverview 可审计实体基类
 * @description 提供带审计字段的实体基类，包含创建时间、更新时间、版本号、用户追踪、激活/失活状态和软删除功能
 */

import { Entity } from "./entity.base.js";
import { EntityId } from "../value-objects/identifiers/entity-id.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- 用于文档示例代码
import { TenantId } from "../value-objects/identifiers/tenant-id.js";
import { UserId } from "../value-objects/identifiers/user-id.js";

/**
 * 可审计实体基类
 * @description 继承自Entity，添加了审计字段（创建时间、更新时间、版本号、用户追踪）、激活/失活状态和软删除功能的实体基类
 * @remarks
 * 可审计实体适用于需要记录创建和修改时间的业务实体。
 * 审计字段包括：
 * - createdAt: 创建时间，实体创建时自动设置
 * - createdBy: 创建者ID，记录创建实体的用户
 * - updatedAt: 更新时间，实体修改时需手动更新（或通过领域服务自动更新）
 * - updatedBy: 更新者ID，记录最后修改实体的用户
 * - version: 版本号，用于乐观锁，初始值为1，每次修改时递增
 * - deletedAt: 删除时间，用于软删除，null表示未删除
 * - deletedBy: 删除者ID，记录软删除实体的用户
 *
 * 激活/失活状态：
 * - isActive: 激活状态，默认为true（激活）
 * - activatedAt: 激活时间，记录最近一次激活的时间
 * - activatedBy: 激活者ID，记录最近一次激活的用户
 * - deactivatedAt: 失活时间，记录最近一次失活的时间，null表示未失活
 * - deactivatedBy: 失活者ID，记录最近一次失活的用户
 * - 实体创建时默认为激活状态
 * - 失活不是软删除，而是业务状态管理
 * - 软删除和失活是两个独立的状态
 *
 * 用户追踪功能：
 * - 记录创建实体的用户ID
 * - 记录最后修改实体的用户ID
 * - 记录删除实体的用户ID（可选）
 * - 记录激活/失活实体的用户ID（可选）
 * - 支持审计和合规要求
 *
 * 软删除功能：
 * - 实体不会被物理删除，而是标记为已删除
 * - 可以通过 restore() 方法恢复已删除的实体
 * - 查询时通常需要过滤已删除的实体
 *
 * 使用场景：
 * - 需要审计追踪的实体
 * - 需要乐观锁控制的实体
 * - 需要记录数据变更历史的实体
 * - 需要支持激活/失活状态的业务实体
 * - 需要支持软删除的业务实体
 * - 需要满足合规要求的实体（如GDPR、SOX等）
 *
 * @example
 * ```typescript
 * class User extends AuditableEntity {
 *   private _name: string;
 *   private _email: string;
 *
 *   constructor(id: EntityId, name: string, email: string, createdBy: UserId) {
 *     super(id, undefined, undefined, undefined, undefined, createdBy);
 *     this._name = name;
 *     this._email = email;
 *   }
 *
 *   get name(): string {
 *     return this._name;
 *   }
 *
 *   updateName(newName: string, updatedBy: UserId): void {
 *     this._name = newName;
 *     this.markAsUpdated(updatedBy); // 标记为已更新，并记录更新者
 *   }
 * }
 *
 * const tenantId = TenantId.generate();
 * const creatorId = UserId.generate(tenantId);
 * const user = new User(EntityId.generate(), "张三", "zhangsan@example.com", creatorId);
 * console.log(user.isActive()); // true，默认激活
 *
 * const deactivatorId = UserId.generate(tenantId);
 * user.deactivate(deactivatorId); // 失活
 * console.log(user.isActive()); // false
 *
 * const activatorId = UserId.generate(tenantId);
 * user.activate(activatorId); // 激活
 * console.log(user.isActive()); // true
 * ```
 */
export abstract class AuditableEntity extends Entity {
  /**
   * 创建时间
   * @description 实体创建的时间戳，在构造函数中自动设置
   */
  protected readonly _createdAt: Date;

  /**
   * 创建者ID
   * @description 创建实体的用户ID，记录创建者信息
   */
  protected readonly _createdBy: UserId | null;

  /**
   * 更新时间
   * @description 实体最后更新的时间戳，初始值与创建时间相同
   */
  protected _updatedAt: Date;

  /**
   * 更新者ID
   * @description 最后更新实体的用户ID，记录更新者信息
   */
  protected _updatedBy: UserId | null;

  /**
   * 版本号
   * @description 实体的版本号，用于乐观锁控制，初始值为1
   */
  protected _version: number;

  /**
   * 删除时间
   * @description 实体被软删除的时间戳，null表示未删除
   */
  protected _deletedAt: Date | null;

  /**
   * 删除者ID
   * @description 软删除实体的用户ID，记录删除者信息，null表示未删除或未记录删除者
   */
  protected _deletedBy: UserId | null;

  /**
   * 激活状态
   * @description 实体是否处于激活状态，true表示激活，false表示失活，默认为true
   */
  protected _isActive: boolean;

  /**
   * 激活时间
   * @description 实体最近一次激活的时间戳，初始值为创建时间
   */
  protected _activatedAt: Date;

  /**
   * 激活者ID
   * @description 最近一次激活实体的用户ID，记录激活者信息，null表示未记录激活者
   */
  protected _activatedBy: UserId | null;

  /**
   * 失活时间
   * @description 实体最近一次失活的时间戳，null表示未失活
   */
  protected _deactivatedAt: Date | null;

  /**
   * 失活者ID
   * @description 最近一次失活实体的用户ID，记录失活者信息，null表示未失活或未记录失活者
   */
  protected _deactivatedBy: UserId | null;

  /**
   * 创建可审计实体
   * @param id 实体标识符，如果未提供则自动生成
   * @param createdAt 创建时间，如果未提供则使用当前时间
   * @param updatedAt 更新时间，如果未提供则使用创建时间
   * @param version 版本号，如果未提供则默认为1
   * @param deletedAt 删除时间，如果未提供则默认为null（未删除）
   * @param createdBy 创建者ID，如果未提供则默认为null
   * @param updatedBy 更新者ID，如果未提供则默认为null
   * @param deletedBy 删除者ID，如果未提供则默认为null
   * @param isActive 激活状态，如果未提供则默认为true（激活）
   * @param activatedAt 激活时间，如果未提供则使用创建时间
   * @param activatedBy 激活者ID，如果未提供则默认为null
   * @param deactivatedAt 失活时间，如果未提供则默认为null（未失活）
   * @param deactivatedBy 失活者ID，如果未提供则默认为null
   * @description 初始化可审计实体实例，自动设置审计字段
   */
  constructor(
    id?: EntityId,
    createdAt?: Date,
    updatedAt?: Date,
    version?: number,
    deletedAt?: Date | null,
    createdBy?: UserId | null,
    updatedBy?: UserId | null,
    deletedBy?: UserId | null,
    isActive?: boolean,
    activatedAt?: Date,
    activatedBy?: UserId | null,
    deactivatedAt?: Date | null,
    deactivatedBy?: UserId | null,
  ) {
    super(id);

    const now = new Date();
    this._createdAt = createdAt || now;
    this._updatedAt = updatedAt || this._createdAt;
    this._version = version ?? 1;
    this._deletedAt = deletedAt ?? null;
    this._createdBy = createdBy ?? null;
    this._updatedBy = updatedBy ?? null;
    this._deletedBy = deletedBy ?? null;
    this._isActive = isActive ?? true;
    this._activatedAt = activatedAt || this._createdAt;
    this._activatedBy = activatedBy ?? null;
    this._deactivatedAt = deactivatedAt ?? null;
    this._deactivatedBy = deactivatedBy ?? null;
  }

  /**
   * 获取创建时间
   * @returns 创建时间
   */
  public get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * 获取更新时间
   * @returns 更新时间
   */
  public get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * 获取版本号
   * @returns 版本号
   */
  public get version(): number {
    return this._version;
  }

  /**
   * 获取删除时间
   * @returns 删除时间，如果未删除则返回null
   */
  public get deletedAt(): Date | null {
    return this._deletedAt;
  }

  /**
   * 获取创建者ID
   * @returns 创建者ID，如果未记录则返回null
   */
  public get createdBy(): UserId | null {
    return this._createdBy;
  }

  /**
   * 获取更新者ID
   * @returns 更新者ID，如果未记录则返回null
   */
  public get updatedBy(): UserId | null {
    return this._updatedBy;
  }

  /**
   * 获取删除者ID
   * @returns 删除者ID，如果未删除或未记录则返回null
   */
  public get deletedBy(): UserId | null {
    return this._deletedBy;
  }

  /**
   * 获取激活时间
   * @returns 激活时间，记录最近一次激活的时间
   */
  public get activatedAt(): Date {
    return this._activatedAt;
  }

  /**
   * 获取激活者ID
   * @returns 激活者ID，如果未记录则返回null
   */
  public get activatedBy(): UserId | null {
    return this._activatedBy;
  }

  /**
   * 获取失活时间
   * @returns 失活时间，如果未失活则返回null
   */
  public get deactivatedAt(): Date | null {
    return this._deactivatedAt;
  }

  /**
   * 获取失活者ID
   * @returns 失活者ID，如果未失活或未记录则返回null
   */
  public get deactivatedBy(): UserId | null {
    return this._deactivatedBy;
  }

  /**
   * 标记实体为已更新
   * @param updatedBy 更新者ID，如果提供则记录更新者信息
   * @description 更新实体的更新时间戳、版本号和更新者信息，用于跟踪实体修改
   * @remarks
   * 此方法应在实体状态发生变化时调用，用于：
   * - 更新 updatedAt 时间戳
   * - 更新 updatedBy 更新者ID（如果提供）
   * - 递增 version 版本号（用于乐观锁）
   *
   * 使用场景：
   * - 实体属性修改时
   * - 实体状态变更时
   * - 需要触发审计记录时
   * - 需要追踪修改者时
   *
   * @example
   * ```typescript
   * class User extends AuditableEntity {
   *   updateName(newName: string, updatedBy: UserId): void {
   *     this._name = newName;
   *     this.markAsUpdated(updatedBy); // 标记为已更新，并记录更新者
   *   }
   * }
   * ```
   */
  protected markAsUpdated(updatedBy?: UserId | null): void {
    this._updatedAt = new Date();
    this._version += 1;
    if (updatedBy !== undefined) {
      this._updatedBy = updatedBy;
    }
  }

  /**
   * 软删除实体
   * @param deletedBy 删除者ID，如果提供则记录删除者信息
   * @description 将实体标记为已删除，设置删除时间戳、删除者ID并更新版本号
   * @remarks
   * 软删除不会物理删除实体，而是：
   * - 设置 deletedAt 为当前时间
   * - 设置 deletedBy 为删除者ID（如果提供）
   * - 更新 updatedAt 时间戳
   * - 更新 updatedBy 为删除者ID（如果提供）
   * - 递增 version 版本号
   *
   * 使用场景：
   * - 需要保留数据但标记为已删除
   * - 需要支持数据恢复功能
   * - 需要审计删除操作
   * - 需要追踪删除者
   *
   * 注意事项：
   * - 已删除的实体不应在常规查询中返回
   * - 可以通过 restore() 方法恢复已删除的实体
   * - 重复调用此方法不会改变删除时间和删除者（除非实体已被恢复）
   *
   * @example
   * ```typescript
   * const tenantId = TenantId.generate();
   * const creatorId = UserId.generate(tenantId);
   * const user = new User(EntityId.generate(), "张三", "zhangsan@example.com", creatorId);
   * const deleterId = UserId.generate(tenantId);
   * user.softDelete(deleterId);
   * console.log(user.isDeleted()); // true
   * console.log(user.deletedAt); // 删除时间
   * console.log(user.deletedBy); // 删除者ID
   * ```
   */
  public softDelete(deletedBy?: UserId | null): void {
    if (this._deletedAt === null) {
      this._deletedAt = new Date();
      if (deletedBy !== undefined) {
        this._deletedBy = deletedBy;
        this.markAsUpdated(deletedBy);
      } else {
        this.markAsUpdated();
      }
    }
  }

  /**
   * 恢复已删除的实体
   * @param restoredBy 恢复者ID，如果提供则记录恢复者信息
   * @description 清除删除标记，恢复实体为正常状态
   * @remarks
   * 恢复已删除的实体会：
   * - 清除 deletedAt（设置为null）
   * - 清除 deletedBy（设置为null）
   * - 更新 updatedAt 时间戳
   * - 更新 updatedBy 为恢复者ID（如果提供）
   * - 递增 version 版本号
   *
   * 使用场景：
   * - 误删除后恢复数据
   * - 需要重新激活已删除的实体
   * - 需要追踪恢复操作
   *
   * 注意事项：
   * - 只有已删除的实体才能被恢复
   * - 恢复后实体可以在常规查询中返回
   *
   * @example
   * ```typescript
   * const tenantId = TenantId.generate();
   * const user = new User(EntityId.generate(), "张三", "zhangsan@example.com");
   * user.softDelete();
   * console.log(user.isDeleted()); // true
   * const restorerId = UserId.generate(tenantId);
   * user.restore(restorerId);
   * console.log(user.isDeleted()); // false
   * console.log(user.updatedBy); // 恢复者ID
   * ```
   */
  public restore(restoredBy?: UserId | null): void {
    if (this._deletedAt !== null) {
      this._deletedAt = null;
      this._deletedBy = null;
      if (restoredBy !== undefined) {
        this.markAsUpdated(restoredBy);
      } else {
        this.markAsUpdated();
      }
    }
  }

  /**
   * 检查实体是否已被软删除
   * @returns 如果实体已被软删除则返回true，否则返回false
   * @description 通过检查 deletedAt 是否为null来判断实体是否已被删除
   *
   * @example
   * ```typescript
   * const user = new User(EntityId.generate(), "张三", "zhangsan@example.com");
   * console.log(user.isDeleted()); // false
   * user.softDelete();
   * console.log(user.isDeleted()); // true
   * ```
   */
  public isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  /**
   * 检查实体是否处于激活状态
   * @returns 如果实体处于激活状态则返回true，否则返回false
   * @description 检查实体的激活状态，失活状态返回false
   *
   * @example
   * ```typescript
   * const user = new User(EntityId.generate(), "张三", "zhangsan@example.com");
   * console.log(user.isActive()); // true，默认激活
   * user.deactivate();
   * console.log(user.isActive()); // false
   * ```
   */
  public isActive(): boolean {
    return this._isActive;
  }

  /**
   * 激活实体
   * @param activatedBy 激活者ID，如果提供则记录激活者信息
   * @description 将实体设置为激活状态，记录激活时间和激活者
   * @remarks
   * 激活实体会：
   * - 设置 isActive 为 true
   * - 更新 activatedAt 为当前时间
   * - 设置 activatedBy 为激活者ID（如果提供）
   * - 清除 deactivatedAt 和 deactivatedBy
   * - 更新 updatedAt 时间戳
   * - 更新 updatedBy 为激活者ID（如果提供）
   * - 递增 version 版本号
   *
   * 使用场景：
   * - 重新激活已失活的实体
   * - 首次激活实体（虽然默认已激活，但可以记录激活者）
   * - 需要追踪激活操作
   *
   * 注意事项：
   * - 如果实体已经是激活状态，调用此方法会更新激活时间和激活者
   * - 激活和软删除是两个独立的状态，激活不会影响软删除状态
   *
   * @example
   * ```typescript
   * const tenantId = TenantId.generate();
   * const user = new User(EntityId.generate(), "张三", "zhangsan@example.com");
   * user.deactivate();
   * console.log(user.isActive()); // false
   * const activatorId = UserId.generate(tenantId);
   * user.activate(activatorId);
   * console.log(user.isActive()); // true
   * console.log(user.activatedBy); // 激活者ID
   * ```
   */
  public activate(activatedBy?: UserId | null): void {
    this._isActive = true;
    this._activatedAt = new Date();
    if (activatedBy !== undefined) {
      this._activatedBy = activatedBy;
      this.markAsUpdated(activatedBy);
    } else {
      this.markAsUpdated();
    }
    this._deactivatedAt = null;
    this._deactivatedBy = null;
  }

  /**
   * 失活实体
   * @param deactivatedBy 失活者ID，如果提供则记录失活者信息
   * @description 将实体设置为失活状态，记录失活时间和失活者
   * @remarks
   * 失活实体会：
   * - 设置 isActive 为 false
   * - 更新 deactivatedAt 为当前时间
   * - 设置 deactivatedBy 为失活者ID（如果提供）
   * - 更新 updatedAt 时间戳
   * - 更新 updatedBy 为失活者ID（如果提供）
   * - 递增 version 版本号
   *
   * 使用场景：
   * - 临时禁用实体（不删除）
   * - 需要暂停实体使用
   * - 需要追踪失活操作
   *
   * 注意事项：
   * - 失活不是软删除，实体仍然存在但处于非激活状态
   * - 失活和软删除是两个独立的状态，可以同时存在
   * - 如果实体已经是失活状态，调用此方法会更新失活时间和失活者
   *
   * @example
   * ```typescript
   * const tenantId = TenantId.generate();
   * const user = new User(EntityId.generate(), "张三", "zhangsan@example.com");
   * console.log(user.isActive()); // true
   * const deactivatorId = UserId.generate(tenantId);
   * user.deactivate(deactivatorId);
   * console.log(user.isActive()); // false
   * console.log(user.deactivatedBy); // 失活者ID
   * ```
   */
  public deactivate(deactivatedBy?: UserId | null): void {
    this._isActive = false;
    this._deactivatedAt = new Date();
    if (deactivatedBy !== undefined) {
      this._deactivatedBy = deactivatedBy;
      this.markAsUpdated(deactivatedBy);
    } else {
      this.markAsUpdated();
    }
  }

  /**
   * 转换为JSON表示
   * @returns 实体的JSON表示，包含审计字段、用户追踪、激活/失活状态和删除时间
   * @description 返回实体的JSON可序列化表示，包含ID、审计字段、用户追踪、激活/失活状态和删除时间
   * @remarks
   * 子类可以重写此方法以包含更多属性。
   * 注意：日期字段会转换为ISO字符串格式，用户ID字段为null时也会包含在结果中。
   *
   * @example
   * ```typescript
   * const tenantId = TenantId.generate();
   * const creatorId = UserId.generate(tenantId);
   * const user = new User(EntityId.generate(), "张三", "zhangsan@example.com", creatorId);
   * console.log(user.toJSON());
   * // {
   * //   id: "...",
   * //   createdAt: "2025-01-27T10:00:00.000Z",
   * //   createdBy: "...",
   * //   updatedAt: "2025-01-27T10:00:00.000Z",
   * //   updatedBy: null,
   * //   version: 1,
   * //   isActive: true,
   * //   activatedAt: "2025-01-27T10:00:00.000Z",
   * //   activatedBy: null,
   * //   deactivatedAt: null,
   * //   deactivatedBy: null,
   * //   deletedAt: null,
   * //   deletedBy: null
   * // }
   *
   * const deactivatorId = UserId.generate(tenantId);
   * user.deactivate(deactivatorId);
   * console.log(user.toJSON());
   * // {
   * //   ...
   * //   isActive: false,
   * //   deactivatedAt: "2025-01-27T11:00:00.000Z",
   * //   deactivatedBy: "..."
   * // }
   * ```
   */
  public override toJSON(): {
    id: string;
    createdAt: string;
    createdBy: string | null;
    updatedAt: string;
    updatedBy: string | null;
    version: number;
    isActive: boolean;
    activatedAt: string;
    activatedBy: string | null;
    deactivatedAt: string | null;
    deactivatedBy: string | null;
    deletedAt: string | null;
    deletedBy: string | null;
  } {
    return {
      ...super.toJSON(),
      createdAt: this._createdAt.toISOString(),
      createdBy: this._createdBy?.value ?? null,
      updatedAt: this._updatedAt.toISOString(),
      updatedBy: this._updatedBy?.value ?? null,
      version: this._version,
      isActive: this._isActive,
      activatedAt: this._activatedAt.toISOString(),
      activatedBy: this._activatedBy?.value ?? null,
      deactivatedAt: this._deactivatedAt
        ? this._deactivatedAt.toISOString()
        : null,
      deactivatedBy: this._deactivatedBy?.value ?? null,
      deletedAt: this._deletedAt ? this._deletedAt.toISOString() : null,
      deletedBy: this._deletedBy?.value ?? null,
    };
  }

  /**
   * 检查实体是否已修改
   * @returns 实体是否已修改（创建时间和更新时间不同）
   * @description 检查实体自创建后是否被修改过
   */
  public isModified(): boolean {
    return this._updatedAt.getTime() !== this._createdAt.getTime();
  }

  /**
   * 获取实体的存活时间（毫秒）
   * @returns 自创建到现在的毫秒数
   * @description 计算实体自创建以来的存活时间
   */
  public getAge(): number {
    return Date.now() - this._createdAt.getTime();
  }

  /**
   * 获取自上次更新以来的时间（毫秒）
   * @returns 自上次更新到现在的毫秒数
   * @description 计算实体自上次更新以来的时间
   */
  public getTimeSinceLastUpdate(): number {
    return Date.now() - this._updatedAt.getTime();
  }

  /**
   * 获取自删除以来的时间（毫秒）
   * @returns 自删除到现在的毫秒数，如果未删除则返回null
   * @description 计算实体自删除以来的时间
   *
   * @example
   * ```typescript
   * const user = new User(EntityId.generate(), "张三", "zhangsan@example.com");
   * user.softDelete();
   * // 等待一段时间
   * console.log(user.getTimeSinceDeleted()); // 删除后的毫秒数
   * ```
   */
  public getTimeSinceDeleted(): number | null {
    if (this._deletedAt === null) {
      return null;
    }
    return Date.now() - this._deletedAt.getTime();
  }

  /**
   * 获取自激活以来的时间（毫秒）
   * @returns 自激活到现在的毫秒数
   * @description 计算实体自最近一次激活以来的时间
   *
   * @example
   * ```typescript
   * const user = new User(EntityId.generate(), "张三", "zhangsan@example.com");
   * // 等待一段时间
   * console.log(user.getTimeSinceActivated()); // 激活后的毫秒数
   * ```
   */
  public getTimeSinceActivated(): number {
    return Date.now() - this._activatedAt.getTime();
  }

  /**
   * 获取自失活以来的时间（毫秒）
   * @returns 自失活到现在的毫秒数，如果未失活则返回null
   * @description 计算实体自最近一次失活以来的时间
   *
   * @example
   * ```typescript
   * const user = new User(EntityId.generate(), "张三", "zhangsan@example.com");
   * user.deactivate();
   * // 等待一段时间
   * console.log(user.getTimeSinceDeactivated()); // 失活后的毫秒数
   * ```
   */
  public getTimeSinceDeactivated(): number | null {
    if (this._deactivatedAt === null) {
      return null;
    }
    return Date.now() - this._deactivatedAt.getTime();
  }
}

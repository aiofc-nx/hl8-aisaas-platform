/**
 * @fileoverview 聚合根基类
 * @description 提供聚合根的基础功能，包括领域事件管理和业务一致性保证
 */

import { AuditableEntity } from "./auditable-entity.base.js";
import { EntityId } from "../value-objects/identifiers/entity-id.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- 用于文档示例代码
import { TenantId } from "../value-objects/identifiers/tenant-id.js";
import { UserId } from "../value-objects/identifiers/user-id.js";

/**
 * 领域事件接口
 * @description 所有领域事件必须实现此接口
 * @remarks
 * 领域事件用于在聚合内记录业务状态变化，支持事件驱动架构。
 * 领域事件应该：
 * - 是不可变的（immutable）
 * - 包含事件发生的时间戳
 * - 包含相关的业务数据
 * - 具有明确的类型标识
 */
export interface DomainEvent {
  /**
   * 事件类型
   * @description 事件的唯一标识符，用于事件路由和处理
   */
  readonly eventType: string;

  /**
   * 聚合根ID
   * @description 触发事件的聚合根标识符
   */
  readonly aggregateId: EntityId;

  /**
   * 事件发生时间
   * @description 事件被创建的时间戳
   */
  readonly occurredAt: Date;

  /**
   * 事件版本
   * @description 事件的版本号，用于事件溯源
   */
  readonly eventVersion: number;
}

/**
 * 聚合根基类
 * @description 所有聚合根的抽象基类，继承自AuditableEntity，添加了领域事件管理功能
 * @remarks
 * 聚合根（Aggregate Root）是领域驱动设计中的核心概念，具有以下特征：
 * - 是聚合的入口点，外部只能通过聚合根访问聚合内的实体
 * - 保证聚合内的业务一致性边界
 * - 管理聚合内的实体集合
 * - 发布领域事件以支持事件驱动架构
 * - 验证业务规则和不变量
 *
 * 领域事件功能：
 * - 记录聚合内的业务状态变化
 * - 支持事件溯源（Event Sourcing）
 * - 支持事件驱动架构（Event-Driven Architecture）
 * - 解耦领域逻辑和外部系统
 *
 * 使用场景：
 * - 作为所有聚合根的基类
 * - 需要保证业务一致性的聚合
 * - 需要发布领域事件的聚合
 * - 需要事件溯源的聚合
 *
 * 注意事项：
 * - 领域事件应该在聚合状态变化后添加
 * - 事件应该在聚合持久化后发布
 * - 发布事件后应该清除事件列表
 *
 * @example
 * ```typescript
 * // 定义领域事件
 * class UserCreatedEvent implements DomainEvent {
 *   readonly eventType = "UserCreated";
 *   readonly aggregateId: EntityId;
 *   readonly occurredAt: Date;
 *   readonly eventVersion = 1;
 *
 *   constructor(
 *     aggregateId: EntityId,
 *     public readonly email: string,
 *     public readonly username: string
 *   ) {
 *     this.aggregateId = aggregateId;
 *     this.occurredAt = new Date();
 *   }
 * }
 *
 * // 使用聚合根
 * class User extends AggregateRoot {
 *   private _email: string;
 *   private _username: string;
 *
 *   constructor(id: EntityId, email: string, username: string, createdBy: UserId) {
 *     super(id, undefined, undefined, undefined, undefined, createdBy);
 *     this._email = email;
 *     this._username = username;
 *
 *     // 发布领域事件
 *     this.addDomainEvent(
 *       new UserCreatedEvent(id, email, username)
 *     );
 *   }
 *
 *   updateEmail(newEmail: string, updatedBy: UserId): void {
 *     this._email = newEmail;
 *     this.markAsUpdated(updatedBy);
 *
 *     // 发布领域事件
 *     this.addDomainEvent(
 *       new UserEmailUpdatedEvent(this.id, newEmail)
 *     );
 *   }
 * }
 *
 * // 使用聚合根
 * const tenantId = TenantId.generate();
 * const creatorId = UserId.generate(tenantId);
 * const user = new User(EntityId.generate(), "test@example.com", "testuser", creatorId);
 *
 * // 获取领域事件
 * const events = user.getDomainEvents();
 * console.log(events.length); // 1
 *
 * // 发布事件后清除
 * await eventBus.publishAll(events);
 * user.clearDomainEvents();
 * ```
 */
export abstract class AggregateRoot extends AuditableEntity {
  /**
   * 领域事件列表
   * @description 聚合内积累的领域事件，用于后续发布
   */
  private _domainEvents: DomainEvent[] = [];

  /**
   * 创建聚合根
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
   * @description 初始化聚合根实例，继承自AuditableEntity的所有功能
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
    super(
      id,
      createdAt,
      updatedAt,
      version,
      deletedAt,
      createdBy,
      updatedBy,
      deletedBy,
      isActive,
      activatedAt,
      activatedBy,
      deactivatedAt,
      deactivatedBy,
    );
  }

  /**
   * 添加领域事件
   * @param event 要添加的领域事件
   * @description 将领域事件添加到聚合的事件列表中
   * @remarks
   * 领域事件应该在聚合状态变化后立即添加。
   * 事件会在聚合持久化后通过事件总线发布。
   *
   * 使用场景：
   * - 实体创建时
   * - 实体状态变更时
   * - 业务规则验证通过后
   *
   * 注意事项：
   * - 事件应该是不可变的
   * - 事件应该包含足够的信息供后续处理
   * - 避免在事件中包含过大的对象引用
   *
   * @example
   * ```typescript
   * class User extends AggregateRoot {
   *   activate(): void {
   *     super.activate();
   *     this.addDomainEvent(
   *       new UserActivatedEvent(this.id)
   *     );
   *   }
   * }
   * ```
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * 获取所有领域事件
   * @returns 聚合内积累的所有领域事件
   * @description 返回聚合内积累的所有领域事件，用于发布
   * @remarks
   * 此方法返回事件的副本，防止外部修改事件列表。
   * 事件应该在发布后通过 clearDomainEvents() 清除。
   *
   * 使用场景：
   * - 在应用层获取事件并发布
   * - 在Repository中保存事件（事件溯源）
   * - 在测试中验证事件
   *
   * @example
   * ```typescript
   * const user = new User(EntityId.generate(), "test@example.com", "testuser", creatorId);
   * const events = user.getDomainEvents();
   * await eventBus.publishAll(events);
   * user.clearDomainEvents();
   * ```
   */
  public getDomainEvents(): ReadonlyArray<DomainEvent> {
    return [...this._domainEvents];
  }

  /**
   * 清除所有领域事件
   * @description 清除聚合内积累的所有领域事件
   * @remarks
   * 事件应该在发布成功后清除，避免重复发布。
   * 清除事件是幂等操作，可以安全地多次调用。
   *
   * 使用场景：
   * - 事件发布成功后
   * - 聚合持久化后
   * - 测试重置时
   *
   * @example
   * ```typescript
   * const events = user.getDomainEvents();
   * await eventBus.publishAll(events);
   * user.clearDomainEvents(); // 发布后清除
   * ```
   */
  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * 检查是否有待发布的领域事件
   * @returns 如果有待发布的领域事件则返回true，否则返回false
   * @description 检查聚合内是否有积累的领域事件
   *
   * @example
   * ```typescript
   * const user = new User(EntityId.generate(), "test@example.com", "testuser", creatorId);
   * console.log(user.hasDomainEvents()); // true
   * user.clearDomainEvents();
   * console.log(user.hasDomainEvents()); // false
   * ```
   */
  public hasDomainEvents(): boolean {
    return this._domainEvents.length > 0;
  }

  /**
   * 获取领域事件数量
   * @returns 领域事件的数量
   * @description 返回聚合内积累的领域事件数量
   *
   * @example
   * ```typescript
   * const user = new User(EntityId.generate(), "test@example.com", "testuser", creatorId);
   * console.log(user.getDomainEventCount()); // 1
   * ```
   */
  public getDomainEventCount(): number {
    return this._domainEvents.length;
  }
}

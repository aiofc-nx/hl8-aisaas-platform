/**
 * @fileoverview 用户解锁领域事件
 * @description 当用户被解锁时发布此事件
 */

import { DomainEvent } from "@hl8/shared";
import { EntityId } from "@hl8/shared";

/**
 * 用户解锁领域事件
 * @description 表示用户被解锁的业务事件
 */
export class UserUnlockedEvent implements DomainEvent {
  readonly eventType = "UserUnlocked";
  readonly aggregateId: EntityId;
  readonly occurredAt: Date;
  readonly eventVersion = 1;

  /**
   * 用户ID
   */
  readonly userId: string;

  /**
   * 构造函数
   * @param aggregateId 聚合根ID
   * @param userId 用户ID
   */
  constructor(aggregateId: EntityId, userId: string) {
    this.aggregateId = aggregateId;
    this.userId = userId;
    this.occurredAt = new Date();
  }
}

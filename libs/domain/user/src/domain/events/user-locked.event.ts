/**
 * @fileoverview 用户锁定领域事件
 * @description 当用户被锁定时发布此事件
 */

import { DomainEvent } from "@hl8/shared";
import { EntityId } from "@hl8/shared";

/**
 * 用户锁定领域事件
 * @description 表示用户被锁定的业务事件
 */
export class UserLockedEvent implements DomainEvent {
  readonly eventType = "UserLocked";
  readonly aggregateId: EntityId;
  readonly occurredAt: Date;
  readonly eventVersion = 1;

  /**
   * 用户ID
   */
  readonly userId: string;

  /**
   * 锁定到期时间
   */
  readonly lockedUntil?: Date;

  /**
   * 锁定原因
   */
  readonly reason?: string;

  /**
   * 构造函数
   * @param aggregateId 聚合根ID
   * @param userId 用户ID
   * @param lockedUntil 锁定到期时间
   * @param reason 锁定原因
   */
  constructor(
    aggregateId: EntityId,
    userId: string,
    lockedUntil?: Date,
    reason?: string,
  ) {
    this.aggregateId = aggregateId;
    this.userId = userId;
    this.lockedUntil = lockedUntil;
    this.reason = reason;
    this.occurredAt = new Date();
  }
}

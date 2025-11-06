/**
 * @fileoverview 用户禁用领域事件
 * @description 当用户被禁用时发布此事件
 */

import { DomainEvent } from "@hl8/shared";
import { EntityId } from "@hl8/shared";

/**
 * 用户禁用领域事件
 * @description 表示用户被禁用的业务事件
 */
export class UserDisabledEvent implements DomainEvent {
  readonly eventType = "UserDisabled";
  readonly aggregateId: EntityId;
  readonly occurredAt: Date;
  readonly eventVersion = 1;

  /**
   * 用户ID
   */
  readonly userId: string;

  /**
   * 禁用原因
   */
  readonly reason?: string;

  /**
   * 构造函数
   * @param aggregateId 聚合根ID
   * @param userId 用户ID
   * @param reason 禁用原因
   */
  constructor(aggregateId: EntityId, userId: string, reason?: string) {
    this.aggregateId = aggregateId;
    this.userId = userId;
    this.reason = reason;
    this.occurredAt = new Date();
  }
}

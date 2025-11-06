/**
 * @fileoverview 用户密码重置领域事件
 * @description 当用户密码被重置时发布此事件（管理员操作）
 */

import { DomainEvent } from "@hl8/shared";
import { EntityId } from "@hl8/shared";

/**
 * 用户密码重置领域事件
 * @description 表示用户密码被重置的业务事件（管理员操作）
 */
export class UserPasswordResetEvent implements DomainEvent {
  readonly eventType = "UserPasswordReset";
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

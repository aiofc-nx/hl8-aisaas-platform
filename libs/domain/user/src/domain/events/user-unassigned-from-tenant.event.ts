/**
 * @fileoverview 用户从租户移除领域事件
 * @description 当用户从租户移除时发布此事件
 */

import { DomainEvent } from "@hl8/shared";
import { EntityId } from "@hl8/shared";

/**
 * 用户从租户移除领域事件
 * @description 表示用户从租户移除的业务事件
 */
export class UserUnassignedFromTenantEvent implements DomainEvent {
  readonly eventType = "UserUnassignedFromTenant";
  readonly aggregateId: EntityId;
  readonly occurredAt: Date;
  readonly eventVersion = 1;

  /**
   * 分配ID
   */
  readonly assignmentId: string;

  /**
   * 用户ID
   */
  readonly userId: string;

  /**
   * 租户ID
   */
  readonly tenantId: string;

  /**
   * 撤销原因
   */
  readonly reason?: string;

  /**
   * 构造函数
   * @param aggregateId 聚合根ID
   * @param assignmentId 分配ID
   * @param userId 用户ID
   * @param tenantId 租户ID
   * @param reason 撤销原因
   */
  constructor(
    aggregateId: EntityId,
    assignmentId: string,
    userId: string,
    tenantId: string,
    reason?: string,
  ) {
    this.aggregateId = aggregateId;
    this.assignmentId = assignmentId;
    this.userId = userId;
    this.tenantId = tenantId;
    this.reason = reason;
    this.occurredAt = new Date();
  }
}

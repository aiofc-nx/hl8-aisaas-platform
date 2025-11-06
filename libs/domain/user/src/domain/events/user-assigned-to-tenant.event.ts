/**
 * @fileoverview 用户分配到租户领域事件
 * @description 当用户被分配到租户时发布此事件
 */

import { DomainEvent } from "@hl8/shared";
import { EntityId } from "@hl8/shared";

/**
 * 用户分配到租户领域事件
 * @description 表示用户被分配到租户的业务事件
 */
export class UserAssignedToTenantEvent implements DomainEvent {
  readonly eventType = "UserAssignedToTenant";
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
   * 角色
   */
  readonly role: string;

  /**
   * 构造函数
   * @param aggregateId 聚合根ID
   * @param assignmentId 分配ID
   * @param userId 用户ID
   * @param tenantId 租户ID
   * @param role 角色
   */
  constructor(
    aggregateId: EntityId,
    assignmentId: string,
    userId: string,
    tenantId: string,
    role: string,
  ) {
    this.aggregateId = aggregateId;
    this.assignmentId = assignmentId;
    this.userId = userId;
    this.tenantId = tenantId;
    this.role = role;
    this.occurredAt = new Date();
  }
}

/**
 * @fileoverview 用户创建领域事件
 * @description 当用户被创建时发布此事件
 */

import { DomainEvent } from "@hl8/shared";
import { EntityId } from "@hl8/shared";

/**
 * 用户创建领域事件
 * @description 表示用户被创建的业务事件
 */
export class UserCreatedEvent implements DomainEvent {
  readonly eventType = "UserCreated";
  readonly aggregateId: EntityId;
  readonly occurredAt: Date;
  readonly eventVersion = 1;

  /**
   * 用户ID
   */
  readonly userId: string;

  /**
   * 邮箱地址
   */
  readonly email: string;

  /**
   * 用户名
   */
  readonly username: string;

  /**
   * 用户昵称（如果未提供则默认使用用户名）
   */
  readonly nickname: string;

  /**
   * 用户来源
   */
  readonly source: string;

  /**
   * 构造函数
   * @param aggregateId 聚合根ID
   * @param userId 用户ID
   * @param email 邮箱地址
   * @param username 用户名
   * @param nickname 用户昵称
   * @param source 用户来源
   */
  constructor(
    aggregateId: EntityId,
    userId: string,
    email: string,
    username: string,
    nickname: string,
    source: string,
  ) {
    this.aggregateId = aggregateId;
    this.userId = userId;
    this.email = email;
    this.username = username;
    this.nickname = nickname;
    this.source = source;
    this.occurredAt = new Date();
  }
}

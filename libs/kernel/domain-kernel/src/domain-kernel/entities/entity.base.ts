/**
 * @fileoverview 实体基类
 * @description 提供充血模型实体的基础功能，包含UUID标识符、相等性比较和哈希值计算
 */

import { EntityId } from "../value-objects/identifiers/entity-id.js";

/**
 * 实体基类
 * @description 所有领域实体的抽象基类，提供标识符、相等性比较和哈希值计算等基础功能
 * @remarks
 * 实体（Entity）是领域驱动设计中的核心概念，具有以下特征：
 * - 具有唯一标识符（EntityId）
 * - 通过标识符判断相等性，而不是通过值
 * - 具有生命周期，可以被创建、修改和删除
 * - 封装业务逻辑和不变性规则
 *
 * 使用场景：
 * - 作为所有领域实体的基类
 * - 需要唯一标识的业务对象
 * - 需要在集合中使用的实体（通过hashCode支持）
 *
 * @example
 * ```typescript
 * class User extends Entity {
 *   private _name: string;
 *   private _email: string;
 *
 *   constructor(id: EntityId, name: string, email: string) {
 *     super(id);
 *     this._name = name;
 *     this._email = email;
 *   }
 *
 *   get name(): string {
 *     return this._name;
 *   }
 *
 *   get email(): string {
 *     return this._email;
 *   }
 * }
 *
 * const user1 = new User(EntityId.generate(), "张三", "zhangsan@example.com");
 * const user2 = new User(user1.id, "李四", "lisi@example.com");
 * console.log(user1.equals(user2)); // false，因为ID不同
 * ```
 */
export abstract class Entity {
  /**
   * 实体标识符
   * @description 实体的唯一标识符，用于区分不同的实体实例
   */
  protected readonly _id: EntityId;

  /**
   * 创建实体
   * @param id 实体标识符，如果未提供则自动生成
   * @description 初始化实体实例，如果未提供ID则自动生成一个新的UUID
   */
  constructor(id?: EntityId) {
    this._id = id || EntityId.generate();
  }

  /**
   * 获取实体标识符
   * @returns 实体标识符
   * @description 返回实体的唯一标识符，用于外部访问和比较
   */
  public get id(): EntityId {
    return this._id;
  }

  /**
   * 比较两个实体是否相等
   * @param other 要比较的另一个实体
   * @returns 如果两个实体具有相同的ID则返回true，否则返回false
   * @description
   * 实体的相等性基于标识符（ID）而不是值。
   * 即使两个实体的所有属性值都相同，只要ID不同，它们就不相等。
   *
   * 使用场景：
   * - 在集合中查找实体
   * - 判断两个实体引用是否指向同一个实体
   * - 避免重复处理同一个实体
   *
   * @example
   * ```typescript
   * const user1 = new User(EntityId.generate(), "张三", "zhangsan@example.com");
   * const user2 = new User(user1.id, "李四", "lisi@example.com");
   * console.log(user1.equals(user2)); // true，因为ID相同
   *
   * const user3 = new User(EntityId.generate(), "张三", "zhangsan@example.com");
   * console.log(user1.equals(user3)); // false，因为ID不同，即使属性值相同
   * ```
   */
  public equals(other: Entity | null | undefined): boolean {
    if (!other) {
      return false;
    }

    if (!(other instanceof Entity)) {
      return false;
    }

    // 如果是同一个实例，直接返回true
    if (this === other) {
      return true;
    }

    // 基于ID比较相等性
    return this._id.equals(other._id);
  }

  /**
   * 获取实体的哈希值
   * @returns 基于ID计算的哈希值
   * @description
   * 返回基于实体ID计算的哈希值，用于在集合（Set、Map）中快速查找和比较。
   * 哈希值遵循以下规则：
   * - 相同ID的实体具有相同的哈希值
   * - 不同ID的实体具有不同的哈希值（在大多数情况下）
   *
   * 使用场景：
   * - 在Set中使用实体作为元素
   * - 在Map中使用实体作为键
   * - 优化集合查找性能
   *
   * @example
   * ```typescript
   * const user1 = new User(EntityId.generate(), "张三", "zhangsan@example.com");
   * const user2 = new User(user1.id, "李四", "lisi@example.com");
   *
   * const userSet = new Set<Entity>();
   * userSet.add(user1);
   * userSet.add(user2);
   * console.log(userSet.size); // 1，因为ID相同，被视为同一个实体
   *
   * console.log(user1.hashCode() === user2.hashCode()); // true
   * ```
   */
  public hashCode(): number {
    return this._id.hashCode();
  }

  /**
   * 转换为字符串表示
   * @returns 实体的字符串表示
   * @description 返回实体的字符串表示，默认返回ID的字符串形式
   */
  public toString(): string {
    return `${this.constructor.name}(${this._id.toString()})`;
  }

  /**
   * 转换为JSON表示
   * @returns 实体的JSON表示
   * @description 返回实体的JSON可序列化表示，默认只包含ID
   * @remarks
   * 子类可以重写此方法以包含更多属性。
   * 注意：此方法返回的是JSON可序列化的对象，不是JSON字符串。
   *
   * @example
   * ```typescript
   * class User extends Entity {
   *   private _name: string;
   *
   *   toJSON() {
   *     return {
   *       ...super.toJSON(),
   *       name: this._name
   *     };
   *   }
   * }
   * ```
   */
  public toJSON(): { id: string } {
    return {
      id: this._id.value,
    };
  }

  /**
   * 检查实体是否有效
   * @returns 实体是否有效
   * @description 检查实体的ID是否有效，用于验证实体是否已正确初始化
   */
  public isValid(): boolean {
    return this._id.isValid();
  }

  /**
   * 创建实体的副本
   * @returns 新的实体实例
   * @description 创建当前实体的浅拷贝，具有相同的ID
   * @remarks
   * 注意：此方法只复制ID，子类需要重写此方法以实现完整的克隆逻辑。
   * 由于Entity是抽象类，此方法主要用于类型定义，实际实现应由子类提供。
   *
   * @throws {Error} 如果子类未实现此方法则抛出错误
   */
  public clone(): Entity {
    throw new Error(`子类 ${this.constructor.name} 必须实现 clone() 方法`);
  }
}

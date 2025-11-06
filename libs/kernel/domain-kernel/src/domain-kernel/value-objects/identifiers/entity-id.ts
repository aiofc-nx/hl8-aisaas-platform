/**
 * @fileoverview 实体标识符值对象
 * @description 封装UUID v4标识符，提供唯一性验证和比较功能
 */

import { UuidGenerator } from "../../../utils/uuid-generator.js";

/**
 * 实体标识符值对象
 * @description 封装UUID v4标识符，提供不可变的值对象功能
 */
export class EntityId {
  private readonly _value: string;

  /**
   * 创建实体标识符
   * @param value UUID v4字符串，如果未提供则自动生成
   * @throws {Error} 当提供的值不是有效的UUID v4时抛出异常
   */
  constructor(value?: string) {
    this._value = this.validateAndGetValue(value, "实体");
  }

  /**
   * 获取标识符值
   * @returns UUID字符串
   */
  public get value(): string {
    return this._value;
  }

  /**
   * 比较两个实体标识符是否相等
   * @param other 要比较的另一个实体标识符
   * @returns 是否相等
   */
  public equals(other: EntityId | null | undefined): boolean {
    return other instanceof EntityId && this._value === other._value;
  }

  /**
   * 转换为字符串表示
   * @returns UUID字符串
   */
  public toString(): string {
    return this._value;
  }

  /**
   * 转换为JSON表示
   * @returns UUID字符串
   */
  public toJSON(): string {
    return this._value;
  }

  /**
   * 验证标识符是否有效
   * @returns 是否有效
   */
  public isValid(): boolean {
    return UuidGenerator.validate(this._value);
  }

  /**
   * 创建实体标识符的副本
   * @returns 新的实体标识符实例
   */
  public clone(): EntityId {
    return new EntityId(this._value);
  }

  /**
   * 从字符串创建实体标识符
   * @param value UUID字符串
   * @returns 实体标识符实例
   * @throws {Error} 当字符串不是有效的UUID时抛出异常
   */
  public static fromString(value: string): EntityId {
    return new EntityId(value);
  }

  /**
   * 生成新的实体标识符
   * @returns 新的实体标识符实例
   */
  public static generate(): EntityId {
    return new EntityId();
  }

  /**
   * 验证字符串是否为有效的实体标识符
   * @param value 要验证的字符串
   * @returns 是否为有效的实体标识符
   */
  public static isValid(value: string): boolean {
    return UuidGenerator.validate(value);
  }

  /**
   * 比较两个实体标识符
   * @param a 第一个实体标识符
   * @param b 第二个实体标识符
   * @returns 比较结果：负数表示a小于b，0表示相等，正数表示a大于b
   */
  public static compare(a: EntityId, b: EntityId): number {
    return a._value.localeCompare(b._value);
  }

  /**
   * 获取标识符的哈希值
   * @returns 哈希值
   */
  public hashCode(): number {
    return this.computeHashCode(this._value);
  }

  /**
   * 验证并获取UUID值
   * @param value 可选的UUID字符串
   * @param typeName 类型名称，用于错误消息
   * @returns 有效的UUID字符串
   * @throws {Error} 当提供的值不是有效的UUID时抛出异常
   */
  private validateAndGetValue(
    value: string | undefined,
    typeName: string,
  ): string {
    if (value !== undefined && value !== null) {
      if (!UuidGenerator.validate(value)) {
        throw new Error(`无效的${typeName}标识符格式: ${value}`);
      }
      return value;
    }
    return UuidGenerator.generate();
  }

  /**
   * 计算字符串的哈希值
   * @param str 要计算哈希值的字符串
   * @returns 哈希值
   */
  private computeHashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash;
  }
}

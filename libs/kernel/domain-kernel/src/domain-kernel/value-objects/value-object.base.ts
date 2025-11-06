/**
 * @fileoverview 值对象基类
 * @description 提供不可变值对象的基础功能，遵循值对象模式，支持简单和复合值对象
 */

/**
 * 值对象基类
 * @description 提供不可变值对象的基础功能，遵循领域驱动设计中的值对象模式
 * @remarks
 * 值对象（Value Object）是领域驱动设计中的核心概念，具有以下特征：
 * - **不可变性（Immutable）**：值对象创建后不可修改
 * - **相等性基于值（Value-based Equality）**：通过值比较而不是引用比较
 * - **无身份标识**：值对象没有唯一标识符，两个值相同的值对象被视为相等
 * - **自包含验证**：值对象封装业务规则和验证逻辑
 *
 * 使用场景：
 * - 简单值对象：Email、PhoneNumber、Money 等
 * - 复合值对象：Address、FullName 等
 * - 枚举值对象：UserStatus、OrderStatus 等
 * - 标识符值对象：EntityId、TenantId 等（虽然标识符通常独立实现）
 *
 * 设计原则：
 * - 保持简单：值对象应该是轻量级的，不包含不必要的元数据
 * - 性能优化：简单值对象直接返回值，复合值对象才深度克隆
 * - 可扩展性：提供钩子方法允许子类自定义行为
 * - 类型安全：通过泛型确保类型安全
 *
 * @template T 值对象的值的类型
 *
 * @example
 * ```typescript
 * // 简单值对象示例：Email
 * class Email extends ValueObject<string> {
 *   protected validateValue(value: string): void {
 *     if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
 *       throw new Error(`无效的邮箱格式: ${value}`);
 *     }
 *   }
 *
 *   protected normalizeValue(value: string): string {
 *     return value.trim().toLowerCase();
 *   }
 *
 *   clone(): Email {
 *     return new Email(this._value);
 *   }
 * }
 *
 * const email1 = new Email("  User@Example.COM  ");
 * const email2 = new Email("user@example.com");
 * console.log(email1.equals(email2)); // true（标准化后相等）
 * console.log(email1.value); // "user@example.com"
 * ```
 *
 * @example
 * ```typescript
 * // 复合值对象示例：Money
 * interface MoneyValue {
 *   amount: number;
 *   currency: string;
 * }
 *
 * class Money extends ValueObject<MoneyValue> {
 *   protected validateValue(value: MoneyValue): void {
 *     if (value.amount < 0) {
 *       throw new Error("金额不能为负数");
 *     }
 *     if (!value.currency || value.currency.length !== 3) {
 *       throw new Error("货币代码必须是3位字符");
 *     }
 *   }
 *
 *   protected compareValues(a: MoneyValue, b: MoneyValue): boolean {
 *     return a.amount === b.amount && a.currency === b.currency;
 *   }
 *
 *   clone(): Money {
 *     return new Money(this._value);
 *   }
 *
 *   add(other: Money): Money {
 *     if (this._value.currency !== other._value.currency) {
 *       throw new Error("不同货币不能相加");
 *     }
 *     return new Money({
 *       amount: this._value.amount + other._value.amount,
 *       currency: this._value.currency,
 *     });
 *   }
 * }
 * ```
 */
export abstract class ValueObject<T> {
  /**
   * 值对象的值
   * @description 不可变的值，子类通过 value getter 访问
   */
  protected readonly _value: T;

  /**
   * 创建值对象
   * @param value 值对象的值
   * @description 初始化值对象实例，执行验证和标准化
   * @throws {Error} 当值无效时抛出异常
   */
  constructor(value: T) {
    this.validateValue(value);
    this._value = this.normalizeValue(value);
  }

  /**
   * 获取值对象的值
   * @returns 值对象的值
   * @description
   * 对于简单值类型（string、number、boolean），直接返回原始值。
   * 对于复杂值类型（object、array），返回深度克隆以确保不可变性。
   *
   * 性能优化：
   * - 简单值类型：直接返回，无性能开销
   * - 复杂值类型：深度克隆，确保不可变性
   */
  public get value(): T {
    return this.cloneValue(this._value);
  }

  /**
   * 比较两个值对象是否相等
   * @param other 要比较的另一个值对象
   * @returns 是否相等
   * @description
   * 值对象的相等性比较规则：
   * 1. 必须是同一类型的值对象
   * 2. 值必须相等（通过 compareValues 方法比较）
   *
   * 使用场景：
   * - 在集合中查找值对象
   * - 判断两个值对象是否表示相同的值
   * - 避免重复处理相同的值
   *
   * @example
   * ```typescript
   * const email1 = new Email("user@example.com");
   * const email2 = new Email("user@example.com");
   * console.log(email1.equals(email2)); // true
   *
   * const email3 = new Email("admin@example.com");
   * console.log(email1.equals(email3)); // false
   * ```
   */
  public equals(other: ValueObject<T> | null | undefined): boolean {
    if (!other) {
      return false;
    }

    if (!(other instanceof ValueObject)) {
      return false;
    }

    if (this.constructor !== other.constructor) {
      return false;
    }

    return this.compareValues(this._value, other._value);
  }

  /**
   * 转换为字符串表示
   * @returns 字符串表示
   * @description 返回值对象的字符串表示，用于日志、调试等场景
   */
  public toString(): string {
    return this.serializeValue(this._value);
  }

  /**
   * 转换为JSON表示
   * @returns JSON可序列化的值
   * @description 返回值对象的值，用于JSON序列化
   * @remarks
   * 值对象的 toJSON 方法直接返回值本身，不包含元数据。
   * 这符合值对象的简单性原则，也便于序列化和反序列化。
   *
   * 如果需要自定义 JSON 格式，子类可以重写此方法。
   */
  public toJSON(): T {
    return this.cloneValue(this._value);
  }

  /**
   * 克隆值对象
   * @returns 新的值对象实例
   * @description 创建值对象的副本，具有相同的值
   * @remarks
   * 值对象的克隆用于创建新的实例，但保持值不变。
   * 子类必须实现此方法以创建正确类型的实例。
   */
  public abstract clone(): ValueObject<T>;

  /**
   * 获取值对象的哈希值
   * @returns 哈希值
   * @description 返回基于值计算的哈希值，用于在集合（Set、Map）中使用
   * @remarks
   * 哈希值遵循以下规则：
   * - 相同值的值对象具有相同的哈希值
   * - 不同值的值对象具有不同的哈希值（在大多数情况下）
   *
   * 使用场景：
   * - 在 Set 中使用值对象作为元素
   * - 在 Map 中使用值对象作为键
   * - 优化集合查找性能
   */
  public hashCode(): number {
    return this.calculateHashCode(this._value);
  }

  /**
   * 验证值是否有效
   * @param value 要验证的值
   * @throws {Error} 当值无效时抛出异常
   * @description 子类必须实现此方法以验证值的有效性
   * @remarks
   * 验证逻辑应该检查：
   * - 值的类型是否正确
   * - 值是否符合业务规则
   * - 值是否满足约束条件
   *
   * 验证失败时应该抛出描述性的错误消息。
   */
  protected abstract validateValue(value: T): void;

  /**
   * 标准化值
   * @param value 原始值
   * @returns 标准化后的值
   * @description 对值进行标准化处理，如去除空格、转小写等
   * @remarks
   * 默认实现直接返回原始值，子类可以重写此方法以实现标准化逻辑。
   *
   * 标准化示例：
   * - Email：转小写、去除空格
   * - PhoneNumber：去除空格、统一格式
   * - Money：保留精度
   */
  protected normalizeValue(value: T): T {
    return value;
  }

  /**
   * 比较两个值是否相等
   * @param a 第一个值
   * @param b 第二个值
   * @returns 是否相等
   * @description 比较两个值的相等性，默认使用深度比较
   * @remarks
   * 默认实现使用深度比较，适用于复合值对象。
   * 对于简单值对象，子类可以重写此方法以使用简单的相等性比较。
   *
   * 性能优化：
   * - 简单值类型：可以使用 === 比较
   * - 复合值类型：使用深度比较
   */
  protected compareValues(a: T, b: T): boolean {
    // 引用相等性快速检查
    if (a === b) {
      return true;
    }

    // null/undefined 检查
    if (a === null || b === null || a === undefined || b === undefined) {
      return a === b;
    }

    // 类型检查
    if (typeof a !== typeof b) {
      return false;
    }

    // 简单值类型比较
    if (
      typeof a === "string" ||
      typeof a === "number" ||
      typeof a === "boolean"
    ) {
      return a === b;
    }

    // 对象类型深度比较
    if (typeof a === "object") {
      return this.deepEquals(a, b);
    }

    return false;
  }

  /**
   * 深度比较两个值是否相等
   * @param a 第一个值
   * @param b 第二个值
   * @returns 是否相等
   * @description 递归比较对象和数组的深度相等性
   * @remarks
   * 此方法用于比较复合值对象（如包含多个字段的对象）。
   * 对于简单值对象，此方法不会被调用。
   */
  protected deepEquals(a: T, b: T): boolean {
    // 数组比较
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false;
      }
      for (let i = 0; i < a.length; i++) {
        if (!this.compareValues(a[i] as T, b[i] as T)) {
          return false;
        }
      }
      return true;
    }

    // Date 比较
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }

    // 对象比较
    if (typeof a === "object" && typeof b === "object" && a && b) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) {
        return false;
      }

      for (const key of keysA) {
        if (!keysB.includes(key)) {
          return false;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!this.compareValues((a as any)[key], (b as any)[key])) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  /**
   * 克隆值
   * @param value 要克隆的值
   * @returns 克隆后的值
   * @description 克隆值以确保不可变性，简单值类型直接返回，复杂值类型深度克隆
   * @remarks
   * 性能优化：
   * - 简单值类型（string、number、boolean）：直接返回，无开销
   * - 复杂值类型（object、array）：深度克隆，确保不可变性
   */
  protected cloneValue(value: T): T {
    // null/undefined 直接返回
    if (value === null || value === undefined) {
      return value;
    }

    // 简单值类型直接返回（不可变，无需克隆）
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return value;
    }

    // Date 克隆
    if (value instanceof Date) {
      return new Date(value.getTime()) as T;
    }

    // 数组深度克隆
    if (Array.isArray(value)) {
      return value.map((item) => this.cloneValue(item)) as T;
    }

    // 对象深度克隆
    if (typeof value === "object") {
      const cloned = {} as T;
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (cloned as any)[key] = this.cloneValue((value as any)[key]);
        }
      }
      return cloned;
    }

    return value;
  }

  /**
   * 序列化值
   * @param value 要序列化的值
   * @returns 序列化后的字符串
   * @description 将值转换为字符串表示，用于 toString 方法
   * @remarks
   * 序列化规则：
   * - 字符串：直接返回
   * - 数字/布尔值：转换为字符串
   * - 对象/数组：使用 JSON.stringify
   * - 其他：使用 String() 转换
   */
  protected serializeValue(value: T): string {
    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    if (value === null || value === undefined) {
      return String(value);
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  /**
   * 计算值的哈希码
   * @param value 要计算哈希码的值
   * @returns 哈希码
   * @description 计算值的哈希码，用于 hashCode 方法
   * @remarks
   * 默认实现基于序列化后的字符串计算哈希值。
   * 子类可以重写此方法以提供更高效的哈希计算。
   *
   * 哈希算法：使用字符串哈希算法（djb2 变体）
   */
  protected calculateHashCode(value: T): number {
    const str = this.serializeValue(value);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash;
  }
}

---
description: 领域内核组件使用指南和培训教程
---

# 领域内核组件使用指南

> **本文档是 `@hl8/shared` 包中 `domain-kernel` 组件的完整使用指南和培训教程**  
> 版本：1.0.0 | 最后更新：2025-01

---

## 📚 目录

1. [概述](#概述)
2. [快速开始](#快速开始)
3. [核心组件详解](#核心组件详解)
4. [使用示例](#使用示例)
5. [最佳实践](#最佳实践)
6. [常见问题](#常见问题)
7. [培训教程](#培训教程)

---

## 概述

### 什么是 Domain Kernel？

`domain-kernel` 是一套领域层通用组件库，基于领域驱动设计（DDD）和清洁架构（Clean Architecture）原则设计，旨在简化业务领域的开发工作。

### 核心价值

- ✅ **简化开发**：提供通用的基类和工具，减少重复代码
- ✅ **类型安全**：完整的 TypeScript 类型支持，编译时捕获错误
- ✅ **业务导向**：封装领域概念，让代码更贴近业务语言
- ✅ **多租户支持**：内置多租户和多层级数据隔离机制
- ✅ **审计追踪**：内置审计字段和用户追踪功能
- ✅ **领域事件**：支持领域事件和事件驱动架构

### 组件架构

```
domain-kernel/
├── entities/              # 实体基类
│   ├── entity.base.ts              # 实体基类（最基础）
│   ├── auditable-entity.base.ts    # 可审计实体（继承Entity）
│   ├── aggregate-root.base.ts      # 聚合根（继承AuditableEntity）
│   ├── tenant-aware-entity.base.ts # 租户感知实体（继承AuditableEntity）
│   └── multi-level-isolated-entity.base.ts  # 多层级隔离实体（继承TenantAwareEntity）
│
└── value-objects/         # 值对象
    ├── value-object.base.ts        # 值对象基类
    └── identifiers/                # 标识符值对象
        ├── entity-id.ts            # 实体标识符
        ├── tenant-id.ts            # 租户标识符
        ├── user-id.ts              # 用户标识符
        ├── organization-id.ts      # 组织标识符
        └── department-id.ts         # 部门标识符
```

### 继承关系图

```
Entity (基础实体)
  └── AuditableEntity (可审计实体)
      ├── AggregateRoot (聚合根)
      └── TenantAwareEntity (租户感知实体)
          └── MultiLevelIsolatedEntity (多层级隔离实体)
```

---

## 快速开始

### 安装

```bash
# 在项目中使用（已在 monorepo 中配置）
pnpm add @hl8/shared
```

### 基本导入

```typescript
import {
  // 实体基类
  Entity,
  AuditableEntity,
  AggregateRoot,
  TenantAwareEntity,
  MultiLevelIsolatedEntity,
  
  // 标识符
  EntityId,
  TenantId,
  UserId,
  OrganizationId,
  DepartmentId,
  
  // 值对象基类
  ValueObject,
} from "@hl8/shared";
```

### 最简单的实体示例

```typescript
import { Entity, EntityId } from "@hl8/shared";

class Product extends Entity {
  private _name: string;
  private _price: number;

  constructor(id: EntityId, name: string, price: number) {
    super(id);
    this._name = name;
    this._price = price;
  }

  get name(): string {
    return this._name;
  }

  get price(): number {
    return this._price;
  }
}

// 使用
const product = new Product(
  EntityId.generate(),
  "笔记本电脑",
  8999
);
```

---

## 核心组件详解

### 1. 实体基类（Entity）

**用途**：所有领域实体的最基础抽象基类

**特性**：
- ✅ 唯一标识符（EntityId）
- ✅ 相等性比较（基于ID）
- ✅ 哈希值计算（用于集合）
- ✅ 字符串表示

**适用场景**：
- 不需要审计追踪的简单实体
- 不需要多租户隔离的实体
- 作为其他实体基类的基础

**示例**：

```typescript
import { Entity, EntityId } from "@hl8/shared";

class Tag extends Entity {
  private _name: string;

  constructor(id: EntityId, name: string) {
    super(id);
    this._name = name;
  }

  get name(): string {
    return this._name;
  }

  clone(): Tag {
    return new Tag(this.id, this._name);
  }
}
```

### 2. 可审计实体（AuditableEntity）

**用途**：需要审计追踪的实体基类

**特性**：
- ✅ 继承 Entity 的所有功能
- ✅ 创建/更新时间（createdAt, updatedAt）
- ✅ 版本号（version，用于乐观锁）
- ✅ 用户追踪（createdBy, updatedBy, deletedBy）
- ✅ 软删除（deletedAt, deletedBy）
- ✅ 激活/失活状态（isActive, activatedAt, activatedBy, deactivatedAt, deactivatedBy）

**适用场景**：
- 需要记录创建和修改时间的实体
- 需要用户追踪的实体
- 需要软删除的实体
- 需要激活/失活状态的实体

**示例**：

```typescript
import { AuditableEntity, EntityId, UserId, TenantId } from "@hl8/shared";

class Article extends AuditableEntity {
  private _title: string;
  private _content: string;

  constructor(
    id: EntityId,
    title: string,
    content: string,
    createdBy: UserId
  ) {
    super(id, undefined, undefined, undefined, undefined, createdBy);
    this._title = title;
    this._content = content;
  }

  get title(): string {
    return this._title;
  }

  updateTitle(newTitle: string, updatedBy: UserId): void {
    this._title = newTitle;
    this.markAsUpdated(updatedBy); // 自动更新时间和版本号
  }

  clone(): Article {
    return new Article(
      this.id,
      this._title,
      this._content,
      this.createdBy || undefined
    );
  }
}
```

### 3. 聚合根（AggregateRoot）

**用途**：领域聚合的根实体，管理领域事件

**特性**：
- ✅ 继承 AuditableEntity 的所有功能
- ✅ 领域事件管理（addDomainEvent, getDomainEvents, clearDomainEvents）
- ✅ 保证聚合内业务一致性

**适用场景**：
- 聚合根实体
- 需要发布领域事件的实体
- 需要保证业务一致性的聚合

**示例**：

```typescript
import { AggregateRoot, EntityId, UserId, TenantId } from "@hl8/shared";

// 领域事件接口
interface DomainEvent {
  readonly eventType: string;
  readonly aggregateId: EntityId;
  readonly occurredAt: Date;
  readonly eventVersion: number;
}

// 订单创建事件
class OrderCreatedEvent implements DomainEvent {
  readonly eventType = "OrderCreated";
  readonly aggregateId: EntityId;
  readonly occurredAt: Date;
  readonly eventVersion = 1;

  constructor(
    aggregateId: EntityId,
    public readonly customerId: string,
    public readonly totalAmount: number
  ) {
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
  }
}

// 订单聚合根
class Order extends AggregateRoot {
  private _customerId: string;
  private _items: OrderItem[] = [];
  private _totalAmount: number = 0;

  constructor(
    id: EntityId,
    customerId: string,
    createdBy: UserId
  ) {
    super(id, undefined, undefined, undefined, undefined, createdBy);
    this._customerId = customerId;

    // 发布领域事件
    this.addDomainEvent(
      new OrderCreatedEvent(id, customerId, 0)
    );
  }

  addItem(item: OrderItem, updatedBy: UserId): void {
    this._items.push(item);
    this._totalAmount += item.price;
    this.markAsUpdated(updatedBy);

    // 发布领域事件
    this.addDomainEvent(
      new OrderItemAddedEvent(this.id, item.id, item.price)
    );
  }

  clone(): Order {
    // 聚合根通常不需要克隆
    throw new Error("聚合根不支持克隆");
  }
}
```

### 4. 租户感知实体（TenantAwareEntity）

**用途**：需要租户级数据隔离的实体

**特性**：
- ✅ 继承 AuditableEntity 的所有功能
- ✅ 租户ID（tenantId，必填，不可修改）
- ✅ 租户归属检查（belongsToTenant）

**适用场景**：
- 所有需要租户级隔离的业务实体
- 多租户SAAS平台的核心实体

**示例**：

```typescript
import { TenantAwareEntity, TenantId, UserId } from "@hl8/shared";

class Product extends TenantAwareEntity {
  private _name: string;
  private _price: number;

  constructor(
    tenantId: TenantId,
    name: string,
    price: number,
    createdBy: UserId
  ) {
    super(tenantId, undefined, undefined, undefined, undefined, undefined, createdBy);
    this._name = name;
    this._price = price;
  }

  get name(): string {
    return this._name;
  }

  get price(): number {
    return this._price;
  }

  clone(): Product {
    return new Product(
      this.tenantId,
      this._name,
      this._price,
      this.createdBy || undefined
    );
  }
}

// 使用
const tenantId = TenantId.generate();
const creatorId = UserId.generate(tenantId);
const product = new Product(tenantId, "笔记本电脑", 8999, creatorId);
```

### 5. 多层级隔离实体（MultiLevelIsolatedEntity）

**用途**：需要租户、组织、部门三级数据隔离的实体

**特性**：
- ✅ 继承 TenantAwareEntity 的所有功能
- ✅ 组织ID（organizationId，可选）
- ✅ 部门ID（departmentId，可选）
- ✅ 层级归属检查（belongsToOrganization, belongsToDepartment）

**适用场景**：
- 需要组织级隔离的业务实体（如用户、资源等）
- 需要部门级隔离的业务实体（如项目、任务等）

**示例**：

```typescript
import {
  MultiLevelIsolatedEntity,
  TenantId,
  OrganizationId,
  DepartmentId,
  UserId,
} from "@hl8/shared";

class Project extends MultiLevelIsolatedEntity {
  private _name: string;
  private _description: string;

  constructor(
    tenantId: TenantId,
    organizationId: OrganizationId | null,
    departmentId: DepartmentId | null,
    name: string,
    description: string,
    createdBy: UserId
  ) {
    super(
      tenantId,
      organizationId,
      departmentId,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      createdBy
    );
    this._name = name;
    this._description = description;
  }

  get name(): string {
    return this._name;
  }

  // 可以移动到其他组织
  moveToOrganization(
    organizationId: OrganizationId,
    updatedBy: UserId
  ): void {
    this.setOrganizationId(organizationId, updatedBy);
    this.setDepartmentId(null, updatedBy); // 清除部门
  }

  clone(): Project {
    return new Project(
      this.tenantId,
      this.organizationId,
      this.departmentId,
      this._name,
      this._description,
      this.createdBy || undefined
    );
  }
}
```

### 6. 值对象基类（ValueObject）

**用途**：所有值对象的抽象基类

**特性**：
- ✅ 不可变性
- ✅ 值相等性比较
- ✅ 哈希值计算
- ✅ 标准化支持
- ✅ 智能克隆（简单值直接返回，复合值深度克隆）

**适用场景**：
- Email、PhoneNumber 等简单值对象
- Money、Address 等复合值对象
- UserStatus 等枚举值对象

**示例**：

```typescript
import { ValueObject } from "@hl8/shared";

// 简单值对象：Email
class Email extends ValueObject<string> {
  protected validateValue(value: string): void {
    if (!value || typeof value !== "string") {
      throw new Error("邮箱地址不能为空");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      throw new Error(`无效的邮箱格式: ${value}`);
    }
  }

  protected normalizeValue(value: string): string {
    return value.trim().toLowerCase();
  }

  clone(): Email {
    return new Email(this._value);
  }
}

// 复合值对象：Money
interface MoneyValue {
  amount: number;
  currency: string;
}

class Money extends ValueObject<MoneyValue> {
  protected validateValue(value: MoneyValue): void {
    if (value.amount < 0) {
      throw new Error("金额不能为负数");
    }
    if (!value.currency || value.currency.length !== 3) {
      throw new Error("货币代码必须是3位字符");
    }
  }

  clone(): Money {
    return new Money(this._value);
  }

  add(other: Money): Money {
    if (this._value.currency !== other._value.currency) {
      throw new Error("不同货币不能相加");
    }
    return new Money({
      amount: this._value.amount + other._value.amount,
      currency: this._value.currency,
    });
  }
}
```

### 7. 标识符值对象

#### EntityId

**用途**：通用实体标识符（UUID v4）

**使用场景**：
- 实体的主键ID
- 不涉及业务关联的通用标识符

**示例**：

```typescript
import { EntityId } from "@hl8/shared";

const id = EntityId.generate();
const id2 = EntityId.fromString("123e4567-e89b-12d3-a456-426614174000");
console.log(id.equals(id2)); // false
```

#### TenantId

**用途**：租户标识符（UUID v4）

**使用场景**：
- 租户的唯一标识
- 多租户数据隔离

**示例**：

```typescript
import { TenantId } from "@hl8/shared";

const tenantId = TenantId.generate();
const tenantId2 = TenantId.fromString("123e4567-e89b-12d3-a456-426614174000");
```

#### UserId

**用途**：用户标识符（包含租户关联）

**使用场景**：
- 用户实体的唯一标识
- 审计追踪中的用户引用
- 需要知道用户所属租户的场景

**示例**：

```typescript
import { UserId, TenantId } from "@hl8/shared";

const tenantId = TenantId.generate();
const userId = UserId.generate(tenantId);
const userId2 = UserId.fromString(tenantId, "123e4567-e89b-12d3-a456-426614174000");

console.log(userId.belongsTo(tenantId)); // true
```

#### OrganizationId

**用途**：组织标识符（包含租户关联和层级关系）

**使用场景**：
- 组织的唯一标识
- 需要知道组织所属租户的场景
- 需要组织层级关系的场景

**示例**：

```typescript
import { OrganizationId, TenantId } from "@hl8/shared";

const tenantId = TenantId.generate();
const orgId = OrganizationId.generate(tenantId);
const parentOrgId = OrganizationId.generate(tenantId);
const childOrgId = OrganizationId.generate(tenantId, undefined, parentOrgId);

console.log(childOrgId.isDescendantOf(parentOrgId)); // true
```

#### DepartmentId

**用途**：部门标识符（包含组织关联和层级关系）

**使用场景**：
- 部门的唯一标识
- 需要知道部门所属组织的场景
- 需要部门层级关系的场景

**示例**：

```typescript
import { DepartmentId, OrganizationId, TenantId } from "@hl8/shared";

const tenantId = TenantId.generate();
const orgId = OrganizationId.generate(tenantId);
const deptId = DepartmentId.generate(orgId);
const parentDeptId = DepartmentId.generate(orgId);
const childDeptId = DepartmentId.generate(orgId, undefined, parentDeptId);

console.log(childDeptId.isDescendantOf(parentDeptId)); // true
```

---

## 使用示例

### 示例 1：创建用户实体（多层级隔离）

```typescript
import {
  MultiLevelIsolatedEntity,
  TenantId,
  OrganizationId,
  DepartmentId,
  UserId,
  Email,
} from "@hl8/shared";

class User extends MultiLevelIsolatedEntity {
  private _email: Email;
  private _name: string;

  constructor(
    tenantId: TenantId,
    organizationId: OrganizationId | null,
    departmentId: DepartmentId | null,
    email: Email,
    name: string,
    createdBy: UserId
  ) {
    super(
      tenantId,
      organizationId,
      departmentId,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      createdBy
    );
    this._email = email;
    this._name = name;
  }

  get email(): Email {
    return this._email;
  }

  get name(): string {
    return this._name;
  }

  updateName(newName: string, updatedBy: UserId): void {
    this._name = newName;
    this.markAsUpdated(updatedBy);
  }

  clone(): User {
    return new User(
      this.tenantId,
      this.organizationId,
      this.departmentId,
      this._email,
      this._name,
      this.createdBy || undefined
    );
  }
}

// 使用
const tenantId = TenantId.generate();
const orgId = OrganizationId.generate(tenantId);
const deptId = DepartmentId.generate(orgId);
const creatorId = UserId.generate(tenantId);
const email = new Email("user@example.com");

const user = new User(tenantId, orgId, deptId, email, "张三", creatorId);
```

### 示例 2：创建订单聚合根（领域事件）

```typescript
import { AggregateRoot, EntityId, UserId, TenantId } from "@hl8/shared";

interface OrderItem {
  id: EntityId;
  productId: EntityId;
  quantity: number;
  price: number;
}

class OrderCreatedEvent implements DomainEvent {
  readonly eventType = "OrderCreated";
  readonly aggregateId: EntityId;
  readonly occurredAt: Date;
  readonly eventVersion = 1;

  constructor(
    aggregateId: EntityId,
    public readonly customerId: string,
    public readonly totalAmount: number
  ) {
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
  }
}

class Order extends AggregateRoot {
  private _customerId: string;
  private _items: OrderItem[] = [];
  private _totalAmount: number = 0;

  constructor(
    id: EntityId,
    customerId: string,
    createdBy: UserId
  ) {
    super(id, undefined, undefined, undefined, undefined, createdBy);
    this._customerId = customerId;

    // 发布领域事件
    this.addDomainEvent(
      new OrderCreatedEvent(id, customerId, 0)
    );
  }

  addItem(item: OrderItem, updatedBy: UserId): void {
    this._items.push(item);
    this._totalAmount += item.price * item.quantity;
    this.markAsUpdated(updatedBy);

    // 发布领域事件
    this.addDomainEvent(
      new OrderItemAddedEvent(this.id, item.id, item.quantity)
    );
  }

  get items(): readonly OrderItem[] {
    return this._items;
  }

  get totalAmount(): number {
    return this._totalAmount;
  }

  clone(): Order {
    throw new Error("聚合根不支持克隆");
  }
}
```

### 示例 3：创建值对象（Email 和 Money）

```typescript
import { ValueObject } from "@hl8/shared";

// Email 值对象
class Email extends ValueObject<string> {
  protected validateValue(value: string): void {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error("邮箱地址不能为空");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      throw new Error(`无效的邮箱格式: ${trimmed}`);
    }
  }

  protected normalizeValue(value: string): string {
    return value.trim().toLowerCase();
  }

  clone(): Email {
    return new Email(this._value);
  }

  getDomain(): string {
    return this._value.split("@")[1];
  }
}

// Money 值对象
interface MoneyValue {
  amount: number;
  currency: string;
}

class Money extends ValueObject<MoneyValue> {
  protected validateValue(value: MoneyValue): void {
    if (value.amount < 0) {
      throw new Error("金额不能为负数");
    }
    if (!value.currency || value.currency.length !== 3) {
      throw new Error("货币代码必须是3位字符");
    }
  }

  clone(): Money {
    return new Money(this._value);
  }

  add(other: Money): Money {
    if (this._value.currency !== other._value.currency) {
      throw new Error("不同货币不能相加");
    }
    return new Money({
      amount: this._value.amount + other._value.amount,
      currency: this._value.currency,
    });
  }

  multiply(factor: number): Money {
    return new Money({
      amount: this._value.amount * factor,
      currency: this._value.currency,
    });
  }
}
```

---

## 最佳实践

### 1. 选择合适的基类

**决策树**：

```
需要领域事件？
├─ 是 → 使用 AggregateRoot
└─ 否 → 需要审计追踪？
    ├─ 是 → 需要多租户隔离？
    │   ├─ 是 → 需要多层级隔离？
    │   │   ├─ 是 → 使用 MultiLevelIsolatedEntity
    │   │   └─ 否 → 使用 TenantAwareEntity
    │   └─ 否 → 使用 AuditableEntity
    └─ 否 → 使用 Entity
```

### 2. 值对象 vs 实体

| 特征 | 值对象 | 实体 |
|------|--------|------|
| 身份标识 | 无 | 有（EntityId） |
| 相等性 | 基于值 | 基于ID |
| 可变性 | 不可变 | 可变 |
| 生命周期 | 无 | 有 |
| 使用场景 | Email、Money、Address | User、Order、Product |

### 3. 审计字段的使用

✅ **正确**：
```typescript
class Product extends TenantAwareEntity {
  updatePrice(newPrice: number, updatedBy: UserId): void {
    this._price = newPrice;
    this.markAsUpdated(updatedBy); // 自动更新时间和版本号
  }
}
```

❌ **错误**：
```typescript
class Product extends TenantAwareEntity {
  updatePrice(newPrice: number): void {
    this._price = newPrice;
    // 缺少 markAsUpdated，不会更新审计字段
  }
}
```

### 4. 多租户隔离

✅ **正确**：
```typescript
// 查询时包含租户ID
const products = await repository.findByTenant(tenantId);
```

❌ **错误**：
```typescript
// 缺少租户ID过滤
const products = await repository.findAll(); // 危险！可能泄露其他租户数据
```

### 5. 领域事件的使用

✅ **正确**：
```typescript
class Order extends AggregateRoot {
  addItem(item: OrderItem, updatedBy: UserId): void {
    this._items.push(item);
    this.markAsUpdated(updatedBy);
    
    // 在状态变化后发布事件
    this.addDomainEvent(new OrderItemAddedEvent(this.id, item.id));
  }
}
```

❌ **错误**：
```typescript
// 在构造函数外发布事件
order.addItem(item, updatedBy);
order.addDomainEvent(new OrderItemAddedEvent(...)); // 应该在 addItem 内部
```

### 6. 值对象的标准化

✅ **正确**：
```typescript
class Email extends ValueObject<string> {
  protected normalizeValue(value: string): string {
    return value.trim().toLowerCase(); // 标准化
  }
}
```

❌ **错误**：
```typescript
class Email extends ValueObject<string> {
  // 不标准化，可能导致 "User@Example.com" 和 "user@example.com" 被视为不同
}
```

---

## 常见问题

### Q1: 什么时候使用 Entity，什么时候使用 ValueObject？

**A**: 
- **Entity（实体）**：有唯一标识，需要跟踪生命周期，如 User、Order
- **ValueObject（值对象）**：无标识，通过值比较，如 Email、Money、Address

**判断标准**：
- 如果两个对象的值相同但被视为不同 → 使用 Entity
- 如果两个对象的值相同被视为相同 → 使用 ValueObject

### Q2: 为什么 TenantAwareEntity 的 tenantId 不可修改？

**A**: 租户ID是数据隔离的基础，修改租户ID会导致数据泄露风险。所有业务实体必须属于某个租户，且创建后不可更改。

### Q3: 什么时候需要实现 clone() 方法？

**A**: 
- **Entity**：必须实现（抽象方法）
- **AuditableEntity**：必须实现（继承自 Entity）
- **AggregateRoot**：通常不需要实现（可以抛出异常）
- **ValueObject**：必须实现（抽象方法）

### Q4: 如何使用领域事件？

**A**: 
1. 在聚合根中发布事件（使用 `addDomainEvent`）
2. 在应用层持久化聚合后发布事件
3. 发布后清除事件（使用 `clearDomainEvents`）

```typescript
// 应用层示例
const order = new Order(id, customerId, createdBy);
await orderRepository.save(order);

const events = order.getDomainEvents();
await eventBus.publishAll(events);
order.clearDomainEvents();
await orderRepository.save(order);
```

### Q5: 如何创建复合值对象？

**A**: 使用接口定义值类型，然后继承 `ValueObject<接口类型>`：

```typescript
interface AddressValue {
  street: string;
  city: string;
  zipCode: string;
  country: string;
}

class Address extends ValueObject<AddressValue> {
  protected validateValue(value: AddressValue): void {
    // 验证逻辑
  }
  
  clone(): Address {
    return new Address(this._value);
  }
}
```

### Q6: 为什么审计字段使用 UserId 而不是 EntityId？

**A**: 
- `UserId` 包含租户关联，便于基于租户过滤审计记录
- 语义更清晰，明确表示这是用户标识符
- 类型更安全，防止误用

---

## 培训教程

### 教程 1：创建第一个实体

**目标**：创建一个简单的产品实体

**步骤**：

1. **导入必要的类型**

```typescript
import { Entity, EntityId } from "@hl8/shared";
```

2. **创建 Product 实体**

```typescript
class Product extends Entity {
  private _name: string;
  private _price: number;

  constructor(id: EntityId, name: string, price: number) {
    super(id);
    this._name = name;
    this._price = price;
  }

  get name(): string {
    return this._name;
  }

  get price(): number {
    return this._price;
  }

  clone(): Product {
    return new Product(this.id, this._name, this._price);
  }
}
```

3. **使用实体**

```typescript
const product = new Product(
  EntityId.generate(),
  "笔记本电脑",
  8999
);

console.log(product.id.value); // UUID字符串
console.log(product.name); // "笔记本电脑"
```

**练习**：
- 添加 `updatePrice()` 方法
- 添加验证逻辑（价格不能为负数）

### 教程 2：创建可审计实体

**目标**：创建一个带审计追踪的产品实体

**步骤**：

1. **导入必要的类型**

```typescript
import { AuditableEntity, EntityId, UserId, TenantId } from "@hl8/shared";
```

2. **创建 AuditableProduct 实体**

```typescript
class AuditableProduct extends AuditableEntity {
  private _name: string;
  private _price: number;

  constructor(
    id: EntityId,
    name: string,
    price: number,
    createdBy: UserId
  ) {
    super(id, undefined, undefined, undefined, undefined, createdBy);
    this._name = name;
    this._price = price;
  }

  get name(): string {
    return this._name;
  }

  get price(): number {
    return this._price;
  }

  updatePrice(newPrice: number, updatedBy: UserId): void {
    if (newPrice < 0) {
      throw new Error("价格不能为负数");
    }
    this._price = newPrice;
    this.markAsUpdated(updatedBy); // 自动更新审计字段
  }

  clone(): AuditableProduct {
    return new AuditableProduct(
      this.id,
      this._name,
      this._price,
      this.createdBy || undefined
    );
  }
}
```

3. **使用实体**

```typescript
const tenantId = TenantId.generate();
const creatorId = UserId.generate(tenantId);
const product = new AuditableProduct(
  EntityId.generate(),
  "笔记本电脑",
  8999,
  creatorId
);

console.log(product.createdAt); // 创建时间
console.log(product.createdBy); // 创建者

const updaterId = UserId.generate(tenantId);
product.updatePrice(7999, updaterId);

console.log(product.updatedAt); // 更新时间
console.log(product.updatedBy); // 更新者
console.log(product.version); // 2（自动递增）
```

**练习**：
- 添加软删除功能
- 添加激活/失活功能

### 教程 3：创建多租户实体

**目标**：创建一个支持多租户隔离的产品实体

**步骤**：

1. **导入必要的类型**

```typescript
import {
  TenantAwareEntity,
  TenantId,
  UserId,
} from "@hl8/shared";
```

2. **创建 TenantProduct 实体**

```typescript
class TenantProduct extends TenantAwareEntity {
  private _name: string;
  private _price: number;

  constructor(
    tenantId: TenantId,
    name: string,
    price: number,
    createdBy: UserId
  ) {
    super(tenantId, undefined, undefined, undefined, undefined, undefined, createdBy);
    this._name = name;
    this._price = price;
  }

  get name(): string {
    return this._name;
  }

  get price(): number {
    return this._price;
  }

  belongsToTenant(tenantId: TenantId): boolean {
    return super.belongsToTenant(tenantId);
  }

  clone(): TenantProduct {
    return new TenantProduct(
      this.tenantId,
      this._name,
      this._price,
      this.createdBy || undefined
    );
  }
}
```

3. **使用实体**

```typescript
const tenantId = TenantId.generate();
const creatorId = UserId.generate(tenantId);

const product = new TenantProduct(
  tenantId,
  "笔记本电脑",
  8999,
  creatorId
);

// 验证租户归属
console.log(product.belongsToTenant(tenantId)); // true
```

**练习**：
- 创建查询方法，确保包含租户过滤
- 实现多租户数据隔离的 Repository

### 教程 4：创建值对象

**目标**：创建 Email 和 Money 值对象

**步骤**：

1. **创建 Email 值对象**

```typescript
import { ValueObject } from "@hl8/shared";

class Email extends ValueObject<string> {
  protected validateValue(value: string): void {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error("邮箱地址不能为空");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      throw new Error(`无效的邮箱格式: ${trimmed}`);
    }
  }

  protected normalizeValue(value: string): string {
    return value.trim().toLowerCase();
  }

  clone(): Email {
    return new Email(this._value);
  }

  getDomain(): string {
    return this._value.split("@")[1];
  }
}

// 使用
const email1 = new Email("  User@Example.COM  ");
const email2 = new Email("user@example.com");
console.log(email1.equals(email2)); // true（标准化后相等）
console.log(email1.value); // "user@example.com"
```

2. **创建 Money 值对象**

```typescript
interface MoneyValue {
  amount: number;
  currency: string;
}

class Money extends ValueObject<MoneyValue> {
  protected validateValue(value: MoneyValue): void {
    if (value.amount < 0) {
      throw new Error("金额不能为负数");
    }
    if (!value.currency || value.currency.length !== 3) {
      throw new Error("货币代码必须是3位字符");
    }
  }

  clone(): Money {
    return new Money(this._value);
  }

  add(other: Money): Money {
    if (this._value.currency !== other._value.currency) {
      throw new Error("不同货币不能相加");
    }
    return new Money({
      amount: this._value.amount + other._value.amount,
      currency: this._value.currency,
    });
  }
}

// 使用
const money1 = new Money({ amount: 100, currency: "USD" });
const money2 = new Money({ amount: 50, currency: "USD" });
const total = money1.add(money2);
console.log(total.value); // { amount: 150, currency: "USD" }
```

**练习**：
- 添加 `subtract()` 方法
- 添加 `multiply()` 方法
- 添加货币转换功能

### 教程 5：创建聚合根（领域事件）

**目标**：创建一个订单聚合根，支持领域事件

**步骤**：

1. **定义领域事件**

```typescript
import { EntityId } from "@hl8/shared";

interface DomainEvent {
  readonly eventType: string;
  readonly aggregateId: EntityId;
  readonly occurredAt: Date;
  readonly eventVersion: number;
}

class OrderCreatedEvent implements DomainEvent {
  readonly eventType = "OrderCreated";
  readonly aggregateId: EntityId;
  readonly occurredAt: Date;
  readonly eventVersion = 1;

  constructor(
    aggregateId: EntityId,
    public readonly customerId: string
  ) {
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
  }
}
```

2. **创建 Order 聚合根**

```typescript
import { AggregateRoot, EntityId, UserId, TenantId } from "@hl8/shared";

class Order extends AggregateRoot {
  private _customerId: string;
  private _items: OrderItem[] = [];
  private _totalAmount: number = 0;

  constructor(
    id: EntityId,
    customerId: string,
    createdBy: UserId
  ) {
    super(id, undefined, undefined, undefined, undefined, createdBy);
    this._customerId = customerId;

    // 发布领域事件
    this.addDomainEvent(new OrderCreatedEvent(id, customerId));
  }

  addItem(item: OrderItem, updatedBy: UserId): void {
    this._items.push(item);
    this._totalAmount += item.price * item.quantity;
    this.markAsUpdated(updatedBy);

    // 发布领域事件
    this.addDomainEvent(
      new OrderItemAddedEvent(this.id, item.id, item.quantity)
    );
  }

  clone(): Order {
    throw new Error("聚合根不支持克隆");
  }
}
```

3. **使用聚合根和事件**

```typescript
const tenantId = TenantId.generate();
const creatorId = UserId.generate(tenantId);
const order = new Order(EntityId.generate(), "customer-123", creatorId);

// 获取领域事件
const events = order.getDomainEvents();
console.log(events.length); // 1
console.log(events[0].eventType); // "OrderCreated"

// 发布事件后清除
await eventBus.publishAll(events);
order.clearDomainEvents();
```

**练习**：
- 添加 `removeItem()` 方法并发布事件
- 添加订单状态变更事件
- 实现订单取消功能

### 教程 6：完整业务场景示例

**目标**：创建一个完整的用户管理模块

**场景**：创建用户实体，支持多租户、多层级隔离、审计追踪

**完整代码**：

```typescript
import {
  MultiLevelIsolatedEntity,
  TenantId,
  OrganizationId,
  DepartmentId,
  UserId,
} from "@hl8/shared";
import { Email } from "./value-objects/email.js";

class User extends MultiLevelIsolatedEntity {
  private _email: Email;
  private _name: string;
  private _phoneNumber: string | null = null;

  constructor(
    tenantId: TenantId,
    organizationId: OrganizationId | null,
    departmentId: DepartmentId | null,
    email: Email,
    name: string,
    createdBy: UserId
  ) {
    super(
      tenantId,
      organizationId,
      departmentId,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      createdBy
    );
    this._email = email;
    this._name = name;
  }

  get email(): Email {
    return this._email;
  }

  get name(): string {
    return this._name;
  }

  get phoneNumber(): string | null {
    return this._phoneNumber;
  }

  updateName(newName: string, updatedBy: UserId): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error("用户名不能为空");
    }
    this._name = newName;
    this.markAsUpdated(updatedBy);
  }

  updatePhoneNumber(phoneNumber: string, updatedBy: UserId): void {
    // 验证电话号码格式
    if (phoneNumber && !/^1[3-9]\d{9}$/.test(phoneNumber)) {
      throw new Error("无效的手机号码格式");
    }
    this._phoneNumber = phoneNumber;
    this.markAsUpdated(updatedBy);
  }

  moveToDepartment(
    departmentId: DepartmentId,
    updatedBy: UserId
  ): void {
    if (!this.organizationId) {
      throw new Error("用户必须先属于某个组织");
    }
    if (!departmentId.belongsTo(this.organizationId)) {
      throw new Error("部门必须属于用户所在的组织");
    }
    this.setDepartmentId(departmentId, updatedBy);
  }

  clone(): User {
    return new User(
      this.tenantId,
      this.organizationId,
      this.departmentId,
      this._email,
      this._name,
      this.createdBy || undefined
    );
  }
}

// 使用示例
const tenantId = TenantId.generate();
const orgId = OrganizationId.generate(tenantId);
const deptId = DepartmentId.generate(orgId);
const creatorId = UserId.generate(tenantId);
const email = new Email("user@example.com");

const user = new User(
  tenantId,
  orgId,
  deptId,
  email,
  "张三",
  creatorId
);

// 更新用户信息
const updaterId = UserId.generate(tenantId);
user.updateName("李四", updaterId);
user.updatePhoneNumber("13800138000", updaterId);

// 移动到其他部门
const newDeptId = DepartmentId.generate(orgId);
user.moveToDepartment(newDeptId, updaterId);
```

---

## 总结

### 组件选择指南

| 需求 | 选择的基类 |
|------|-----------|
| 简单实体，无需审计 | `Entity` |
| 需要审计追踪 | `AuditableEntity` |
| 需要领域事件 | `AggregateRoot` |
| 需要租户隔离 | `TenantAwareEntity` |
| 需要多层级隔离 | `MultiLevelIsolatedEntity` |
| 值对象 | `ValueObject<T>` |

### 关键原则

1. ✅ **选择合适的基类**：根据业务需求选择最合适的基类
2. ✅ **实现 clone() 方法**：所有实体必须实现 clone() 方法
3. ✅ **使用 markAsUpdated()**：修改实体状态时调用此方法
4. ✅ **多租户隔离**：所有业务实体都应该支持租户隔离
5. ✅ **值对象标准化**：实现 normalizeValue() 确保值的一致性
6. ✅ **领域事件**：聚合根中在状态变化后发布事件

### 下一步

- 📖 阅读 [多租户数据隔离技术方案](../multi-tenant/multi-tenant-data-isolation-technical-solution.md)
- 📖 阅读 [用户领域设计文档](../domain/user-domain-design.md)
- 💻 实践：完成所有培训教程练习
- 🧪 测试：为你的实体编写单元测试

---

**有问题？** 请查看[常见问题](#常见问题)部分或联系团队。


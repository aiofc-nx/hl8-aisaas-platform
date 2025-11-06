---
description: 领域内核组件快速参考卡片
---

# 领域内核组件快速参考

> **快速查找常用API和方法**

---

## 📦 导入

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
  
  // 值对象
  ValueObject,
} from "@hl8/shared";
```

---

## 🏗️ 实体基类继承关系

```
Entity
  └── AuditableEntity
      ├── AggregateRoot
      └── TenantAwareEntity
          └── MultiLevelIsolatedEntity
```

---

## 🔧 常用方法速查

### Entity（基础实体）

```typescript
class MyEntity extends Entity {
  constructor(id?: EntityId) {
    super(id); // 自动生成ID
  }
  
  // 必须实现
  clone(): MyEntity { }
}

// 常用方法
entity.id           // EntityId
entity.equals(other) // boolean
entity.hashCode()    // number
entity.toString()    // string
entity.toJSON()      // { id: string }
entity.isValid()     // boolean
```

### AuditableEntity（可审计实体）

```typescript
class MyEntity extends AuditableEntity {
  constructor(
    id?: EntityId,
    createdAt?: Date,
    updatedAt?: Date,
    version?: number,
    deletedAt?: Date | null,
    createdBy?: UserId | null,
    updatedBy?: UserId | null,
    deletedBy?: UserId | null,
    isActive?: boolean,
    activatedAt?: Date,
    activatedBy?: UserId | null,
    deactivatedAt?: Date | null,
    deactivatedBy?: UserId | null,
  ) {
    super(id, createdAt, updatedAt, version, deletedAt, 
          createdBy, updatedBy, deletedBy, isActive,
          activatedAt, activatedBy, deactivatedAt, deactivatedBy);
  }
  
  // 常用方法
  markAsUpdated(updatedBy?: UserId | null): void
  softDelete(deletedBy?: UserId | null): void
  restore(restoredBy?: UserId | null): void
  activate(activatedBy?: UserId | null): void
  deactivate(deactivatedBy?: UserId | null): void
  
  // 属性
  createdAt, updatedAt, version
  createdBy, updatedBy, deletedBy
  isActive(), activatedAt, activatedBy
  deactivatedAt, deactivatedBy
  deletedAt, isDeleted()
}
```

### AggregateRoot（聚合根）

```typescript
class MyAggregate extends AggregateRoot {
  // 领域事件管理
  addDomainEvent(event: DomainEvent): void
  getDomainEvents(): DomainEvent[]
  clearDomainEvents(): void
  hasDomainEvents(): boolean
  getDomainEventCount(): number
}
```

### TenantAwareEntity（租户感知实体）

```typescript
class MyEntity extends TenantAwareEntity {
  constructor(
    tenantId: TenantId,  // 必填
    id?: EntityId,
    // ... 其他审计字段
  ) {
    super(tenantId, id, ...);
  }
  
  // 常用方法
  tenantId                    // TenantId
  belongsToTenant(tenantId)   // boolean
}
```

### MultiLevelIsolatedEntity（多层级隔离实体）

```typescript
class MyEntity extends MultiLevelIsolatedEntity {
  constructor(
    tenantId: TenantId,                    // 必填
    organizationId?: OrganizationId | null, // 可选
    departmentId?: DepartmentId | null,      // 可选
    // ... 其他审计字段
  ) {
    super(tenantId, organizationId, departmentId, ...);
  }
  
  // 常用方法
  organizationId, departmentId
  setOrganizationId(orgId, updatedBy?)
  setDepartmentId(deptId, updatedBy?)
  clearOrganization(updatedBy?)
  clearDepartment(updatedBy?)
  belongsToOrganization(orgId)    // boolean
  belongsToDepartment(deptId)     // boolean
  belongsToOrganizationAndDepartment(orgId, deptId)  // boolean
  hasOrganization(), hasDepartment()
}
```

### ValueObject（值对象基类）

```typescript
class MyValueObject extends ValueObject<T> {
  constructor(value: T) {
    super(value); // 自动验证和标准化
  }
  
  // 必须实现
  protected validateValue(value: T): void
  clone(): MyValueObject
  
  // 可选重写
  protected normalizeValue(value: T): T
  protected compareValues(a: T, b: T): boolean
  protected calculateHashCode(value: T): number
  
  // 常用方法
  value                      // T（智能克隆）
  equals(other)              // boolean
  hashCode()                 // number
  toString()                 // string
  toJSON()                   // T
}
```

---

## 🆔 标识符速查

### EntityId（通用标识符）

```typescript
const id = EntityId.generate();
const id2 = EntityId.fromString("uuid-string");
EntityId.isValid("uuid-string"); // boolean

id.value        // string
id.equals(other) // boolean
id.hashCode()    // number
id.toString()    // string
id.toJSON()      // string
id.isValid()     // boolean
id.clone()       // EntityId
EntityId.compare(a, b) // number
```

### TenantId（租户标识符）

```typescript
const tenantId = TenantId.generate();
const tenantId2 = TenantId.fromString("uuid-string");
TenantId.isValid("uuid-string"); // boolean

// API 与 EntityId 相同
```

### UserId（用户标识符）

```typescript
const tenantId = TenantId.generate();
const userId = UserId.generate(tenantId);
const userId2 = UserId.fromString(tenantId, "uuid-string");

userId.value        // string
userId.tenantId     // TenantId
userId.belongsTo(tenantId) // boolean
// 其他 API 与 EntityId 相同
```

### OrganizationId（组织标识符）

```typescript
const tenantId = TenantId.generate();
const orgId = OrganizationId.generate(tenantId);
const parentOrgId = OrganizationId.generate(tenantId);
const childOrgId = OrganizationId.generate(tenantId, undefined, parentOrgId);

orgId.value              // string
orgId.tenantId           // TenantId
orgId.parentId           // OrganizationId | undefined
orgId.belongsTo(tenantId)      // boolean
orgId.isAncestorOf(other)      // boolean
orgId.isDescendantOf(other)     // boolean
// 其他 API...
```

### DepartmentId（部门标识符）

```typescript
const orgId = OrganizationId.generate(tenantId);
const deptId = DepartmentId.generate(orgId);
const parentDeptId = DepartmentId.generate(orgId);
const childDeptId = DepartmentId.generate(orgId, undefined, parentDeptId);

deptId.value                    // string
deptId.organizationId           // OrganizationId
deptId.parentId                 // DepartmentId | undefined
deptId.belongsTo(organizationId)     // boolean
deptId.belongsToTenant(tenantId)     // boolean
deptId.isAncestorOf(other)           // boolean
deptId.isDescendantOf(other)         // boolean
// 其他 API...
```

---

## 📋 决策树

### 选择实体基类

```
需要领域事件？
├─ 是 → AggregateRoot
└─ 否 → 需要审计追踪？
    ├─ 是 → 需要多租户隔离？
    │   ├─ 是 → 需要多层级隔离？
    │   │   ├─ 是 → MultiLevelIsolatedEntity
    │   │   └─ 否 → TenantAwareEntity
    │   └─ 否 → AuditableEntity
    └─ 否 → Entity
```

### 选择值对象 vs 实体

```
有唯一标识？
├─ 是 → Entity
└─ 否 → 通过值比较相等？
    ├─ 是 → ValueObject
    └─ 否 → Entity
```

---

## ⚡ 常用模式

### 模式 1：更新实体状态

```typescript
class Product extends TenantAwareEntity {
  updatePrice(newPrice: number, updatedBy: UserId): void {
    if (newPrice < 0) throw new Error("价格不能为负数");
    this._price = newPrice;
    this.markAsUpdated(updatedBy); // ✅ 必须调用
  }
}
```

### 模式 2：创建值对象

```typescript
class Email extends ValueObject<string> {
  protected validateValue(value: string): void {
    // 验证逻辑
  }
  
  protected normalizeValue(value: string): string {
    return value.trim().toLowerCase(); // ✅ 标准化
  }
  
  clone(): Email {
    return new Email(this._value);
  }
}
```

### 模式 3：发布领域事件

```typescript
class Order extends AggregateRoot {
  addItem(item: OrderItem, updatedBy: UserId): void {
    this._items.push(item);
    this.markAsUpdated(updatedBy);
    
    // ✅ 在状态变化后发布事件
    this.addDomainEvent(new OrderItemAddedEvent(this.id, item.id));
  }
}
```

### 模式 4：多租户查询

```typescript
// ✅ 正确：包含租户ID
const products = await repository.findByTenant(tenantId);

// ❌ 错误：缺少租户过滤
const products = await repository.findAll(); // 危险！
```

---

## 🎯 最佳实践检查清单

创建实体时：

- [ ] 选择了正确的基类
- [ ] 实现了 `clone()` 方法
- [ ] 所有修改方法都调用了 `markAsUpdated(updatedBy)`
- [ ] 添加了必要的业务验证
- [ ] 多租户实体包含了 `tenantId` 参数

创建值对象时：

- [ ] 实现了 `validateValue()` 方法
- [ ] 实现了 `clone()` 方法
- [ ] 实现了 `normalizeValue()` 方法（如需要）
- [ ] 值对象是不可变的

使用聚合根时：

- [ ] 在状态变化后发布领域事件
- [ ] 在持久化后发布和清除事件
- [ ] 事件包含了必要的业务数据

---

## 🔗 相关文档

- 📖 [完整使用指南](./domain-kernel-usage-guide.md)
- 📖 [多租户数据隔离方案](../multi-tenant/multi-tenant-data-isolation-technical-solution.md)
- 📖 [用户领域设计](../domain/user-domain-design.md)

---

**最后更新**：2025-01


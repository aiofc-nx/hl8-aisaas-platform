# Domain Kernel 文档

欢迎使用领域内核组件库！本文档目录包含 `@hl8/shared` 包中 `domain-kernel` 组件的完整文档和培训教程。

## 📚 文档导航

### 主要文档

1. **[使用指南和培训教程](./domain-kernel-usage-guide.md)** 📖
   - 完整的组件使用指南
   - 详细的API说明
   - 实战示例代码
   - 6个培训教程
   - 最佳实践和常见问题

2. **[快速参考卡片](./domain-kernel-quick-reference.md)** ⚡
   - 常用API速查
   - 决策树
   - 常用模式
   - 最佳实践检查清单

## 🚀 快速开始

```typescript
import {
  Entity,
  AuditableEntity,
  TenantAwareEntity,
  EntityId,
  TenantId,
  UserId,
  ValueObject,
} from "@hl8/shared";

// 创建简单实体
class Product extends Entity {
  constructor(id: EntityId, name: string) {
    super(id);
    this._name = name;
  }
  
  clone(): Product {
    return new Product(this.id, this._name);
  }
}

// 创建值对象
class Email extends ValueObject<string> {
  protected validateValue(value: string): void {
    // 验证逻辑
  }
  
  clone(): Email {
    return new Email(this._value);
  }
}
```

## 📖 推荐阅读顺序

1. **新手**：
   - 阅读 [使用指南 - 概述章节](./domain-kernel-usage-guide.md#概述)
   - 完成 [教程 1：创建第一个实体](./domain-kernel-usage-guide.md#教程-1创建第一个实体)
   - 完成 [教程 2：创建可审计实体](./domain-kernel-usage-guide.md#教程-2创建可审计实体)

2. **进阶**：
   - 阅读 [核心组件详解](./domain-kernel-usage-guide.md#核心组件详解)
   - 完成所有培训教程
   - 阅读 [最佳实践](./domain-kernel-usage-guide.md#最佳实践)

3. **参考**：
   - 使用 [快速参考卡片](./domain-kernel-quick-reference.md) 查找API
   - 查看 [常见问题](./domain-kernel-usage-guide.md#常见问题)

## 🔗 相关文档

- [多租户数据隔离技术方案](../multi-tenant/multi-tenant-data-isolation-technical-solution.md)
- [用户领域设计文档](../domain/user-domain-design.md)
- [术语定义](../definition-of-terms.md)

---

**有问题？** 请查看使用指南中的[常见问题](./domain-kernel-usage-guide.md#常见问题)部分。


# Research: 用户领域模型开发

**Feature**: 用户领域模型开发  
**Date**: 2025-01-27  
**Phase**: 0 - Outline & Research

## Research Objectives

1. 验证 domain-kernel 组件库的可用性和合理性
2. 研究 DDD 中用户领域模型的最佳实践
3. 确定领域事件的设计模式
4. 确定 Repository 接口的设计模式
5. 确定值对象的验证和标准化规则

## Research Findings

### 1. Domain-Kernel 组件库使用

**Decision**: 使用 `@hl8/shared` 的 `domain-kernel` 组件库作为基础

**Rationale**: 
- `domain-kernel` 提供了完整的 DDD 基础组件（Entity、AggregateRoot、AuditableEntity、ValueObject）
- 提供了多租户支持的基类（TenantAwareEntity、MultiLevelIsolatedEntity）
- 提供了完整的标识符值对象（EntityId、TenantId、UserId、OrganizationId、DepartmentId）
- 提供了审计追踪和领域事件支持
- 符合项目技术栈要求（TypeScript + NodeNext）

**Alternatives Considered**:
- 不使用 domain-kernel，自行实现基础组件：被拒绝，因为会重复造轮子，且不符合项目统一标准
- 使用其他 DDD 框架：被拒绝，因为项目已有 domain-kernel，应保持一致性

**References**:
- `docs/domain-kernel/domain-kernel-usage-guide.md`
- `docs/domain-kernel/domain-kernel-quick-reference.md`
- `libs/shared/src/domain-kernel/`

### 2. 用户领域模型设计模式

**Decision**: 采用聚合根 + 值对象 + 领域服务的标准 DDD 模式

**Rationale**:
- User 作为聚合根，管理用户的基础身份信息和生命周期
- UserTenantAssignment、UserOrganizationAssignment、UserDepartmentAssignment 作为独立的聚合根，管理分配关系
- Email、UserStatus、UserSource、Username、PasswordHash 作为值对象，封装业务规则
- UserAssignmentDomainService、UserValidationDomainService 作为领域服务，处理跨聚合的业务逻辑

**Alternatives Considered**:
- 将所有分配关系放在 User 聚合根中：被拒绝，因为违反了聚合边界，会导致聚合过大和性能问题
- 将值对象的验证逻辑放在实体中：被拒绝，因为违反了值对象的封装原则

**References**:
- `docs/domain/user-domain-design.md`
- DDD 最佳实践：聚合根应保持小而内聚

### 2.1. User 聚合根的标识符设计

**Decision**: User 聚合根使用 `UserId` 作为标识符，而不是通用的 `EntityId`

**Rationale**:
- `UserId` 包含租户信息（`tenantId`），确保多租户数据隔离
- 即使用户是平台级别的，也需要租户上下文来确保数据安全和隔离
- 创建用户时必须提供 `tenantId`，保证所有用户都有明确的租户归属
- Repository 接口使用 `UserId` 进行查询，确保数据隔离

**实现细节**:
- User 内部存储 `_userId: UserId` 作为业务标识符
- 为了兼容 `AggregateRoot` 基类要求，从 `UserId.value` 创建 `EntityId` 传给基类
- 提供 `getId(): UserId` 方法返回业务层面的用户ID
- 提供 `getTenantId(): TenantId` 方法方便获取租户ID
- `createPlatformUser` 和 `createSystemUser` 都要求传入 `tenantId` 参数

**Alternatives Considered**:
- 使用 `EntityId` 作为 User.id，Repository 使用 `EntityId`：被拒绝，因为无法保证多租户数据隔离
- 使用 `EntityId` 作为 User.id，Repository 使用 `UserId`：被拒绝，因为会导致类型不一致

**References**:
- `libs/shared/src/domain-kernel/value-objects/identifiers/user-id.ts`
- 多租户数据隔离技术方案文档

### 3. 领域事件设计模式

**Decision**: 使用 AggregateRoot 基类提供的领域事件机制

**Rationale**:
- `AggregateRoot` 基类提供了 `addDomainEvent()`、`getDomainEvents()`、`clearDomainEvents()` 方法
- 领域事件在聚合根内部创建，在应用层持久化后发布
- 事件应该是不变的（immutable）值对象

**Alternatives Considered**:
- 使用事件总线直接在领域层发布事件：被拒绝，因为违反了依赖方向（领域层不应依赖基础设施层）
- 使用第三方事件框架：被拒绝，因为 domain-kernel 已提供事件机制

**Event Types**:
- UserCreatedEvent
- UserActivatedEvent
- UserDisabledEvent
- UserLockedEvent
- UserUnlockedEvent
- UserPasswordChangedEvent
- UserPasswordResetEvent
- UserAssignedToTenantEvent
- UserUnassignedFromTenantEvent

**References**:
- `libs/shared/src/domain-kernel/entities/aggregate-root.base.ts`
- DDD 最佳实践：领域事件应在聚合根内部创建

### 4. Repository 接口设计模式

**Decision**: Repository 接口定义在领域层，使用领域对象作为参数和返回值

**Rationale**:
- Repository 接口属于领域层，不依赖基础设施层
- 接口使用领域对象（聚合根、值对象），不暴露数据库细节
- 方法命名体现业务语义

**Alternatives Considered**:
- 使用 DTO 作为参数和返回值：被拒绝，因为会泄漏基础设施层的概念到领域层
- 使用原生 SQL 查询：被拒绝，因为会泄漏数据库细节到领域层

**Repository Interfaces**:
- IUserRepository
- IUserTenantAssignmentRepository
- IUserOrganizationAssignmentRepository
- IUserDepartmentAssignmentRepository

**References**:
- `docs/domain/user-domain-design.md` 第 6 章
- DDD 最佳实践：Repository 接口应在领域层定义

### 5. 值对象验证和标准化规则

**Decision**: 值对象封装验证逻辑，使用 ValueObject 基类提供的验证和标准化机制

**Rationale**:
- `ValueObject` 基类提供了 `validateValue()` 和 `normalizeValue()` 方法
- 值对象应该是不变的（immutable）
- 验证逻辑应该在值对象内部，确保数据一致性

**Validation Rules**:
- **Email**: 格式验证（RFC 5322），长度限制（最大 100 字符），自动标准化（转小写、去除空格）
- **Username**: 长度限制（3-30 字符），格式限制（仅允许字母、数字和下划线）
- **Password**: 最小长度 8 字符，必须包含大小写字母、数字和特殊字符（通过 PasswordHash 值对象处理）
- **UserStatus**: 状态转换规则验证
- **UserSource**: 枚举值验证

**Alternatives Considered**:
- 在应用层进行验证：被拒绝，因为违反值对象的封装原则
- 使用第三方验证库：被拒绝，因为值对象应该自包含验证逻辑

**References**:
- `libs/shared/src/domain-kernel/value-objects/value-object.base.ts`
- `docs/domain-kernel/domain-kernel-usage-guide.md` 值对象部分

### 6. 用户状态转换规则

**Decision**: 用户状态转换遵循有限状态机模式，状态转换规则封装在 UserStatus 值对象中

**Rationale**:
- 状态转换规则是业务规则，应该在领域层封装
- UserStatus 值对象封装状态转换逻辑，确保状态转换的合法性
- 状态转换应该触发领域事件

**State Transitions**:
- PENDING_ACTIVATION → ACTIVE (通过 activate())
- ACTIVE → DISABLED (通过 disable())
- ACTIVE → LOCKED (通过 lock())
- LOCKED → ACTIVE (通过 unlock())
- DISABLED → ACTIVE (通过 activate()，但需要验证是否允许)

**Alternatives Considered**:
- 在实体中直接管理状态：被拒绝，因为违反了值对象的封装原则
- 使用状态机库：被拒绝，因为简单的状态转换不需要额外的库

**References**:
- `docs/domain/user-domain-design.md` 第 3.2 节
- DDD 最佳实践：业务规则应封装在值对象或实体中

### 7. 密码安全策略

**Decision**: 密码安全策略封装在 PasswordHash 值对象中

**Rationale**:
- 密码验证和哈希是业务规则，应该在领域层处理
- 密码不应以明文形式存储或传输
- 密码哈希使用安全的哈希算法（如 bcrypt）

**Password Policy**:
- 最小长度：8 字符
- 必须包含：大小写字母、数字、特殊字符
- 哈希算法：bcrypt（由基础设施层实现，领域层只定义接口）

**Alternatives Considered**:
- 在应用层进行密码验证：被拒绝，因为违反了领域层的封装原则
- 使用明文密码：被拒绝，因为严重的安全风险

**References**:
- 安全最佳实践：密码应使用安全的哈希算法
- OWASP 密码策略指南

### 8. 多租户数据隔离

**Decision**: 使用 TenantAwareEntity 和 MultiLevelIsolatedEntity 基类实现多租户数据隔离

**Rationale**:
- `domain-kernel` 提供了多租户支持的基类
- 数据隔离在领域层通过聚合根保证
- 基础设施层负责实现物理隔离（如行级安全）

**Alternatives Considered**:
- 在应用层实现数据隔离：被拒绝，因为违反了领域层的封装原则
- 不使用基类，自行实现：被拒绝，因为会重复造轮子

**References**:
- `libs/shared/src/domain-kernel/entities/tenant-aware-entity.base.ts`
- `libs/shared/src/domain-kernel/entities/multi-level-isolated-entity.base.ts`
- `docs/multi-tenant/multi-tenant-data-isolation-technical-solution.md`

## Domain-Kernel 验证计划

在实现过程中，需要特别关注以下方面，验证 domain-kernel 的合理性：

1. **基类功能完整性**：验证 Entity、AggregateRoot、AuditableEntity、ValueObject 是否提供了必要的功能
2. **基类易用性**：验证基类的使用是否简单直观，是否需要过多的样板代码
3. **基类灵活性**：验证基类是否足够灵活，能够支持各种业务场景
4. **标识符设计**：验证 TenantId、UserId、OrganizationId、DepartmentId 的设计是否合理
5. **多租户支持**：验证 TenantAwareEntity、MultiLevelIsolatedEntity 是否满足多租户需求
6. **审计功能**：验证 AuditableEntity 的审计功能是否完善
7. **领域事件**：验证 AggregateRoot 的领域事件功能是否完善
8. **值对象功能**：验证 ValueObject 基类是否提供了足够的灵活性
9. **类型安全**：验证 domain-kernel 的类型定义是否完善
10. **文档完整性**：验证 domain-kernel 的文档是否完整

**验证结果记录**：在实现过程中，将记录发现的问题和改进建议，形成验证报告。

## Open Questions / Risks

### Resolved Questions

1. ✅ 密码安全策略：已明确（最小长度 8 字符 + 复杂度要求）
2. ✅ 用户名规则：已明确（3-30 字符，仅允许字母、数字和下划线）
3. ✅ 邮箱长度限制：已明确（最大 100 字符）
4. ✅ 软删除恢复规则：已明确（允许恢复，恢复后状态为禁用）
5. ✅ 激活/失活幂等性：已明确（允许重复操作，视为无操作）

### Remaining Risks

1. **Domain-Kernel 的潜在问题**：在实现过程中可能发现 domain-kernel 的设计问题，需要及时反馈和改进
2. **性能考虑**：值对象的深度克隆可能影响性能，需要在实际使用中验证
3. **领域事件的发布时机**：需要确保领域事件在正确的时机发布（持久化后）

## Next Steps

1. 完成 Phase 1：设计和合约生成
2. 开始实现用户领域模型
3. 在实现过程中持续验证 domain-kernel 的合理性
4. 记录发现的问题和改进建议


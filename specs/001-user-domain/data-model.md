# Data Model: 用户领域模型

**Feature**: 用户领域模型开发  
**Date**: 2025-01-27  
**Phase**: 1 - Design & Contracts

## Overview

本文档定义了用户领域模型的数据模型，包括聚合根、值对象、领域服务和 Repository 接口的设计。

## Aggregate Roots

### 1. User（用户聚合根）

**职责**：管理用户的基础身份信息和生命周期

**继承关系**：继承自 `AggregateRoot`（来自 `@hl8/shared`）

**属性**：
- `id: UserId` - 用户唯一标识符（包含租户信息）
- `username: Username` - 用户名（值对象）
- `email: Email` - 邮箱地址（值对象）
- `passwordHash: PasswordHash` - 密码哈希（值对象）
- `status: UserStatus` - 用户状态（值对象）
- `source: UserSource` - 用户来源（值对象）
- `nickname: string` - 用户昵称（如果未提供，默认使用用户名）
- `profile: UserProfile` - 用户档案（可选，待定义）

**审计字段**（从 `AuditableEntity` 继承）：
- `createdAt: Date` - 创建时间
- `updatedAt: Date` - 更新时间
- `version: number` - 版本号（乐观锁）
- `deletedAt: Date | null` - 软删除时间
- `createdBy: UserId | null` - 创建人
- `updatedBy: UserId | null` - 更新人
- `deletedBy: UserId | null` - 删除人
- `isActive: boolean` - 激活状态
- `activatedAt: Date | null` - 激活时间
- `activatedBy: UserId | null` - 激活人
- `deactivatedAt: Date | null` - 失活时间
- `deactivatedBy: UserId | null` - 失活人

**领域事件**（从 `AggregateRoot` 继承）：
- `UserCreatedEvent` - 用户创建事件
- `UserActivatedEvent` - 用户激活事件
- `UserDisabledEvent` - 用户禁用事件
- `UserLockedEvent` - 用户锁定事件
- `UserUnlockedEvent` - 用户解锁事件
- `UserPasswordChangedEvent` - 密码修改事件
- `UserPasswordResetEvent` - 密码重置事件

**核心方法**：
- `static createPlatformUser(params): User` - 创建平台用户（需要 tenantId）
- `static createSystemUser(params): User` - 创建系统用户（需要 tenantId）
- `getId(): UserId` - 获取用户ID（包含租户信息）
- `getTenantId(): TenantId` - 获取租户ID
- `activate(): void` - 激活用户
- `disable(reason?: string): void` - 禁用用户
- `lock(lockedUntil?: Date, reason?: string): void` - 锁定用户
- `unlock(): void` - 解锁用户
- `updateNickname(nickname: string, updatedBy: UserId): void` - 更新用户昵称（需验证唯一性）
- `updateProfile(updates: Partial<UserProfile>): void` - 更新用户档案
- `changePassword(oldPassword: string, newPassword: string): void` - 修改密码
- `resetPassword(newPassword: string): void` - 重置密码（管理员操作）
- `verifyPassword(password: string): boolean` - 验证密码
- `isAvailable(): boolean` - 检查用户是否可用
- `getNickname(): string` - 获取用户昵称

**业务规则**：
- 用户必须提供唯一的邮箱地址
- 用户名必须唯一（平台级别）
- 密码必须符合安全策略
- 昵称必须唯一（平台级别），如果未提供则默认使用用户名
- 新创建的用户默认为待激活状态
- 只有待激活状态的用户可以被激活
- 只有锁定状态的用户可以被解锁
- 锁定可以设置过期时间，过期后自动解锁
- 禁用用户可以重新激活
- 软删除后的用户可以恢复，恢复后状态为禁用

**验证规则**：
- 邮箱格式验证（RFC 5322），长度限制（最大 100 字符）
- 用户名长度限制（3-30 字符），格式限制（仅允许字母、数字和下划线）
- 密码安全策略：最小长度 8 字符，必须包含大小写字母、数字和特殊字符
- 昵称长度限制（1-50 字符），允许中英文、数字和常用符号，不能为空字符串
- 昵称必须唯一（平台级别），如果未提供则默认使用用户名

### 2. UserTenantAssignment（用户租户分配聚合根）

**职责**：管理用户与租户的分配关系

**继承关系**：继承自 `AggregateRoot`（来自 `@hl8/shared`）

**属性**：
- `id: EntityId` - 分配唯一标识符
- `userId: UserId` - 用户ID
- `tenantId: TenantId` - 租户ID
- `role: TenantRole` - 在租户中的角色（待定义）
- `status: AssignmentStatus` - 分配状态（待定义）
- `assignedAt: Date` - 分配时间
- `assignedBy: UserId` - 分配人
- `expiresAt: Date | null` - 过期时间（可选）
- `revokedAt: Date | null` - 撤销时间
- `revokedBy: UserId | null` - 撤销人
- `revokeReason: string | null` - 撤销原因

**审计字段**（从 `AuditableEntity` 继承）：
- `createdAt: Date`
- `updatedAt: Date`
- `version: number`
- 其他审计字段...

**领域事件**：
- `UserAssignedToTenantEvent` - 用户分配到租户事件
- `UserUnassignedFromTenantEvent` - 用户从租户移除事件

**核心方法**：
- `static create(params): UserTenantAssignment` - 创建分配
- `revoke(revokedBy: UserId, reason?: string): void` - 撤销分配
- `isValid(): boolean` - 检查分配是否有效

**业务规则**：
- 只有平台用户可以被分配到租户
- 系统用户不能分配到租户
- 一个平台用户可以属于多个租户
- 用户在不同租户中的角色相互独立
- 用户离开租户后仍然是平台用户
- 分配可以设置有效期
- 过期后自动失效
- 可以手动撤销分配

### 3. UserOrganizationAssignment（用户组织分配聚合根）

**职责**：管理用户与组织的分配关系

**继承关系**：继承自 `AggregateRoot`（来自 `@hl8/shared`）

**属性**：
- `id: EntityId` - 分配唯一标识符
- `userId: UserId` - 用户ID
- `tenantId: TenantId` - 租户ID
- `organizationId: OrganizationId` - 组织ID
- `role: OrganizationRole` - 在组织中的角色（待定义）
- `status: AssignmentStatus` - 分配状态
- `assignedAt: Date` - 分配时间
- `assignedBy: UserId` - 分配人

**审计字段**（从 `AuditableEntity` 继承）

**核心方法**：
- `static create(params): UserOrganizationAssignment` - 创建分配

**业务规则**：
- 用户可以同时属于多个组织
- 组织分配必须基于租户分配存在

### 4. UserDepartmentAssignment（用户部门分配实体）

**职责**：管理用户与部门的分配关系

**继承关系**：继承自 `Entity` 或 `AuditableEntity`（待确定）

**属性**：
- `id: EntityId` - 分配唯一标识符
- `userId: UserId` - 用户ID
- `organizationId: OrganizationId` - 组织ID
- `departmentId: DepartmentId` - 部门ID
- `role: DepartmentRole` - 在部门中的角色（待定义）
- `status: AssignmentStatus` - 分配状态
- `assignedAt: Date` - 分配时间
- `assignedBy: UserId` - 分配人

**业务规则**：
- 用户在同一组织内只能属于一个部门
- 部门分配必须基于组织分配存在

## Value Objects

### 1. Email（邮箱值对象）

**继承关系**：继承自 `ValueObject<string>`（来自 `@hl8/shared`）

**属性**：
- `_value: string` - 邮箱地址（私有，通过 getter 访问）

**验证规则**：
- 邮箱格式验证（RFC 5322 正则表达式）
- 长度限制：最大 100 字符
- 不能为空

**标准化规则**：
- 转小写
- 去除首尾空格

**方法**：
- `getValue(): string` - 获取邮箱地址
- `getDomain(): string` - 获取邮箱域名
- `equals(other: Email): boolean` - 相等性比较
- `toString(): string` - 字符串表示

### 2. Username（用户名值对象）

**继承关系**：继承自 `ValueObject<string>`（来自 `@hl8/shared`）

**属性**：
- `_value: string` - 用户名（私有）

**验证规则**：
- 长度限制：3-30 字符
- 格式限制：仅允许字母、数字和下划线
- 不能为空

**标准化规则**：
- 去除首尾空格

**方法**：
- `getValue(): string` - 获取用户名
- `equals(other: Username): boolean` - 相等性比较

### 3. UserStatus（用户状态值对象）

**继承关系**：继承自 `ValueObject<UserStatusEnum>`（来自 `@hl8/shared`）

**属性**：
- `_value: UserStatusEnum` - 状态枚举值
- `reason?: string` - 状态原因（可选）
- `lockedUntil?: Date` - 锁定到期时间（可选）

**状态枚举**：
- `PENDING_ACTIVATION` - 待激活
- `ACTIVE` - 活跃
- `DISABLED` - 禁用
- `LOCKED` - 锁定
- `EXPIRED` - 过期

**状态转换规则**：
- `PENDING_ACTIVATION → ACTIVE` (通过 activate())
- `ACTIVE → DISABLED` (通过 disable())
- `ACTIVE → LOCKED` (通过 lock())
- `LOCKED → ACTIVE` (通过 unlock())
- 禁用状态不能直接激活（需要先恢复）

**方法**：
- `static active(): UserStatus` - 创建活跃状态
- `static pendingActivation(): UserStatus` - 创建待激活状态
- `static disabled(reason?: string): UserStatus` - 创建禁用状态
- `static locked(lockedUntil?: Date, reason?: string): UserStatus` - 创建锁定状态
- `static expired(): UserStatus` - 创建过期状态
- `activate(): UserStatus` - 激活用户
- `disable(reason?: string): UserStatus` - 禁用用户
- `lock(lockedUntil?: Date, reason?: string): UserStatus` - 锁定用户
- `unlock(): UserStatus` - 解锁用户
- `isAvailable(): boolean` - 检查用户是否可用
- `isLockExpired(): boolean` - 检查锁定是否已过期
- `getValue(): UserStatusEnum` - 获取状态值
- `getReason(): string | undefined` - 获取状态原因

### 4. UserSource（用户来源值对象）

**继承关系**：继承自 `ValueObject<UserSourceEnum>`（来自 `@hl8/shared`）

**属性**：
- `_value: UserSourceEnum` - 来源枚举值

**来源枚举**：
- `PLATFORM` - 平台用户
- `TENANT` - 租户用户
- `SYSTEM` - 系统用户

**方法**：
- `static platform(): UserSource` - 创建平台用户来源
- `static tenant(): UserSource` - 创建租户用户来源
- `static system(): UserSource` - 创建系统用户来源
- `isPlatform(): boolean` - 检查是否为平台用户
- `isTenant(): boolean` - 检查是否为租户用户
- `isSystem(): boolean` - 检查是否为系统用户

### 5. PasswordHash（密码哈希值对象）

**继承关系**：继承自 `ValueObject<string>`（来自 `@hl8/shared`）

**属性**：
- `_value: string` - 密码哈希值（私有）

**验证规则**：
- 密码安全策略：最小长度 8 字符，必须包含大小写字母、数字和特殊字符
- 哈希值不能为空

**方法**：
- `static fromPlainText(password: string): PasswordHash` - 从明文密码创建（需要基础设施层支持）
- `static system(): PasswordHash` - 创建系统用户密码哈希（无密码）
- `verify(password: string): boolean` - 验证密码（需要基础设施层支持）
- `getValue(): string` - 获取哈希值

**注意**：密码哈希的实际实现需要基础设施层支持（如 bcrypt），领域层只定义接口。

## Domain Services

### 1. UserAssignmentDomainService（用户分配领域服务）

**职责**：处理跨聚合的用户分配业务逻辑

**方法**：
- `assignUserToOrganization(params): Promise<UserOrganizationAssignment>` - 分配用户到组织
- `assignUserToDepartment(params): Promise<UserDepartmentAssignment>` - 分配用户到部门
- `changeUserDepartmentInOrganization(params): Promise<void>` - 调整用户在组织内的部门

**业务规则**：
- 组织分配必须基于租户分配存在
- 部门分配必须基于组织分配存在
- 用户在同一组织内只能属于一个部门

### 2. UserValidationDomainService（用户验证领域服务）

**职责**：处理用户相关的验证逻辑

**方法**：
- `isEmailUnique(email: Email, excludeUserId?: UserId): Promise<boolean>` - 验证邮箱唯一性
- `isUsernameUnique(username: Username, excludeUserId?: UserId): Promise<boolean>` - 验证用户名唯一性
- `isNicknameUnique(nickname: string, excludeUserId?: UserId): Promise<boolean>` - 验证昵称唯一性

## Repository Interfaces

### 1. IUserRepository

**职责**：定义用户聚合的持久化操作接口

**方法**：
- `findById(id: UserId): Promise<User | null>` - 根据ID查找用户
- `findByEmail(email: Email): Promise<User | null>` - 根据邮箱查找用户
- `findByUsername(username: Username): Promise<User | null>` - 根据用户名查找用户
- `findByNickname(nickname: string): Promise<User | null>` - 根据昵称查找用户
- `save(user: User): Promise<User>` - 保存用户（创建或更新）
- `delete(id: UserId): Promise<boolean>` - 删除用户
- `existsByEmail(email: Email): Promise<boolean>` - 检查邮箱是否存在
- `existsByUsername(username: Username): Promise<boolean>` - 检查用户名是否存在
- `existsByNickname(nickname: string): Promise<boolean>` - 检查昵称是否存在

### 2. IUserTenantAssignmentRepository

**职责**：定义用户租户分配聚合的持久化操作接口

**方法**：
- `findById(id: EntityId): Promise<UserTenantAssignment | null>` - 根据ID查找分配
- `findActiveByUser(userId: UserId): Promise<UserTenantAssignment[]>` - 查找用户的所有有效租户分配
- `findActiveByUserAndTenant(userId: UserId, tenantId: TenantId): Promise<UserTenantAssignment | null>` - 查找用户和租户的有效分配
- `save(assignment: UserTenantAssignment): Promise<UserTenantAssignment>` - 保存分配
- `delete(id: EntityId): Promise<boolean>` - 删除分配

### 3. IUserOrganizationAssignmentRepository

**职责**：定义用户组织分配聚合的持久化操作接口

**方法**：
- `findById(id: EntityId): Promise<UserOrganizationAssignment | null>` - 根据ID查找分配
- `findActiveByUserAndOrganization(userId: UserId, organizationId: OrganizationId): Promise<UserOrganizationAssignment | null>` - 查找用户和组织的有效分配
- `save(assignment: UserOrganizationAssignment): Promise<UserOrganizationAssignment>` - 保存分配
- `delete(id: EntityId): Promise<boolean>` - 删除分配

### 4. IUserDepartmentAssignmentRepository

**职责**：定义用户部门分配实体的持久化操作接口

**方法**：
- `findById(id: EntityId): Promise<UserDepartmentAssignment | null>` - 根据ID查找分配
- `findByUserAndOrganization(userId: UserId, organizationId: OrganizationId): Promise<UserDepartmentAssignment | null>` - 查找用户在组织内的部门分配
- `save(assignment: UserDepartmentAssignment): Promise<UserDepartmentAssignment>` - 保存分配
- `delete(id: EntityId): Promise<boolean>` - 删除分配

## Domain Events

### 1. UserCreatedEvent

**属性**：
- `userId: string` - 用户ID
- `email: string` - 邮箱地址
- `username: string` - 用户名
- `nickname: string` - 用户昵称（如果未提供则默认使用用户名）
- `source: string` - 用户来源
- `occurredAt: Date` - 事件发生时间

### 2. UserActivatedEvent

**属性**：
- `userId: string` - 用户ID
- `occurredAt: Date` - 事件发生时间

### 3. UserDisabledEvent

**属性**：
- `userId: string` - 用户ID
- `reason?: string` - 禁用原因
- `occurredAt: Date` - 事件发生时间

### 4. UserLockedEvent

**属性**：
- `userId: string` - 用户ID
- `lockedUntil?: Date` - 锁定到期时间
- `reason?: string` - 锁定原因
- `occurredAt: Date` - 事件发生时间

### 5. UserUnlockedEvent

**属性**：
- `userId: string` - 用户ID
- `occurredAt: Date` - 事件发生时间

### 6. UserPasswordChangedEvent

**属性**：
- `userId: string` - 用户ID
- `occurredAt: Date` - 事件发生时间

### 7. UserPasswordResetEvent

**属性**：
- `userId: string` - 用户ID
- `occurredAt: Date` - 事件发生时间

### 8. UserAssignedToTenantEvent

**属性**：
- `assignmentId: string` - 分配ID
- `userId: string` - 用户ID
- `tenantId: string` - 租户ID
- `role: string` - 角色
- `occurredAt: Date` - 事件发生时间

### 9. UserUnassignedFromTenantEvent

**属性**：
- `assignmentId: string` - 分配ID
- `userId: string` - 用户ID
- `tenantId: string` - 租户ID
- `reason?: string` - 撤销原因
- `occurredAt: Date` - 事件发生时间

## Domain Exceptions

### 1. InvalidEmailError

**消息**：邮箱格式无效

### 2. InvalidUsernameError

**消息**：用户名格式无效

### 3. InvalidPasswordError

**消息**：密码不符合安全策略

### 4. InvalidNicknameError

**消息**：昵称格式无效（长度必须在 1-50 字符之间，不能为空字符串）

### 5. NicknameAlreadyExistsError

**消息**：昵称已存在

### 6. EmailAlreadyExistsError

**消息**：邮箱已存在

### 7. UsernameAlreadyExistsError

**消息**：用户名已存在

### 8. InvalidStatusTransitionError

**消息**：无效的状态转换

### 9. UserNotAssignedToTenantError

**消息**：用户未分配到租户

### 10. UserAlreadyAssignedToTenantError

**消息**：用户已分配到租户

### 11. InvalidUserSourceError

**消息**：无效的用户来源

### 12. UserNotAssignedToOrganizationError

**消息**：用户未分配到组织

### 13. UserAlreadyAssignedToOrganizationError

**消息**：用户已分配到组织

### 14. UserNotAssignedToDepartmentError

**消息**：用户未分配到部门

### 15. UserAlreadyAssignedToDepartmentError

**消息**：用户已分配到部门

### 16. UserAlreadyAssignedToDepartmentInOrganizationError

**消息**：用户在同一组织内已属于某个部门

## Relationships

### User ↔ UserTenantAssignment

- **关系类型**：一对多
- **方向**：User → UserTenantAssignment（通过 UserId 关联）
- **规则**：一个用户可以有多个租户分配

### User ↔ UserOrganizationAssignment

- **关系类型**：一对多
- **方向**：User → UserOrganizationAssignment（通过 UserId 关联）
- **规则**：一个用户可以有多个组织分配

### User ↔ UserDepartmentAssignment

- **关系类型**：一对多
- **方向**：User → UserDepartmentAssignment（通过 UserId 关联）
- **规则**：一个用户可以有多个部门分配，但在同一组织内只能有一个

### UserTenantAssignment ↔ UserOrganizationAssignment

- **关系类型**：一对多
- **方向**：UserTenantAssignment → UserOrganizationAssignment（通过 UserId 和 TenantId 关联）
- **规则**：组织分配必须基于租户分配存在

### UserOrganizationAssignment ↔ UserDepartmentAssignment

- **关系类型**：一对多
- **方向**：UserOrganizationAssignment → UserDepartmentAssignment（通过 UserId 和 OrganizationId 关联）
- **规则**：部门分配必须基于组织分配存在，且在同一组织内只能有一个


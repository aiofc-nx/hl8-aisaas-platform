---
description: 用户领域设计文档
---

# 用户领域设计文档

## 1. 概述

本文档基于领域驱动设计（DDD）和清洁架构（Clean Architecture）原则，设计用户领域的完整架构方案。

### 1.1 设计原则

- **领域驱动设计（DDD）**：以用户业务为核心，构建领域模型
- **清洁架构（Clean Architecture）**：分层清晰，依赖方向向内
- **聚合根（Aggregate Root）**：保证业务一致性边界
- **值对象（Value Object）**：封装业务规则和不变性
- **领域服务（Domain Service）**：处理跨聚合的业务逻辑

### 1.2 架构分层

```
┌─────────────────────────────────────────┐
│      接口层 (Interface Layer)           │
│  - REST API / GraphQL                   │
│  - DTO转换                              │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│      应用层 (Application Layer)         │
│  - 用例 (Use Cases)                     │
│  - 应用服务 (Application Services)       │
│  - 命令/查询 (CQRS)                     │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│      领域层 (Domain Layer)              │
│  - 聚合根 (Aggregate Roots)             │
│  - 实体 (Entities)                      │
│  - 值对象 (Value Objects)               │
│  - 领域服务 (Domain Services)           │
│  - Repository接口                       │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│   基础设施层 (Infrastructure Layer)     │
│  - Repository实现                       │
│  - 数据库访问                           │
│  - 外部服务集成                         │
│  - 多租户数据隔离                       │
└─────────────────────────────────────────┘
```

---

## 2. 领域模型设计

### 2.1 核心概念

根据术语定义，用户领域包含以下核心概念：

- **平台用户（Platform User）**：在平台注册的基础用户身份
- **租户用户（Tenant User）**：从平台用户分配到租户的用户
- **用户分配（User Assignment）**：用户与租户/组织/部门的关系
- **用户状态（User Status）**：用户的生命周期状态

### 2.2 聚合识别

#### 2.2.1 User聚合（聚合根）

**职责**：管理用户的基础身份信息和生命周期

**边界**：
- 用户基本信息（ID、用户名、邮箱、密码等）
- 用户状态管理
- 用户基础验证

**不包含**：
- 用户分配关系（属于独立的分配聚合）
- 用户权限（属于权限领域）

#### 2.2.2 UserTenantAssignment聚合（聚合根）

**职责**：管理用户与租户的分配关系

**边界**：
- 用户-租户分配记录
- 分配状态和有效期
- 在租户内的基础角色

**业务规则**：
- 一个平台用户可以属于多个租户
- 用户在不同租户中的角色相互独立
- 用户离开租户后保持平台用户身份

#### 2.2.3 UserOrganizationAssignment聚合（聚合根）

**职责**：管理用户与组织的分配关系

**边界**：
- 用户-组织分配记录
- 在组织中的角色和权限
- 分配时间和管理记录

**业务规则**：
- 用户可以同时属于多个组织
- 用户在同一组织内只能属于一个部门
- 组织分配必须基于租户分配存在

#### 2.2.4 UserDepartmentAssignment聚合（实体）

**职责**：管理用户与部门的分配关系

**边界**：
- 用户-组织-部门三级关系
- 在部门中的角色

**业务规则**：
- 用户在同一组织内只能属于一个部门
- 部门分配必须基于组织分配存在

---

## 3. 值对象设计

### 3.1 Email值对象

```typescript
/**
 * 邮箱值对象
 * @description 封装邮箱地址的验证和格式化逻辑，确保邮箱格式正确
 */
export class Email {
  private readonly value: string;

  private constructor(value: string) {
    this.validate(value);
    this.value = this.normalize(value);
  }

  /**
   * 创建邮箱值对象
   * @param value - 邮箱地址
   * @returns Email实例
   * @throws {InvalidEmailError} 邮箱格式无效时抛出
   */
  static create(value: string): Email {
    return new Email(value);
  }

  /**
   * 验证邮箱格式
   * @param value - 待验证的邮箱地址
   * @throws {InvalidEmailError} 邮箱格式无效
   */
  private validate(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new InvalidEmailError('邮箱地址不能为空');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new InvalidEmailError(`邮箱格式无效: ${value}`);
    }

    if (value.length > 255) {
      throw new InvalidEmailError('邮箱地址长度不能超过255个字符');
    }
  }

  /**
   * 标准化邮箱地址（转小写，去除空格）
   * @param value - 原始邮箱地址
   * @returns 标准化后的邮箱地址
   */
  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }

  /**
   * 获取邮箱地址字符串值
   * @returns 邮箱地址
   */
  getValue(): string {
    return this.value;
  }

  /**
   * 获取邮箱域名
   * @returns 邮箱域名部分
   */
  getDomain(): string {
    return this.value.split('@')[1];
  }

  /**
   * 值对象相等性比较
   * @param other - 另一个Email值对象
   * @returns 是否相等
   */
  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
```

### 3.2 UserStatus值对象

```typescript
/**
 * 用户状态枚举
 * @description 定义用户的生命周期状态
 */
export enum UserStatusEnum {
  /** 待激活：已注册但未激活的用户 */
  PENDING_ACTIVATION = 'PENDING_ACTIVATION',
  /** 活跃：正常使用系统的用户 */
  ACTIVE = 'ACTIVE',
  /** 禁用：被管理员禁用的用户 */
  DISABLED = 'DISABLED',
  /** 锁定：因安全原因被锁定的用户 */
  LOCKED = 'LOCKED',
  /** 过期：权限已过期的用户 */
  EXPIRED = 'EXPIRED',
}

/**
 * 用户状态值对象
 * @description 封装用户状态的业务规则和状态转换逻辑
 */
export class UserStatus {
  private readonly value: UserStatusEnum;
  private readonly reason?: string;
  private readonly lockedUntil?: Date;

  private constructor(
    value: UserStatusEnum,
    reason?: string,
    lockedUntil?: Date
  ) {
    this.value = value;
    this.reason = reason;
    this.lockedUntil = lockedUntil;
  }

  /**
   * 创建活跃状态
   * @returns 活跃状态实例
   */
  static active(): UserStatus {
    return new UserStatus(UserStatusEnum.ACTIVE);
  }

  /**
   * 创建待激活状态
   * @returns 待激活状态实例
   */
  static pendingActivation(): UserStatus {
    return new UserStatus(UserStatusEnum.PENDING_ACTIVATION);
  }

  /**
   * 创建禁用状态
   * @param reason - 禁用原因
   * @returns 禁用状态实例
   */
  static disabled(reason?: string): UserStatus {
    return new UserStatus(UserStatusEnum.DISABLED, reason);
  }

  /**
   * 创建锁定状态
   * @param lockedUntil - 锁定到期时间（可选，永久锁定则为undefined）
   * @param reason - 锁定原因
   * @returns 锁定状态实例
   */
  static locked(lockedUntil?: Date, reason?: string): UserStatus {
    return new UserStatus(UserStatusEnum.LOCKED, reason, lockedUntil);
  }

  /**
   * 创建过期状态
   * @returns 过期状态实例
   */
  static expired(): UserStatus {
    return new UserStatus(UserStatusEnum.EXPIRED);
  }

  /**
   * 激活用户
   * @returns 新的活跃状态
   * @throws {InvalidStatusTransitionError} 当前状态不允许激活
   */
  activate(): UserStatus {
    if (this.value !== UserStatusEnum.PENDING_ACTIVATION) {
      throw new InvalidStatusTransitionError(
        `无法从${this.value}状态激活用户`
      );
    }
    return UserStatus.active();
  }

  /**
   * 禁用用户
   * @param reason - 禁用原因
   * @returns 新的禁用状态
   */
  disable(reason?: string): UserStatus {
    return UserStatus.disabled(reason);
  }

  /**
   * 锁定用户
   * @param lockedUntil - 锁定到期时间
   * @param reason - 锁定原因
   * @returns 新的锁定状态
   */
  lock(lockedUntil?: Date, reason?: string): UserStatus {
    return UserStatus.locked(lockedUntil, reason);
  }

  /**
   * 解锁用户
   * @returns 新的活跃状态
   * @throws {InvalidStatusTransitionError} 当前状态不允许解锁
   */
  unlock(): UserStatus {
    if (this.value !== UserStatusEnum.LOCKED) {
      throw new InvalidStatusTransitionError(
        `无法从${this.value}状态解锁用户`
      );
    }

    // 如果锁定已过期，自动解锁
    if (this.lockedUntil && this.lockedUntil < new Date()) {
      return UserStatus.active();
    }

    return UserStatus.active();
  }

  /**
   * 检查用户是否可用
   * @returns 用户是否可用（活跃状态且未锁定）
   */
  isAvailable(): boolean {
    if (this.value === UserStatusEnum.ACTIVE) {
      // 检查锁定是否已过期
      if (this.lockedUntil && this.lockedUntil < new Date()) {
        return true;
      }
      return !this.lockedUntil;
    }
    return false;
  }

  /**
   * 检查锁定是否已过期
   * @returns 锁定是否已过期
   */
  isLockExpired(): boolean {
    if (this.value === UserStatusEnum.LOCKED && this.lockedUntil) {
      return this.lockedUntil < new Date();
    }
    return false;
  }

  getValue(): UserStatusEnum {
    return this.value;
  }

  getReason(): string | undefined {
    return this.reason;
  }

  getLockedUntil(): Date | undefined {
    return this.lockedUntil;
  }

  equals(other: UserStatus): boolean {
    return (
      this.value === other.value &&
      this.reason === other.reason &&
      this.lockedUntil?.getTime() === other.lockedUntil?.getTime()
    );
  }
}
```

### 3.3 UserSource值对象

```typescript
/**
 * 用户来源枚举
 * @description 定义用户的来源分类
 */
export enum UserSourceEnum {
  /** 平台用户：在平台注册的所有用户 */
  PLATFORM = 'PLATFORM',
  /** 租户用户：从平台用户分配到租户的用户 */
  TENANT = 'TENANT',
  /** 系统用户：系统内部用户，用于系统间通信和自动化任务 */
  SYSTEM = 'SYSTEM',
}

/**
 * 用户来源值对象
 * @description 封装用户来源的业务规则
 */
export class UserSource {
  private readonly value: UserSourceEnum;

  private constructor(value: UserSourceEnum) {
    this.value = value;
  }

  static platform(): UserSource {
    return new UserSource(UserSourceEnum.PLATFORM);
  }

  static tenant(): UserSource {
    return new UserSource(UserSourceEnum.TENANT);
  }

  static system(): UserSource {
    return new UserSource(UserSourceEnum.SYSTEM);
  }

  getValue(): UserSourceEnum {
    return this.value;
  }

  /**
   * 检查是否为平台用户
   * @returns 是否为平台用户
   */
  isPlatform(): boolean {
    return this.value === UserSourceEnum.PLATFORM;
  }

  /**
   * 检查是否为租户用户
   * @returns 是否为租户用户
   */
  isTenant(): boolean {
    return this.value === UserSourceEnum.TENANT;
  }

  /**
   * 检查是否为系统用户
   * @returns 是否为系统用户
   */
  isSystem(): boolean {
    return this.value === UserSourceEnum.SYSTEM;
  }

  equals(other: UserSource): boolean {
    return this.value === other.value;
  }
}
```

---

## 4. 实体设计

### 4.1 User聚合根

```typescript
/**
 * 用户聚合根
 * @description 管理用户的基础身份信息和生命周期，是用户领域的核心聚合根
 * 
 * ## 业务规则
 * 
 * ### 用户创建规则
 * - 用户必须提供唯一的邮箱地址
 * - 用户名必须唯一（平台级别）
 * - 密码必须符合安全策略
 * - 新创建的用户默认为待激活状态
 * 
 * ### 用户状态规则
 * - 只有待激活状态的用户可以被激活
 * - 只有锁定状态的用户可以被解锁
 * - 锁定可以设置过期时间，过期后自动解锁
 * - 禁用用户可以重新激活
 * 
 * ### 用户身份规则
 * - 用户首先属于平台（平台用户）
 * - 平台用户可以分配到租户（成为租户用户）
 * - 用户离开租户后仍然是平台用户
 * - 系统用户不能分配到租户
 */
export class User {
  private id: UserId;
  private username: Username;
  private email: Email;
  private passwordHash: PasswordHash;
  private status: UserStatus;
  private source: UserSource;
  private profile: UserProfile;
  private createdAt: Date;
  private updatedAt: Date;
  private version: number; // 乐观锁版本号

  /**
   * 创建平台用户
   * @param params - 用户创建参数
   * @returns 新创建的用户实例
   */
  static createPlatformUser(params: {
    username: string;
    email: string;
    password: string;
    profile?: Partial<UserProfile>;
  }): User {
    const user = new User();
    user.id = UserId.generate();
    user.username = Username.create(params.username);
    user.email = Email.create(params.email);
    user.passwordHash = PasswordHash.fromPlainText(params.password);
    user.status = UserStatus.pendingActivation();
    user.source = UserSource.platform();
    user.profile = UserProfile.create(params.profile);
    user.createdAt = new Date();
    user.updatedAt = new Date();
    user.version = 1;

    // 发布领域事件
    user.addDomainEvent(
      new UserCreatedEvent({
        userId: user.id.getValue(),
        email: user.email.getValue(),
        username: user.username.getValue(),
        source: user.source.getValue(),
      })
    );

    return user;
  }

  /**
   * 创建系统用户
   * @param params - 系统用户创建参数
   * @returns 新创建的系统用户实例
   */
  static createSystemUser(params: {
    username: string;
    email: string;
    description?: string;
  }): User {
    const user = new User();
    user.id = UserId.generate();
    user.username = Username.create(params.username);
    user.email = Email.create(params.email);
    user.passwordHash = PasswordHash.system(); // 系统用户无密码
    user.status = UserStatus.active();
    user.source = UserSource.system();
    user.profile = UserProfile.create({
      ...params,
      isSystemUser: true,
    });
    user.createdAt = new Date();
    user.updatedAt = new Date();
    user.version = 1;

    return user;
  }

  /**
   * 激活用户
   * @throws {InvalidStatusTransitionError} 当前状态不允许激活
   */
  activate(): void {
    this.status = this.status.activate();
    this.updatedAt = new Date();
    this.version++;

    this.addDomainEvent(
      new UserActivatedEvent({
        userId: this.id.getValue(),
      })
    );
  }

  /**
   * 禁用用户
   * @param reason - 禁用原因
   */
  disable(reason?: string): void {
    this.status = this.status.disable(reason);
    this.updatedAt = new Date();
    this.version++;

    this.addDomainEvent(
      new UserDisabledEvent({
        userId: this.id.getValue(),
        reason,
      })
    );
  }

  /**
   * 锁定用户
   * @param lockedUntil - 锁定到期时间（可选）
   * @param reason - 锁定原因
   */
  lock(lockedUntil?: Date, reason?: string): void {
    this.status = this.status.lock(lockedUntil, reason);
    this.updatedAt = new Date();
    this.version++;

    this.addDomainEvent(
      new UserLockedEvent({
        userId: this.id.getValue(),
        lockedUntil,
        reason,
      })
    );
  }

  /**
   * 解锁用户
   * @throws {InvalidStatusTransitionError} 当前状态不允许解锁
   */
  unlock(): void {
    this.status = this.status.unlock();
    this.updatedAt = new Date();
    this.version++;

    this.addDomainEvent(
      new UserUnlockedEvent({
        userId: this.id.getValue(),
      })
    );
  }

  /**
   * 更新用户信息
   * @param updates - 更新内容
   */
  updateProfile(updates: Partial<UserProfile>): void {
    this.profile = this.profile.update(updates);
    this.updatedAt = new Date();
    this.version++;
  }

  /**
   * 修改密码
   * @param oldPassword - 旧密码
   * @param newPassword - 新密码
   * @throws {InvalidPasswordError} 旧密码不正确
   */
  changePassword(oldPassword: string, newPassword: string): void {
    if (!this.passwordHash.verify(oldPassword)) {
      throw new InvalidPasswordError('旧密码不正确');
    }

    this.passwordHash = PasswordHash.fromPlainText(newPassword);
    this.updatedAt = new Date();
    this.version++;

    this.addDomainEvent(
      new UserPasswordChangedEvent({
        userId: this.id.getValue(),
      })
    );
  }

  /**
   * 重置密码（管理员操作）
   * @param newPassword - 新密码
   */
  resetPassword(newPassword: string): void {
    this.passwordHash = PasswordHash.fromPlainText(newPassword);
    this.updatedAt = new Date();
    this.version++;

    this.addDomainEvent(
      new UserPasswordResetEvent({
        userId: this.id.getValue(),
      })
    );
  }

  /**
   * 验证密码
   * @param password - 待验证的密码
   * @returns 密码是否正确
   */
  verifyPassword(password: string): boolean {
    return this.passwordHash.verify(password);
  }

  /**
   * 检查用户是否可用
   * @returns 用户是否可用
   */
  isAvailable(): boolean {
    return this.status.isAvailable();
  }

  // Getters
  getId(): UserId {
    return this.id;
  }

  getUsername(): Username {
    return this.username;
  }

  getEmail(): Email {
    return this.email;
  }

  getStatus(): UserStatus {
    return this.status;
  }

  getSource(): UserSource {
    return this.source;
  }

  getProfile(): UserProfile {
    return this.profile;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getVersion(): number {
    return this.version;
  }
}
```

### 4.2 UserTenantAssignment聚合根

```typescript
/**
 * 用户租户分配聚合根
 * @description 管理用户与租户的分配关系
 * 
 * ## 业务规则
 * 
 * ### 分配规则
 * - 只有平台用户可以被分配到租户
 * - 系统用户不能分配到租户
 * - 一个平台用户可以属于多个租户
 * - 用户在不同租户中的角色相互独立
 * 
 * ### 状态规则
 * - 分配可以设置有效期
 * - 过期后自动失效
 * - 可以手动撤销分配
 * 
 * ### 身份规则
 * - 用户离开租户后仍然是平台用户
 * - 分配记录保留历史信息
 */
export class UserTenantAssignment {
  private id: AssignmentId;
  private userId: UserId;
  private tenantId: TenantId;
  private role: TenantRole;
  private status: AssignmentStatus;
  private assignedAt: Date;
  private assignedBy: UserId;
  private expiresAt?: Date;
  private revokedAt?: Date;
  private revokedBy?: UserId;
  private revokeReason?: string;
  private createdAt: Date;
  private updatedAt: Date;

  /**
   * 创建用户租户分配
   * @param params - 分配参数
   * @returns 新创建的分配实例
   */
  static create(params: {
    userId: UserId;
    tenantId: TenantId;
    role: TenantRole;
    assignedBy: UserId;
    expiresAt?: Date;
  }): UserTenantAssignment {
    const assignment = new UserTenantAssignment();
    assignment.id = AssignmentId.generate();
    assignment.userId = params.userId;
    assignment.tenantId = params.tenantId;
    assignment.role = params.role;
    assignment.status = AssignmentStatus.active();
    assignment.assignedAt = new Date();
    assignment.assignedBy = params.assignedBy;
    assignment.expiresAt = params.expiresAt;
    assignment.createdAt = new Date();
    assignment.updatedAt = new Date();

    assignment.addDomainEvent(
      new UserAssignedToTenantEvent({
        assignmentId: assignment.id.getValue(),
        userId: assignment.userId.getValue(),
        tenantId: assignment.tenantId.getValue(),
        role: assignment.role.getValue(),
      })
    );

    return assignment;
  }

  /**
   * 撤销分配
   * @param revokedBy - 撤销人
   * @param reason - 撤销原因
   */
  revoke(revokedBy: UserId, reason?: string): void {
    if (!this.status.isActive()) {
      throw new InvalidAssignmentStatusError('分配已失效，无法撤销');
    }

    this.status = AssignmentStatus.revoked();
    this.revokedAt = new Date();
    this.revokedBy = revokedBy;
    this.revokeReason = reason;
    this.updatedAt = new Date();

    this.addDomainEvent(
      new UserUnassignedFromTenantEvent({
        assignmentId: this.id.getValue(),
        userId: this.userId.getValue(),
        tenantId: this.tenantId.getValue(),
        reason,
      })
    );
  }

  /**
   * 检查分配是否有效
   * @returns 分配是否有效
   */
  isValid(): boolean {
    if (!this.status.isActive()) {
      return false;
    }

    if (this.expiresAt && this.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  // Getters
  getId(): AssignmentId {
    return this.id;
  }

  getUserId(): UserId {
    return this.userId;
  }

  getTenantId(): TenantId {
    return this.tenantId;
  }

  getRole(): TenantRole {
    return this.role;
  }

  getStatus(): AssignmentStatus {
    return this.status;
  }

  getAssignedAt(): Date {
    return this.assignedAt;
  }
}
```

---

## 5. 领域服务设计

### 5.1 UserAssignmentDomainService

```typescript
/**
 * 用户分配领域服务
 * @description 处理跨聚合的用户分配业务逻辑
 * 
 * ## 业务规则
 * 
 * ### 组织分配规则
 * - 用户可以同时属于多个组织
 * - 用户在同一组织内只能属于一个部门
 * - 组织分配必须基于租户分配存在
 * 
 * ### 部门分配规则
 * - 用户在同一组织内只能属于一个部门
 * - 部门分配必须基于组织分配存在
 * - 调整部门时需要先移除原部门分配
 */
export class UserAssignmentDomainService {
  constructor(
    private readonly userTenantAssignmentRepo: IUserTenantAssignmentRepository,
    private readonly userOrganizationAssignmentRepo: IUserOrganizationAssignmentRepository,
    private readonly userDepartmentAssignmentRepo: IUserDepartmentAssignmentRepository
  ) {}

  /**
   * 分配用户到组织
   * @param params - 分配参数
   * @throws {UserNotAssignedToTenantError} 用户未分配到租户
   * @throws {OrganizationNotFoundError} 组织不存在
   */
  async assignUserToOrganization(params: {
    userId: UserId;
    tenantId: TenantId;
    organizationId: OrganizationId;
    role: OrganizationRole;
    assignedBy: UserId;
  }): Promise<UserOrganizationAssignment> {
    // 验证用户已分配到租户
    const tenantAssignment = await this.userTenantAssignmentRepo.findActiveByUserAndTenant(
      params.userId,
      params.tenantId
    );

    if (!tenantAssignment) {
      throw new UserNotAssignedToTenantError(
        `用户${params.userId.getValue()}未分配到租户${params.tenantId.getValue()}`
      );
    }

    // 检查是否已存在分配
    const existing = await this.userOrganizationAssignmentRepo.findActiveByUserAndOrganization(
      params.userId,
      params.organizationId
    );

    if (existing) {
      throw new UserAlreadyAssignedToOrganizationError(
        `用户${params.userId.getValue()}已分配到组织${params.organizationId.getValue()}`
      );
    }

    // 创建组织分配
    return UserOrganizationAssignment.create({
      userId: params.userId,
      tenantId: params.tenantId,
      organizationId: params.organizationId,
      role: params.role,
      assignedBy: params.assignedBy,
    });
  }

  /**
   * 分配用户到部门
   * @param params - 分配参数
   * @throws {UserNotAssignedToOrganizationError} 用户未分配到组织
   * @throws {DepartmentNotFoundError} 部门不存在
   */
  async assignUserToDepartment(params: {
    userId: UserId;
    organizationId: OrganizationId;
    departmentId: DepartmentId;
    role: DepartmentRole;
    assignedBy: UserId;
  }): Promise<UserDepartmentAssignment> {
    // 验证用户已分配到组织
    const orgAssignment = await this.userOrganizationAssignmentRepo.findActiveByUserAndOrganization(
      params.userId,
      params.organizationId
    );

    if (!orgAssignment) {
      throw new UserNotAssignedToOrganizationError(
        `用户${params.userId.getValue()}未分配到组织${params.organizationId.getValue()}`
      );
    }

    // 检查用户在该组织内是否已有部门分配
    const existing = await this.userDepartmentAssignmentRepo.findByUserAndOrganization(
      params.userId,
      params.organizationId
    );

    if (existing) {
      // 如果已存在，需要先移除原分配
      throw new UserAlreadyAssignedToDepartmentInOrganizationError(
        `用户${params.userId.getValue()}在组织${params.organizationId.getValue()}内已属于部门${existing.getDepartmentId().getValue()}，请先移除原分配`
      );
    }

    // 创建部门分配
    return UserDepartmentAssignment.create({
      userId: params.userId,
      organizationId: params.organizationId,
      departmentId: params.departmentId,
      role: params.role,
      assignedBy: params.assignedBy,
    });
  }

  /**
   * 调整用户在组织内的部门
   * @param params - 调整参数
   */
  async changeUserDepartmentInOrganization(params: {
    userId: UserId;
    organizationId: OrganizationId;
    newDepartmentId: DepartmentId;
    newRole?: DepartmentRole;
    changedBy: UserId;
  }): Promise<void> {
    // 查找现有部门分配
    const existing = await this.userDepartmentAssignmentRepo.findByUserAndOrganization(
      params.userId,
      params.organizationId
    );

    if (!existing) {
      throw new UserNotAssignedToDepartmentInOrganizationError(
        `用户${params.userId.getValue()}在组织${params.organizationId.getValue()}内未分配部门`
      );
    }

    // 撤销原分配
    existing.revoke(params.changedBy, '部门调整');

    // 创建新分配
    const newAssignment = UserDepartmentAssignment.create({
      userId: params.userId,
      organizationId: params.organizationId,
      departmentId: params.newDepartmentId,
      role: params.newRole || existing.getRole(),
      assignedBy: params.changedBy,
    });

    await this.userDepartmentAssignmentRepo.save(existing);
    await this.userDepartmentAssignmentRepo.save(newAssignment);
  }
}
```

### 5.2 UserValidationDomainService

```typescript
/**
 * 用户验证领域服务
 * @description 处理用户相关的验证逻辑
 */
export class UserValidationDomainService {
  constructor(
    private readonly userRepo: IUserRepository
  ) {}

  /**
   * 验证邮箱是否唯一
   * @param email - 邮箱地址
   * @param excludeUserId - 排除的用户ID（用于更新时检查）
   * @returns 邮箱是否唯一
   */
  async isEmailUnique(email: Email, excludeUserId?: UserId): Promise<boolean> {
    const existing = await this.userRepo.findByEmail(email);
    
    if (!existing) {
      return true;
    }

    if (excludeUserId && existing.getId().equals(excludeUserId)) {
      return true;
    }

    return false;
  }

  /**
   * 验证用户名是否唯一
   * @param username - 用户名
   * @param excludeUserId - 排除的用户ID（用于更新时检查）
   * @returns 用户名是否唯一
   */
  async isUsernameUnique(username: Username, excludeUserId?: UserId): Promise<boolean> {
    const existing = await this.userRepo.findByUsername(username);
    
    if (!existing) {
      return true;
    }

    if (excludeUserId && existing.getId().equals(excludeUserId)) {
      return true;
    }

    return false;
  }
}
```

---

## 6. Repository接口设计（领域层）

### 6.1 IUserRepository

```typescript
/**
 * 用户仓库接口
 * @description 定义用户聚合的持久化操作接口，属于领域层
 * 
 * ## 设计原则
 * - 接口定义在领域层，实现放在基础设施层
 * - 接口使用领域对象，不暴露数据库细节
 * - 方法命名体现业务语义
 */
export interface IUserRepository {
  /**
   * 根据ID查找用户
   * @param id - 用户ID
   * @returns 用户聚合根，不存在则返回null
   */
  findById(id: UserId): Promise<User | null>;

  /**
   * 根据邮箱查找用户
   * @param email - 邮箱地址
   * @returns 用户聚合根，不存在则返回null
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * 根据用户名查找用户
   * @param username - 用户名
   * @returns 用户聚合根，不存在则返回null
   */
  findByUsername(username: Username): Promise<User | null>;

  /**
   * 保存用户（创建或更新）
   * @param user - 用户聚合根
   * @returns 保存后的用户聚合根
   */
  save(user: User): Promise<User>;

  /**
   * 删除用户
   * @param id - 用户ID
   * @returns 是否删除成功
   */
  delete(id: UserId): Promise<boolean>;

  /**
   * 检查邮箱是否存在
   * @param email - 邮箱地址
   * @returns 邮箱是否存在
   */
  existsByEmail(email: Email): Promise<boolean>;

  /**
   * 检查用户名是否存在
   * @param username - 用户名
   * @returns 用户名是否存在
   */
  existsByUsername(username: Username): Promise<boolean>;
}
```

### 6.2 IUserTenantAssignmentRepository

```typescript
/**
 * 用户租户分配仓库接口
 * @description 定义用户租户分配聚合的持久化操作接口
 */
export interface IUserTenantAssignmentRepository {
  /**
   * 根据ID查找分配
   * @param id - 分配ID
   * @returns 分配聚合根，不存在则返回null
   */
  findById(id: AssignmentId): Promise<UserTenantAssignment | null>;

  /**
   * 查找用户的所有有效租户分配
   * @param userId - 用户ID
   * @returns 分配列表
   */
  findActiveByUser(userId: UserId): Promise<UserTenantAssignment[]>;

  /**
   * 查找用户和租户的有效分配
   * @param userId - 用户ID
   * @param tenantId - 租户ID
   * @returns 分配聚合根，不存在则返回null
   */
  findActiveByUserAndTenant(
    userId: UserId,
    tenantId: TenantId
  ): Promise<UserTenantAssignment | null>;

  /**
   * 保存分配（创建或更新）
   * @param assignment - 分配聚合根
   * @returns 保存后的分配聚合根
   */
  save(assignment: UserTenantAssignment): Promise<UserTenantAssignment>;

  /**
   * 删除分配
   * @param id - 分配ID
   * @returns 是否删除成功
   */
  delete(id: AssignmentId): Promise<boolean>;
}
```

---

## 7. 应用层设计（Use Cases）

### 7.1 CreatePlatformUserUseCase

```typescript
/**
 * 创建平台用户用例
 * @description 处理平台用户注册的业务流程
 */
export class CreatePlatformUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly userValidationService: UserValidationDomainService,
    private readonly eventBus: IEventBus
  ) {}

  /**
   * 执行用例
   * @param command - 创建用户命令
   * @returns 创建的用户ID
   * @throws {EmailAlreadyExistsError} 邮箱已存在
   * @throws {UsernameAlreadyExistsError} 用户名已存在
   */
  async execute(command: CreatePlatformUserCommand): Promise<CreatePlatformUserResult> {
    // 验证邮箱唯一性
    const email = Email.create(command.email);
    const isEmailUnique = await this.userValidationService.isEmailUnique(email);
    if (!isEmailUnique) {
      throw new EmailAlreadyExistsError(`邮箱${command.email}已存在`);
    }

    // 验证用户名唯一性
    const username = Username.create(command.username);
    const isUsernameUnique = await this.userValidationService.isUsernameUnique(username);
    if (!isUsernameUnique) {
      throw new UsernameAlreadyExistsError(`用户名${command.username}已存在`);
    }

    // 创建用户聚合
    const user = User.createPlatformUser({
      username: command.username,
      email: command.email,
      password: command.password,
      profile: command.profile,
    });

    // 持久化
    await this.userRepo.save(user);

    // 发布领域事件
    await this.eventBus.publishAll(user.getDomainEvents());
    user.clearDomainEvents();

    return {
      userId: user.getId().getValue(),
      email: user.getEmail().getValue(),
      username: user.getUsername().getValue(),
      status: user.getStatus().getValue(),
    };
  }
}
```

### 7.2 AssignUserToTenantUseCase

```typescript
/**
 * 分配用户到租户用例
 * @description 处理将平台用户分配到租户的业务流程
 */
export class AssignUserToTenantUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tenantRepo: ITenantRepository,
    private readonly assignmentRepo: IUserTenantAssignmentRepository,
    private readonly eventBus: IEventBus
  ) {}

  /**
   * 执行用例
   * @param command - 分配命令
   * @returns 分配结果
   */
  async execute(command: AssignUserToTenantCommand): Promise<AssignUserToTenantResult> {
    // 查找用户
    const user = await this.userRepo.findById(UserId.create(command.userId));
    if (!user) {
      throw new UserNotFoundError(`用户${command.userId}不存在`);
    }

    // 验证用户来源
    if (!user.getSource().isPlatform()) {
      throw new InvalidUserSourceError('只有平台用户可以被分配到租户');
    }

    // 查找租户
    const tenant = await this.tenantRepo.findById(TenantId.create(command.tenantId));
    if (!tenant) {
      throw new TenantNotFoundError(`租户${command.tenantId}不存在`);
    }

    // 检查是否已分配
    const existing = await this.assignmentRepo.findActiveByUserAndTenant(
      user.getId(),
      tenant.getId()
    );

    if (existing) {
      throw new UserAlreadyAssignedToTenantError(
        `用户${command.userId}已分配到租户${command.tenantId}`
      );
    }

    // 创建分配
    const assignment = UserTenantAssignment.create({
      userId: user.getId(),
      tenantId: tenant.getId(),
      role: TenantRole.create(command.role),
      assignedBy: UserId.create(command.assignedBy),
      expiresAt: command.expiresAt,
    });

    // 持久化
    await this.assignmentRepo.save(assignment);

    // 发布领域事件
    await this.eventBus.publishAll(assignment.getDomainEvents());
    assignment.clearDomainEvents();

    return {
      assignmentId: assignment.getId().getValue(),
      userId: user.getId().getValue(),
      tenantId: tenant.getId().getValue(),
      role: assignment.getRole().getValue(),
    };
  }
}
```

---

## 8. 基础设施层设计

### 8.1 UserRepository实现

```typescript
/**
 * 用户仓库实现（MikroORM）
 * @description 基础设施层实现，负责用户聚合的持久化
 */
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userEntityRepo: EntityRepository<UserEntity>,
    private readonly mapper: UserMapper
  ) {}

  async findById(id: UserId): Promise<User | null> {
    const entity = await this.userEntityRepo.findOne({
      id: id.getValue(),
    });

    if (!entity) {
      return null;
    }

    return this.mapper.toDomain(entity);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const entity = await this.userEntityRepo.findOne({
      email: email.getValue(),
    });

    if (!entity) {
      return null;
    }

    return this.mapper.toDomain(entity);
  }

  async findByUsername(username: Username): Promise<User | null> {
    const entity = await this.userEntityRepo.findOne({
      username: username.getValue(),
    });

    if (!entity) {
      return null;
    }

    return this.mapper.toDomain(entity);
  }

  async save(user: User): Promise<User> {
    const entity = await this.userEntityRepo.findOne({
      id: user.getId().getValue(),
    });

    if (entity) {
      // 更新
      this.mapper.toEntity(user, entity);
      await this.userEntityRepo.persistAndFlush(entity);
    } else {
      // 创建
      const newEntity = this.mapper.toEntity(user);
      await this.userEntityRepo.persistAndFlush(newEntity);
    }

    return user;
  }

  async delete(id: UserId): Promise<boolean> {
    const entity = await this.userEntityRepo.findOne({
      id: id.getValue(),
    });

    if (!entity) {
      return false;
    }

    await this.userEntityRepo.removeAndFlush(entity);
    return true;
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const count = await this.userEntityRepo.count({
      email: email.getValue(),
    });
    return count > 0;
  }

  async existsByUsername(username: Username): Promise<boolean> {
    const count = await this.userEntityRepo.count({
      username: username.getValue(),
    });
    return count > 0;
  }
}
```

### 8.2 多租户数据隔离

```typescript
/**
 * 用户仓库实现（支持多租户隔离）
 * @description 继承基础仓库，自动处理租户数据隔离
 */
@Injectable()
export class UserRepositoryWithTenantIsolation extends BaseRepository<User>
  implements IUserRepository {
  
  constructor(
    em: EntityManager,
    private readonly tenantContext: TenantContext,
    private readonly mapper: UserMapper
  ) {
    super(em, UserEntity, tenantContext);
  }

  async findById(id: UserId): Promise<User | null> {
    // 平台用户不受租户隔离限制
    const entity = await this.em.findOne(UserEntity, {
      id: id.getValue(),
      // 如果当前上下文有租户，只查询平台用户或该租户的用户
      ...(this.tenantContext.tenantId && {
        $or: [
          { tenantId: null }, // 平台用户
          { tenantId: this.tenantContext.tenantId }, // 当前租户用户
        ],
      }),
    });

    if (!entity) {
      return null;
    }

    return this.mapper.toDomain(entity);
  }

  // 其他方法类似处理...
}
```

---

## 9. 目录结构

```
libs/
└── domain/
    └── user/
        ├── domain/                    # 领域层
        │   ├── entities/              # 实体
        │   │   ├── user.entity.ts     # User聚合根
        │   │   └── ...
        │   ├── value-objects/          # 值对象
        │   │   ├── email.vo.ts
        │   │   ├── user-status.vo.ts
        │   │   ├── user-source.vo.ts
        │   │   └── ...
        │   ├── services/               # 领域服务
        │   │   ├── user-assignment.service.ts
        │   │   └── user-validation.service.ts
        │   ├── repositories/          # Repository接口
        │   │   ├── user.repository.ts
        │   │   └── ...
        │   ├── events/                 # 领域事件
        │   │   ├── user-created.event.ts
        │   │   └── ...
        │   └── exceptions/             # 领域异常
        │       ├── invalid-email.error.ts
        │       └── ...
        │
        ├── application/                # 应用层
        │   ├── use-cases/              # 用例
        │   │   ├── create-platform-user.use-case.ts
        │   │   ├── assign-user-to-tenant.use-case.ts
        │   │   └── ...
        │   ├── commands/               # 命令（CQRS）
        │   │   └── ...
        │   └── queries/                # 查询（CQRS）
        │       └── ...
        │
        └── infrastructure/             # 基础设施层
            ├── persistence/            # 持久化
            │   ├── entities/           # 数据库实体
            │   │   └── user.entity.ts
            │   ├── repositories/       # Repository实现
            │   │   └── user.repository.ts
            │   └── mappers/            # 领域-实体映射
            │       └── user.mapper.ts
            └── ...
```

---

## 10. 总结

### 10.1 设计要点

1. **聚合根边界清晰**：User、UserTenantAssignment、UserOrganizationAssignment各自独立
2. **值对象封装规则**：Email、UserStatus等值对象封装业务规则和不变性
3. **领域服务处理跨聚合逻辑**：用户分配服务处理复杂的分配规则
4. **Repository接口在领域层**：保持领域层独立性
5. **应用层编排业务流程**：用例类负责业务流程编排和事务管理

### 10.2 下一步工作

1. 实现值对象和基础实体
2. 实现Repository接口
3. 实现应用层用例
4. 实现基础设施层持久化
5. 编写单元测试和集成测试


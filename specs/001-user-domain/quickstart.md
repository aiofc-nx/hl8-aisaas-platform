# Quick Start: 用户领域模型开发

**Feature**: 用户领域模型开发  
**Date**: 2025-01-27

## 概述

本文档提供用户领域模型的快速开始指南，帮助开发者快速理解和使用领域模型。

## 项目结构

```
libs/domain/user/
├── src/
│   └── domain/
│       ├── entities/              # 聚合根
│       ├── value-objects/         # 值对象
│       ├── services/              # 领域服务
│       ├── repositories/          # Repository 接口
│       ├── events/                # 领域事件
│       └── exceptions/            # 领域异常
└── ...
```

## 快速开始

### 1. 创建平台用户

```typescript
import { User, Email, Username } from '@hl8/domain-user';
import { TenantId, UserId } from '@hl8/shared';

// 准备租户ID（必需）
const tenantId = TenantId.generate();

// 创建用户（带昵称）
const user = User.createPlatformUser({
  tenantId: tenantId, // 必需：租户ID，用于数据隔离
  username: new Username('john_doe'),
  email: new Email('john@example.com'),
  password: 'SecurePass123!',
  nickname: '约翰', // 可选，如果不提供则默认使用用户名
  createdBy: UserId.generate(tenantId), // 可选：创建人ID
});

// 创建用户（不带昵称，将使用用户名作为昵称）
const user2 = User.createPlatformUser({
  tenantId: tenantId, // 必需
  username: new Username('jane_doe'),
  email: new Email('jane@example.com'),
  password: 'SecurePass123!',
  // 不提供 nickname，将使用 'jane_doe' 作为昵称
});

// 获取用户信息
const userId = user.getId(); // 返回 UserId（包含租户信息）
const tenantIdFromUser = user.getTenantId(); // 获取租户ID
const email = user.getEmail(); // 返回 Email 值对象
const nickname = user.getNickname(); // '约翰' 或 'jane_doe'（如果未提供）
const status = user.getStatus(); // 返回 UserStatus 值对象
```

### 2. 创建系统用户

```typescript
import { User, Email, Username } from '@hl8/domain-user';
import { TenantId, UserId } from '@hl8/shared';

const tenantId = TenantId.generate();

// 创建系统用户（不需要密码）
const systemUser = User.createSystemUser({
  tenantId: tenantId, // 必需：租户ID
  username: new Username('system'),
  email: new Email('system@example.com'),
  createdBy: UserId.generate(tenantId), // 可选：创建人ID
});

// 系统用户默认为活跃状态，无密码
expect(systemUser.getStatus().getValue()).toBe('ACTIVE');
expect(systemUser.getSource().isSystem()).toBe(true);
```

### 3. 更新用户昵称

```typescript
import { UserId } from '@hl8/shared';

// 更新昵称（需要验证唯一性）
const tenantId = user.getTenantId(); // 从用户获取租户ID
const updatedBy = UserId.generate(tenantId);
user.updateNickname('新昵称', updatedBy); // 如果昵称已存在会抛出 NicknameAlreadyExistsError

// 获取昵称
const nickname = user.getNickname();
```

### 4. 激活用户

```typescript
// 激活用户
user.activate();

// 检查用户是否可用
if (user.isAvailable()) {
  // 用户可用
}
```

### 5. 创建值对象

```typescript
import { Email, Username } from '@hl8/domain-user';

// 创建邮箱值对象
const email = new Email('user@example.com');
const domain = email.getDomain(); // 'example.com'

// 创建用户名值对象
const username = new Username('john_doe');
```

### 6. 用户状态管理

```typescript
import { UserStatus } from '@hl8/domain-user';

// 创建状态
const status = UserStatus.pendingActivation();

// 激活
const activeStatus = status.activate();

// 禁用
const disabledStatus = activeStatus.disable('违反规则');

// 锁定
const lockedStatus = activeStatus.lock(new Date('2025-12-31'), '安全原因');

// 解锁
const unlockedStatus = lockedStatus.unlock();
```

### 7. 用户租户分配

```typescript
import { UserTenantAssignment } from '@hl8/domain-user';
import { TenantId, UserId } from '@hl8/shared';

// 创建分配
const assignment = UserTenantAssignment.create({
  userId: user.getId(),
  tenantId: TenantId.generate(),
  role: TenantRole.create('member'),
  assignedBy: UserId.generate(tenantId),
});

// 检查分配是否有效
if (assignment.isValid()) {
  // 分配有效
}

// 撤销分配
assignment.revoke(assignedBy, '用户离职');
```

### 8. 使用领域服务

```typescript
import { 
  UserAssignmentDomainService,
  UserValidationDomainService 
} from '@hl8/domain-user';

// 验证邮箱唯一性
const isUnique = await userValidationService.isEmailUnique(email);

// 验证昵称唯一性
const isNicknameUnique = await userValidationService.isNicknameUnique('新昵称');

// 分配用户到组织
const orgAssignment = await userAssignmentService.assignUserToOrganization({
  userId: user.getId(),
  tenantId: tenantId,
  organizationId: organizationId,
  role: OrganizationRole.create('member'),
  assignedBy: assignedBy,
});
```

### 9. 领域事件

```typescript
// 获取领域事件
const events = user.getDomainEvents();

// 发布事件（在应用层）
await eventBus.publishAll(events);

// 清除事件
user.clearDomainEvents();
```

## 测试示例

### 单元测试

```typescript
import { describe, it, expect } from '@jest/globals';
import { User, Email, Username } from '@hl8/domain-user';
import { TenantId, UserId } from '@hl8/shared';

describe('User', () => {
  let tenantId: TenantId;

  beforeEach(() => {
    tenantId = TenantId.generate();
  });

  it('应该创建平台用户（带昵称）', () => {
    const user = User.createPlatformUser({
      tenantId: tenantId,
      username: new Username('john_doe'),
      email: new Email('john@example.com'),
      password: 'SecurePass123!',
      nickname: '约翰', // 可选
    });

    expect(user.getId()).toBeInstanceOf(UserId);
    expect(user.getId().tenantId).toEqual(tenantId);
    expect(user.getEmail().getValue()).toBe('john@example.com');
    expect(user.getNickname()).toBe('约翰');
    expect(user.getStatus().getValue()).toBe('PENDING_ACTIVATION');
  });

  it('应该创建平台用户（不带昵称，默认使用用户名）', () => {
    const user = User.createPlatformUser({
      tenantId: tenantId,
      username: new Username('john_doe'),
      email: new Email('john@example.com'),
      password: 'SecurePass123!',
      // 不提供 nickname
    });

    expect(user.getNickname()).toBe('john_doe'); // 默认使用用户名
  });

  it('应该更新用户昵称', () => {
    const user = User.createPlatformUser({
      tenantId: tenantId,
      username: new Username('john_doe'),
      email: new Email('john@example.com'),
      password: 'SecurePass123!',
    });

    const updatedBy = UserId.generate(tenantId);
    user.updateNickname('新昵称', updatedBy);

    expect(user.getNickname()).toBe('新昵称');
  });

  it('应该激活用户', () => {
    const user = User.createPlatformUser({
      tenantId: tenantId,
      username: new Username('john_doe'),
      email: new Email('john@example.com'),
      password: 'SecurePass123!',
    });

    user.activate();

    expect(user.getStatus().getValue()).toBe('ACTIVE');
    expect(user.isAvailable()).toBe(true);
  });
});
```

## 最佳实践

### 1. 值对象使用

- 始终使用值对象封装业务规则
- 使用值对象的工厂方法创建实例
- 通过 getter 方法访问值对象的内部值

### 2. 聚合根使用

- 通过聚合根的工厂方法创建实例
- 通过业务方法修改聚合根状态
- 不要直接修改聚合根的私有属性

### 3. 领域事件

- 在聚合根内部创建领域事件
- 在应用层持久化后发布事件
- 发布后清除事件

### 4. 领域服务

- 使用领域服务处理跨聚合的业务逻辑
- 领域服务应该保持无状态

### 5. Repository 接口

- Repository 接口定义在领域层
- 使用领域对象作为参数和返回值
- 不要在 Repository 接口中暴露数据库细节

## 常见问题

### Q: 如何验证邮箱格式？

A: 使用 `Email.create()` 方法，如果邮箱格式无效，会抛出 `InvalidEmailError`。

### Q: 如何检查用户状态？

A: 使用 `user.getStatus().getValue()` 获取状态值，或使用 `user.isAvailable()` 检查用户是否可用。

### Q: 如何处理领域事件？

A: 在应用层持久化聚合根后，获取领域事件并发布，然后清除事件。

### Q: 如何实现 Repository？

A: Repository 接口定义在领域层，实现放在基础设施层。使用领域对象作为参数和返回值。

## 下一步

1. 阅读 [数据模型文档](./data-model.md) 了解详细的数据模型设计
2. 阅读 [研究文档](./research.md) 了解设计决策
3. 阅读用户领域设计文档了解完整的架构设计
4. 开始实现用户领域模型


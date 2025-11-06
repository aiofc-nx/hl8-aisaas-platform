# @hl8/domain-user

用户领域模块，提供用户领域模型的核心功能，包括用户创建、状态管理、分配管理等。

## 安装

```bash
pnpm add @hl8/domain-user
```

## 功能特性

- ✅ 用户聚合根（User）- 管理用户基础信息和生命周期
- ✅ 用户分配聚合根（UserTenantAssignment、UserOrganizationAssignment）
- ✅ 用户部门分配实体（UserDepartmentAssignment）
- ✅ 值对象（Email、Username、PasswordHash、UserStatus、UserSource 等）
- ✅ 领域服务（UserValidationDomainService、UserAssignmentDomainService）
- ✅ 领域事件（UserCreatedEvent、UserActivatedEvent 等）
- ✅ 多租户支持（通过标识符设计实现数据隔离）

## 快速开始

### 创建平台用户

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

// 获取用户信息
const userId = user.getId(); // 返回 UserId（包含租户信息）
const email = user.getEmail(); // 返回 Email 值对象
const nickname = user.getNickname(); // '约翰' 或 'john_doe'（如果未提供）
```

### 创建系统用户

```typescript
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

### 用户状态管理

```typescript
// 激活用户
user.activate();

// 禁用用户
user.disable();

// 锁定用户
user.lock(new Date('2025-12-31'), '安全原因');

// 解锁用户
user.unlock();

// 检查用户是否可用
if (user.isAvailable()) {
  // 用户可用
}
```

### 用户分配管理

```typescript
import { 
  UserTenantAssignment,
  UserOrganizationAssignment,
  UserAssignmentDomainService,
  TenantRole,
  OrganizationRole
} from '@hl8/domain-user';

// 创建租户分配
const tenantAssignment = UserTenantAssignment.create({
  userId: user.getId(),
  tenantId: TenantId.generate(),
  role: new TenantRole('member'),
  assignedBy: UserId.generate(tenantId),
});

// 使用领域服务分配用户到组织
const orgAssignment = await userAssignmentService.assignUserToOrganization({
  userId: user.getId(),
  tenantId: tenantId,
  organizationId: organizationId,
  role: new OrganizationRole('admin'),
  assignedBy: assignedBy,
});
```

### 使用领域服务

```typescript
import { 
  UserValidationDomainService,
  UserAssignmentDomainService 
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
  role: new OrganizationRole('member'),
  assignedBy: assignedBy,
});
```

### 领域事件

```typescript
// 获取领域事件
const events = user.getDomainEvents();

// 发布事件（在应用层）
await eventBus.publishAll(events);

// 清除事件
user.clearDomainEvents();
```

## API 文档

### 聚合根

- **User**: 用户聚合根，管理用户基础信息和生命周期
- **UserTenantAssignment**: 用户租户分配聚合根
- **UserOrganizationAssignment**: 用户组织分配聚合根

### 实体

- **UserDepartmentAssignment**: 用户部门分配实体

### 值对象

- **Email**: 邮箱值对象
- **Username**: 用户名值对象
- **PasswordHash**: 密码哈希值对象
- **UserStatus**: 用户状态值对象
- **UserSource**: 用户来源值对象
- **TenantRole**: 租户角色值对象
- **OrganizationRole**: 组织角色值对象
- **DepartmentRole**: 部门角色值对象
- **AssignmentStatus**: 分配状态值对象

### 领域服务

- **UserValidationDomainService**: 用户验证领域服务
- **UserAssignmentDomainService**: 用户分配领域服务

### Repository 接口

- **IUserRepository**: 用户 Repository 接口
- **IUserTenantAssignmentRepository**: 用户租户分配 Repository 接口
- **IUserOrganizationAssignmentRepository**: 用户组织分配 Repository 接口
- **IUserDepartmentAssignmentRepository**: 用户部门分配 Repository 接口

### 领域事件

- **UserCreatedEvent**: 用户创建事件
- **UserActivatedEvent**: 用户激活事件
- **UserDisabledEvent**: 用户禁用事件
- **UserLockedEvent**: 用户锁定事件
- **UserUnlockedEvent**: 用户解锁事件
- **UserPasswordChangedEvent**: 用户密码修改事件
- **UserPasswordResetEvent**: 用户密码重置事件
- **UserAssignedToTenantEvent**: 用户分配到租户事件
- **UserUnassignedFromTenantEvent**: 用户从租户移除事件

### 领域异常

- **InvalidEmailError**: 无效邮箱错误
- **InvalidUsernameError**: 无效用户名错误
- **InvalidPasswordError**: 无效密码错误
- **InvalidNicknameError**: 无效昵称错误
- **EmailAlreadyExistsError**: 邮箱已存在错误
- **UsernameAlreadyExistsError**: 用户名已存在错误
- **NicknameAlreadyExistsError**: 昵称已存在错误
- 更多异常请参考源代码

## 项目结构

```
libs/domain/user/
├── src/
│   ├── domain/
│   │   ├── entities/              # 聚合根和实体
│   │   ├── value-objects/         # 值对象
│   │   ├── services/              # 领域服务
│   │   ├── repositories/          # Repository 接口
│   │   ├── events/                # 领域事件
│   │   └── exceptions/            # 领域异常
│   └── index.ts                   # 导出入口
└── package.json
```

## 开发

### 运行测试

```bash
pnpm test
```

### 运行类型检查

```bash
pnpm type-check
```

### 运行代码检查

```bash
pnpm lint:check
```

### 格式化代码

```bash
pnpm format
```

## 设计原则

本模块遵循以下设计原则：

1. **领域驱动设计（DDD）**: 使用聚合根、值对象、领域服务等 DDD 模式
2. **多租户支持**: 通过标识符设计实现数据隔离
3. **类型安全**: 使用 TypeScript 确保类型安全
4. **事件驱动**: 支持领域事件，实现松耦合架构
5. **依赖倒置**: Repository 接口定义在领域层，实现放在基础设施层

## 相关文档

- [快速开始指南](../../specs/001-user-domain/quickstart.md)
- [数据模型文档](../../specs/001-user-domain/data-model.md)
- [研究文档](../../specs/001-user-domain/research.md)
- [Domain Kernel 验证报告](../../specs/001-user-domain/domain-kernel-validation-report.md)

## 许可证

内部项目，仅供团队使用。

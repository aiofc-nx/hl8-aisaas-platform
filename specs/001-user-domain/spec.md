# Feature Specification: 用户领域模型开发

**Feature Branch**: `001-user-domain`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "我创建了用户领域模型的项目架构libs/domain/user，基于libs/shared/src/domain-kernel开发用户领域模型，同时检验libs/shared/src/domain-kernel的合理性，你可以参考docs/domain/user-domain-design.md和docs/domain-kernel"

## Constitution Check

*GATE: Must verify compliance before proceeding with specification.*

- [x] **Principle I (Chinese Priority)**: Specification MUST be written in Chinese (except Git commit messages)
- [x] **Principle II (Code as Documentation)**: All API specifications MUST include complete TSDoc-style documentation requirements
- [x] **Principle IV (Testing)**: Each user story MUST include independent test scenarios; test structure must follow constitution (unit tests co-located, integration/e2e in `test/`)

## Clarifications

### Session 2025-01-27

- Q: 密码安全策略的具体要求是什么？ → A: 最小长度 8 字符 + 复杂度要求（包含大小写字母、数字和特殊字符）
- Q: 用户名的长度和格式限制是什么？ → A: 3-30 字符，仅允许字母、数字和下划线
- Q: 邮箱地址的最大长度限制是什么？ → A: 最大 100 字符
- Q: 用户软删除后是否可以恢复？如果可以，恢复后的状态是什么？ → A: 允许恢复，恢复后状态为禁用（需要重新激活）
- Q: 当用户已处于激活状态时，再次调用激活操作应如何处理？当用户已处于失活状态时，再次调用失活操作应如何处理？ → A: 允许重复操作，视为无操作（幂等，不抛异常，不更新状态）

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 创建平台用户聚合根 (Priority: P1)

作为系统管理员，我需要能够创建平台用户，以便用户可以注册并开始使用系统。

**为什么这个优先级**：这是用户领域的核心功能，所有其他功能都依赖于用户实体的存在。没有用户实体，无法进行后续的用户管理、分配等操作。

**独立测试**：可以独立测试通过创建用户聚合根，验证其是否符合领域设计文档的要求，包括基本的用户信息、状态管理等。测试将验证 domain-kernel 的 Entity 和 AggregateRoot 基类是否满足用户领域的需求。

**Acceptance Scenarios**:

1. **Given** 系统已初始化，**When** 创建平台用户（提供用户名、邮箱、密码），**Then** 系统创建 User 聚合根，状态为待激活，昵称默认使用用户名，并发布 UserCreatedEvent 领域事件
2. **Given** 系统已初始化，**When** 创建平台用户时提供昵称，**Then** 系统创建 User 聚合根，昵称使用提供的值
3. **Given** 系统已初始化，**When** 创建平台用户时昵称已存在，**Then** 系统抛出 NicknameAlreadyExistsError 异常
4. **Given** 系统已初始化，**When** 创建平台用户时邮箱已存在，**Then** 系统抛出 EmailAlreadyExistsError 异常
5. **Given** 系统已初始化，**When** 创建平台用户时用户名已存在，**Then** 系统抛出 UsernameAlreadyExistsError 异常
6. **Given** 系统已初始化，**When** 创建平台用户时密码不符合安全策略，**Then** 系统抛出 InvalidPasswordError 异常

---

### User Story 2 - 实现用户值对象 (Priority: P1)

作为开发者，我需要实现用户领域所需的值对象（Email、UserStatus、UserSource等），以便封装业务规则和验证逻辑。

**为什么这个优先级**：值对象是领域模型的基础组件，User 聚合根依赖这些值对象来封装业务规则。同时，这些值对象的实现将验证 domain-kernel 的 ValueObject 基类是否合理。

**独立测试**：可以独立测试每个值对象的功能，包括验证逻辑、相等性比较、不可变性等。测试将验证 ValueObject 基类是否提供了足够的灵活性和功能。

**Acceptance Scenarios**:

1. **Given** 有效的邮箱地址，**When** 创建 Email 值对象，**Then** 系统创建 Email 实例并自动标准化（转小写、去除空格）
2. **Given** 无效的邮箱地址，**When** 创建 Email 值对象，**Then** 系统抛出 InvalidEmailError 异常
3. **Given** 用户状态为待激活，**When** 调用 activate() 方法，**Then** 状态转换为活跃状态
4. **Given** 用户状态为锁定，**When** 调用 unlock() 方法，**Then** 状态转换为活跃状态
5. **Given** 用户状态为活跃，**When** 调用 disable() 方法，**Then** 状态转换为禁用状态，并记录禁用原因

---

### User Story 3 - 实现用户聚合根的核心业务方法 (Priority: P1)

作为系统管理员，我需要能够管理用户的生命周期状态，包括激活、禁用、锁定、解锁等操作，以便管理用户账户。

**为什么这个优先级**：用户状态管理是用户领域的核心业务功能，是用户使用系统的基础。这些方法的实现将验证 domain-kernel 的 AuditableEntity 基类是否满足用户领域的需求。

**独立测试**：可以独立测试每个状态转换方法，验证状态转换规则是否正确执行，以及是否正确更新审计字段。测试将验证 AuditableEntity 基类的审计功能是否完善。

**Acceptance Scenarios**:

1. **Given** 用户状态为待激活，**When** 调用 activate() 方法，**Then** 用户状态变为活跃，updatedAt 和 version 更新，并发布 UserActivatedEvent
2. **Given** 用户状态为活跃，**When** 调用 disable(reason) 方法，**Then** 用户状态变为禁用，记录禁用原因，updatedAt 和 version 更新，并发布 UserDisabledEvent
3. **Given** 用户状态为活跃，**When** 调用 lock(lockedUntil, reason) 方法，**Then** 用户状态变为锁定，记录锁定到期时间和原因，updatedAt 和 version 更新，并发布 UserLockedEvent
4. **Given** 用户状态为锁定且锁定已过期，**When** 调用 unlock() 方法，**Then** 用户状态变为活跃，updatedAt 和 version 更新，并发布 UserUnlockedEvent
5. **Given** 用户状态为锁定，**When** 调用 unlock() 方法，**Then** 用户状态变为活跃，updatedAt 和 version 更新，并发布 UserUnlockedEvent
6. **Given** 用户状态为禁用，**When** 尝试调用 activate() 方法，**Then** 系统抛出 InvalidStatusTransitionError 异常

---

### User Story 4 - 实现用户租户分配聚合根 (Priority: P2)

作为系统管理员，我需要能够将平台用户分配到租户，以便用户可以在特定租户中工作。

**为什么这个优先级**：多租户是系统的核心特性，用户租户分配是实现多租户的基础。这个功能的实现将验证 domain-kernel 的标识符值对象（TenantId、UserId）是否满足分配关系的需求。

**独立测试**：可以独立测试用户租户分配的创建、撤销等操作，验证分配规则是否正确执行。测试将验证 TenantId 和 UserId 的使用是否合理。

**Acceptance Scenarios**:

1. **Given** 平台用户已存在，**When** 创建用户租户分配，**Then** 系统创建 UserTenantAssignment 聚合根，状态为活跃，并发布 UserAssignedToTenantEvent
2. **Given** 用户已分配到租户，**When** 尝试再次分配到同一租户，**Then** 系统抛出 UserAlreadyAssignedToTenantError 异常
3. **Given** 用户来源为系统用户，**When** 尝试分配到租户，**Then** 系统抛出 InvalidUserSourceError 异常
4. **Given** 用户租户分配已存在，**When** 调用 revoke(revokedBy, reason) 方法，**Then** 分配状态变为已撤销，记录撤销时间和原因，并发布 UserUnassignedFromTenantEvent
5. **Given** 用户租户分配已过期，**When** 调用 isValid() 方法，**Then** 返回 false

---

### User Story 5 - 实现用户领域服务 (Priority: P2)

作为系统管理员，我需要能够进行跨聚合的用户分配操作（分配到组织、部门），以便管理用户的组织结构关系。

**为什么这个优先级**：用户分配领域服务处理跨聚合的复杂业务逻辑，是用户领域的重要组成部分。这个功能的实现将验证 domain-kernel 的多层级标识符（OrganizationId、DepartmentId）是否满足分配关系的需求。

**独立测试**：可以独立测试用户分配到组织、部门的操作，验证分配规则和约束是否正确执行。测试将验证 OrganizationId 和 DepartmentId 的使用是否合理。

**Acceptance Scenarios**:

1. **Given** 用户已分配到租户，**When** 调用 assignUserToOrganization() 方法，**Then** 系统创建 UserOrganizationAssignment 聚合根，并验证用户已分配到租户
2. **Given** 用户未分配到租户，**When** 尝试分配到组织，**Then** 系统抛出 UserNotAssignedToTenantError 异常
3. **Given** 用户已分配到组织，**When** 调用 assignUserToDepartment() 方法，**Then** 系统创建 UserDepartmentAssignment 实体，并验证用户已分配到组织
4. **Given** 用户在同一组织内已属于某个部门，**When** 尝试分配到另一个部门，**Then** 系统抛出 UserAlreadyAssignedToDepartmentInOrganizationError 异常
5. **Given** 用户在同一组织内已属于某个部门，**When** 调用 changeUserDepartmentInOrganization() 方法，**Then** 系统撤销原部门分配并创建新部门分配

---

### User Story 6 - 实现用户验证领域服务 (Priority: P2)

作为系统，我需要能够验证邮箱、用户名和昵称的唯一性，以便确保用户数据的完整性。

**为什么这个优先级**：用户验证是用户创建和更新的前置条件，确保数据的唯一性和完整性。这个功能的实现将验证 domain-kernel 的 Repository 接口设计是否合理。

**独立测试**：可以独立测试邮箱、用户名和昵称的唯一性验证，验证验证逻辑是否正确执行。测试将验证 Repository 接口的设计是否满足领域服务的需求。

**Acceptance Scenarios**:

1. **Given** 邮箱不存在于系统中，**When** 调用 isEmailUnique(email) 方法，**Then** 返回 true
2. **Given** 邮箱已存在于系统中，**When** 调用 isEmailUnique(email) 方法，**Then** 返回 false
3. **Given** 邮箱已存在但属于当前更新用户，**When** 调用 isEmailUnique(email, excludeUserId) 方法，**Then** 返回 true
4. **Given** 用户名不存在于系统中，**When** 调用 isUsernameUnique(username) 方法，**Then** 返回 true
5. **Given** 用户名已存在于系统中，**When** 调用 isUsernameUnique(username) 方法，**Then** 返回 false
6. **Given** 昵称不存在于系统中，**When** 调用 isNicknameUnique(nickname) 方法，**Then** 返回 true
7. **Given** 昵称已存在于系统中，**When** 调用 isNicknameUnique(nickname) 方法，**Then** 返回 false
8. **Given** 昵称已存在但属于当前更新用户，**When** 调用 isNicknameUnique(nickname, excludeUserId) 方法，**Then** 返回 true

---

### User Story 7 - 验证 Domain Kernel 的合理性 (Priority: P1)

作为架构师，我需要验证 domain-kernel 组件是否满足用户领域的需求，以便确认其设计合理性和可用性。

**为什么这个优先级**：这是本次开发的核心目标之一，通过实际应用 domain-kernel 来验证其设计的合理性。如果发现不合理之处，需要及时调整 domain-kernel 的设计。

**独立测试**：在实现用户领域模型的过程中，记录 domain-kernel 的使用体验，包括：
- 基类是否提供了必要的功能
- 基类的设计是否易于使用
- 基类是否足够灵活以支持业务需求
- 是否存在功能缺失或设计不合理的地方

**Acceptance Scenarios**:

1. **Given** 使用 Entity 基类实现 User 聚合根，**When** 检查基类提供的功能，**Then** 基类提供了 ID、equals、hashCode、clone 等必要功能
2. **Given** 使用 AggregateRoot 基类实现 User 聚合根，**When** 添加领域事件，**Then** 基类提供了 addDomainEvent、getDomainEvents、clearDomainEvents 等方法
3. **Given** 使用 AuditableEntity 基类实现 User 聚合根，**When** 更新用户信息，**Then** 基类自动更新 updatedAt 和 version，并记录 updatedBy
4. **Given** 使用 ValueObject 基类实现 Email 值对象，**When** 创建值对象，**Then** 基类提供了验证、标准化、相等性比较等功能
5. **Given** 使用 TenantId、UserId、OrganizationId、DepartmentId 标识符，**When** 实现用户分配关系，**Then** 标识符提供了必要的业务方法和验证逻辑
6. **Given** 在实现过程中发现 domain-kernel 的问题，**When** 记录问题并提交反馈，**Then** 问题被记录并用于改进 domain-kernel 的设计

---

### Edge Cases

- 用户创建时邮箱格式验证的边界情况（空字符串、特殊字符、超过 100 字符的字符串等）
- 用户创建时昵称未提供时的默认值处理（使用用户名作为昵称）
- 用户创建时昵称唯一性验证的边界情况（昵称与用户名冲突、昵称与其他用户昵称冲突等）
- 用户更新昵称时的唯一性验证（排除当前用户）
- 用户状态转换的边界情况（从未激活直接到禁用、从锁定直接到过期等）
- 用户租户分配的有效期边界情况（过期时间在过去、过期时间为 null 等）
- 用户分配到组织时的层级关系验证（组织是否属于租户、部门是否属于组织等）
- 并发更新用户时的乐观锁冲突处理
- 用户软删除后的状态处理（允许恢复，恢复后状态为禁用，需要重新激活）
- 用户激活/失活状态的边界情况（已激活再次激活、已失活再次失活等，重复操作视为无操作，幂等处理）
- 领域事件的发布和订阅机制（事件丢失、重复处理等）

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统必须能够创建平台用户，包括用户名、邮箱、密码、昵称（可选，未提供时默认使用用户名）等基本信息
- **FR-031**: 系统必须支持用户昵称的更新功能，昵称长度限制为 1-50 字符，昵称必须唯一（平台级别）
- **FR-032**: 系统必须验证昵称唯一性，如果昵称未提供则默认使用用户名
- **FR-002**: 系统必须验证邮箱格式和唯一性，邮箱地址长度不能超过 100 字符
- **FR-003**: 系统必须验证用户名唯一性，用户名长度必须在 3-30 字符之间，仅允许字母、数字和下划线
- **FR-004**: 系统必须验证密码符合安全策略：最小长度 8 字符，必须包含大小写字母、数字和特殊字符
- **FR-005**: 系统必须支持用户状态管理（待激活、活跃、禁用、锁定、过期）
- **FR-006**: 系统必须支持用户状态转换，包括激活、禁用、锁定、解锁等操作
- **FR-007**: 系统必须记录用户操作的审计信息（创建时间、更新时间、操作人等）
- **FR-008**: 系统必须支持用户软删除功能，软删除后的用户可以恢复，恢复后状态为禁用（需要重新激活）
- **FR-009**: 系统必须支持用户激活/失活状态管理，重复操作视为无操作（幂等，不抛异常，不更新状态）
- **FR-010**: 系统必须支持用户密码修改和重置功能
- **FR-011**: 系统必须支持用户密码验证功能
- **FR-012**: 系统必须支持用户租户分配功能
- **FR-013**: 系统必须支持用户租户分配的撤销功能
- **FR-014**: 系统必须支持用户租户分配的有效期管理
- **FR-015**: 系统必须支持用户组织分配功能
- **FR-016**: 系统必须支持用户部门分配功能
- **FR-017**: 系统必须支持用户在组织内部门调整功能
- **FR-018**: 系统必须支持领域事件的发布和订阅机制
- **FR-019**: 系统必须支持乐观锁机制，防止并发更新冲突
- **FR-020**: 系统必须支持多租户数据隔离
- **FR-021**: 系统必须支持多层级数据隔离（租户、组织、部门）
- **FR-022**: 值对象必须封装业务规则和验证逻辑
- **FR-023**: 值对象必须支持不可变性和相等性比较
- **FR-024**: 聚合根必须保证业务一致性边界
- **FR-025**: 聚合根必须支持领域事件的发布
- **FR-026**: 领域服务必须处理跨聚合的业务逻辑
- **FR-027**: Repository 接口必须定义在领域层
- **FR-028**: 所有代码必须遵循 TSDoc 注释规范，使用中文注释
- **FR-029**: 所有公共 API 必须包含完整的 TSDoc 注释
- **FR-030**: 所有代码必须遵循项目编码规范（ESLint、Prettier）

### Key Entities *(include if feature involves data)*

- **User（用户聚合根）**：管理用户的基础身份信息和生命周期，包含用户名、邮箱、密码、昵称、状态、来源等属性，支持状态转换、密码管理等操作
- **UserTenantAssignment（用户租户分配聚合根）**：管理用户与租户的分配关系，包含用户ID、租户ID、角色、状态、有效期等属性，支持分配和撤销操作
- **UserOrganizationAssignment（用户组织分配聚合根）**：管理用户与组织的分配关系，包含用户ID、租户ID、组织ID、角色等属性
- **UserDepartmentAssignment（用户部门分配实体）**：管理用户与部门的分配关系，包含用户ID、组织ID、部门ID、角色等属性
- **Email（邮箱值对象）**：封装邮箱地址的验证和格式化逻辑，确保邮箱格式正确
- **UserStatus（用户状态值对象）**：封装用户状态的业务规则和状态转换逻辑
- **UserSource（用户来源值对象）**：封装用户来源的业务规则
- **Username（用户名值对象）**：封装用户名的验证和格式化逻辑
- **PasswordHash（密码哈希值对象）**：封装密码的哈希和验证逻辑

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户领域模型的核心聚合根（User、UserTenantAssignment）实现完成，覆盖所有核心业务方法
- **SC-002**: 用户领域模型的核心值对象（Email、UserStatus、UserSource等）实现完成，覆盖所有业务规则
- **SC-003**: 用户领域模型的核心领域服务（UserAssignmentDomainService、UserValidationDomainService）实现完成
- **SC-004**: 所有核心功能的单元测试覆盖率 ≥ 80%，关键路径测试覆盖率 ≥ 90%
- **SC-005**: 所有代码通过 ESLint 和 Prettier 检查，无错误和警告
- **SC-006**: 所有公共 API 包含完整的 TSDoc 中文注释，符合项目规范
- **SC-007**: 用户领域模型能够正确使用 domain-kernel 的所有核心组件（Entity、AggregateRoot、AuditableEntity、ValueObject、标识符等）
- **SC-008**: 在实现过程中识别并记录 domain-kernel 的潜在问题或改进建议，形成验证报告
- **SC-009**: 用户领域模型符合领域驱动设计（DDD）和清洁架构（Clean Architecture）原则
- **SC-010**: 用户领域模型的实现与用户领域设计文档（docs/domain/user-domain-design.md）保持一致

## Assumptions

- 用户领域模型将使用 domain-kernel 提供的所有核心组件，包括 Entity、AggregateRoot、AuditableEntity、ValueObject 等
- 用户领域模型将使用 domain-kernel 提供的标识符值对象，包括 EntityId、TenantId、UserId、OrganizationId、DepartmentId 等
- 用户领域模型将遵循项目编码规范，使用 TypeScript、ESM 模块系统、NodeNext 模块解析等
- 用户领域模型将使用 Jest 进行单元测试，测试文件与被测试文件在同一目录
- 用户领域模型将使用 TSDoc 规范进行代码注释，使用中文注释
- 用户领域模型将支持多租户和多层级数据隔离，使用 domain-kernel 提供的相应基类
- 用户领域模型将支持领域事件，使用 domain-kernel 提供的 AggregateRoot 基类
- 用户领域模型将支持审计追踪，使用 domain-kernel 提供的 AuditableEntity 基类
- 密码安全策略要求：最小长度 8 字符，必须包含大小写字母、数字和特殊字符
- 用户状态转换规则将符合业务需求（待激活可以激活、活跃可以禁用/锁定等）

## Dependencies

- **@hl8/shared**：依赖 domain-kernel 组件库，提供实体基类、值对象基类、标识符值对象等
- **用户领域设计文档**：参考 docs/domain/user-domain-design.md 进行实现
- **Domain Kernel 文档**：参考 docs/domain-kernel 进行使用
- **多租户数据隔离技术方案**：参考 docs/multi-tenant/multi-tenant-data-isolation-technical-solution.md 进行多租户支持

## Out of Scope

- 用户接口层（REST API、GraphQL）的实现
- 用户应用层（Use Cases）的实现
- 用户基础设施层（Repository 实现、数据库访问）的实现
- 用户权限和角色管理的实现（属于权限领域）
- 用户认证和授权的实现（属于认证领域）
- 用户密码重置的邮件通知功能（属于基础设施层）
- 用户数据的持久化实现（属于基础设施层）
- 用户数据的查询和报表功能（属于应用层）

## Domain Kernel 验证要点

在实现用户领域模型的过程中，需要特别关注以下方面，以验证 domain-kernel 的合理性：

1. **基类功能完整性**：验证 Entity、AggregateRoot、AuditableEntity、ValueObject 等基类是否提供了必要的功能
2. **基类易用性**：验证基类的使用是否简单直观，是否需要过多的样板代码
3. **基类灵活性**：验证基类是否足够灵活，能够支持各种业务场景
4. **标识符设计**：验证 TenantId、UserId、OrganizationId、DepartmentId 等标识符的设计是否合理
5. **多租户支持**：验证 TenantAwareEntity、MultiLevelIsolatedEntity 等基类是否满足多租户需求
6. **审计功能**：验证 AuditableEntity 的审计功能是否完善，是否满足业务需求
7. **领域事件**：验证 AggregateRoot 的领域事件功能是否完善，是否满足业务需求
8. **值对象功能**：验证 ValueObject 基类是否提供了足够的灵活性，支持各种值对象场景
9. **类型安全**：验证 domain-kernel 的类型定义是否完善，是否提供了足够的类型安全
10. **文档完整性**：验证 domain-kernel 的文档是否完整，是否易于理解和使用

如果发现 domain-kernel 的问题，需要记录并提交反馈，以便改进 domain-kernel 的设计。

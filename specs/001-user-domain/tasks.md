# Tasks: 用户领域模型开发

**Input**: Design documents from `/specs/001-user-domain/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: 根据项目规范，需要为所有核心功能编写单元测试（单元测试与源代码同目录，`.spec.ts` 文件）

**Constitution Compliance**: All tasks MUST comply with project constitution:
- Code comments and documentation in Chinese (Principle I)
- Complete TSDoc comments for all public APIs (Principle II)
- NodeNext module system, no CommonJS (Principle III)
- Test structure: unit tests co-located (`*.spec.ts`), integration/e2e in `test/` directory (Principle IV)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Source code: `libs/domain/user/src/domain/`
- Unit tests: Co-located with source files (`*.spec.ts`)
- Integration tests: `libs/domain/user/test/integration/`
- E2E tests: `libs/domain/user/test/e2e/`

---

## Phase 1: Setup (Project Initialization)

**Purpose**: 项目初始化和目录结构创建

- [x] T001 创建项目目录结构（entities/, value-objects/, services/, repositories/, events/, exceptions/）在 libs/domain/user/src/domain/
- [x] T002 验证 package.json 配置，确保依赖 @hl8/shared 正确
- [x] T003 验证 tsconfig.json 配置，确保使用 NodeNext 模块系统
- [x] T004 验证 jest.config.cjs 配置，确保测试配置正确
- [x] T005 验证 eslint.config.mjs 配置，确保代码规范检查正确

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 基础组件（领域异常和领域事件），这些是所有用户故事的基础依赖

**⚠️ CRITICAL**: 这些异常和事件是领域层的通用组件，需要先实现

### Domain Exceptions (领域异常)

- [x] T006 [P] 创建 InvalidEmailError 异常类在 libs/domain/user/src/domain/exceptions/invalid-email.error.ts
- [x] T007 [P] 创建 InvalidUsernameError 异常类在 libs/domain/user/src/domain/exceptions/invalid-username.error.ts
- [x] T008 [P] 创建 InvalidPasswordError 异常类在 libs/domain/user/src/domain/exceptions/invalid-password.error.ts
- [x] T009 [P] 创建 InvalidNicknameError 异常类在 libs/domain/user/src/domain/exceptions/invalid-nickname.error.ts
- [x] T010 [P] 创建 EmailAlreadyExistsError 异常类在 libs/domain/user/src/domain/exceptions/email-already-exists.error.ts
- [x] T011 [P] 创建 UsernameAlreadyExistsError 异常类在 libs/domain/user/src/domain/exceptions/username-already-exists.error.ts
- [x] T012 [P] 创建 NicknameAlreadyExistsError 异常类在 libs/domain/user/src/domain/exceptions/nickname-already-exists.error.ts
- [x] T013 [P] 创建 InvalidStatusTransitionError 异常类在 libs/domain/user/src/domain/exceptions/invalid-status-transition.error.ts
- [x] T014 [P] 创建 UserNotAssignedToTenantError 异常类在 libs/domain/user/src/domain/exceptions/user-not-assigned-to-tenant.error.ts
- [x] T015 [P] 创建 UserAlreadyAssignedToTenantError 异常类在 libs/domain/user/src/domain/exceptions/user-already-assigned-to-tenant.error.ts
- [x] T016 [P] 创建 InvalidUserSourceError 异常类在 libs/domain/user/src/domain/exceptions/invalid-user-source.error.ts
- [x] T017 [P] 创建 UserNotAssignedToOrganizationError 异常类在 libs/domain/user/src/domain/exceptions/user-not-assigned-to-organization.error.ts
- [x] T018 [P] 创建 UserAlreadyAssignedToOrganizationError 异常类在 libs/domain/user/src/domain/exceptions/user-already-assigned-to-organization.error.ts
- [x] T019 [P] 创建 UserNotAssignedToDepartmentError 异常类在 libs/domain/user/src/domain/exceptions/user-not-assigned-to-department.error.ts
- [x] T020 [P] 创建 UserAlreadyAssignedToDepartmentError 异常类在 libs/domain/user/src/domain/exceptions/user-already-assigned-to-department.error.ts
- [x] T021 [P] 创建 UserAlreadyAssignedToDepartmentInOrganizationError 异常类在 libs/domain/user/src/domain/exceptions/user-already-assigned-to-department-in-organization.error.ts

### Domain Events (领域事件)

- [x] T022 [P] 创建 UserCreatedEvent 领域事件在 libs/domain/user/src/domain/events/user-created.event.ts
- [x] T023 [P] 创建 UserActivatedEvent 领域事件在 libs/domain/user/src/domain/events/user-activated.event.ts
- [x] T024 [P] 创建 UserDisabledEvent 领域事件在 libs/domain/user/src/domain/events/user-disabled.event.ts
- [x] T025 [P] 创建 UserLockedEvent 领域事件在 libs/domain/user/src/domain/events/user-locked.event.ts
- [x] T026 [P] 创建 UserUnlockedEvent 领域事件在 libs/domain/user/src/domain/events/user-unlocked.event.ts
- [x] T027 [P] 创建 UserPasswordChangedEvent 领域事件在 libs/domain/user/src/domain/events/user-password-changed.event.ts
- [x] T028 [P] 创建 UserPasswordResetEvent 领域事件在 libs/domain/user/src/domain/events/user-password-reset.event.ts
- [x] T029 [P] 创建 UserAssignedToTenantEvent 领域事件在 libs/domain/user/src/domain/events/user-assigned-to-tenant.event.ts
- [x] T030 [P] 创建 UserUnassignedFromTenantEvent 领域事件在 libs/domain/user/src/domain/events/user-unassigned-from-tenant.event.ts

**Checkpoint**: 基础异常和事件已创建，可以开始实现值对象和聚合根

---

## Phase 3: User Story 2 - 实现用户值对象 (Priority: P1) 🎯 MVP Foundation

**Goal**: 实现用户领域所需的值对象（Email、UserStatus、UserSource、Username、PasswordHash），封装业务规则和验证逻辑

**Independent Test**: 可以独立测试每个值对象的功能，包括验证逻辑、相等性比较、不可变性等

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T031 [P] [US2] 编写 Email 值对象单元测试在 libs/domain/user/src/domain/value-objects/email.vo.spec.ts
- [x] T032 [P] [US2] 编写 Username 值对象单元测试在 libs/domain/user/src/domain/value-objects/username.vo.spec.ts
- [x] T033 [P] [US2] 编写 UserStatus 值对象单元测试在 libs/domain/user/src/domain/value-objects/user-status.vo.spec.ts
- [x] T034 [P] [US2] 编写 UserSource 值对象单元测试在 libs/domain/user/src/domain/value-objects/user-source.vo.spec.ts
- [x] T035 [P] [US2] 编写 PasswordHash 值对象单元测试在 libs/domain/user/src/domain/value-objects/password-hash.vo.spec.ts

### Implementation for User Story 2

- [x] T036 [P] [US2] 实现 Email 值对象在 libs/domain/user/src/domain/value-objects/email.vo.ts（继承 ValueObject<string>，验证规则、标准化、getDomain方法）
- [x] T037 [P] [US2] 实现 Username 值对象在 libs/domain/user/src/domain/value-objects/username.vo.ts（继承 ValueObject<string>，验证规则、标准化）
- [x] T038 [P] [US2] 实现 UserStatus 值对象在 libs/domain/user/src/domain/value-objects/user-status.vo.ts（继承 ValueObject<UserStatusEnum>，状态转换规则、工厂方法）
- [x] T039 [P] [US2] 实现 UserSource 值对象在 libs/domain/user/src/domain/value-objects/user-source.vo.ts（继承 ValueObject<UserSourceEnum>，工厂方法）
- [x] T040 [P] [US2] 实现 PasswordHash 值对象在 libs/domain/user/src/domain/value-objects/password-hash.vo.ts（继承 ValueObject<string>，验证规则、工厂方法，注意：哈希实现由基础设施层提供）

**Checkpoint**: 所有值对象已实现并通过测试，可以开始实现 User 聚合根

---

## Phase 4: User Story 1 - 创建平台用户聚合根 (Priority: P1) 🎯 MVP Core

**Goal**: 实现 User 聚合根，支持创建平台用户和系统用户，包括基础身份信息管理

**Independent Test**: 可以独立测试通过创建用户聚合根，验证其是否符合领域设计文档的要求，包括基本的用户信息、状态管理等

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T041 [US1] 编写 User 聚合根单元测试在 libs/domain/user/src/domain/entities/user.entity.spec.ts（覆盖创建、基本属性、默认值、唯一性验证等场景）

### Implementation for User Story 1

- [x] T042 [US1] 创建 IUserRepository 接口在 libs/domain/user/src/domain/repositories/user.repository.ts（定义所有 Repository 方法）
- [x] T043 [US1] 实现 User 聚合根类在 libs/domain/user/src/domain/entities/user.entity.ts（继承 AggregateRoot，实现 createPlatformUser、createSystemUser、基本属性和getter方法）
- [x] T044 [US1] 实现 User 聚合根的昵称默认值逻辑（如果未提供昵称，默认使用用户名）
- [x] T045 [US1] 实现 User 聚合根的昵称验证逻辑（长度、格式、唯一性验证）
- [x] T046 [US1] 实现 User 聚合根的 clone 方法

**Checkpoint**: User 聚合根已实现，可以创建用户并获取基本信息，可以开始实现状态管理功能

---

## Phase 5: User Story 3 - 实现用户聚合根的核心业务方法 (Priority: P1)

**Goal**: 实现用户状态管理功能，包括激活、禁用、锁定、解锁、密码修改、密码重置等核心业务方法

**Independent Test**: 可以独立测试每个状态转换方法，验证状态转换规则是否正确执行，以及是否正确更新审计字段

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T047 [US3] 扩展 User 聚合根单元测试，添加状态转换测试场景在 libs/domain/user/src/domain/entities/user.entity.spec.ts（覆盖 activate、disable、lock、unlock、密码管理等方法）

### Implementation for User Story 3

- [ ] T048 [US3] 实现 User 聚合根的 activate 方法（状态转换、审计字段更新、领域事件发布）
- [ ] T049 [US3] 实现 User 聚合根的 disable 方法（状态转换、记录原因、审计字段更新、领域事件发布）
- [ ] T050 [US3] 实现 User 聚合根的 lock 方法（状态转换、记录锁定到期时间和原因、审计字段更新、领域事件发布）
- [ ] T051 [US3] 实现 User 聚合根的 unlock 方法（状态转换、审计字段更新、领域事件发布）
- [ ] T052 [US3] 实现 User 聚合根的 updateNickname 方法（验证唯一性、更新昵称、审计字段更新）
- [ ] T053 [US3] 实现 User 聚合根的 updateProfile 方法（更新用户档案、审计字段更新）
- [ ] T054 [US3] 实现 User 聚合根的 changePassword 方法（验证旧密码、更新密码、审计字段更新、领域事件发布）
- [ ] T055 [US3] 实现 User 聚合根的 resetPassword 方法（管理员操作、更新密码、审计字段更新、领域事件发布）
- [ ] T056 [US3] 实现 User 聚合根的 verifyPassword 方法（密码验证）
- [ ] T057 [US3] 实现 User 聚合根的 isAvailable 方法（检查用户是否可用）

**Checkpoint**: User 聚合根的核心业务方法已实现，用户状态管理和密码管理功能完整

---

## Phase 6: User Story 6 - 实现用户验证领域服务 (Priority: P2)

**Goal**: 实现用户验证领域服务，支持邮箱、用户名和昵称的唯一性验证

**Independent Test**: 可以独立测试邮箱、用户名和昵称的唯一性验证，验证验证逻辑是否正确执行

### Tests for User Story 6

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T058 [US6] 编写 UserValidationDomainService 单元测试在 libs/domain/user/src/domain/services/user-validation.service.spec.ts（覆盖所有验证方法、边界情况）

### Implementation for User Story 6

- [ ] T059 [US6] 实现 UserValidationDomainService 类在 libs/domain/user/src/domain/services/user-validation.service.ts（实现 isEmailUnique、isUsernameUnique、isNicknameUnique 方法）

**Checkpoint**: 用户验证领域服务已实现，可以验证邮箱、用户名和昵称的唯一性

---

## Phase 7: User Story 4 - 实现用户租户分配聚合根 (Priority: P2)

**Goal**: 实现 UserTenantAssignment 聚合根，支持用户与租户的分配关系管理

**Independent Test**: 可以独立测试用户租户分配的创建、撤销等操作，验证分配规则是否正确执行

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T060 [US4] 编写 UserTenantAssignment 聚合根单元测试在 libs/domain/user/src/domain/entities/user-tenant-assignment.entity.spec.ts（覆盖创建、撤销、有效性检查等场景）

### Implementation for User Story 4

- [ ] T061 [US4] 创建 IUserTenantAssignmentRepository 接口在 libs/domain/user/src/domain/repositories/user-tenant-assignment.repository.ts
- [ ] T062 [US4] 实现 UserTenantAssignment 聚合根类在 libs/domain/user/src/domain/entities/user-tenant-assignment.entity.ts（继承 AggregateRoot，实现 create、revoke、isValid 方法）
- [ ] T063 [US4] 实现 UserTenantAssignment 的业务规则验证（只有平台用户可以被分配、不能重复分配等）
- [ ] T064 [US4] 实现 UserTenantAssignment 的有效期管理逻辑
- [ ] T065 [US4] 实现 UserTenantAssignment 的 clone 方法

**Checkpoint**: UserTenantAssignment 聚合根已实现，可以管理用户与租户的分配关系

---

## Phase 8: User Story 5 - 实现用户领域服务 (Priority: P2)

**Goal**: 实现用户分配领域服务，支持跨聚合的用户分配操作（分配到组织、部门）

**Independent Test**: 可以独立测试用户分配到组织、部门的操作，验证分配规则和约束是否正确执行

### Tests for User Story 5

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T066 [US5] 编写 UserOrganizationAssignment 聚合根单元测试在 libs/domain/user/src/domain/entities/user-organization-assignment.entity.spec.ts
- [ ] T067 [US5] 编写 UserDepartmentAssignment 实体单元测试在 libs/domain/user/src/domain/entities/user-department-assignment.entity.spec.ts
- [ ] T068 [US5] 编写 UserAssignmentDomainService 单元测试在 libs/domain/user/src/domain/services/user-assignment.service.spec.ts

### Implementation for User Story 5

- [ ] T069 [US5] 创建 IUserOrganizationAssignmentRepository 接口在 libs/domain/user/src/domain/repositories/user-organization-assignment.repository.ts
- [ ] T070 [US5] 创建 IUserDepartmentAssignmentRepository 接口在 libs/domain/user/src/domain/repositories/user-department-assignment.repository.ts
- [ ] T071 [US5] 实现 UserOrganizationAssignment 聚合根类在 libs/domain/user/src/domain/entities/user-organization-assignment.entity.ts
- [ ] T072 [US5] 实现 UserDepartmentAssignment 实体类在 libs/domain/user/src/domain/entities/user-department-assignment.entity.ts
- [ ] T073 [US5] 实现 UserAssignmentDomainService 类在 libs/domain/user/src/domain/services/user-assignment.service.ts（实现 assignUserToOrganization、assignUserToDepartment、changeUserDepartmentInOrganization 方法）
- [ ] T074 [US5] 实现跨聚合的业务规则验证（组织分配必须基于租户分配、部门分配必须基于组织分配等）

**Checkpoint**: 用户分配领域服务和相关聚合根已实现，可以管理用户在组织层级中的分配关系

---

## Phase 9: User Story 7 - 验证 Domain Kernel 的合理性 (Priority: P1)

**Goal**: 在实现过程中持续验证 domain-kernel 组件的合理性，记录发现的问题和改进建议

**Independent Test**: 在实现用户领域模型的过程中，记录 domain-kernel 的使用体验和发现的问题

### Implementation for User Story 7

- [ ] T075 [US7] 在实现过程中记录 domain-kernel 基类功能完整性验证（Entity、AggregateRoot、AuditableEntity、ValueObject）
- [ ] T076 [US7] 在实现过程中记录 domain-kernel 基类易用性验证（使用是否简单直观、是否需要过多样板代码）
- [ ] T077 [US7] 在实现过程中记录 domain-kernel 基类灵活性验证（是否足够灵活支持业务需求）
- [ ] T078 [US7] 在实现过程中记录 domain-kernel 标识符设计验证（TenantId、UserId、OrganizationId、DepartmentId）
- [ ] T079 [US7] 在实现过程中记录 domain-kernel 多租户支持验证（TenantAwareEntity、MultiLevelIsolatedEntity）
- [ ] T080 [US7] 在实现过程中记录 domain-kernel 审计功能验证（AuditableEntity 的审计功能）
- [ ] T081 [US7] 在实现过程中记录 domain-kernel 领域事件功能验证（AggregateRoot 的领域事件功能）
- [ ] T082 [US7] 在实现过程中记录 domain-kernel 值对象功能验证（ValueObject 基类的灵活性）
- [ ] T083 [US7] 在实现过程中记录 domain-kernel 类型安全验证（类型定义是否完善）
- [ ] T084 [US7] 在实现过程中记录 domain-kernel 文档完整性验证（文档是否完整、易于理解）
- [ ] T085 [US7] 整理 domain-kernel 验证报告，记录发现的问题和改进建议

**Checkpoint**: Domain-kernel 验证报告已创建，记录了使用体验和改进建议

---

## Phase 10: Export & Integration (导出和集成)

**Purpose**: 创建导出入口，确保所有组件可以被正确导入使用

- [ ] T086 创建 index.ts 导出文件在 libs/domain/user/src/index.ts（导出所有聚合根、值对象、领域服务、Repository接口、领域事件、异常）
- [ ] T087 验证所有导出路径正确，确保可以正常导入使用
- [ ] T088 验证模块导出符合 ESM 规范（使用 .js 扩展名）

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: 代码质量检查、文档完善和最终验证

### Code Quality

- [ ] T089 [P] 运行 ESLint 检查所有代码，修复所有代码规范问题
- [ ] T090 [P] 运行 Prettier 格式化所有代码
- [ ] T091 [P] 运行 TypeScript 类型检查，确保无类型错误
- [ ] T092 [P] 运行所有单元测试，确保测试通过
- [ ] T093 [P] 检查测试覆盖率，确保核心功能 ≥80%，关键路径 ≥90%

### Documentation

- [ ] T094 [P] 验证所有公共 API 包含完整的 TSDoc 中文注释
- [ ] T095 [P] 验证所有代码注释符合 TSDoc 规范
- [ ] T096 [P] 更新 README.md，添加使用说明和示例

### Domain Kernel Validation

- [ ] T097 完成 domain-kernel 验证报告，总结使用体验和改进建议
- [ ] T098 验证所有 domain-kernel 组件使用正确

### Final Validation

- [ ] T099 验证所有功能需求已实现（对照 spec.md 中的 FR-001 到 FR-032）
- [ ] T100 验证所有成功标准已达成（对照 spec.md 中的 SC-001 到 SC-010）
- [ ] T101 运行 quickstart.md 中的示例代码，确保可以正常工作
- [ ] T102 验证代码符合项目章程要求（Principle I-IV）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 2 (Phase 3)**: Depends on Foundational - 值对象是聚合根的基础
- **User Story 1 (Phase 4)**: Depends on User Story 2 - User 聚合根依赖值对象
- **User Story 3 (Phase 5)**: Depends on User Story 1 - 状态管理依赖 User 聚合根
- **User Story 6 (Phase 6)**: Depends on User Story 1 - 验证服务依赖 User 聚合根和 Repository 接口
- **User Story 4 (Phase 7)**: Depends on User Story 1 - 分配聚合根依赖 User 聚合根
- **User Story 5 (Phase 8)**: Depends on User Story 1 and User Story 4 - 分配服务依赖 User 和 UserTenantAssignment
- **User Story 7 (Phase 9)**: Runs throughout implementation - 贯穿整个实现过程
- **Export & Integration (Phase 10)**: Depends on all user stories completion
- **Polish (Phase 11)**: Depends on all implementation phases completion

### User Story Dependencies

- **User Story 2 (P1)**: 值对象 - 基础组件，无依赖，应该最先实现
- **User Story 1 (P1)**: User 聚合根 - 依赖 User Story 2（值对象）
- **User Story 3 (P1)**: 用户状态管理 - 依赖 User Story 1（User 聚合根）
- **User Story 6 (P2)**: 验证服务 - 依赖 User Story 1（User 聚合根和 Repository 接口）
- **User Story 4 (P2)**: 租户分配 - 依赖 User Story 1（User 聚合根）
- **User Story 5 (P2)**: 分配服务 - 依赖 User Story 1 和 User Story 4
- **User Story 7 (P1)**: Domain Kernel 验证 - 贯穿整个过程，可以与其他故事并行

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Value objects before entities
- Entities before services
- Repository interfaces before services
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: T002-T005 can run in parallel
- **Phase 2**: All exception tasks (T006-T021) can run in parallel
- **Phase 2**: All event tasks (T022-T030) can run in parallel
- **Phase 3**: All test tasks (T031-T035) can run in parallel
- **Phase 3**: All value object implementation tasks (T036-T040) can run in parallel
- **Phase 8**: Repository interface tasks (T069-T070) can run in parallel
- **Phase 8**: Entity implementation tasks (T071-T072) can run in parallel
- **Phase 9**: All validation recording tasks (T075-T084) can run in parallel
- **Phase 11**: All code quality tasks (T089-T093) can run in parallel
- **Phase 11**: All documentation tasks (T094-T096) can run in parallel

---

## Parallel Example: Phase 3 (User Story 2)

```bash
# Launch all value object tests together:
Task: T031 [US2] 编写 Email 值对象单元测试
Task: T032 [US2] 编写 Username 值对象单元测试
Task: T033 [US2] 编写 UserStatus 值对象单元测试
Task: T034 [US2] 编写 UserSource 值对象单元测试
Task: T035 [US2] 编写 PasswordHash 值对象单元测试

# Launch all value object implementations together (after tests):
Task: T036 [US2] 实现 Email 值对象
Task: T037 [US2] 实现 Username 值对象
Task: T038 [US2] 实现 UserStatus 值对象
Task: T039 [US2] 实现 UserSource 值对象
Task: T040 [US2] 实现 PasswordHash 值对象
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 2 (值对象)
4. Complete Phase 4: User Story 1 (User 聚合根)
5. Complete Phase 5: User Story 3 (状态管理)
6. **STOP and VALIDATE**: Test User Stories 1, 2, 3 independently
7. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 2 (值对象) → Test independently → Foundation complete
3. Add User Story 1 (User 聚合根) → Test independently → Core entity ready
4. Add User Story 3 (状态管理) → Test independently → Core functionality complete (MVP!)
5. Add User Story 6 (验证服务) → Test independently → Validation ready
6. Add User Story 4 (租户分配) → Test independently → Multi-tenancy support
7. Add User Story 5 (分配服务) → Test independently → Full assignment support
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 2 (值对象)
   - Developer B: User Story 7 (Domain Kernel 验证 - 贯穿整个过程)
3. Once User Story 2 is done:
   - Developer A: User Story 1 (User 聚合根)
   - Developer B: User Story 7 (继续验证)
4. Once User Story 1 is done:
   - Developer A: User Story 3 (状态管理)
   - Developer B: User Story 6 (验证服务)
   - Developer C: User Story 4 (租户分配)
5. Once User Story 4 is done:
   - Developer A: User Story 5 (分配服务)
   - Developer B: User Story 7 (完成验证报告)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Write tests FIRST, ensure they FAIL before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Domain Kernel validation (User Story 7) should run throughout implementation
- All code must follow TSDoc Chinese comment standards
- All code must use NodeNext module system (ESM with .js extensions)
- Test files should be co-located with source files (`.spec.ts`)


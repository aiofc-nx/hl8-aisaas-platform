# Implementation Plan: 用户领域模型开发

**Branch**: `001-user-domain` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-user-domain/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

基于 `@hl8/shared` 的 `domain-kernel` 组件库开发用户领域模型，实现用户聚合根、值对象、领域服务等核心组件，同时验证 `domain-kernel` 的设计合理性。本功能将实现用户的基础身份管理、状态管理、分配关系管理等功能，为后续的应用层和基础设施层提供领域层支持。

**技术方案**：
- 使用 `domain-kernel` 提供的基类（Entity、AggregateRoot、AuditableEntity、ValueObject）
- 使用 `domain-kernel` 提供的标识符值对象（EntityId、TenantId、UserId、OrganizationId、DepartmentId）
- 遵循 DDD 和 Clean Architecture 原则
- 实现完整的领域模型，包括聚合根、值对象、领域服务和 Repository 接口

## Technical Context

**Language/Version**: TypeScript 5.9.3, Node.js >=20  
**Primary Dependencies**: `@hl8/shared` (domain-kernel 组件库)  
**Storage**: N/A (仅领域层，不涉及持久化实现)  
**Testing**: Jest 30.2.0 with ts-jest  
**Target Platform**: Node.js 运行时环境  
**Project Type**: Monorepo 中的领域模块包  
**Performance Goals**: N/A (领域层专注于业务逻辑，性能由基础设施层保证)  
**Constraints**: 
- 必须使用 NodeNext 模块系统（ESM）
- 必须遵循项目编码规范（ESLint、Prettier）
- 必须使用 TSDoc 中文注释
- 单元测试覆盖率 ≥80%（核心逻辑），≥90%（关键路径）
**Scale/Scope**: 
- 实现 4 个聚合根（User、UserTenantAssignment、UserOrganizationAssignment、UserDepartmentAssignment）
- 实现 5 个值对象（Email、UserStatus、UserSource、Username、PasswordHash）
- 实现 2 个领域服务（UserAssignmentDomainService、UserValidationDomainService）
- 实现多个 Repository 接口

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Principle I (Chinese Priority)**: All code comments, documentation, error messages MUST use Chinese (Git commit messages use English)
- [x] **Principle II (Code as Documentation)**: All public APIs, classes, methods, interfaces, enums MUST have complete TSDoc comments in Chinese
- [x] **Principle III (Technology Stack)**: Project MUST use Node.js + TypeScript with NodeNext module system (no CommonJS)
- [x] **Principle IV (Testing)**: Unit tests co-located with source (`*.spec.ts`), integration/e2e tests in `test/` directory; coverage ≥80% for core logic, ≥90% for critical paths

## Project Structure

### Documentation (this feature)

```text
specs/001-user-domain/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
libs/domain/user/
├── src/
│   ├── domain/                    # 领域层
│   │   ├── entities/              # 实体（聚合根）
│   │   │   ├── user.entity.ts
│   │   │   ├── user-tenant-assignment.entity.ts
│   │   │   ├── user-organization-assignment.entity.ts
│   │   │   └── user-department-assignment.entity.ts
│   │   ├── value-objects/         # 值对象
│   │   │   ├── email.vo.ts
│   │   │   ├── user-status.vo.ts
│   │   │   ├── user-source.vo.ts
│   │   │   ├── username.vo.ts
│   │   │   └── password-hash.vo.ts
│   │   ├── services/              # 领域服务
│   │   │   ├── user-assignment.service.ts
│   │   │   └── user-validation.service.ts
│   │   ├── repositories/          # Repository 接口
│   │   │   ├── user.repository.ts
│   │   │   ├── user-tenant-assignment.repository.ts
│   │   │   ├── user-organization-assignment.repository.ts
│   │   │   └── user-department-assignment.repository.ts
│   │   ├── events/                # 领域事件
│   │   │   ├── user-created.event.ts
│   │   │   ├── user-activated.event.ts
│   │   │   ├── user-disabled.event.ts
│   │   │   ├── user-locked.event.ts
│   │   │   ├── user-unlocked.event.ts
│   │   │   ├── user-password-changed.event.ts
│   │   │   ├── user-password-reset.event.ts
│   │   │   ├── user-assigned-to-tenant.event.ts
│   │   │   └── user-unassigned-from-tenant.event.ts
│   │   └── exceptions/            # 领域异常
│   │       ├── invalid-email.error.ts
│   │       ├── invalid-username.error.ts
│   │       ├── invalid-password.error.ts
│   │       ├── email-already-exists.error.ts
│   │       ├── username-already-exists.error.ts
│   │       ├── invalid-status-transition.error.ts
│   │       ├── invalid-password.error.ts
│   │       ├── user-not-assigned-to-tenant.error.ts
│   │       ├── user-already-assigned-to-tenant.error.ts
│   │       ├── user-not-assigned-to-organization.error.ts
│   │       ├── user-already-assigned-to-organization.error.ts
│   │       ├── user-not-assigned-to-department.error.ts
│   │       ├── user-already-assigned-to-department.error.ts
│   │       └── invalid-user-source.error.ts
│   └── index.ts                   # 导出入口
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── jest.config.cjs
└── eslint.config.mjs
```

**Structure Decision**: 采用领域驱动设计的标准分层结构，领域层包含实体、值对象、领域服务、Repository 接口、领域事件和领域异常。所有代码位于 `libs/domain/user/src/domain/` 目录下，测试文件与源代码同目录（`.spec.ts` 文件）。

## Phase 0: Research & Clarification

**Status**: ✅ Completed

- [x] Research domain-kernel usage and best practices
- [x] Research DDD user domain model patterns
- [x] Research domain event design patterns
- [x] Research Repository interface design patterns
- [x] Research value object validation and normalization rules
- [x] Generate research.md with all findings

**Output**: `research.md` - Complete research findings and design decisions

## Phase 1: Design & Contracts

**Status**: ✅ Completed

- [x] Extract entities from feature spec → data-model.md
- [x] Generate API contracts documentation
- [x] Create quickstart.md guide

**Outputs**:
- `data-model.md` - Complete data model definition with all entities, value objects, services, and repositories
- `quickstart.md` - Quick start guide for developers
- `contracts/README.md` - API contracts documentation (note: domain layer only, no REST/GraphQL APIs)

## Phase 2: Task Planning

**Status**: ⏳ Pending (to be completed by `/speckit.tasks` command)

**Next Steps**:
- Run `/speckit.tasks` to generate task breakdown
- Begin implementation based on task list

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

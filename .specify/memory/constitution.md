<!--
Sync Impact Report
==================
Version Change: N/A → 1.0.0 (Initial creation)
Created: 2025-11-06
Last Amended: 2025-11-06

Modified Principles:
- N/A (Initial creation)

Added Sections:
- Overview
- Core Principle I: Chinese Priority Principle
- Core Principle II: Code as Documentation Principle
- Core Principle III: Technology Stack Constraints Principle
- Core Principle IV: Testing Requirements Principle
- Governance: Compliance Review

Removed Sections:
- N/A (Initial creation)

Templates Requiring Updates:
- ✅ updated: .specify/templates/plan-template.md (added detailed Constitution Check checklist)
- ✅ updated: .specify/templates/spec-template.md (added Constitution Check section)
- ✅ updated: .specify/templates/tasks-template.md (added Constitution Compliance section)

Follow-up TODOs:
- None

-->

# 项目章程 (Project Constitution)

**版本**: 1.0.0  
**批准日期**: 2025-11-06  
**最后修订**: 2025-11-06

---

## 概述

本文档定义了 hl8-aisaas-platform 项目的核心原则和治理规范。所有代码、文档和开发活动必须遵循这些原则。

---

## 核心原则

### I. 中文优先原则 (Git提交信息除外，且必须使用英文描述)

**所有代码注释、文档、错误消息和用户界面必须使用中文**

- **代码注释必须使用中文**，且遵循 TSDoc 规范

- **技术文档必须使用中文编写**

- **错误消息和日志必须使用中文**

- **API 文档和接口说明必须使用中文**

- **Git 提交消息使用英文**

- **代码变量命名使用英文，但必须有中文注释说明**

**理由**：本项目面向中国大陆地区的企业级SAAS平台，中文优先确保团队沟通效率、代码可维护性和业务理解的一致性。

**除外**：Git提交信息除外，且必须使用英文描述

---

### II. 代码即文档原则

**代码注释必须清晰、准确、完整地描述业务规则与逻辑**

- **遵循 TSDoc 注释规范**

- **所有公共 API、类、方法、接口、枚举都必须添加完整的 TSDoc 注释**

- **注释必须包含**：
  - @description: 功能描述和业务逻辑

  - @param: 参数说明（含业务含义）

  - @returns: 返回值说明

  - @throws: 异常情况说明

- **业务规则详细描述**

- **前置条件和后置条件**

- **使用场景和注意事项**

- **代码变更时必须同步更新注释**

**理由**：通过详细的注释让代码本身成为最好的业务文档，减少文档维护成本，提高团队协作效率，确保业务逻辑的准确传承。

---

### III. 技术栈约束原则

**本项目基于 Node.js + TypeScript 开发，使用 monorepo + pnpm 管理代码**

- **基础技术栈**：
  - Node.js + TypeScript
  - Monorepo 架构（使用 pnpm workspace）
  - pnpm 作为包管理工具

- **服务端项目必须使用 NodeNext 模块系统**：
  - **TypeScript 配置要求**：
    - `module: "NodeNext"`
    - `moduleResolution: "NodeNext"`
    - `target: "ES2022"`
    - `strict: true`
  - **package.json 配置要求**：
    - `type: "module"`
    - `engines: { "node": ">=20" }`
  - **禁止使用 CommonJS**：不允许在新项目中使用 CommonJS 模块系统（`require`, `module.exports`, `exports` 等）

**理由**：统一使用 NodeNext 模块系统确保项目与 Node.js 现代标准对齐，提供更好的类型安全、性能优化和未来兼容性。Monorepo + pnpm 架构提供高效的代码组织和依赖管理，支持多包协同开发。

---

### IV. 测试要求原则

**分层测试架构，确保代码质量和快速反馈**

- **就近原则**：单元测试文件与被测试文件在同一目录，命名格式：`{被测试文件名}.spec.ts`

- **集中管理**：集成测试、端到端测试统一放置在项目根目录下的 **test** 目录（src目录外）
  - 集成测试：`test/integration/`
  - 端到端测试：`test/e2e/`

- **类型分离**：
  - 单元测试与源代码同目录
  - 集成测试按模块组织
  - 端到端测试按功能组织

- **测试覆盖率要求**：
  - 核心业务逻辑 ≥ 80%
  - 关键路径 ≥ 90%
  - 所有公共 API 必须有测试用例

**理由**：分层测试架构确保代码质量，提供快速反馈。就近原则便于维护和理解测试与被测代码的关系，集中管理便于统一执行和报告。明确的覆盖率要求确保关键业务逻辑和公共 API 的可靠性。

---

## 治理规范

### 版本管理

本文档采用语义化版本控制：

- **MAJOR**：向后不兼容的治理/原则移除或重新定义
- **MINOR**：新增原则/章节或重大扩展指导
- **PATCH**：澄清、措辞修正、拼写错误修复、非语义性改进

版本变更时，必须更新本文档顶部的版本信息和最后修订日期。

### 修订流程

1. **提案阶段**：在项目讨论中提出修改建议
2. **审查阶段**：团队成员审查修改内容的影响
3. **批准阶段**：获得项目负责人批准
4. **更新阶段**：
   - 更新本文档
   - 更新版本号和日期
   - 生成 Sync Impact Report
   - 更新相关模板和文档
5. **传播阶段**：通知所有团队成员并确保理解

### 合规审查

- 所有代码提交必须符合章程原则
- 代码审查时检查注释和文档的语言及完整性
- 定期审查项目文档和代码库的合规性
- 违反原则的代码不应合并到主分支

---

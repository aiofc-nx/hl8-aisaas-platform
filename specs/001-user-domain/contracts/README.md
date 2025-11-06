# API Contracts: 用户领域模型

**Feature**: 用户领域模型开发  
**Date**: 2025-01-27

## 说明

本功能仅实现领域层（Domain Layer），不涉及接口层（Interface Layer）的实现，因此不需要定义 REST API 或 GraphQL 接口合约。

领域层的接口定义包括：

1. **Repository 接口**：定义在领域层，用于持久化操作
   - `IUserRepository`
   - `IUserTenantAssignmentRepository`
   - `IUserOrganizationAssignmentRepository`
   - `IUserDepartmentAssignmentRepository`

2. **领域服务接口**：定义在领域层，用于跨聚合的业务逻辑
   - `UserAssignmentDomainService`
   - `UserValidationDomainService`

3. **聚合根方法**：定义在聚合根类中，用于业务操作
   - `User` 聚合根的方法
   - `UserTenantAssignment` 聚合根的方法
   - 等等

## 接口定义位置

所有接口定义请参考：
- [数据模型文档](../data-model.md) - Repository 接口和领域服务接口的详细定义
- `libs/domain/user/src/domain/repositories/` - Repository 接口实现
- `libs/domain/user/src/domain/services/` - 领域服务实现
- `libs/domain/user/src/domain/entities/` - 聚合根实现

## 未来接口定义

当实现应用层（Application Layer）和接口层（Interface Layer）时，将需要定义以下接口：

1. **REST API 接口**：定义在接口层
   - 用户创建接口
   - 用户查询接口
   - 用户状态管理接口
   - 用户分配接口

2. **DTO 定义**：定义在接口层或应用层
   - 用户创建 DTO
   - 用户查询 DTO
   - 用户状态更新 DTO

这些接口将在后续的功能实现中定义。


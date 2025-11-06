# 数据隔离与权限控制分析

## 问题背景

在 SAAS 平台的多租户架构中，租户下设组织和部门，需要对组织和部门级别的数据访问进行限制。这涉及到两个核心概念：

1. **数据隔离（Data Isolation）**
2. **权限控制（Access Control）**

**核心问题**：组织和部门数据访问限制属于数据隔离还是权限控制？

---

## 1. 概念定义

### 1.1 数据隔离（Data Isolation）

**定义**：数据隔离是指在数据库层面，通过技术手段确保不同数据范围之间的数据完全隔离，防止数据泄露和越权访问。

**特点**：
- **技术实现**：在数据库层面通过字段过滤（如 `tenant_id`、`organization_id`、`department_id`）实现
- **数据范围**：定义哪些数据属于哪个数据范围
- **自动执行**：查询时自动添加过滤条件，无需应用层显式判断
- **安全保证**：即使应用层代码有漏洞，也能在数据库层面防止数据泄露

**示例**：
- 租户A的用户无法查询到租户B的数据（通过 `tenant_id` 过滤）
- 组织A的用户无法查询到组织B的数据（通过 `organization_id` 过滤）

### 1.2 权限控制（Access Control）

**定义**：权限控制是指在应用层面，基于用户身份、角色和权限，控制用户能够访问哪些功能和资源。

**特点**：
- **业务逻辑**：在应用层面判断用户是否有权限执行某个操作
- **权限判断**：基于用户角色、权限配置、组织/部门归属等
- **灵活配置**：可以动态配置和调整权限规则
- **功能控制**：不仅控制数据访问，还控制功能使用

**示例**：
- 普通用户只能查看自己部门的数据，管理员可以查看所有部门的数据
- 用户A被分配了组织A的访问权限，因此可以访问组织A的数据

---

## 2. 多层级数据访问架构

### 2.1 层级结构

```
平台 (Platform)
└── 租户 (Tenant) - 第一层隔离边界
    └── 组织 (Organization) - 第二层隔离边界
        └── 部门 (Department) - 第三层隔离边界
            └── 用户 (User)
```

### 2.2 数据访问层级

#### **层级1：租户级数据隔离（多租户隔离）**

**性质**：纯粹的数据隔离

**实现方式**：
- 所有业务表包含 `tenant_id` 字段
- 查询时自动添加 `WHERE tenant_id = ?` 条件
- 数据库RLS策略确保租户间数据完全隔离

**目的**：确保不同租户之间的数据完全隔离，这是多租户架构的基础安全要求。

**示例**：
```sql
-- 租户A的用户查询用户列表
SELECT * FROM users WHERE tenant_id = 'tenant-a-id';

-- 租户B的用户查询用户列表
SELECT * FROM users WHERE tenant_id = 'tenant-b-id';
```

#### **层级2：组织级数据隔离（组织架构隔离）**

**性质**：数据隔离 + 权限控制

**实现方式**：
- 业务表包含 `organization_id` 字段
- 查询时根据用户所属组织添加 `WHERE organization_id IN (?)` 条件
- 应用层权限控制判断用户是否有权限访问某个组织

**目的**：
- **数据隔离**：在数据库层面确保不同组织的数据隔离
- **权限控制**：在应用层面控制用户能访问哪些组织的数据

**示例**：
```sql
-- 用户属于组织A和组织B，查询时自动过滤
SELECT * FROM users 
WHERE tenant_id = 'tenant-id' 
  AND organization_id IN ('org-a-id', 'org-b-id');
```

#### **层级3：部门级数据隔离（部门架构隔离）**

**性质**：数据隔离 + 权限控制

**实现方式**：
- 业务表包含 `department_id` 字段
- 查询时根据用户所属部门添加 `WHERE department_id IN (?)` 条件
- 应用层权限控制判断用户是否有权限访问某个部门的数据
- 支持部门层级继承（上级部门可以查看下级部门的数据）

**目的**：
- **数据隔离**：在数据库层面确保不同部门的数据隔离
- **权限控制**：在应用层面控制用户能访问哪些部门的数据，以及是否有跨部门访问权限

**示例**：
```sql
-- 用户属于部门A，查询时自动过滤
SELECT * FROM users 
WHERE tenant_id = 'tenant-id' 
  AND organization_id = 'org-id'
  AND department_id IN ('dept-a-id', 'dept-a-child-1', 'dept-a-child-2'); -- 包含子部门
```

---

## 3. 答案：混合实现

### 3.1 核心结论

**组织和部门数据访问限制既属于数据隔离，也属于权限控制，是两者的有机结合。**

### 3.2 分层理解

#### **数据隔离层面（Database Layer）**

在数据库层面，通过组织ID和部门ID字段实现数据隔离：

```typescript
/**
 * 数据隔离实现
 * @description 在数据库层面通过字段过滤实现组织/部门数据隔离
 */
class OrganizationDataIsolation {
  /**
   * 查询时自动添加组织过滤条件
   */
  async findUsers(organizationIds: string[], tenantId: string): Promise<User[]> {
    return this.em.find(User, {
      tenantId,
      organizationId: { $in: organizationIds }
    });
  }
}
```

**特点**：
- 自动执行，无需应用层显式判断
- 数据库层面的安全保证
- 防止数据泄露的技术屏障

#### **权限控制层面（Application Layer）**

在应用层面，基于用户身份和权限判断用户能访问哪些组织/部门：

```typescript
/**
 * 权限控制实现
 * @description 在应用层面判断用户是否有权限访问某个组织/部门的数据
 */
class OrganizationAccessControl {
  /**
   * 判断用户是否有权限访问组织
   */
  async canAccessOrganization(
    userId: string,
    organizationId: string
  ): Promise<boolean> {
    // 1. 检查用户是否属于该组织
    const userAssignment = await this.findUserOrganizationAssignment(
      userId,
      organizationId
    );
    if (userAssignment) {
      return true;
    }
    
    // 2. 检查用户是否有跨组织访问权限
    const user = await this.findUser(userId);
    if (user.roles.includes('TENANT_ADMIN')) {
      return true; // 租户管理员可以访问所有组织
    }
    
    // 3. 检查用户是否有特殊权限
    const permissions = await this.getUserPermissions(userId);
    if (permissions.includes('VIEW_ALL_ORGANIZATIONS')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * 获取用户可访问的组织列表
   */
  async getAccessibleOrganizations(userId: string): Promise<string[]> {
    // 1. 用户直接所属的组织
    const userOrganizations = await this.getUserOrganizations(userId);
    
    // 2. 基于权限可访问的组织
    const user = await this.findUser(userId);
    if (user.roles.includes('TENANT_ADMIN')) {
      // 租户管理员可以访问所有组织
      return await this.getAllTenantOrganizations(user.tenantId);
    }
    
    return userOrganizations;
  }
}
```

**特点**：
- 基于业务规则的权限判断
- 灵活配置和动态调整
- 支持复杂的权限场景（如跨组织访问、部门层级继承）

---

## 4. 实现架构

### 4.1 分层架构设计

```
┌─────────────────────────────────────┐
│      应用层（Application Layer）      │
│  ┌───────────────────────────────┐  │
│  │   权限控制（Access Control）   │  │
│  │  - 判断用户权限                │  │
│  │  - 获取可访问的组织/部门列表    │  │
│  │  - 业务规则验证                │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│      数据访问层（Data Access Layer）│
│  ┌───────────────────────────────┐  │
│  │   数据隔离（Data Isolation）   │  │
│  │  - 自动添加过滤条件            │  │
│  │  - tenant_id 过滤              │  │
│  │  - organization_id 过滤        │  │
│  │  - department_id 过滤          │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│      数据库层（Database Layer）     │
│  ┌───────────────────────────────┐  │
│  │   数据库RLS策略                │  │
│  │  - PostgreSQL RLS              │  │
│  │  - 索引优化                    │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 4.2 完整实现示例

```typescript
/**
 * 组织/部门数据访问服务
 * @description 结合数据隔离和权限控制的完整实现
 */
class OrganizationDataAccessService {
  constructor(
    private readonly accessControl: OrganizationAccessControl,
    private readonly dataIsolation: OrganizationDataIsolation,
    private readonly em: EntityManager
  ) {}
  
  /**
   * 查询用户列表（带组织/部门过滤）
   */
  async findUsers(
    userId: string,
    options: {
      organizationId?: string;
      departmentId?: string;
      filters?: any;
    }
  ): Promise<User[]> {
    // 第一步：权限控制 - 判断用户权限
    const accessibleOrganizations = await this.accessControl
      .getAccessibleOrganizations(userId);
    
    if (accessibleOrganizations.length === 0) {
      throw new ForbiddenError('用户没有访问任何组织的权限');
    }
    
    // 第二步：权限控制 - 验证请求的组织是否在可访问范围内
    if (options.organizationId) {
      if (!accessibleOrganizations.includes(options.organizationId)) {
        throw new ForbiddenError('用户没有权限访问该组织');
      }
    }
    
    // 第三步：数据隔离 - 构建查询条件
    const whereConditions: any = {
      tenantId: await this.getTenantId(userId),
      organizationId: options.organizationId 
        ? options.organizationId 
        : { $in: accessibleOrganizations }
    };
    
    if (options.departmentId) {
      // 权限控制 - 验证部门访问权限
      const canAccess = await this.accessControl
        .canAccessDepartment(userId, options.departmentId);
      if (!canAccess) {
        throw new ForbiddenError('用户没有权限访问该部门');
      }
      
      // 数据隔离 - 添加部门过滤（包含子部门）
      const accessibleDepartments = await this.getAccessibleDepartments(
        userId,
        options.departmentId
      );
      whereConditions.departmentId = { $in: accessibleDepartments };
    }
    
    // 第四步：数据隔离 - 执行查询（自动添加过滤条件）
    return this.em.find(User, {
      ...whereConditions,
      ...options.filters
    });
  }
  
  /**
   * 获取可访问的部门列表（包含子部门）
   */
  private async getAccessibleDepartments(
    userId: string,
    departmentId: string
  ): Promise<string[]> {
    // 获取部门及其所有子部门
    const department = await this.em.findOne(Department, { id: departmentId });
    if (!department) {
      return [];
    }
    
    // 递归获取所有子部门
    const allDepartments = await this.getDepartmentTree(department.id);
    return allDepartments.map(d => d.id);
  }
}
```

---

## 5. 关键区别总结

### 5.1 数据隔离 vs 权限控制

| 维度 | 数据隔离（Data Isolation） | 权限控制（Access Control） |
|------|---------------------------|---------------------------|
| **实现层面** | 数据库层 | 应用层 |
| **主要目的** | 防止数据泄露，确保数据范围隔离 | 控制用户访问权限，实现业务规则 |
| **执行方式** | 自动执行，查询时自动添加过滤条件 | 显式判断，基于业务规则验证 |
| **灵活性** | 相对固定，基于数据结构 | 灵活配置，支持复杂业务规则 |
| **安全保证** | 数据库层面的安全屏障 | 应用层面的业务控制 |
| **示例** | `WHERE organization_id IN (?)` | `if (!canAccess) throw ForbiddenError` |

### 5.2 组织/部门数据访问限制的双重性质

```
组织/部门数据访问限制
├── 数据隔离（技术实现）
│   ├── 数据库层面的字段过滤
│   ├── 自动添加 organization_id 条件
│   ├── 自动添加 department_id 条件
│   └── 数据库RLS策略支持
│
└── 权限控制（业务逻辑）
    ├── 应用层面的权限判断
    ├── 用户组织/部门归属验证
    ├── 角色权限验证
    └── 跨组织/部门访问权限控制
```

---

## 6. 最佳实践建议

### 6.1 分层实现原则

1. **数据隔离层（必须）**
   - 所有业务表必须包含 `organization_id` 和 `department_id` 字段
   - 查询时自动添加组织/部门过滤条件
   - 使用数据库RLS策略作为额外保障

2. **权限控制层（必须）**
   - 在数据访问前验证用户权限
   - 获取用户可访问的组织/部门列表
   - 支持复杂的权限场景（跨组织、部门层级继承等）

3. **双重保障**
   - 数据隔离防止数据泄露（即使权限控制有漏洞）
   - 权限控制实现业务规则（灵活配置和动态调整）

### 6.2 实现建议

```typescript
/**
 * 推荐的实现模式
 */
class RecommendedDataAccessService {
  /**
   * 数据访问流程
   */
  async findData<T>(
    userId: string,
    entityType: string,
    options: QueryOptions
  ): Promise<T[]> {
    // Step 1: 权限控制 - 获取可访问的范围
    const accessibleScope = await this.getAccessibleScope(userId, options);
    
    // Step 2: 权限控制 - 验证访问权限
    this.validateAccess(userId, accessibleScope, options);
    
    // Step 3: 数据隔离 - 构建查询条件
    const whereConditions = this.buildWhereConditions(accessibleScope, options);
    
    // Step 4: 数据隔离 - 执行查询（自动过滤）
    return this.em.find(entityType, whereConditions);
  }
  
  /**
   * 获取可访问的范围（组织/部门）
   */
  private async getAccessibleScope(
    userId: string,
    options: QueryOptions
  ): Promise<AccessibleScope> {
    const user = await this.findUser(userId);
    
    // 租户管理员可以访问所有组织/部门
    if (user.roles.includes('TENANT_ADMIN')) {
      return {
        organizationIds: await this.getAllOrganizationIds(user.tenantId),
        departmentIds: await this.getAllDepartmentIds(user.tenantId),
      };
    }
    
    // 组织管理员可以访问该组织下的所有部门
    if (user.roles.includes('ORGANIZATION_ADMIN')) {
      const organizations = await this.getUserOrganizations(userId);
      const departments = await this.getOrganizationDepartments(organizations);
      return { organizationIds: organizations, departmentIds: departments };
    }
    
    // 普通用户只能访问自己所属的组织/部门
    return {
      organizationIds: await this.getUserOrganizations(userId),
      departmentIds: await this.getUserDepartments(userId),
    };
  }
}
```

---

## 7. 总结

### 7.1 核心观点

1. **组织和部门数据访问限制既属于数据隔离，也属于权限控制**
2. **数据隔离是技术实现层面**：在数据库层面通过字段过滤实现数据范围隔离
3. **权限控制是业务逻辑层面**：在应用层面基于用户身份和权限判断访问权限
4. **两者缺一不可**：数据隔离提供安全屏障，权限控制实现业务规则

### 7.2 架构建议

- **数据隔离层**：在数据库层面实现，确保数据不会泄露到不应该访问的范围
- **权限控制层**：在应用层面实现，基于业务规则控制访问权限
- **双重保障**：两层结合，既保证安全性，又实现灵活性

### 7.3 实施建议

1. **必须实现数据隔离**：所有查询自动添加组织/部门过滤条件
2. **必须实现权限控制**：在数据访问前验证用户权限
3. **分层清晰**：明确区分数据隔离层和权限控制层的职责
4. **文档完善**：清晰记录数据隔离和权限控制的实现方式

---

## 附录：相关概念

### A. 数据隔离（Data Isolation）

- **行级隔离（Row-Level Security）**：通过字段过滤实现数据隔离
- **模式级隔离（Schema-Level Isolation）**：通过数据库模式实现隔离
- **数据库级隔离（Database-Level Isolation）**：通过独立数据库实现隔离

### B. 权限控制（Access Control）

- **基于角色的访问控制（RBAC）**：基于用户角色控制访问
- **基于属性的访问控制（ABAC）**：基于用户属性控制访问
- **组织架构权限**：基于组织架构的权限控制

### C. 相关文档

- [多租户和数据隔离技术方案](./multi-tenant-data-isolation-technical-solution.md)
- [IAM业务需求](./iam-business-requirements.mdc)
- [术语定义](./definition-of-terms.mdc)


# 多租户和数据隔离技术方案

## 1. 概述

### 1.1 文档目的

本文档详细阐述 SAAS 平台的多租户架构设计和数据隔离技术方案，为系统开发提供技术指导和实施规范。

### 1.2 设计原则

#### **核心设计原则**

1. **数据完全隔离**：确保不同租户之间的数据完全隔离，无任何数据泄露风险
2. **安全第一**：采用多层安全机制，确保数据访问的安全性
3. **性能优化**：在保证隔离的前提下，最大化系统性能和资源利用率
4. **可扩展性**：支持未来多种隔离策略的扩展，满足不同租户需求
5. **运维简化**：降低运维复杂度，提高系统可维护性

### 1.3 技术栈

- **数据库**：PostgreSQL 15+、MongoDB 6.0+
- **ORM框架**：MikroORM
- **应用框架**：Node.js + TypeScript + Fastify
- **缓存**：Redis
- **消息队列**：RabbitMQ / Kafka（可选）

#### **数据库选择策略**

- **PostgreSQL**：用于结构化数据、关系型数据、需要事务保证的核心业务数据
- **MongoDB**：用于文档型数据、非结构化数据、日志、审计、配置等
- **混合使用**：根据数据特性选择合适的数据库，通过 MikroORM 统一管理

---

## 2. 多租户架构设计

### 2.1 租户模型

#### **租户实体设计**

```typescript
/**
 * 租户实体
 * @description 表示平台中的一个独立租户，拥有独立的数据空间和配置环境
 */
interface Tenant {
  /** 租户ID（主键，UUID） */
  id: string;
  
  /** 租户代码（唯一标识，3-20字符） */
  code: string;
  
  /** 租户名称 */
  name: string;
  
  /** 租户域名（可选，用于多域名访问） */
  domain?: string;
  
  /** 租户类型 */
  type: TenantType; // FREE | BASIC | PROFESSIONAL | ENTERPRISE | CUSTOM
  
  /** 租户状态 */
  status: TenantStatus; // TRIAL | ACTIVE | SUSPENDED | EXPIRED | DELETED
  
  /** 隔离策略 */
  isolationStrategy: IsolationStrategy; // ROW_LEVEL_SECURITY | SCHEMA_PER_TENANT | DATABASE_PER_TENANT | HYBRID
  
  /** 配置信息（JSON） */
  config: TenantConfig;
  
  /** 创建时间 */
  createdAt: Date;
  
  /** 更新时间 */
  updatedAt: Date;
  
  /** 创建者ID */
  createdBy: string;
  
  /** 过期时间（试用租户） */
  expiresAt?: Date;
}

/**
 * 租户配置
 */
interface TenantConfig {
  /** 用户数量限制 */
  maxUsers?: number;
  
  /** 存储空间限制（GB） */
  maxStorage?: number;
  
  /** 组织数量限制 */
  maxOrganizations?: number;
  
  /** 部门层级限制 */
  maxDepartmentLevels?: number;
  
  /** 功能开关 */
  features: Record<string, boolean>;
  
  /** 自定义配置 */
  customConfig?: Record<string, any>;
}
```

#### **租户类型枚举**

```typescript
/**
 * 租户类型枚举
 */
enum TenantType {
  /** 免费租户 */
  FREE = 'FREE',
  
  /** 基础租户 */
  BASIC = 'BASIC',
  
  /** 专业租户 */
  PROFESSIONAL = 'PROFESSIONAL',
  
  /** 企业租户 */
  ENTERPRISE = 'ENTERPRISE',
  
  /** 定制租户 */
  CUSTOM = 'CUSTOM'
}

/**
 * 租户状态枚举
 */
enum TenantStatus {
  /** 试用中 */
  TRIAL = 'TRIAL',
  
  /** 活跃 */
  ACTIVE = 'ACTIVE',
  
  /** 已暂停 */
  SUSPENDED = 'SUSPENDED',
  
  /** 已过期 */
  EXPIRED = 'EXPIRED',
  
  /** 已删除 */
  DELETED = 'DELETED'
}

/**
 * 隔离策略枚举
 */
enum IsolationStrategy {
  /** 行级隔离（当前默认） */
  ROW_LEVEL_SECURITY = 'ROW_LEVEL_SECURITY',
  
  /** 模式级隔离（未来扩展） */
  SCHEMA_PER_TENANT = 'SCHEMA_PER_TENANT',
  
  /** 数据库级隔离（未来扩展） */
  DATABASE_PER_TENANT = 'DATABASE_PER_TENANT',
  
  /** 混合隔离（未来扩展） */
  HYBRID = 'HYBRID'
}
```

### 2.2 租户上下文管理

#### **租户上下文（Tenant Context）**

```typescript
/**
 * 租户上下文
 * @description 在请求处理过程中携带租户、组织、部门信息，确保多层级数据隔离
 */
interface TenantContext {
  /** 租户ID */
  tenantId: string;
  
  /** 租户代码 */
  tenantCode: string;
  
  /** 租户类型 */
  tenantType: TenantType;
  
  /** 租户状态 */
  tenantStatus: TenantStatus;
  
  /** 隔离策略 */
  isolationStrategy: IsolationStrategy;
  
  /** 用户ID（当前请求用户） */
  userId: string;
  
  /** 用户角色 */
  userRoles: string[];
  
  /** 用户可访问的组织ID列表（用于组织级隔离） */
  accessibleOrganizationIds: string[];
  
  /** 用户可访问的部门ID列表（用于部门级隔离，包含子部门） */
  accessibleDepartmentIds: string[];
  
  /** 请求时间 */
  timestamp: Date;
}

/**
 * 租户上下文提供者
 * @description 从请求中提取租户信息，创建租户上下文
 */
interface TenantContextProvider {
  /**
   * 从请求中提取租户上下文
   * @param request - HTTP请求对象
   * @returns 租户上下文
   */
  extractFromRequest(request: FastifyRequest): Promise<TenantContext>;
  
  /**
   * 验证租户上下文
   * @param context - 租户上下文
   * @returns 验证结果
   */
  validateContext(context: TenantContext): Promise<boolean>;
}
```

#### **租户上下文提取策略**

租户信息可以从以下来源提取：

1. **子域名**：`tenant-code.platform.com`
2. **路径参数**：`/api/tenant/{tenantCode}/...`
3. **请求头**：`X-Tenant-Code` 或 `X-Tenant-Id`
4. **JWT Token**：从用户认证Token中提取

**优先级**：子域名 > 路径参数 > 请求头 > JWT Token

---

## 3. 数据隔离策略

### 3.1 行级隔离（Row-Level Security）

#### **3.1.1 策略概述**

行级隔离是平台运营初期的统一隔离策略，所有租户共享同一个数据库和模式，通过多层级字段进行数据隔离：

1. **租户级隔离**：通过 `tenant_id` 字段实现租户间的数据隔离
2. **组织级隔离**：通过 `organization_id` 字段实现组织间的数据隔离
3. **部门级隔离**：通过 `department_id` 字段实现部门间的数据隔离

多层级隔离确保数据在租户、组织、部门三个层级都得到完全隔离，防止数据泄露和越权访问。

#### **3.1.2 数据库设计规范**

##### **表结构设计**

所有业务表必须包含多层级隔离字段：

**必填字段**：
- `tenant_id` - 租户ID（所有业务表必须）
- `organization_id` - 组织ID（需要组织隔离的业务表）
- `department_id` - 部门ID（需要部门隔离的业务表）

```sql
-- 示例：用户表（支持多层级隔离）
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,          -- 租户ID（必填）
    organization_id UUID,             -- 组织ID（可选，用于组织级隔离）
    department_id UUID,                -- 部门ID（可选，用于部门级隔离）
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- 唯一性约束需要考虑租户
    CONSTRAINT users_email_unique UNIQUE (tenant_id, email),
    
    -- 外键约束
    CONSTRAINT users_tenant_fk FOREIGN KEY (tenant_id) 
        REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT users_organization_fk FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE SET NULL,
    CONSTRAINT users_department_fk FOREIGN KEY (department_id) 
        REFERENCES departments(id) ON DELETE SET NULL
);

-- 创建索引（多层级隔离索引）
-- 租户级索引
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);

-- 组织级索引
CREATE INDEX idx_users_organization_id ON users(tenant_id, organization_id);
CREATE INDEX idx_users_tenant_organization ON users(tenant_id, organization_id) 
    WHERE organization_id IS NOT NULL;

-- 部门级索引
CREATE INDEX idx_users_department_id ON users(tenant_id, organization_id, department_id);
CREATE INDEX idx_users_tenant_org_dept ON users(tenant_id, organization_id, department_id)
    WHERE department_id IS NOT NULL;
```

**注意**：
- `organization_id` 和 `department_id` 可以为 NULL，表示不属于特定组织/部门的数据
- 外键约束使用 `ON DELETE SET NULL`，确保删除组织/部门时不会级联删除数据
- 索引设计遵循多层级查询模式：`tenant_id` → `organization_id` → `department_id`

##### **表设计规范**

**多层级隔离字段要求**：

1. **租户级（必须）**
   - 所有业务表必须包含 `tenant_id UUID NOT NULL`
   - 索引策略：`tenant_id` 必须作为复合索引的第一个字段
   - 唯一性约束：唯一性约束必须包含 `tenant_id`
   - 外键约束：`tenant_id` 必须引用 `tenants` 表
   - 级联删除：外键约束使用 `ON DELETE CASCADE`

2. **组织级（可选，根据业务需求）**
   - 需要组织级隔离的业务表包含 `organization_id UUID`
   - 索引策略：创建 `(tenant_id, organization_id)` 复合索引
   - 外键约束：`organization_id` 引用 `organizations` 表，使用 `ON DELETE SET NULL`
   - 支持 NULL：允许数据不属于任何组织

3. **部门级（可选，根据业务需求）**
   - 需要部门级隔离的业务表包含 `department_id UUID`
   - 索引策略：创建 `(tenant_id, organization_id, department_id)` 复合索引
   - 外键约束：`department_id` 引用 `departments` 表，使用 `ON DELETE SET NULL`
   - 支持 NULL：允许数据不属于任何部门
   - 层级继承：查询时需要考虑部门层级关系（父部门可查看子部门数据）

##### **表命名规范**

- 业务表：使用复数形式，如 `users`, `organizations`, `departments`
- 关联表：使用下划线连接，如 `user_organization_assignments`
- 审计表：以 `_audit` 结尾，如 `users_audit`

#### **3.1.3 应用层隔离实现**

##### **数据访问层（Repository Pattern）**

```typescript
/**
 * 基础仓库接口
 * @description 所有业务仓库必须实现此接口，确保数据隔离
 */
interface IBaseRepository<T> {
  /**
   * 查询单条记录（自动添加租户过滤）
   * @param id - 记录ID
   * @param tenantId - 租户ID
   * @returns 记录或null
   */
  findById(id: string, tenantId: string): Promise<T | null>;
  
  /**
   * 查询多条记录（自动添加租户过滤）
   * @param options - 查询选项
   * @param tenantId - 租户ID
   * @returns 记录列表
   */
  findAll(options: QueryOptions, tenantId: string): Promise<T[]>;
  
  /**
   * 创建记录（自动添加租户ID）
   * @param data - 记录数据
   * @param tenantId - 租户ID
   * @returns 创建的记录
   */
  create(data: Partial<T>, tenantId: string): Promise<T>;
  
  /**
   * 更新记录（自动验证租户ID）
   * @param id - 记录ID
   * @param data - 更新数据
   * @param tenantId - 租户ID
   * @returns 更新后的记录
   */
  update(id: string, data: Partial<T>, tenantId: string): Promise<T>;
  
  /**
   * 删除记录（自动验证租户ID）
   * @param id - 记录ID
   * @param tenantId - 租户ID
   * @returns 是否删除成功
   */
  delete(id: string, tenantId: string): Promise<boolean>;
}

/**
 * 基础仓库实现（MikroORM示例，支持多层级隔离）
 */
abstract class BaseRepository<T extends { 
  id: string; 
  tenantId: string;
  organizationId?: string;
  departmentId?: string;
}> implements IBaseRepository<T> {
  
  constructor(
    protected readonly em: EntityManager,
    protected readonly entityName: string,
    protected readonly tenantContext: TenantContext
  ) {}
  
  async findById(id: string, tenantId: string): Promise<T | null> {
    const where = this.buildMultiLevelWhere({ id, tenantId });
    return this.em.findOne(this.entityName as any, where) as Promise<T | null>;
  }
  
  async findAll(options: QueryOptions, tenantId: string): Promise<T[]> {
    const where = this.buildMultiLevelWhere({ ...options.where, tenantId });
    return this.em.find(this.entityName as any, where, options) as Promise<T[]>;
  }
  
  async create(data: Partial<T>, tenantId: string): Promise<T> {
    const entityData = {
      ...data,
      tenantId,
      // 自动设置组织/部门ID（如果实体支持）
      ...(this.tenantContext.accessibleOrganizationIds.length === 1 && {
        organizationId: this.tenantContext.accessibleOrganizationIds[0]
      }),
    };
    
    const entity = this.em.create(this.entityName as any, entityData as any);
    await this.em.persistAndFlush(entity);
    return entity as T;
  }
  
  async update(id: string, data: Partial<T>, tenantId: string): Promise<T> {
    // 先验证记录属于该租户且在可访问范围内
    const existing = await this.findById(id, tenantId);
    if (!existing) {
      throw new NotFoundError('记录不存在或不在可访问范围内');
    }
    
    const entity = await this.em.findOneOrFail(
      this.entityName as any,
      this.buildMultiLevelWhere({ id, tenantId })
    );
    this.em.assign(entity, data);
    await this.em.flush();
    
    return entity as T;
  }
  
  async delete(id: string, tenantId: string): Promise<boolean> {
    const entity = await this.em.findOne(
      this.entityName as any,
      this.buildMultiLevelWhere({ id, tenantId })
    );
    if (!entity) {
      return false;
    }
    
    await this.em.removeAndFlush(entity);
    return true;
  }
  
  /**
   * 构建多层级查询条件
   * @description 自动添加租户、组织、部门过滤条件
   */
  protected buildMultiLevelWhere(baseWhere: any): any {
    const where: any = { ...baseWhere };
    
    // 租户级隔离（必须）
    where.tenantId = baseWhere.tenantId || this.tenantContext.tenantId;
    
    // 组织级隔离（如果实体有 organizationId 字段且用户有可访问的组织）
    if (this.tenantContext.accessibleOrganizationIds.length > 0) {
      where.organizationId = {
        $in: this.tenantContext.accessibleOrganizationIds
      };
    }
    
    // 部门级隔离（如果实体有 departmentId 字段且用户有可访问的部门）
    if (this.tenantContext.accessibleDepartmentIds.length > 0) {
      where.departmentId = {
        $in: this.tenantContext.accessibleDepartmentIds
      };
    }
    
    return where;
  }
}
```

##### **查询构建器增强**

```typescript
/**
 * 多层级感知查询构建器（MikroORM）
 * @description 自动为所有查询添加租户、组织、部门过滤条件
 */
class MultiLevelAwareQueryBuilder<T> {
  constructor(
    private readonly qb: QueryBuilder<T>,
    private readonly tenantContext: TenantContext
  ) {}
  
  /**
   * 添加多层级过滤条件
   */
  whereMultiLevel(): this {
    // 租户级隔离（必须）
    this.qb.andWhere({ tenantId: this.tenantContext.tenantId });
    
    // 组织级隔离（如果用户有可访问的组织）
    if (this.tenantContext.accessibleOrganizationIds.length > 0) {
      this.qb.andWhere({
        organizationId: { $in: this.tenantContext.accessibleOrganizationIds }
      });
    }
    
    // 部门级隔离（如果用户有可访问的部门）
    if (this.tenantContext.accessibleDepartmentIds.length > 0) {
      this.qb.andWhere({
        departmentId: { $in: this.tenantContext.accessibleDepartmentIds }
      });
    }
    
    return this;
  }
  
  /**
   * 代理其他查询方法
   */
  where(condition: any): this {
    this.qb.where(condition);
    return this.whereMultiLevel();
  }
  
  andWhere(condition: any): this {
    this.qb.andWhere(condition);
    return this.whereMultiLevel();
  }
  
  /**
   * 执行查询
   */
  getResult(): Promise<T[]> {
    return this.qb.getResult();
  }
  
  getSingleResult(): Promise<T | null> {
    return this.qb.getSingleResult();
  }
  
  // ... 其他方法代理
}

/**
 * 使用示例
 */
class UserService {
  constructor(private readonly em: EntityManager) {}
  
  async findUsersByMultiLevel(tenantContext: TenantContext): Promise<User[]> {
    const qb = this.em.createQueryBuilder(User, 'u');
    const multiLevelQb = new MultiLevelAwareQueryBuilder(qb, tenantContext);
    
    return multiLevelQb
      .where({ status: 'ACTIVE' })
      .getResult();
  }
}
```

#### **3.1.4 数据库层隔离（PostgreSQL RLS）**

##### **启用行级安全策略（多层级隔离）**

```sql
-- 为业务表启用行级安全
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 创建策略：多层级隔离策略
-- 1. 租户级隔离（必须）
-- 2. 组织级隔离（如果设置了组织上下文）
-- 3. 部门级隔离（如果设置了部门上下文）

CREATE POLICY multi_level_isolation_policy ON users
    FOR ALL
    USING (
        -- 租户级隔离（必须）
        tenant_id = current_setting('app.current_tenant_id', true)::UUID
        AND
        -- 组织级隔离（可选，如果设置了组织上下文）
        (
            current_setting('app.current_organization_ids', true) IS NULL
            OR
            organization_id = ANY(string_to_array(
                current_setting('app.current_organization_ids', true),
                ','
            )::UUID[])
            OR
            organization_id IS NULL
        )
        AND
        -- 部门级隔离（可选，如果设置了部门上下文）
        (
            current_setting('app.current_department_ids', true) IS NULL
            OR
            department_id = ANY(string_to_array(
                current_setting('app.current_department_ids', true),
                ','
            )::UUID[])
            OR
            department_id IS NULL
        )
    );

-- 设置当前租户、组织、部门ID（在连接时设置）
-- 注意：这需要在应用层设置，通过 SET LOCAL 命令
```

##### **应用层设置当前租户**

```typescript
/**
 * PostgreSQL RLS 支持（MikroORM，多层级隔离）
 * @description 在数据库连接中设置当前租户、组织、部门ID，启用RLS策略
 */
class MultiLevelRLSManager {
  /**
   * 为数据库连接设置多层级隔离参数
   * @param em - MikroORM EntityManager
   * @param tenantContext - 租户上下文（包含组织、部门信息）
   */
  async setMultiLevelContext(
    em: EntityManager,
    tenantContext: TenantContext
  ): Promise<void> {
    const connection = em.getConnection();
    
    // 设置租户ID（必须）
    await connection.execute(
      `SET LOCAL app.current_tenant_id = ?`,
      [tenantContext.tenantId]
    );
    
    // 设置组织ID列表（可选）
    if (tenantContext.accessibleOrganizationIds.length > 0) {
      const orgIds = tenantContext.accessibleOrganizationIds.join(',');
      await connection.execute(
        `SET LOCAL app.current_organization_ids = ?`,
        [orgIds]
      );
    } else {
      await connection.execute('SET LOCAL app.current_organization_ids = NULL');
    }
    
    // 设置部门ID列表（可选，包含子部门）
    if (tenantContext.accessibleDepartmentIds.length > 0) {
      const deptIds = tenantContext.accessibleDepartmentIds.join(',');
      await connection.execute(
        `SET LOCAL app.current_department_ids = ?`,
        [deptIds]
      );
    } else {
      await connection.execute('SET LOCAL app.current_department_ids = NULL');
    }
  }
  
  /**
   * 清除多层级隔离参数设置
   * @param em - MikroORM EntityManager
   */
  async clearMultiLevelContext(em: EntityManager): Promise<void> {
    const connection = em.getConnection();
    await connection.execute('RESET app.current_tenant_id');
    await connection.execute('RESET app.current_organization_ids');
    await connection.execute('RESET app.current_department_ids');
  }
}
```

##### **MikroORM 配置示例**

```typescript
/**
 * MikroORM 配置（支持 PostgreSQL 和 MongoDB）
 */
import { MikroORM, PostgreSqlDriver, MongoDriver } from '@mikro-orm/core';
import { PostgreSqlConnection } from '@mikro-orm/postgresql';
import { MongoConnection } from '@mikro-orm/mongodb';

/**
 * PostgreSQL 配置
 */
const postgresConfig = {
  type: 'postgresql',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  entities: ['./dist/entities/postgres/**/*.entity.js'],
  migrations: {
    path: './dist/migrations/postgres',
    pattern: /^[\w-]+\d+\.js$/,
  },
  driver: PostgreSqlDriver,
  // 启用连接池
  pool: {
    min: 2,
    max: 10,
  },
};

/**
 * MongoDB 配置
 */
const mongoConfig = {
  type: 'mongo',
  clientUrl: process.env.MONGO_URL || 'mongodb://localhost:27017',
  dbName: process.env.MONGO_DB || 'saas_platform',
  entities: ['./dist/entities/mongo/**/*.entity.js'],
  migrations: {
    path: './dist/migrations/mongo',
    pattern: /^[\w-]+\d+\.js$/,
  },
  driver: MongoDriver,
};

/**
 * 初始化 MikroORM
 */
async function initMikroORM() {
  // PostgreSQL ORM
  const postgresORM = await MikroORM.init<PostgreSqlDriver>(postgresConfig);
  
  // MongoDB ORM
  const mongoORM = await MikroORM.init<MongoDriver>(mongoConfig);
  
  return {
    postgres: postgresORM,
    mongo: mongoORM,
  };
}
```

##### **租户感知 EntityManager**

```typescript
/**
 * 多层级感知 EntityManager 包装器
 * @description 自动为所有查询添加租户、组织、部门过滤条件
 */
class MultiLevelAwareEntityManager {
  constructor(
    private readonly em: EntityManager,
    private readonly tenantContext: TenantContext
  ) {}
  
  /**
   * 查询方法（自动添加多层级过滤）
   */
  async find<T extends { 
    tenantId: string;
    organizationId?: string;
    departmentId?: string;
  }>(
    entityName: string,
    where: any,
    options?: any
  ): Promise<T[]> {
    const multiLevelWhere = this.buildMultiLevelWhere(where);
    return this.em.find(entityName, multiLevelWhere, options) as Promise<T[]>;
  }
  
  /**
   * 查找单条记录
   */
  async findOne<T extends { 
    tenantId: string;
    organizationId?: string;
    departmentId?: string;
  }>(
    entityName: string,
    where: any,
    options?: any
  ): Promise<T | null> {
    const multiLevelWhere = this.buildMultiLevelWhere(where);
    return this.em.findOne(entityName, multiLevelWhere, options) as Promise<T | null>;
  }
  
  /**
   * 创建实体（自动添加租户ID，可选的组织/部门ID）
   */
  async create<T extends { 
    tenantId: string;
    organizationId?: string;
    departmentId?: string;
  }>(
    entityName: string,
    data: Partial<T>
  ): Promise<T> {
    const entityData = {
      ...data,
      tenantId: this.tenantContext.tenantId,
      // 如果用户只有一个可访问的组织，自动设置
      ...(this.tenantContext.accessibleOrganizationIds.length === 1 && {
        organizationId: this.tenantContext.accessibleOrganizationIds[0]
      }),
    };
    
    const entity = this.em.create(entityName, entityData as any);
    return entity as T;
  }
  
  /**
   * 持久化并刷新
   */
  async persistAndFlush(entity: any): Promise<void> {
    await this.em.persistAndFlush(entity);
  }
  
  /**
   * 构建多层级查询条件
   */
  private buildMultiLevelWhere(baseWhere: any): any {
    const where: any = { ...baseWhere };
    
    // 租户级隔离（必须）
    where.tenantId = this.tenantContext.tenantId;
    
    // 组织级隔离（如果实体有 organizationId 字段）
    if (this.tenantContext.accessibleOrganizationIds.length > 0) {
      where.organizationId = {
        $in: this.tenantContext.accessibleOrganizationIds
      };
    }
    
    // 部门级隔离（如果实体有 departmentId 字段）
    if (this.tenantContext.accessibleDepartmentIds.length > 0) {
      where.departmentId = {
        $in: this.tenantContext.accessibleDepartmentIds
      };
    }
    
    return where;
  }
  
  /**
   * 获取原始 EntityManager（谨慎使用）
   */
  getRawEntityManager(): EntityManager {
    return this.em;
  }
}
```

#### **3.1.5 中间件和拦截器**

##### **多层级上下文中间件**

```typescript
/**
 * 多层级上下文中间件
 * @description 从请求中提取租户、组织、部门信息，设置多层级上下文
 */
export async function multiLevelContextMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // 提取租户信息
  const tenantContext = await tenantContextProvider.extractFromRequest(request);
  
  // 验证租户上下文
  const isValid = await tenantContextProvider.validateContext(tenantContext);
  if (!isValid) {
    reply.code(403).send({ error: '无效的租户上下文' });
    return;
  }
  
  // 验证租户状态
  if (!isTenantActive(tenantContext.tenantStatus)) {
    reply.code(403).send({ error: '租户状态不允许访问' });
    return;
  }
  
  // 获取用户可访问的组织和部门列表
  const accessibleOrganizations = await getAccessibleOrganizations(
    tenantContext.userId,
    tenantContext.tenantId
  );
  const accessibleDepartments = await getAccessibleDepartments(
    tenantContext.userId,
    tenantContext.tenantId,
    accessibleOrganizations
  );
  
  // 扩展租户上下文，添加组织/部门信息
  const enhancedContext: TenantContext = {
    ...tenantContext,
    accessibleOrganizationIds: accessibleOrganizations,
    accessibleDepartmentIds: accessibleDepartments,
  };
  
  // 存储到 AsyncLocalStorage
  tenantContextStorage.run(enhancedContext, () => {
    // 请求处理继续
  });
}

/**
 * 获取用户可访问的组织ID列表
 */
async function getAccessibleOrganizations(
  userId: string,
  tenantId: string
): Promise<string[]> {
  const user = await userRepository.findUserWithRoles(userId);
  
  // 租户管理员可以访问所有组织
  if (user.roles.includes('TENANT_ADMIN')) {
    const allOrganizations = await organizationRepository.findAllByTenant(tenantId);
    return allOrganizations.map(org => org.id);
  }
  
  // 获取用户所属的组织
  const userOrganizations = await userOrganizationAssignmentRepository
    .findOrganizationsByUser(userId);
  
  return userOrganizations.map(assignment => assignment.organizationId);
}

/**
 * 获取用户可访问的部门ID列表（包含子部门）
 */
async function getAccessibleDepartments(
  userId: string,
  tenantId: string,
  organizationIds: string[]
): Promise<string[]> {
  if (organizationIds.length === 0) {
    return [];
  }
  
  const user = await userRepository.findUserWithRoles(userId);
  
  // 租户管理员可以访问所有部门
  if (user.roles.includes('TENANT_ADMIN')) {
    const allDepartments = await departmentRepository.findAllByOrganizations(
      tenantId,
      organizationIds
    );
    return allDepartments.map(dept => dept.id);
  }
  
  // 获取用户所属的部门（包含子部门）
  const userDepartments = await userDepartmentAssignmentRepository
    .findDepartmentsByUser(userId, organizationIds);
  
  // 获取每个部门的子部门
  const allDepartmentIds = new Set<string>();
  for (const deptId of userDepartments) {
    allDepartmentIds.add(deptId);
    // 递归获取子部门
    const children = await departmentRepository.getDescendants(deptId);
    children.forEach(child => allDepartmentIds.add(child.id));
  }
  
  return Array.from(allDepartmentIds);
}

/**
 * 检查租户是否活跃
 */
function isTenantActive(status: TenantStatus): boolean {
  return status === TenantStatus.ACTIVE || status === TenantStatus.TRIAL;
}
```

##### **数据访问拦截器**

```typescript
/**
 * 多层级数据访问拦截器（MikroORM）
 * @description 拦截所有数据访问操作，自动添加租户、组织、部门过滤
 */
export class MultiLevelDataInterceptor implements NestInterceptor {
  constructor(
    private readonly orm: MikroORM,
    private readonly rlsManager: MultiLevelRLSManager
  ) {}
  
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const tenantContext = tenantContextStorage.getStore();
    if (!tenantContext) {
      throw new Error('租户上下文不存在');
    }
    
    // 在数据库操作前设置多层级RLS参数（仅对 PostgreSQL 连接）
    const em = this.orm.em.fork(); // 创建新的 EntityManager 实例
    
    return from(
      this.rlsManager.setMultiLevelContext(em, tenantContext)
    ).pipe(
      switchMap(() => {
        // 将多层级感知的 EntityManager 注入到请求中
        const request = context.switchToHttp().getRequest();
        request.entityManager = new MultiLevelAwareEntityManager(em, tenantContext);
        return next.handle();
      }),
      finalize(() => {
        this.rlsManager.clearMultiLevelContext(em);
      })
    );
  }
}
```

### 3.2 安全机制

#### **3.2.1 双重验证机制**

```typescript
/**
 * 租户数据访问验证器
 * @description 双重验证机制：应用层验证 + 数据库层验证
 */
class TenantDataValidator {
  /**
   * 验证数据访问权限
   * @param entityId - 实体ID
   * @param entityType - 实体类型
   * @param tenantId - 租户ID
   */
  async validateAccess(
    entityId: string,
    entityType: string,
    tenantId: string
  ): Promise<boolean> {
    // 第一层：应用层验证
    const entity = await this.findEntity(entityType, entityId);
    if (!entity || entity.tenantId !== tenantId) {
      // 记录安全审计日志
      await this.logSecurityViolation({
        entityId,
        entityType,
        tenantId,
        reason: '租户ID不匹配'
      });
      return false;
    }
    
    // 第二层：数据库层验证（RLS自动处理）
    // 如果应用层验证通过，数据库RLS策略会再次验证
    
    return true;
  }
  
  /**
   * 批量验证
   */
  async validateBatchAccess(
    entityIds: string[],
    entityType: string,
    tenantId: string
  ): Promise<boolean> {
    const entities = await this.findEntities(entityType, entityIds);
    const allBelongToTenant = entities.every(
      entity => entity.tenantId === tenantId
    );
    
    if (!allBelongToTenant) {
      await this.logSecurityViolation({
        entityIds,
        entityType,
        tenantId,
        reason: '批量访问中存在租户ID不匹配的记录'
      });
      return false;
    }
    
    return true;
  }
}
```

#### **3.2.2 审计日志**

```typescript
/**
 * 数据访问审计日志
 */
interface DataAccessAuditLog {
  /** 日志ID */
  id: string;
  
  /** 租户ID */
  tenantId: string;
  
  /** 用户ID */
  userId: string;
  
  /** 操作类型 */
  operation: 'READ' | 'WRITE' | 'DELETE';
  
  /** 实体类型 */
  entityType: string;
  
  /** 实体ID */
  entityId: string;
  
  /** 是否违反安全策略 */
  isViolation: boolean;
  
  /** 违反原因 */
  violationReason?: string;
  
  /** 请求IP */
  requestIp: string;
  
  /** 请求时间 */
  timestamp: Date;
  
  /** 请求详情（JSON） */
  requestDetails?: Record<string, any>;
}

/**
 * 安全审计服务
 */
class SecurityAuditService {
  /**
   * 记录数据访问日志
   */
  async logDataAccess(log: Partial<DataAccessAuditLog>): Promise<void> {
    await this.auditRepository.create({
      ...log,
      timestamp: new Date()
    });
  }
  
  /**
   * 记录安全违规
   */
  async logSecurityViolation(violation: {
    entityId?: string | string[];
    entityType: string;
    tenantId: string;
    reason: string;
  }): Promise<void> {
    const tenantContext = tenantContextStorage.getStore();
    
    await this.logDataAccess({
      tenantId: violation.tenantId,
      userId: tenantContext?.userId || 'unknown',
      operation: 'READ',
      entityType: violation.entityType,
      entityId: Array.isArray(violation.entityId)
        ? violation.entityId.join(',')
        : violation.entityId,
      isViolation: true,
      violationReason: violation.reason,
      requestIp: tenantContext?.requestIp || 'unknown',
      timestamp: new Date()
    });
    
    // 发送告警（如果违规严重）
    if (this.isSevereViolation(violation)) {
      await this.sendSecurityAlert(violation);
    }
  }
}
```

#### **3.2.3 查询注入防护**

```typescript
/**
 * SQL注入防护
 * @description 确保租户ID等关键参数不会被注入
 */
class SQLInjectionProtection {
  /**
   * 验证租户ID格式
   */
  validateTenantId(tenantId: string): boolean {
    // UUID格式验证
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(tenantId);
  }
  
  /**
   * 清理查询参数
   */
  sanitizeQueryParams(params: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        // 移除潜在的SQL注入字符
        sanitized[key] = value.replace(/[;'\"\\]/g, '');
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}
```

### 3.3 性能优化

#### **3.3.1 索引策略**

```sql
-- 1. 单列索引（tenant_id）
CREATE INDEX idx_users_tenant_id ON users(tenant_id);

-- 2. 复合索引（tenant_id 作为第一个字段）
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX idx_users_tenant_created ON users(tenant_id, created_at);

-- 3. 部分索引（针对特定租户状态）
CREATE INDEX idx_users_tenant_active 
  ON users(tenant_id) 
  WHERE status = 'ACTIVE';

-- 4. 覆盖索引（包含查询所需的所有字段）
CREATE INDEX idx_users_tenant_covering 
  ON users(tenant_id, email, name) 
  INCLUDE (created_at, updated_at);
```

#### **3.3.2 分区表策略**

```sql
-- 按租户ID进行哈希分区（适用于超大表）
CREATE TABLE users (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    -- ... 其他字段
) PARTITION BY HASH (tenant_id);

-- 创建分区
CREATE TABLE users_partition_0 PARTITION OF users
    FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE users_partition_1 PARTITION OF users
    FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE users_partition_2 PARTITION OF users
    FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE users_partition_3 PARTITION OF users
    FOR VALUES WITH (MODULUS 4, REMAINDER 3);
```

#### **3.3.3 缓存策略**

```typescript
/**
 * 租户感知缓存
 * @description 缓存键包含租户ID，确保缓存隔离
 */
class TenantAwareCache {
  /**
   * 生成缓存键
   */
  private generateCacheKey(key: string, tenantId: string): string {
    return `tenant:${tenantId}:${key}`;
  }
  
  /**
   * 获取缓存
   */
  async get<T>(key: string, tenantId: string): Promise<T | null> {
    const cacheKey = this.generateCacheKey(key, tenantId);
    return this.cache.get<T>(cacheKey);
  }
  
  /**
   * 设置缓存
   */
  async set<T>(
    key: string,
    value: T,
    tenantId: string,
    ttl?: number
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(key, tenantId);
    await this.cache.set(cacheKey, value, ttl);
  }
  
  /**
   * 删除缓存
   */
  async delete(key: string, tenantId: string): Promise<void> {
    const cacheKey = this.generateCacheKey(key, tenantId);
    await this.cache.delete(cacheKey);
  }
  
  /**
   * 清除租户所有缓存
   */
  async clearTenantCache(tenantId: string): Promise<void> {
    const pattern = `tenant:${tenantId}:*`;
    await this.cache.deletePattern(pattern);
  }
}
```

#### **3.3.4 查询优化**

```typescript
/**
 * 查询优化器（MikroORM）
 * @description 优化跨租户查询，避免全表扫描
 */
class QueryOptimizer {
  /**
   * 优化查询
   */
  optimizeQuery<T>(
    qb: QueryBuilder<T>,
    tenantId: string
  ): QueryBuilder<T> {
    // 1. 确保 tenant_id 过滤条件在最前面
    qb.andWhere({ tenantId });
    
    // 2. 限制查询结果数量
    if (!qb.limit) {
      qb.limit(100); // 默认限制100条
    }
    
    // 3. 优化排序
    // qb.orderBy({ createdAt: 'DESC' });
    
    return qb;
  }
  
  /**
   * 批量查询优化
   */
  async batchQuery<T extends { id: string; tenantId: string }>(
    ids: string[],
    tenantId: string,
    em: EntityManager,
    entityName: string
  ): Promise<T[]> {
    // 分批查询，避免IN子句过大
    const batchSize = 100;
    const results: T[] = [];
    
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const batchResults = await em.find(entityName, {
        id: { $in: batch },
        tenantId
      } as any) as T[];
      results.push(...batchResults);
    }
    
    return results;
  }
}
```

### 3.4 MongoDB 数据隔离

#### **3.4.1 策略概述**

MongoDB 作为文档数据库，支持灵活的文档结构，适合存储非结构化数据、日志、审计记录等。MongoDB 的数据隔离策略与 PostgreSQL 类似，通过文档中的 `tenantId` 字段进行隔离。

#### **3.4.2 MongoDB 集合设计规范**

##### **文档结构设计**

所有 MongoDB 文档必须包含 `tenantId` 字段：

```typescript
/**
 * MongoDB 实体示例（MikroORM）
 */
import { Entity, Property, ObjectId, ObjectIdType } from '@mikro-orm/mongodb';

@Entity({ collection: 'users' })
export class MongoUser {
  @ObjectId()
  _id!: ObjectIdType;
  
  /** 租户ID（必填） */
  @Property({ index: true })
  tenantId!: string;
  
  @Property()
  email!: string;
  
  @Property()
  name!: string;
  
  @Property()
  createdAt: Date = new Date();
  
  @Property()
  updatedAt: Date = new Date();
}
```

##### **索引策略**

```typescript
/**
 * MongoDB 索引创建（MikroORM）
 */
import { Entity, Property, Index } from '@mikro-orm/mongodb';

@Entity({ collection: 'users' })
@Index({ tenantId: 1, email: 1 }, { unique: true })
@Index({ tenantId: 1, createdAt: -1 })
export class MongoUser {
  @Property({ index: true })
  tenantId!: string;
  
  // ... 其他字段
}
```

或者在迁移中创建：

```typescript
/**
 * MongoDB 索引迁移
 */
export class CreateUserIndexes extends Migration {
  async up(): Promise<void> {
    // 创建单字段索引
    this.driver.createIndex('users', 'tenantId');
    
    // 创建复合索引
    this.driver.createIndex('users', { tenantId: 1, email: 1 }, { unique: true });
    
    // 创建复合索引（用于排序）
    this.driver.createIndex('users', { tenantId: 1, createdAt: -1 });
  }
  
  async down(): Promise<void> {
    this.driver.dropIndex('users', 'tenantId');
    this.driver.dropIndex('users', 'tenantId_1_email_1');
    this.driver.dropIndex('users', 'tenantId_1_createdAt_-1');
  }
}
```

#### **3.4.3 MongoDB 数据访问层**

```typescript
/**
 * MongoDB 基础仓库实现
 */
abstract class MongoBaseRepository<T extends { _id: ObjectIdType; tenantId: string }> 
  implements IBaseRepository<T> {
  
  constructor(
    protected readonly em: EntityManager,
    protected readonly entityName: string,
    protected readonly tenantContext: TenantContext
  ) {}
  
  async findById(id: string, tenantId: string): Promise<T | null> {
    return this.em.findOne(
      this.entityName as any,
      { _id: new ObjectId(id), tenantId } as any
    ) as Promise<T | null>;
  }
  
  async findAll(options: QueryOptions, tenantId: string): Promise<T[]> {
    const where = { ...options.where, tenantId } as any;
    return this.em.find(
      this.entityName as any,
      where,
      options
    ) as Promise<T[]>;
  }
  
  async create(data: Partial<T>, tenantId: string): Promise<T> {
    const entity = this.em.create(this.entityName as any, {
      ...data,
      tenantId
    } as any);
    await this.em.persistAndFlush(entity);
    return entity as T;
  }
  
  async update(id: string, data: Partial<T>, tenantId: string): Promise<T> {
    const entity = await this.em.findOneOrFail(
      this.entityName as any,
      { _id: new ObjectId(id), tenantId } as any
    );
    this.em.assign(entity, data);
    await this.em.flush();
    return entity as T;
  }
  
  async delete(id: string, tenantId: string): Promise<boolean> {
    const entity = await this.em.findOne(
      this.entityName as any,
      { _id: new ObjectId(id), tenantId } as any
    );
    if (!entity) {
      return false;
    }
    await this.em.removeAndFlush(entity);
    return true;
  }
}
```

#### **3.4.4 MongoDB 查询优化**

```typescript
/**
 * MongoDB 查询优化器
 */
class MongoQueryOptimizer {
  /**
   * 优化查询（使用聚合管道）
   */
  async findWithAggregation<T>(
    em: EntityManager,
    collectionName: string,
    tenantId: string,
    pipeline: any[] = []
  ): Promise<T[]> {
    // 在管道开始处添加租户过滤
    const tenantMatch = { $match: { tenantId } };
    const optimizedPipeline = [tenantMatch, ...pipeline];
    
    return em.aggregate(collectionName, optimizedPipeline) as Promise<T[]>;
  }
  
  /**
   * 批量查询优化
   */
  async batchQuery<T extends { _id: ObjectIdType; tenantId: string }>(
    ids: string[],
    tenantId: string,
    em: EntityManager,
    entityName: string
  ): Promise<T[]> {
    const batchSize = 100;
    const results: T[] = [];
    
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const objectIds = batch.map(id => new ObjectId(id));
      
      const batchResults = await em.find(entityName, {
        _id: { $in: objectIds },
        tenantId
      } as any) as T[];
      results.push(...batchResults);
    }
    
    return results;
  }
}
```

#### **3.4.5 MongoDB 集合级隔离（可选）**

对于需要更强隔离的场景，可以为每个租户创建独立的集合：

```typescript
/**
 * MongoDB 集合级隔离
 * @description 为每个租户创建独立的集合（适用于超大租户）
 */
class MongoCollectionPerTenantIsolation {
  /**
   * 获取租户集合名称
   */
  getTenantCollectionName(baseCollection: string, tenantId: string): string {
    return `${baseCollection}_${tenantId.replace(/-/g, '_')}`;
  }
  
  /**
   * 创建租户集合
   */
  async createTenantCollection(
    em: EntityManager,
    baseCollection: string,
    tenantId: string
  ): Promise<void> {
    const collectionName = this.getTenantCollectionName(baseCollection, tenantId);
    await em.getDriver().createCollection(collectionName);
    
    // 创建索引
    await em.getDriver().createIndex(collectionName, { createdAt: -1 });
  }
  
  /**
   * 使用租户集合查询
   */
  async findInTenantCollection<T>(
    em: EntityManager,
    baseCollection: string,
    tenantId: string,
    where: any
  ): Promise<T[]> {
    const collectionName = this.getTenantCollectionName(baseCollection, tenantId);
    return em.find(collectionName, where) as Promise<T[]>;
  }
}
```

### 3.5 PostgreSQL 和 MongoDB 混合使用

#### **3.5.1 数据分配策略**

```typescript
/**
 * 数据分配策略
 * @description 根据数据特性选择合适的数据库
 */
class DataAllocationStrategy {
  /**
   * 判断数据应该存储在哪个数据库
   */
  shouldUsePostgreSQL(entityType: string): boolean {
    // 使用 PostgreSQL 的场景：
    // 1. 需要事务保证的核心业务数据
    // 2. 关系型数据
    // 3. 需要复杂查询的数据
    const postgresEntities = [
      'User',
      'Organization',
      'Department',
      'Tenant',
      'Permission',
      'Role',
    ];
    
    return postgresEntities.includes(entityType);
  }
  
  shouldUseMongoDB(entityType: string): boolean {
    // 使用 MongoDB 的场景：
    // 1. 文档型数据
    // 2. 非结构化数据
    // 3. 日志、审计记录
    // 4. 配置数据
    const mongoEntities = [
      'AuditLog',
      'SystemLog',
      'UserActivity',
      'Configuration',
      'Notification',
    ];
    
    return mongoEntities.includes(entityType);
  }
}
```

#### **3.5.2 统一数据访问服务**

```typescript
/**
 * 统一数据访问服务
 * @description 根据实体类型自动选择 PostgreSQL 或 MongoDB
 */
class UnifiedDataAccessService {
  constructor(
    private readonly postgresORM: MikroORM,
    private readonly mongoORM: MikroORM,
    private readonly allocationStrategy: DataAllocationStrategy
  ) {}
  
  /**
   * 获取对应的 EntityManager
   */
  getEntityManager(entityType: string): EntityManager {
    if (this.allocationStrategy.shouldUsePostgreSQL(entityType)) {
      return this.postgresORM.em.fork();
    } else if (this.allocationStrategy.shouldUseMongoDB(entityType)) {
      return this.mongoORM.em.fork();
    }
    
    throw new Error(`无法确定实体 ${entityType} 应该使用的数据库`);
  }
  
  /**
   * 统一查询方法
   */
  async find<T>(
    entityType: string,
    where: any,
    tenantId: string
  ): Promise<T[]> {
    const em = this.getEntityManager(entityType);
    const tenantWhere = { ...where, tenantId };
    return em.find(entityType, tenantWhere) as Promise<T[]>;
  }
  
  /**
   * 跨数据库事务（如果需要）
   * 注意：MongoDB 和 PostgreSQL 不支持跨数据库事务
   * 需要使用 Saga 模式或最终一致性方案
   */
  async executeInTransaction<T>(
    operations: Array<() => Promise<any>>
  ): Promise<T[]> {
    // 分别执行操作，使用补偿机制处理失败
    const results: any[] = [];
    const compensations: Array<() => Promise<void>> = [];
    
    for (const operation of operations) {
      try {
        const result = await operation();
        results.push(result);
      } catch (error) {
        // 执行补偿操作
        for (const compensation of compensations.reverse()) {
          await compensation();
        }
        throw error;
      }
    }
    
    return results as T[];
  }
}
```

---

## 4. 未来扩展方案

### 4.1 模式级隔离（Schema-Per-Tenant）

#### **4.1.1 架构设计**

```typescript
/**
 * 模式级隔离实现（MikroORM）
 * @description 每个租户拥有独立的数据库模式
 */
class SchemaPerTenantIsolation {
  constructor(
    private readonly orm: MikroORM,
    private readonly baseConfig: any
  ) {}
  
  /**
   * 创建租户模式
   */
  async createTenantSchema(tenantId: string): Promise<void> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const connection = this.orm.em.getConnection();
    
    // 创建模式
    await connection.execute(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    
    // 在模式中创建所有业务表
    await this.createTablesInSchema(schemaName);
  }
  
  /**
   * 获取租户 EntityManager
   */
  async getTenantEntityManager(tenantId: string): Promise<EntityManager> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    // 创建指向特定模式的 EntityManager
    const em = this.orm.em.fork();
    // 设置搜索路径
    await em.getConnection().execute(`SET search_path TO ${schemaName}`);
    
    return em;
  }
}
```

#### **4.1.2 迁移策略**

```typescript
/**
 * 从行级隔离迁移到模式级隔离
 */
class IsolationMigrationService {
  /**
   * 迁移租户数据
   */
  async migrateToSchemaIsolation(
    tenantId: string,
    targetSchema: string
  ): Promise<void> {
    // 1. 创建目标模式
    await this.createTenantSchema(targetSchema);
    
    // 2. 复制数据
    await this.copyTenantData(tenantId, targetSchema);
    
    // 3. 验证数据完整性
    await this.validateDataIntegrity(tenantId, targetSchema);
    
    // 4. 更新租户配置
    await this.updateTenantIsolationStrategy(
      tenantId,
      IsolationStrategy.SCHEMA_PER_TENANT
    );
    
    // 5. 切换数据源
    await this.switchTenantDataSource(tenantId, targetSchema);
  }
}
```

### 4.2 数据库级隔离（Database-Per-Tenant）

#### **4.2.1 架构设计**

```typescript
/**
 * 数据库级隔离实现（MikroORM）
 * @description 每个租户拥有独立的数据库实例
 */
class DatabasePerTenantIsolation {
  private tenantORMInstances: Map<string, MikroORM> = new Map();
  
  constructor(
    private readonly baseConfig: any,
    private readonly adminConnection: Connection
  ) {}
  
  /**
   * 创建租户数据库
   */
  async createTenantDatabase(tenantId: string): Promise<void> {
    const dbName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    // 创建数据库
    await this.adminConnection.execute(`CREATE DATABASE ${dbName}`);
    
    // 创建 MikroORM 实例
    const tenantConfig = {
      ...this.baseConfig,
      dbName,
    };
    
    const tenantORM = await MikroORM.init(tenantConfig);
    
    // 运行迁移
    await tenantORM.getMigrator().up();
    
    // 缓存实例
    this.tenantORMInstances.set(tenantId, tenantORM);
  }
  
  /**
   * 获取租户 MikroORM 实例
   */
  async getTenantORM(tenantId: string): Promise<MikroORM> {
    let orm = this.tenantORMInstances.get(tenantId);
    
    if (!orm) {
      const dbName = `tenant_${tenantId.replace(/-/g, '_')}`;
      const tenantConfig = {
        ...this.baseConfig,
        dbName,
      };
      orm = await MikroORM.init(tenantConfig);
      this.tenantORMInstances.set(tenantId, orm);
    }
    
    return orm;
  }
  
  /**
   * 获取租户 EntityManager
   */
  async getTenantEntityManager(tenantId: string): Promise<EntityManager> {
    const orm = await this.getTenantORM(tenantId);
    return orm.em.fork();
  }
}
```

### 4.3 混合隔离策略

#### **4.3.1 策略选择器**

```typescript
/**
 * 混合隔离策略选择器
 * @description 根据租户需求动态选择隔离策略
 */
class HybridIsolationStrategy {
  /**
   * 选择隔离策略
   */
  selectIsolationStrategy(tenant: Tenant): IsolationStrategy {
    // 根据租户类型、规模、安全需求选择策略
    if (tenant.type === TenantType.CUSTOM) {
      return IsolationStrategy.DATABASE_PER_TENANT;
    }
    
    if (tenant.type === TenantType.ENTERPRISE && tenant.config.requiresStrongIsolation) {
      return IsolationStrategy.SCHEMA_PER_TENANT;
    }
    
    return IsolationStrategy.ROW_LEVEL_SECURITY;
  }
  
  /**
   * 获取数据访问服务
   */
  getDataAccessService(tenant: Tenant): IDataAccessService {
    const strategy = this.selectIsolationStrategy(tenant);
    
    switch (strategy) {
      case IsolationStrategy.ROW_LEVEL_SECURITY:
        return new RowLevelSecurityService();
      case IsolationStrategy.SCHEMA_PER_TENANT:
        return new SchemaPerTenantService();
      case IsolationStrategy.DATABASE_PER_TENANT:
        return new DatabasePerTenantService();
      default:
        return new RowLevelSecurityService();
    }
  }
}
```

---

## 5. 实施规范

### 5.1 开发规范

#### **5.1.1 代码规范**

1. **所有业务表必须包含 `tenant_id` 字段**
2. **所有数据查询必须包含租户过滤条件**
3. **所有数据写入必须设置 `tenant_id`**
4. **禁止跨租户数据访问**
5. **所有数据访问操作必须记录审计日志**

#### **5.1.2 代码审查清单**

- [ ] 表结构包含 `tenant_id` 字段
- [ ] 查询包含租户过滤条件
- [ ] 写入操作设置 `tenant_id`
- [ ] 索引包含 `tenant_id` 作为第一个字段
- [ ] 唯一性约束包含 `tenant_id`
- [ ] 外键约束正确设置
- [ ] 审计日志记录完整

### 5.2 测试规范

#### **5.2.1 单元测试**

```typescript
/**
 * 租户隔离测试
 */
describe('Tenant Isolation Tests', () => {
  it('should only return data for the specified tenant', async () => {
    const tenant1 = await createTestTenant();
    const tenant2 = await createTestTenant();
    
    const user1 = await createUser({ tenantId: tenant1.id });
    const user2 = await createUser({ tenantId: tenant2.id });
    
    const users = await userRepository.findAll({}, tenant1.id);
    
    expect(users).toHaveLength(1);
    expect(users[0].id).toBe(user1.id);
    expect(users).not.toContainEqual(expect.objectContaining({ id: user2.id }));
  });
  
  it('should prevent cross-tenant data access', async () => {
    const tenant1 = await createTestTenant();
    const tenant2 = await createTestTenant();
    
    const user1 = await createUser({ tenantId: tenant1.id });
    
    await expect(
      userRepository.findById(user1.id, tenant2.id)
    ).rejects.toThrow('记录不存在或不属于该租户');
  });
});
```

#### **5.2.2 集成测试**

```typescript
/**
 * 租户隔离集成测试
 */
describe('Tenant Isolation Integration Tests', () => {
  it('should isolate data across tenants in API requests', async () => {
    const tenant1 = await createTestTenant();
    const tenant2 = await createTestTenant();
    
    const user1 = await createUser({ tenantId: tenant1.id });
    const user2 = await createUser({ tenantId: tenant2.id });
    
    // 使用 tenant1 的上下文请求
    const response1 = await request(app)
      .get('/api/users')
      .set('X-Tenant-Id', tenant1.id)
      .expect(200);
    
    expect(response1.body).toHaveLength(1);
    expect(response1.body[0].id).toBe(user1.id);
    
    // 使用 tenant2 的上下文请求
    const response2 = await request(app)
      .get('/api/users')
      .set('X-Tenant-Id', tenant2.id)
      .expect(200);
    
    expect(response2.body).toHaveLength(1);
    expect(response2.body[0].id).toBe(user2.id);
  });
});
```

### 5.3 监控和告警

#### **5.3.1 监控指标**

1. **数据访问指标**
   - 跨租户访问尝试次数
   - 安全违规次数
   - 查询性能指标

2. **系统资源指标**
   - 数据库连接数
   - 查询响应时间
   - 缓存命中率

3. **业务指标**
   - 租户数量
   - 租户数据量
   - 租户活跃度

#### **5.3.2 告警规则**

```typescript
/**
 * 安全告警规则
 */
interface SecurityAlertRule {
  /** 跨租户访问尝试次数阈值 */
  crossTenantAccessThreshold: number;
  
  /** 安全违规次数阈值 */
  securityViolationThreshold: number;
  
  /** 告警级别 */
  alertLevel: 'WARNING' | 'CRITICAL';
  
  /** 告警通知渠道 */
  notificationChannels: string[];
}

/**
 * 告警服务
 */
class SecurityAlertService {
  async checkAndAlert(tenantId: string): Promise<void> {
    const violations = await this.getViolationsCount(tenantId);
    
    if (violations > this.alertRule.securityViolationThreshold) {
      await this.sendAlert({
        level: 'CRITICAL',
        message: `租户 ${tenantId} 检测到 ${violations} 次安全违规`,
        tenantId
      });
    }
  }
}
```

---

## 6. 总结

### 6.1 核心要点

1. **统一行级隔离策略**：运营初期所有租户采用行级隔离，简化系统复杂度
2. **多层安全机制**：应用层验证 + 数据库RLS + 审计日志
3. **性能优化**：索引策略、分区表、缓存策略
4. **可扩展架构**：预留模式级和数据库级隔离支持
5. **严格开发规范**：确保所有数据访问操作都包含租户隔离

### 6.2 实施建议

1. **阶段一**：实施行级隔离，建立完整的租户隔离机制
2. **阶段二**：优化性能和监控，确保系统稳定运行
3. **阶段三**：根据业务需求，逐步开放模式级和数据库级隔离

### 6.3 风险控制

1. **数据泄露风险**：通过多层验证机制降低风险
2. **性能风险**：通过索引和缓存优化保证性能
3. **扩展风险**：通过可扩展架构设计降低迁移成本

---

## 附录

### A. 术语表

- **租户（Tenant）**：平台中的独立客户单位
- **行级隔离（Row-Level Security）**：通过租户ID字段进行数据隔离
- **模式级隔离（Schema-Per-Tenant）**：每个租户拥有独立的数据库模式
- **数据库级隔离（Database-Per-Tenant）**：每个租户拥有独立的数据库实例
- **RLS（Row Level Security）**：PostgreSQL的行级安全策略

### B. 参考文档

- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Multi-Tenant SaaS Architecture](https://docs.microsoft.com/en-us/azure/sql-database/saas-tenancy-app-design-patterns)
- [MikroORM Documentation](https://mikro-orm.io/)
- [MikroORM PostgreSQL Driver](https://mikro-orm.io/docs/installation#postgresql)
- [MikroORM MongoDB Driver](https://mikro-orm.io/docs/installation#mongodb)
- [MongoDB Multi-Tenancy](https://www.mongodb.com/docs/manual/administration/multi-tenant-architecture/)

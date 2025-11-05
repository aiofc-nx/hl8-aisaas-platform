# @hl8/nestjs-fastify

Fastify 专用的企业级基础设施模块 - 为 NestJS + Fastify 应用提供生产级功能

---

## ⚠️ 重要说明

### 模块配置方式

本模块提供多个独立的子模块，每个子模块都使用 **模块选项**（Module Options）进行配置。

**关键点**：

- ✅ 每个功能模块独立配置
- ✅ 使用 `forRoot()` 或 `forRootAsync()` 进行配置
- ✅ 模块选项使用 **interface** 定义
- ✅ **不使用** `@hl8/config` 的 TypedConfigModule
- ✅ 可以从 AppConfig 获取配置值（推荐）

**典型用法**：

```typescript
// 方式1：直接配置（简单）
RateLimitModule.forRoot({
  max: 100,
  timeWindow: 60000,
});

// 方式2：从 AppConfig 获取（推荐）
RateLimitModule.forRootAsync({
  inject: [AppConfig],
  useFactory: (config: AppConfig) => config.rateLimit,
});
```

详见：[模块选项 vs 应用配置](../../docs/guides/config/MODULE_OPTIONS_VS_APP_CONFIG.md)

---

## 🎓 新手培训

**培训文档**：👉 **[Fastify 基础设施模块培训](./docs/FASTIFY_TRAINING.md)** ⭐

这份培训文档详细讲解：

- **为什么设计这个模块**：企业级需求分析
- **与官方适配器的区别**：功能对比、性能对比、代码量对比
- **如何使用**：详细的使用方法和区别说明
- **实际应用**：完整的实战场景和迁移指南

**推荐阅读顺序**：

1. 先看培训文档（了解为什么和区别）
2. 再看本 README（了解详细用法）

**更多文档**：查看 [docs 目录](./docs/)

---

## 📚 目录

- [重要说明](#-重要说明)
- [概述](#-概述)
- [特性](#-特性)
- [安装](#-安装)
- [模块列表](#-模块列表)
- [快速开始](#-快速开始)
- [核心模块](#-核心模块)
- [性能模块](#-性能模块)
- [安全模块](#-安全模块)
- [完整示例](#-完整示例)
- [配置参考](#-配置参考)
- [与其他模块集成](#-与其他模块集成)
- [常见问题](#-常见问题)
- [最佳实践](#-最佳实践)
- [架构设计](#️-架构设计)
- [相关链接](#-相关链接)

---

## 📋 概述

`@hl8/nestjs-fastify` 是一个为 NestJS + Fastify 应用设计的企业级基础设施模块集，提供：

- ✅ **完整的功能模块**：8+ 个生产级功能模块
- ✅ **Fastify 原生集成**：充分利用 Fastify 性能
- ✅ **企业级特性**：速率限制、安全、监控、日志
- ✅ **多租户支持**：内置多租户隔离能力
- ✅ **开箱即用**：默认配置，零配置启动
- ✅ **类型安全**：完整的 TypeScript 类型定义

---

## ✨ 特性

### 核心基础设施

#### 🎯 异常处理（FastifyExceptionModule）

- ✅ **RFC7807 标准**：统一的错误响应格式
- ✅ **Fastify 优化**：针对 Fastify 的专门优化
- ✅ **自动捕获**：全局异常过滤器
- ✅ **环境适配**：开发/生产环境差异化

详见：[@hl8/exceptions](../exceptions)

#### 📝 日志（FastifyLoggingModule）

- ✅ **零开销**：复用 Fastify Pino，性能极致
- ✅ **结构化日志**：JSON 格式，易于解析
- ✅ **自动上下文注入**：自动包含请求上下文（requestId、method、url 等）
- ✅ **敏感信息脱敏**：自动脱敏敏感字段（password、token 等）
- ✅ **结构化上下文**：类型安全的结构化上下文接口
- ✅ **子日志器支持**：创建带有预定义上下文的子日志器
- ✅ **性能监控**：自动记录日志性能指标
- ✅ **错误处理增强**：日志写入失败的降级策略
- ✅ **隔离上下文**：自动包含租户/组织信息
- ✅ **美化输出**：开发环境友好的日志格式
- ✅ **完全兼容**：API 与 NestJS Logger 完全兼容

**新功能文档**：

- [使用示例](./docs/LOGGING_EXAMPLES.md) - 结构化上下文和子日志器使用示例
- [迁移指南](./docs/LOGGING_MIGRATION.md) - 从 NestJS Logger 迁移指南
- [日志级别映射](./docs/LOG_LEVEL_MAPPING.md) - 日志级别映射说明

详见：[日志配置文档](./docs/LOGGING_CONFIG.md)

---

### 性能优化

#### 🗜️ 响应压缩（CompressionModule）

- ✅ **多种算法**：Brotli、Gzip、Deflate
- ✅ **智能压缩**：根据内容类型和大小自动判断
- ✅ **可配置阈值**：控制压缩触发条件
- ✅ **性能优化**：减少带宽，提升响应速度

#### 📊 Prometheus Metrics（MetricsModule）

- ✅ **HTTP 指标**：请求计数、响应时间、错误率
- ✅ **租户级指标**：多租户场景的分组统计
- ✅ **自定义指标**：支持业务指标收集
- ✅ **标准端点**：`/metrics` Prometheus 格式

---

### 安全保护

#### 🛡️ 安全头（SecurityModule/Helmet）

- ✅ **默认安全配置**：开箱即用的安全策略
- ✅ **CSP 策略**：内容安全策略配置
- ✅ **HSTS**：强制 HTTPS
- ✅ **X-Frame-Options**：防止点击劫持
- ✅ **多重安全头**：XSS、MIME 等保护

#### 🚦 速率限制（RateLimitModule）

- ✅ **多种策略**：IP、租户、用户、自定义
- ✅ **双存储支持**：Redis（分布式）+ 内存（本地）
- ✅ **装饰器语法**：声明式配置
- ✅ **自动降级**：Redis 故障时降级到内存
- ✅ **RFC 6585**：标准响应头

#### 🌐 CORS（CorsModule）

- ✅ **灵活的 Origin**：支持字符串、数组、正则、函数
- ✅ **凭证支持**：Cookie/认证头
- ✅ **预检请求**：自动处理 OPTIONS
- ✅ **自定义头**：允许的请求/响应头配置

---

### 适配器和工具

#### ⚡ EnterpriseFastifyAdapter

- ✅ **Fastify 适配**：NestJS 与 Fastify 的桥接
- ✅ **性能监控**：内置请求跟踪
- ✅ **健康检查**：`/health` 端点
- ✅ **优雅关闭**：确保请求完成后关闭

---

## 📦 安装

```bash
pnpm add @hl8/nestjs-fastify
````

**依赖要求**：

- NestJS >= 11.0.0
- Fastify >= 4.0.0
- Node.js >= 18.0.0

---

## 📋 模块列表

本包提供以下独立模块：

| 模块                         | 功能             | 必需    |
| ---------------------------- | ---------------- | ------- |
| **FastifyExceptionModule**   | 异常处理         | ✅ 推荐 |
| **FastifyLoggingModule**     | 日志             | ✅ 推荐 |
| **CompressionModule**        | 响应压缩         | ⭐ 推荐 |
| **MetricsModule**            | Prometheus 指标  | ⭐ 推荐 |
| **SecurityModule**           | 安全头（Helmet） | ✅ 推荐 |
| **RateLimitModule**          | 速率限制         | ⭐ 按需 |
| **CorsModule**               | 跨域配置         | ⭐ 按需 |
| **EnterpriseFastifyAdapter** | Fastify 适配器   | ✅ 必需 |

---

## 🚀 快速开始

### 步骤1：创建 Fastify 应用

```typescript
// main.ts
import { NestFactory } from "@nestjs/core";
import { EnterpriseFastifyAdapter } from "@hl8/nestjs-fastify/index.js";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  // 使用 EnterpriseFastifyAdapter
  const app = await NestFactory.create(AppModule, new EnterpriseFastifyAdapter());

  await app.listen(3000, "0.0.0.0");
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
```

### 步骤2：配置核心模块

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { FastifyExceptionModule, FastifyLoggingModule, CompressionModule, MetricsModule } from "@hl8/nestjs-fastify/index.js";

@Module({
  imports: [
    // 异常处理（推荐）
    FastifyExceptionModule.forRoot({
      isProduction: process.env.NODE_ENV === "production",
    }),

    // 日志（推荐）
    FastifyLoggingModule.forRoot({
      config: {
        level: "info",
        prettyPrint: process.env.NODE_ENV === "development",
      },
    }),

    // 压缩（可选）
    CompressionModule.forRoot({
      global: true,
      threshold: 1024,
    }),

    // Metrics（可选）
    MetricsModule.forRoot({
      defaultLabels: {
        app: "my-app",
      },
    }),
  ],
})
export class AppModule {}
```

### 步骤3：访问应用

```bash
# 访问应用
curl http://localhost:3000

# 查看 Metrics
curl http://localhost:3000/metrics

# 查看健康检查
curl http://localhost:3000/health
```

---

## 🎯 核心模块

### FastifyExceptionModule - 异常处理

统一的异常处理，符合 RFC7807 标准。

**基本用法**：

```typescript
import { FastifyExceptionModule } from "@hl8/nestjs-fastify/index.js";

@Module({
  imports: [
    FastifyExceptionModule.forRoot({
      isProduction: process.env.NODE_ENV === "production",
    }),
  ],
})
export class AppModule {}
```

**特性**：

- 自动捕获所有异常
- RFC7807 格式响应
- 开发/生产环境差异化
- 详细的错误日志

详见：[@hl8/exceptions 文档](../exceptions/README.md)

---

### FastifyLoggingModule - 日志

高性能的结构化日志，复用 Fastify Pino，提供企业级功能。

**基本用法**：

```typescript
import { FastifyLoggingModule } from "@hl8/nestjs-fastify/index.js";

@Module({
  imports: [
    FastifyLoggingModule.forRoot({
      config: {
        level: "info", // 日志级别
        prettyPrint: true, // 美化输出（开发环境）
        timestamp: true, // 时间戳

        // 启用上下文注入（自动包含请求上下文）
        context: {
          enabled: true,
          includeRequestDetails: true,
          includeUserInfo: false,
        },

        // 启用敏感信息脱敏
        sanitizer: {
          enabled: true,
          sensitiveFields: ["password", "token", "secret"],
        },

        // 启用性能监控（可选）
        performance: {
          enabled: true,
          trackLogWriteTime: true,
        },
      },
    }),
  ],
})
export class AppModule {}
```

**在服务中使用**：

```typescript
// 推荐：使用 Logger 别名（更接近 NestJS 风格）
import { Logger } from "@hl8/nestjs-fastify/index.js";
// 或者使用完整的类名（向后兼容）
import { FastifyLoggerService } from "@hl8/nestjs-fastify/index.js";

import type { StructuredLogContext } from "@hl8/nestjs-fastify/index.js";

@Injectable()
export class UserService {
  constructor(private readonly logger: Logger) {}

  async createUser(data: CreateUserDto) {
    // 使用结构化上下文（推荐）
    this.logger.log("创建用户", {
      business: {
        operation: "createUser",
        resource: "User",
      },
      // 敏感字段会自动脱敏
      password: data.password, // 自动脱敏为 "***"
    } satisfies StructuredLogContext);

    try {
      const user = await this.userRepo.save(data);
      this.logger.log("用户创建成功", {
        business: {
          operation: "createUser",
          resource: "User",
          action: "completed",
        },
        userId: user.id,
      } satisfies StructuredLogContext);
      return user;
    } catch (error) {
      this.logger.error(error, {
        business: {
          operation: "createUser",
          resource: "User",
          action: "failed",
        },
      } satisfies StructuredLogContext);
      throw error;
    }
  }
}
```

**使用子日志器**：

```typescript
@Injectable()
export class OrderService {
  private readonly logger: FastifyLoggerService;

  constructor(baseLogger: FastifyLoggerService) {
    // 创建子日志器，自动包含模块上下文
    this.logger = baseLogger.child({
      module: "OrderService",
      domain: "ecommerce",
    });
  }

  async createOrder(orderData: OrderData) {
    // 自动包含 module 和 domain 上下文，以及请求上下文
    this.logger.log("创建订单", {
      orderData,
    });
  }
}
```

**日志输出示例**：

```json
{
  "level": 30,
  "time": 1699876543210,
  "pid": 12345,
  "hostname": "app-server",
  "module": "OrderService",
  "domain": "ecommerce",
  "request": {
    "requestId": "req-abc-123",
    "method": "POST",
    "url": "/api/orders",
    "ip": "192.168.1.1"
  },
  "business": {
    "operation": "createOrder",
    "resource": "Order",
    "action": "completed"
  },
  "msg": "创建订单",
  "orderId": "order-123",
  "password": "***"
}
```

**新功能文档**：

- [使用示例](./docs/LOGGING_EXAMPLES.md) - 结构化上下文和子日志器详细示例
- [迁移指南](./docs/LOGGING_MIGRATION.md) - 从 NestJS Logger 迁移指南
- [日志级别映射](./docs/LOG_LEVEL_MAPPING.md) - 日志级别映射说明

详见：[日志配置文档](./docs/LOGGING_CONFIG.md)

---

## 🚀 性能模块

### CompressionModule - 响应压缩

自动压缩响应，减少带宽使用。

**基本用法**：

```typescript
import { CompressionModule } from "@hl8/nestjs-fastify/index.js";

@Module({
  imports: [
    // 同步配置
    CompressionModule.forRoot({
      global: true, // 全局启用
      threshold: 1024, // 大于 1KB 才压缩
      encodings: ["br", "gzip", "deflate"], // 支持的编码
    }),

    // 异步配置（推荐，从 AppConfig 获取）
    CompressionModule.forRootAsync({
      imports: [ConfigModule],
      inject: [AppConfig],
      useFactory: (config: AppConfig) => config.compression,
    }),
  ],
})
export class AppModule {}
```

**配置选项**：

| 选项        | 类型       | 默认值                      | 说明             |
| ----------- | ---------- | --------------------------- | ---------------- |
| `global`    | `boolean`  | `false`                     | 是否全局启用     |
| `threshold` | `number`   | `1024`                      | 压缩阈值（字节） |
| `encodings` | `string[]` | `['br', 'gzip', 'deflate']` | 支持的编码       |

**效果**：

- Brotli：最高压缩率（~20-25%）
- Gzip：平衡（~30-40%）
- Deflate：最快（~35-45%）

---

### MetricsModule - Prometheus 指标

收集和暴露 Prometheus 格式的指标。

**基本用法**：

```typescript
import { MetricsModule } from "@hl8/nestjs-fastify/index.js";

@Module({
  imports: [
    // 同步配置
    MetricsModule.forRoot({
      path: "/metrics", // Metrics 端点
      defaultLabels: {
        // 默认标签
        app: "my-app",
        environment: "production",
      },
      enableDefaultMetrics: true, // 启用默认指标
    }),

    // 异步配置（推荐，从 AppConfig 获取）
    MetricsModule.forRootAsync({
      imports: [ConfigModule],
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        path: config.metrics.path || "/metrics",
        defaultLabels: {
          app: config.appName,
          environment: config.environment,
        },
        enableDefaultMetrics: config.metrics.enableDefaultMetrics,
      }),
    }),
  ],
})
export class AppModule {}
```

**内置指标**：

1. **HTTP 请求计数**：

   ```
   http_requests_total{method="GET",path="/users",status="200",tenant="tenant-123"} 1000
   ```

2. **响应时间直方图**：

   ```
   http_request_duration_seconds_bucket{method="GET",path="/users",le="0.1"} 950
   http_request_duration_seconds_bucket{method="GET",path="/users",le="0.5"} 980
   ```

3. **错误率**：

   ```
   http_requests_errors_total{method="POST",path="/users",status="500"} 5
   ```

**自定义指标**：

```typescript
import { MetricsService } from "@hl8/nestjs-fastify/index.js";

@Injectable()
export class OrderService {
  constructor(private readonly metrics: MetricsService) {
    // 创建自定义指标
    this.orderCounter = this.metrics.createCounter({
      name: "orders_created_total",
      help: "Total number of orders created",
      labelNames: ["status"],
    });
  }

  async createOrder(data: CreateOrderDto) {
    const order = await this.orderRepo.save(data);

    // 增加计数
    this.orderCounter.inc({ status: order.status });

    return order;
  }
}
```

**访问 Metrics**：

```bash
curl http://localhost:3000/metrics
```

---

## 🛡️ 安全模块

### SecurityModule - 安全头（Helmet）

设置安全相关的 HTTP 响应头。

**基本用法**：

```typescript
import { SecurityModule } from "@hl8/nestjs-fastify/index.js";

@Module({
  imports: [
    // 同步配置
    SecurityModule.forRoot({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "cdn.example.com"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "api.example.com"],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 年
        includeSubDomains: true,
      },
    }),

    // 异步配置（推荐，从 AppConfig 获取）
    SecurityModule.forRootAsync({
      imports: [ConfigModule],
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: config.csp.scriptSrc,
            styleSrc: config.csp.styleSrc,
          },
        },
        hsts: {
          maxAge: config.security.hstsMaxAge,
          includeSubDomains: true,
        },
      }),
    }),
  ],
})
export class AppModule {}
```

**默认安全头**：

```text
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=15552000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

---

### RateLimitModule - 速率限制

限制客户端请求频率，防止滥用。

**基本用法**：

```typescript
import { RateLimitModule } from "@hl8/nestjs-fastify/index.js";

@Module({
  imports: [
    RateLimitModule.forRoot({
      max: 100, // 最大请求数
      timeWindow: 60000, // 时间窗口（毫秒）
      strategy: "ip", // 限制策略：ip/tenant/user/custom
      redis: redisClient, // Redis 客户端（可选）
    }),
  ],
})
export class AppModule {}
```

**装饰器用法**：

```typescript
import { RateLimit } from "@hl8/nestjs-fastify/index.js";

// 控制器级别限制
@Controller("users")
@RateLimit({ max: 1000, timeWindow: 60000 }) // 1000 次/分钟
export class UserController {
  // 方法级别限制（更严格）
  @Post()
  @RateLimit({ max: 10, timeWindow: 60000 }) // 10 次/分钟
  create(@Body() data: CreateUserDto) {
    return this.userService.create(data);
  }

  // 查询可以更宽松
  @Get()
  @RateLimit({ max: 100, timeWindow: 60000 }) // 100 次/分钟
  findAll() {
    return this.userService.findAll();
  }
}
```

**租户级别限制**：

```typescript
import { RateLimitByTenant } from "@hl8/nestjs-fastify/index.js";

@Controller("api")
@RateLimitByTenant({ max: 10000, timeWindow: 3600000 }) // 10000 次/小时/租户
export class ApiController {
  // ...
}
```

**响应头**：

```text
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699876543
Retry-After: 45
```

---

### CorsModule - 跨域配置

配置跨域资源共享（CORS）。

**基本用法**：

```typescript
import { CorsModule } from "@hl8/nestjs-fastify/index.js";

@Module({
  imports: [
    // 同步配置
    CorsModule.forRoot({
      origin: ["https://app.example.com", "https://admin.example.com"],
      credentials: true, // 允许凭证
      allowedHeaders: ["Content-Type", "Authorization"],
      exposedHeaders: ["X-Total-Count"],
      methods: ["GET", "POST", "PUT", "DELETE"],
      maxAge: 3600, // 预检缓存时间
    }),

    // 异步配置（推荐，从 AppConfig 获取）
    CorsModule.forRootAsync({
      imports: [ConfigModule],
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        origin:
          config.environment === "development"
            ? true // 开发环境允许所有
            : config.cors.allowedOrigins, // 生产环境指定域名
        credentials: config.cors.credentials,
        allowedHeaders: config.cors.allowedHeaders,
        exposedHeaders: config.cors.exposedHeaders,
      }),
    }),
  ],
})
export class AppModule {}
```

**动态 Origin**：

```typescript
CorsModule.forRoot({
  origin: (origin, callback) => {
    // 动态判断是否允许
    if (!origin || origin.endsWith(".example.com")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
});
```

---

## 💼 完整示例

### 生产环境推荐配置

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { TypedConfigModule, dotenvLoader } from "@hl8/config";
import { FastifyExceptionModule, FastifyLoggingModule, SecurityModule, CorsModule, CompressionModule, MetricsModule, RateLimitModule } from "@hl8/nestjs-fastify/index.js";
import { IsolationModule } from "@hl8/nestjs-isolation";
import { AppConfig } from "./config/app.config.js";

@Module({
  imports: [
    // 1. 配置模块（必需）
    TypedConfigModule.forRoot({
      schema: AppConfig,
      isGlobal: true,
      load: [
        dotenvLoader({
          envFilePath: [".env.local", ".env"],
        }),
      ],
    }),

    // 2. 数据隔离（推荐）
    IsolationModule.forRoot(),

    // 3. 异常处理（必需）
    FastifyExceptionModule.forRoot({
      isProduction: process.env.NODE_ENV === "production",
    }),

    // 4. 日志（必需）
    FastifyLoggingModule.forRoot({
      config: {
        level: process.env.LOG_LEVEL || "info",
        prettyPrint: process.env.NODE_ENV === "development",
        includeIsolationContext: true,
      },
    }),

    // 5. 安全头（推荐）
    SecurityModule.forRoot({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
    }),

    // 6. CORS（按需）
    CorsModule.forRoot({
      origin: process.env.CORS_ORIGIN?.split(",") || [],
      credentials: true,
    }),

    // 7. 压缩（推荐）
    CompressionModule.forRoot({
      global: true,
      threshold: 1024,
      encodings: ["br", "gzip", "deflate"],
    }),

    // 8. Metrics（推荐）
    MetricsModule.forRoot({
      path: "/metrics",
      defaultLabels: {
        app: "my-app",
        environment: process.env.NODE_ENV,
      },
      includeTenantMetrics: true,
    }),

    // 9. 速率限制（推荐）
    RateLimitModule.forRoot({
      max: 1000,
      timeWindow: 60000,
      strategy: "tenant",
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### 使用 AppConfig（推荐）

```typescript
// app.module.ts
@Module({
  imports: [
    // 配置模块
    TypedConfigModule.forRoot({
      schema: AppConfig,
      isGlobal: true,
      load: [dotenvLoader()],
    }),

    // 从 AppConfig 获取配置
    FastifyExceptionModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        isProduction: config.isProduction,
      }),
    }),

    FastifyLoggingModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        config: config.logging,
      }),
    }),

    MetricsModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => config.metrics,
    }),

    CompressionModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => config.compression,
    }),

    SecurityModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => config.security,
    }),

    CorsModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => config.cors,
    }),

    RateLimitModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => config.rateLimit,
    }),
  ],
})
export class AppModule {}
```

---

## 📖 配置参考

### 从 AppConfig 组合配置（推荐）

```typescript
// apps/fastify-api/src/config/app.config.ts
import { Type } from "class-transformer";
import { IsString, IsNumber, ValidateNested } from "class-validator";
import { LoggingConfig, MetricsModuleConfig, RateLimitModuleConfig } from "@hl8/nestjs-fastify/index.js";

export class AppConfig {
  @IsString()
  NODE_ENV: string = "development";

  @IsNumber()
  @Type(() => Number)
  PORT: number = 3000;

  // 从 @hl8/nestjs-fastify 导入配置类
  @ValidateNested()
  @Type(() => LoggingConfig)
  logging: LoggingConfig = new LoggingConfig();

  @ValidateNested()
  @Type(() => MetricsModuleConfig)
  metrics: MetricsModuleConfig = new MetricsModuleConfig();

  @ValidateNested()
  @Type(() => RateLimitModuleConfig)
  rateLimit?: RateLimitModuleConfig;

  get isProduction(): boolean {
    return this.NODE_ENV === "production";
  }
}
```

详见：[配置指南](../../docs/guides/config/CONFIGURATION_GUIDE.md)

---

## 🔗 与其他模块集成

### 与 @hl8/isolation 集成

```typescript
import { IsolationModule } from "@hl8/nestjs-isolation";
import { FastifyLoggingModule } from "@hl8/nestjs-fastify/index.js";

@Module({
  imports: [
    // 隔离模块
    IsolationModule.forRoot(),

    // 日志模块（自动包含隔离上下文）
    FastifyLoggingModule.forRoot({
      config: {
        includeIsolationContext: true, // ← 自动包含租户/组织信息
      },
    }),
  ],
})
export class AppModule {}
```

### 与 @hl8/caching 集成

```typescript
import { CachingModule } from '@hl8/caching';
import { MetricsModule } from '@hl8/nestjs-fastify';

@Module({
  imports: [
    CachingModule.forRoot({ ... }),

    // Metrics 可以监控缓存命中率
    MetricsModule.forRoot({
      includeTenantMetrics: true,
    }),
  ],
})
export class AppModule {}
```

---

## ❓ 常见问题

### Q1: 为什么不使用 @hl8/config 的 TypedConfigModule？

**A**: 本模块的各个子模块使用**模块选项**（Module Options）进行配置。

- 模块选项：配置模块如何工作（interface，forRoot）
- 应用配置：应用运行时数据（class，TypedConfigModule）

**可以结合使用**：

```typescript
// AppConfig 从 .env 读取
TypedConfigModule.forRoot({ schema: AppConfig });

// 模块从 AppConfig 获取配置值
RateLimitModule.forRootAsync({
  inject: [AppConfig],
  useFactory: (config: AppConfig) => config.rateLimit,
});
```

详见：[模块选项 vs 应用配置](../../docs/guides/config/MODULE_OPTIONS_VS_APP_CONFIG.md)

---

### Q2: EnterpriseFastifyAdapter 和普通 FastifyAdapter 有什么区别？

**A**: EnterpriseF astifyAdapter 是增强版本：

| 特性     | FastifyAdapter | EnterpriseFastifyAdapter |
| -------- | -------------- | ------------------------ |
| 基本功能 | ✅             | ✅                       |
| 性能监控 | ❌             | ✅                       |
| 健康检查 | ❌             | ✅ `/health`             |
| 优雅关闭 | 基础           | ✅ 增强                  |
| 请求跟踪 | ❌             | ✅                       |
| 指标收集 | ❌             | ✅                       |

---

### Q3: 速率限制的 Redis 故障会影响服务吗？

**A**: 不会，有自动降级机制：

1. Redis 可用 → 使用 Redis（分布式）
2. Redis 故障 → 自动降级到内存（本地）
3. 记录警告日志
4. 服务继续运行

---

### Q4: 如何禁用某个路由的 Metrics 收集？

**A**: 使用路由排除配置：

```typescript
MetricsModule.forRoot({
  excludeRoutes: ["/health", "/metrics", "/internal/*"],
});
```

---

### Q5: 日志太多，如何减少？

**A**: 调整日志级别：

```typescript
FastifyLoggingModule.forRoot({
  config: {
    level: "warn", // 只记录 warn 和 error
  },
});
```

日志级别：`trace` < `debug` < `info` < `warn` < `error` < `fatal`

---

### Q6: CORS 在开发环境如何配置？

**A**: 开发环境可以允许所有来源：

```typescript
CorsModule.forRoot({
  origin:
    process.env.NODE_ENV === "development"
      ? true // 开发：允许所有
      : ["https://app.example.com"], // 生产：指定域名
  credentials: true,
});
```

---

## 🎨 最佳实践

### 1. 模块加载顺序

```typescript
@Module({
  imports: [
    // 1️⃣ 配置模块（最先）
    TypedConfigModule.forRoot({ ... }),

    // 2️⃣ 基础设施模块
    IsolationModule.forRoot(),
    FastifyExceptionModule.forRoot({ ... }),
    FastifyLoggingModule.forRoot({ ... }),

    // 3️⃣ 安全模块
    SecurityModule.forRoot({ ... }),
    CorsModule.forRoot({ ... }),
    RateLimitModule.forRoot({ ... }),

    // 4️⃣ 性能模块
    CompressionModule.forRoot({ ... }),
    MetricsModule.forRoot({ ... }),

    // 5️⃣ 业务模块（最后）
    UserModule,
    OrderModule,
  ],
})
```

---

### 2. 环境差异化配置

```typescript
// ✅ 好的做法
@Module({
  imports: [
    FastifyLoggingModule.forRoot({
      config: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        prettyPrint: process.env.NODE_ENV === 'development',
      },
    }),

    SecurityModule.forRoot({
      contentSecurityPolicy: process.env.NODE_ENV === 'production'
        ? { directives: { defaultSrc: ["'self'"] } }
        : false,  // 开发环境禁用 CSP
    }),
  ],
})
```

---

### 3. 使用 forRootAsync 集成配置

```typescript
// ✅ 推荐：从 AppConfig 获取
RateLimitModule.forRootAsync({
  inject: [AppConfig],
  useFactory: (config: AppConfig) => config.rateLimit,
});

// ❌ 避免：硬编码配置
RateLimitModule.forRoot({
  max: 100,
  timeWindow: 60000,
});
```

---

### 4. 速率限制策略选择

```typescript
// ✅ 好的做法：根据场景选择策略
@Module({
  imports: [
    RateLimitModule.forRoot({
      // 公开 API：按 IP 限制
      strategy: "ip",
      max: 100,
      timeWindow: 60000,
    }),
  ],
})
// 在控制器中可以覆盖
@Controller("premium-api")
@RateLimitByTenant({ max: 10000, timeWindow: 60000 }) // 按租户限制
export class PremiumApiController {
  // 高级客户有更高的限额
}
```

---

### 5. Metrics 标签使用

```typescript
// ✅ 好的做法：使用有意义的标签
this.metrics.httpRequestCounter.inc({
  method: "POST",
  path: "/users",
  status: "201",
  tenant: context.tenantId?.value,
});

// ❌ 避免：高基数标签
this.metrics.httpRequestCounter.inc({
  userId: user.id, // ❌ 每个用户一个标签，基数太高
});
```

---

## 🏗️ 架构设计

### 模块架构

```plaintext
@hl8/nestjs-fastify
├── exceptions/              # 异常处理
│   ├── exception.module.ts
│   └── filters/
│
├── logging/                 # 日志
│   ├── logging.module.ts
│   └── fastify-logger.service.ts
│
├── performance/             # 性能优化
│   ├── compression/         # 压缩
│   └── metrics/             # Metrics
│
├── security/                # 安全
│   ├── helmet/              # 安全头
│   ├── cors/                # CORS
│   └── rate-limit/          # 速率限制
│
├── fastify/                 # Fastify 适配器
│   ├── enterprise-fastify.adapter.ts
│   └── monitoring/          # 监控
│
└── config/                  # 配置定义
    ├── logging.config.ts
    ├── fastify-modules.config.ts
    └── index.ts
```

### 依赖关系

```plaintext
业务代码
  ↓ 使用
@hl8/nestjs-fastify（NestJS + Fastify 实现）
  ↓ 依赖
├─ @hl8/exceptions（异常处理）
├─ @hl8/isolation-model（隔离模型）
├─ fastify（Web 框架）
└─ pino（日志）
```

---

## 📚 相关链接

### 项目文档

- [日志配置文档](./docs/LOGGING_CONFIG.md)
- [请求 ID 配置和使用指南](./docs/request-id-guide.md)
- [配置指南](../../docs/guides/config/CONFIGURATION_GUIDE.md)
- [模块选项 vs 应用配置](../../docs/guides/config/MODULE_OPTIONS_VS_APP_CONFIG.md)

### 相关模块

- [@hl8/exceptions](../exceptions) - 异常处理
- [@hl8/nestjs-isolation](../nestjs-isolation) - 数据隔离
- [@hl8/caching](../caching) - 缓存
- [@hl8/config](../config) - 配置管理

### 外部资源

- [Fastify 文档](https://www.fastify.io/)
- [NestJS 文档](https://docs.nestjs.com/)
- [Pino 日志](https://github.com/pinojs/pino)
- [Prometheus](https://prometheus.io/)

---

## 📄 License

MIT © HL8 Team

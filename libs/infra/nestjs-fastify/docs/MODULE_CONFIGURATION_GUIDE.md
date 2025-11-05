# 模块配置指南

本指南详细说明如何配置 `@hl8/nestjs-fastify` 中的各个模块。

---

## 📋 目录

- [配置方式](#配置方式)
- [同步配置 (forRoot)](#同步配置-forroot)
- [异步配置 (forRootAsync)](#异步配置-forrootasync)
- [模块配置示例](#模块配置示例)
- [最佳实践](#最佳实践)

---

## 配置方式

所有模块都支持两种配置方式：

1. **同步配置** (`forRoot`) - 适用于静态配置
2. **异步配置** (`forRootAsync`) - 适用于从 AppConfig 或其他动态源获取配置

---

## 同步配置 (forRoot)

同步配置适用于配置值已知且固定的场景。

### 基本语法

```typescript
import { CompressionModule } from "@hl8/nestjs-fastify/index.js";

@Module({
  imports: [
    CompressionModule.forRoot({
      global: true,
      threshold: 1024,
      encodings: ["br", "gzip", "deflate"],
    }),
  ],
})
export class AppModule {}
```

### 适用场景

- 开发环境快速配置
- 配置值固定不变
- 不需要从环境变量读取

---

## 异步配置 (forRootAsync)

异步配置适用于从 AppConfig 或其他动态源获取配置的场景，**推荐在生产环境使用**。

### 基本语法

```typescript
import { CompressionModule } from "@hl8/nestjs-fastify/index.js";
import { TypedConfigModule } from "@hl8/config";
import { AppConfig } from "./config/app.config.js";

@Module({
  imports: [
    // 1. 先配置 TypedConfigModule
    TypedConfigModule.forRoot({
      schema: AppConfig,
      isGlobal: true,
      load: [dotenvLoader()],
    }),

    // 2. 使用异步配置
    CompressionModule.forRootAsync({
      imports: [ConfigModule], // 如果需要导入其他模块
      inject: [AppConfig], // 注入依赖
      useFactory: (config: AppConfig) => config.compression, // 工厂函数
    }),
  ],
})
export class AppModule {}
```

### 参数说明

- `imports`: 需要导入的模块（可选）
- `inject`: 要注入的依赖（通常是 `AppConfig`）
- `useFactory`: 工厂函数，返回模块配置

### 适用场景

- 从环境变量读取配置
- 从远程配置服务获取配置
- 需要根据环境动态调整配置
- 生产环境推荐方式

---

## 模块配置示例

### CompressionModule

**同步配置**：

```typescript
CompressionModule.forRoot({
  global: true,
  threshold: 1024,
  encodings: ["br", "gzip", "deflate"],
})
```

**异步配置**：

```typescript
CompressionModule.forRootAsync({
  inject: [AppConfig],
  useFactory: (config: AppConfig) => config.compression,
})
```

### MetricsModule

**同步配置**：

```typescript
MetricsModule.forRoot({
  path: "/metrics",
  defaultLabels: {
    app: "my-app",
    environment: "production",
  },
  enableDefaultMetrics: true,
})
```

**异步配置**：

```typescript
MetricsModule.forRootAsync({
  inject: [AppConfig],
  useFactory: (config: AppConfig) => ({
    path: config.metrics.path || "/metrics",
    defaultLabels: {
      app: config.appName,
      environment: config.environment,
    },
    enableDefaultMetrics: config.metrics.enableDefaultMetrics,
  }),
})
```

### SecurityModule

**同步配置**：

```typescript
SecurityModule.forRoot({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
})
```

**异步配置**：

```typescript
SecurityModule.forRootAsync({
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
})
```

### CorsModule

**同步配置**：

```typescript
CorsModule.forRoot({
  origin: ["https://app.example.com"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
})
```

**异步配置**：

```typescript
CorsModule.forRootAsync({
  inject: [AppConfig],
  useFactory: (config: AppConfig) => ({
    origin:
      config.environment === "development"
        ? true // 开发环境允许所有
        : config.cors.allowedOrigins, // 生产环境指定域名
    credentials: config.cors.credentials,
    allowedHeaders: config.cors.allowedHeaders,
  }),
})
```

### RateLimitModule

**同步配置**：

```typescript
RateLimitModule.forRoot({
  max: 1000,
  timeWindow: 60000,
  strategy: "ip",
})
```

**异步配置**：

```typescript
RateLimitModule.forRootAsync({
  inject: [AppConfig],
  useFactory: (config: AppConfig) => config.rateLimit,
})
```

---

## 最佳实践

### 1. 统一使用异步配置

在生产环境中，推荐统一使用 `forRootAsync` 从 AppConfig 获取配置：

```typescript
@Module({
  imports: [
    TypedConfigModule.forRoot({
      schema: AppConfig,
      isGlobal: true,
      load: [dotenvLoader()],
    }),

    // 所有模块都使用异步配置
    CompressionModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => config.compression,
    }),

    MetricsModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => config.metrics,
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

### 2. 环境差异化配置

通过 `useFactory` 实现环境差异化：

```typescript
CorsModule.forRootAsync({
  inject: [AppConfig],
  useFactory: (config: AppConfig) => ({
    origin:
      config.environment === "development"
        ? true // 开发环境：允许所有
        : config.cors.allowedOrigins, // 生产环境：指定域名
    credentials: config.cors.credentials,
  }),
})
```

### 3. 配置合并

异步配置会自动与默认配置合并，无需手动合并：

```typescript
// 只提供需要覆盖的配置
SecurityModule.forRootAsync({
  inject: [AppConfig],
  useFactory: (config: AppConfig) => ({
    // 只覆盖 CSP 配置，其他使用默认值
    contentSecurityPolicy: {
      directives: {
        scriptSrc: config.csp.scriptSrc,
      },
    },
  }),
})
```

### 4. 错误处理

如果 `useFactory` 抛出错误，模块初始化会失败：

```typescript
MetricsModule.forRootAsync({
  inject: [AppConfig],
  useFactory: (config: AppConfig) => {
    if (!config.metrics) {
      throw new Error("Metrics configuration is required");
    }
    return config.metrics;
  },
})
```

---

## 相关文档

- [README.md](../README.md) - 完整的使用指南
- [模块选项 vs 应用配置](../../docs/guides/config/MODULE_OPTIONS_VS_APP_CONFIG.md) - 配置模式说明


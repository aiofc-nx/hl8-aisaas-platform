# 日志级别映射说明

本文档说明 `FastifyLoggerService` 与 NestJS Logger 和 Pino 之间的日志级别映射关系。

---

## 映射表

| NestJS Logger | FastifyLoggerService | Pino 级别 | 数值     | 说明                |
| ------------- | -------------------- | --------- | -------- | ------------------- |
| `log()`       | `log()`              | `info`    | 30       | 常规信息日志        |
| `warn()`      | `warn()`             | `warn`    | 40       | 警告日志            |
| `error()`     | `error()`            | `error`   | 50       | 错误日志            |
| `debug()`     | `debug()`            | `debug`   | 20       | 调试日志            |
| `verbose()`   | `verbose()`          | `trace`   | 10       | 详细跟踪日志        |
| -             | -                    | `fatal`   | 60       | 致命错误（仅 Pino） |
| -             | -                    | `silent`  | Infinity | 禁用所有日志        |

---

## 详细说明

### log() → info

**NestJS Logger**:

```typescript
this.logger.log("用户已创建", "UserService");
```

**FastifyLoggerService**:

```typescript
this.logger.log("用户已创建", { context: "UserService" });
```

**Pino 级别**: `info` (30)

**说明**: NestJS 的 `log()` 方法是最常用的日志方法，映射到 Pino 的 `info` 级别。这是生产环境的标准日志级别。

---

### warn()

**NestJS Logger**:

```typescript
this.logger.warn("配置值缺失，使用默认值", "ConfigService");
```

**FastifyLoggerService**:

```typescript
this.logger.warn("配置值缺失，使用默认值", { context: "ConfigService" });
```

**Pino 级别**: `warn` (40)

**说明**: 警告级别在两个系统中保持一致，用于记录可能存在问题但不影响功能的情况。

---

### error()

**NestJS Logger**:

```typescript
// 方式 1：字符串消息 + 堆栈
this.logger.error("操作失败", error.stack, "ServiceName");

// 方式 2：Error 对象
this.logger.error(error, "ServiceName");
```

**FastifyLoggerService**:

```typescript
// 方式 1：字符串消息 + 堆栈 + context
this.logger.error("操作失败", error.stack, { context: "ServiceName" });

// 方式 2：Error 对象 + context
this.logger.error(error, { context: "ServiceName" });
```

**Pino 级别**: `error` (50)

**说明**: 错误级别在两个系统中保持一致，用于记录错误信息。

---

### debug()

**NestJS Logger**:

```typescript
this.logger.debug("调试信息", "ServiceName");
```

**FastifyLoggerService**:

```typescript
this.logger.debug("调试信息", { context: "ServiceName" });
```

**Pino 级别**: `debug` (20)

**说明**: 调试级别在两个系统中保持一致，用于开发阶段的调试信息。

---

### verbose() → trace

**NestJS Logger**:

```typescript
this.logger.verbose("详细跟踪信息", "ServiceName");
```

**FastifyLoggerService**:

```typescript
this.logger.verbose("详细跟踪信息", { context: "ServiceName" });
```

**Pino 级别**: `trace` (10)

**说明**: NestJS 的 `verbose()` 映射到 Pino 的 `trace` 级别，这是最详细的日志级别。用于记录详细的执行路径和内部状态。

---

## 日志级别优先级

日志级别按以下顺序排列（从低到高）：

```
trace (10) < debug (20) < info (30) < warn (40) < error (50) < fatal (60) < silent (Infinity)
```

### 配置日志级别

设置日志级别后，只会输出该级别及更高级别的日志：

```typescript
FastifyLoggingModule.forRoot({
  config: {
    level: "info", // 只输出 info, warn, error, fatal
  },
});
```

**示例**：

- `level: 'trace'` → 输出所有日志（trace, debug, info, warn, error, fatal）
- `level: 'debug'` → 输出 debug, info, warn, error, fatal
- `level: 'info'` → 输出 info, warn, error, fatal（推荐生产环境）
- `level: 'warn'` → 输出 warn, error, fatal
- `level: 'error'` → 只输出 error, fatal
- `level: 'fatal'` → 只输出 fatal
- `level: 'silent'` → 不输出任何日志

---

## 迁移注意事项

### 1. verbose() 级别变化

**重要**: NestJS 的 `verbose()` 映射到 Pino 的 `trace` 级别。如果您的代码大量使用 `verbose()`，请确保日志级别配置为 `trace` 或 `debug`：

```typescript
FastifyLoggingModule.forRoot({
  config: {
    level: "trace", // 或 'debug'，以包含 verbose 日志
  },
});
```

### 2. log() 级别变化

NestJS 的 `log()` 映射到 Pino 的 `info` 级别。如果您的代码使用 `log()` 记录重要信息，这是正确的映射。

### 3. 环境变量配置

建议使用环境变量配置日志级别：

```typescript
FastifyLoggingModule.forRoot({
  config: {
    level: process.env.LOG_LEVEL || "info",
  },
});
```

**环境变量示例**：

```bash
# 开发环境
LOG_LEVEL=debug

# 生产环境
LOG_LEVEL=info

# 测试环境
LOG_LEVEL=warn
```

---

## 实际使用建议

### 开发环境

```typescript
FastifyLoggingModule.forRoot({
  config: {
    level: "debug", // 或 'trace'，查看详细日志
    prettyPrint: true, // 美化输出
  },
});
```

### 生产环境

```typescript
FastifyLoggingModule.forRoot({
  config: {
    level: "info", // 只记录重要信息
    prettyPrint: false, // JSON 格式，便于日志聚合
  },
});
```

### 测试环境

```typescript
FastifyLoggingModule.forRoot({
  config: {
    level: "warn", // 只记录警告和错误
    prettyPrint: false,
  },
});
```

---

## 总结

- ✅ **完全兼容**: 所有 NestJS Logger 方法都有对应的实现
- ✅ **级别映射**: 合理的级别映射，保持语义一致性
- ✅ **灵活配置**: 支持环境变量和运行时配置
- ✅ **生产就绪**: 默认配置适合生产环境使用

通过了解日志级别映射关系，您可以更好地配置和使用日志系统。

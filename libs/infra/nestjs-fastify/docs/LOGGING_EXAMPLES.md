# 日志模块使用示例

本文档提供 Fastify 日志模块的详细使用示例，包括结构化上下文和子日志器的使用方法。

---

## 目录

- [结构化上下文使用示例](#结构化上下文使用示例)
- [子日志器使用示例](#子日志器使用示例)
- [完整示例](#完整示例)

---

## 结构化上下文使用示例

结构化上下文提供类型安全的日志记录方式，让 IDE 能够提供完整的类型提示和自动补全。

### 基础使用

```typescript
import { Injectable } from "@nestjs/common";
// 推荐：使用 Logger 别名（更接近 NestJS 风格）
import { Logger } from "@hl8/nestjs-fastify";
import type { StructuredLogContext } from "@hl8/nestjs-fastify";

@Injectable()
export class UserService {
  constructor(private readonly logger: Logger) {}

  async createUser(userData: { name: string; email: string }) {
    // 使用结构化上下文记录日志
    this.logger.log("创建用户", {
      business: {
        operation: "createUser",
        resource: "User",
        action: "create",
        userId: "user-123",
      },
      custom: {
        email: userData.email,
        name: userData.name,
      },
    } satisfies StructuredLogContext);

    // 业务逻辑...
    return { id: "user-123", ...userData };
  }
}
```

### 业务上下文示例

```typescript
@Injectable()
export class OrderService {
  constructor(private readonly logger: FastifyLoggerService) {}

  async processOrder(orderId: string, amount: number) {
    // 记录订单处理开始
    this.logger.log("开始处理订单", {
      business: {
        operation: "processOrder",
        resource: "Order",
        action: "process",
        orderId,
        amount,
      },
      performance: {
        startTime: Date.now(),
      },
    } satisfies StructuredLogContext);

    try {
      // 处理订单逻辑...
      const result = await this.executeOrder(orderId);

      // 记录订单处理成功
      this.logger.log("订单处理成功", {
        business: {
          operation: "processOrder",
          resource: "Order",
          action: "complete",
          orderId,
          result,
        },
        performance: {
          duration: Date.now() - startTime,
        },
      } satisfies StructuredLogContext);

      return result;
    } catch (error) {
      // 记录订单处理失败
      this.logger.error("订单处理失败", {
        business: {
          operation: "processOrder",
          resource: "Order",
          action: "failed",
          orderId,
        },
        error: {
          type: error.constructor.name,
          message: error.message,
        },
      } satisfies StructuredLogContext);

      throw error;
    }
  }
}
```

### 性能指标示例

```typescript
@Injectable()
export class PaymentService {
  constructor(private readonly logger: FastifyLoggerService) {}

  async processPayment(paymentData: { amount: number; currency: string; method: string }) {
    const startTime = performance.now();

    this.logger.log("处理支付", {
      business: {
        operation: "processPayment",
        resource: "Payment",
        action: "process",
        amount: paymentData.amount,
        currency: paymentData.currency,
      },
      performance: {
        startTime: Date.now(),
        method: paymentData.method,
      },
    } satisfies StructuredLogContext);

    // 执行支付逻辑...
    const result = await this.executePayment(paymentData);

    const duration = performance.now() - startTime;

    this.logger.log("支付处理完成", {
      business: {
        operation: "processPayment",
        resource: "Payment",
        action: "complete",
        transactionId: result.transactionId,
      },
      performance: {
        duration: Math.round(duration),
        status: "success",
      },
    } satisfies StructuredLogContext);

    return result;
  }
}
```

### 自定义字段示例

```typescript
@Injectable()
export class NotificationService {
  constructor(private readonly logger: FastifyLoggerService) {}

  async sendNotification(userId: string, type: string, channel: string) {
    this.logger.log("发送通知", {
      business: {
        operation: "sendNotification",
        resource: "Notification",
        action: "send",
        userId,
      },
      custom: {
        notificationType: type,
        channel,
        timestamp: Date.now(),
        priority: "high",
      },
    } satisfies StructuredLogContext);

    // 发送通知逻辑...
  }
}
```

---

## 子日志器使用示例

子日志器允许您创建带有预定义上下文的日志器，子日志器会自动继承父日志器的上下文和请求上下文。

### 基础使用

```typescript
import { Injectable } from "@nestjs/common";
import { FastifyLoggerService } from "@hl8/nestjs-fastify";

@Injectable()
export class OrderService {
  private readonly logger: FastifyLoggerService;

  constructor(baseLogger: FastifyLoggerService) {
    // 创建子日志器，包含模块上下文
    this.logger = baseLogger.child({
      module: "OrderService",
      domain: "ecommerce",
    });
  }

  async createOrder(orderData: { productId: string; quantity: number }) {
    // 使用子日志器记录日志，自动包含模块上下文
    this.logger.log("创建订单", {
      productId: orderData.productId,
      quantity: orderData.quantity,
    });

    // 所有日志都会自动包含：
    // - module: 'OrderService'
    // - domain: 'ecommerce'
    // - request: { requestId, method, url, ... } (如果启用上下文注入)

    return { success: true, orderId: "order-123" };
  }
}
```

### 嵌套子日志器

```typescript
@Injectable()
export class OrderProcessingService {
  private readonly orderLogger: FastifyLoggerService;
  private readonly paymentLogger: FastifyLoggerService;

  constructor(baseLogger: FastifyLoggerService) {
    // 创建第一层子日志器（模块级别）
    const moduleLogger = baseLogger.child({
      module: "OrderProcessingService",
    });

    // 创建第二层子日志器（功能级别）
    this.orderLogger = moduleLogger.child({
      feature: "order",
    });

    this.paymentLogger = moduleLogger.child({
      feature: "payment",
    });
  }

  async processOrder(orderId: string) {
    // 使用订单子日志器
    this.orderLogger.log("处理订单", { orderId });

    // 使用支付子日志器
    this.paymentLogger.log("处理支付", { orderId });

    // 订单日志包含：module, feature: 'order', request
    // 支付日志包含：module, feature: 'payment', request
  }
}
```

### 服务级别子日志器

```typescript
@Injectable()
export class UserService {
  private readonly logger: FastifyLoggerService;

  constructor(baseLogger: FastifyLoggerService) {
    this.logger = baseLogger.child({
      module: "UserService",
      domain: "user-management",
    });
  }

  async createUser(userData: { name: string; email: string }) {
    this.logger.log("创建用户", {
      name: userData.name,
      email: userData.email,
    });

    return { id: "user-123", ...userData };
  }

  async updateUser(userId: string, updates: Partial<User>) {
    this.logger.log("更新用户", {
      userId,
      updates,
    });

    // 业务逻辑...
  }
}

@Injectable()
export class PaymentService {
  private readonly logger: FastifyLoggerService;

  constructor(baseLogger: FastifyLoggerService) {
    this.logger = baseLogger.child({
      module: "PaymentService",
      domain: "payment",
    });
  }

  async processPayment(paymentData: PaymentData) {
    this.logger.log("处理支付", {
      amount: paymentData.amount,
      currency: paymentData.currency,
    });

    // 业务逻辑...
  }
}
```

### 控制器中使用子日志器

```typescript
import { Controller, Get, Post, Body } from "@nestjs/common";
import { FastifyLoggerService } from "@hl8/nestjs-fastify";

@Controller("orders")
export class OrderController {
  private readonly logger: FastifyLoggerService;

  constructor(baseLogger: FastifyLoggerService) {
    // 在控制器中创建子日志器
    this.logger = baseLogger.child({
      controller: "OrderController",
      route: "/orders",
    });
  }

  @Post()
  async createOrder(@Body() orderData: CreateOrderDto) {
    // 使用子日志器，自动包含 controller 和 route 上下文
    this.logger.log("创建订单请求", {
      orderData,
    });

    // 处理请求...
    return { success: true };
  }

  @Get(":id")
  async getOrder(@Param("id") id: string) {
    this.logger.log("获取订单", { orderId: id });

    // 处理请求...
    return { id, status: "pending" };
  }
}
```

### 在异步操作中使用子日志器

```typescript
@Injectable()
export class BackgroundJobService {
  private readonly logger: FastifyLoggerService;

  constructor(baseLogger: FastifyLoggerService) {
    this.logger = baseLogger.child({
      module: "BackgroundJobService",
      jobType: "scheduled",
    });
  }

  async executeJob(jobId: string) {
    // 子日志器会在异步操作中保持上下文
    this.logger.log("开始执行任务", { jobId });

    await this.processJob(jobId);

    // 上下文仍然可用
    this.logger.log("任务执行完成", { jobId });
  }

  private async processJob(jobId: string) {
    // 在嵌套异步函数中，上下文仍然可用
    this.logger.log("处理任务", { jobId, step: "processing" });
  }
}
```

---

## 完整示例

### 电商订单处理示例

```typescript
import { Injectable } from "@nestjs/common";
import { FastifyLoggerService } from "@hl8/nestjs-fastify";
import type { StructuredLogContext } from "@hl8/nestjs-fastify";

@Injectable()
export class OrderProcessingService {
  private readonly logger: FastifyLoggerService;
  private readonly orderLogger: FastifyLoggerService;
  private readonly paymentLogger: FastifyLoggerService;

  constructor(
    baseLogger: FastifyLoggerService,
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
  ) {
    // 创建模块级别的子日志器
    this.logger = baseLogger.child({
      module: "OrderProcessingService",
      domain: "ecommerce",
    });

    // 创建功能级别的子日志器
    this.orderLogger = this.logger.child({ feature: "order" });
    this.paymentLogger = this.logger.child({ feature: "payment" });
  }

  async processOrder(orderId: string, orderData: OrderData) {
    const startTime = Date.now();

    // 使用结构化上下文和子日志器
    this.orderLogger.log("开始处理订单", {
      business: {
        operation: "processOrder",
        resource: "Order",
        action: "start",
        orderId,
      },
      performance: {
        startTime,
      },
    } satisfies StructuredLogContext);

    try {
      // 创建订单
      const order = await this.orderService.create(orderData);

      this.orderLogger.log("订单创建成功", {
        business: {
          operation: "processOrder",
          resource: "Order",
          action: "created",
          orderId: order.id,
        },
      } satisfies StructuredLogContext);

      // 处理支付
      const payment = await this.paymentService.processPayment({
        orderId: order.id,
        amount: order.total,
        currency: order.currency,
      });

      this.paymentLogger.log("支付处理成功", {
        business: {
          operation: "processPayment",
          resource: "Payment",
          action: "completed",
          transactionId: payment.transactionId,
        },
        performance: {
          duration: Date.now() - startTime,
        },
      } satisfies StructuredLogContext);

      // 完成订单
      const completedOrder = await this.orderService.complete(order.id);

      this.orderLogger.log("订单处理完成", {
        business: {
          operation: "processOrder",
          resource: "Order",
          action: "completed",
          orderId: completedOrder.id,
        },
        performance: {
          totalDuration: Date.now() - startTime,
        },
      } satisfies StructuredLogContext);

      return completedOrder;
    } catch (error) {
      this.logger.error("订单处理失败", {
        business: {
          operation: "processOrder",
          resource: "Order",
          action: "failed",
          orderId,
        },
        error: {
          type: error.constructor.name,
          message: error.message,
        },
      } satisfies StructuredLogContext);

      throw error;
    }
  }
}
```

### 日志输出示例

当使用子日志器和结构化上下文时，日志输出可能如下：

```json
{
  "level": 30,
  "time": 1704067200000,
  "pid": 12345,
  "hostname": "server-1",
  "module": "OrderProcessingService",
  "domain": "ecommerce",
  "feature": "order",
  "request": {
    "requestId": "req-123",
    "method": "POST",
    "url": "/api/orders",
    "ip": "192.168.1.1"
  },
  "business": {
    "operation": "processOrder",
    "resource": "Order",
    "action": "start",
    "orderId": "order-456"
  },
  "performance": {
    "startTime": 1704067200000
  },
  "msg": "开始处理订单"
}
```

---

## 最佳实践

### 1. 使用结构化上下文

✅ **推荐**：使用结构化上下文提供类型安全

```typescript
this.logger.log("操作完成", {
  business: {
    operation: "complete",
    resource: "Resource",
    action: "done",
  },
} satisfies StructuredLogContext);
```

❌ **不推荐**：使用任意对象

```typescript
this.logger.log("操作完成", {
  operation: "complete",
  resource: "Resource",
  // 缺少类型检查
});
```

### 2. 在服务级别创建子日志器

✅ **推荐**：在构造函数中创建子日志器

```typescript
@Injectable()
export class UserService {
  private readonly logger: FastifyLoggerService;

  constructor(baseLogger: FastifyLoggerService) {
    this.logger = baseLogger.child({ module: "UserService" });
  }
}
```

❌ **不推荐**：每次调用都创建子日志器

```typescript
async createUser() {
  const logger = this.baseLogger.child({ module: 'UserService' });
  // 每次调用都创建，性能开销大
}
```

### 3. 嵌套子日志器

✅ **推荐**：按功能创建嵌套子日志器

```typescript
const moduleLogger = baseLogger.child({ module: "OrderService" });
const orderLogger = moduleLogger.child({ feature: "order" });
const paymentLogger = moduleLogger.child({ feature: "payment" });
```

### 4. 结合结构化上下文和子日志器

✅ **推荐**：子日志器提供基础上下文，结构化上下文提供业务上下文

```typescript
// 子日志器提供模块上下文
this.logger = baseLogger.child({ module: "OrderService" });

// 结构化上下文提供业务上下文
this.logger.log("处理订单", {
  business: {
    operation: "processOrder",
    resource: "Order",
  },
} satisfies StructuredLogContext);
```

---

## 总结

- **结构化上下文**：提供类型安全的日志记录，改善开发体验
- **子日志器**：自动继承上下文，减少重复代码
- **组合使用**：子日志器提供基础上下文，结构化上下文提供业务上下文

通过合理使用这些功能，您可以创建清晰、可维护、类型安全的日志记录系统。

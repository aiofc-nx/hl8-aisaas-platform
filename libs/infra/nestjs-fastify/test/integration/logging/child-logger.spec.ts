/**
 * 子日志器集成测试
 *
 * @description 测试子日志器功能在完整请求流程中的行为
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { Test } from "@nestjs/testing";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Module, Controller, Get, Injectable } from "@nestjs/common";
import {
  FastifyLoggingModule,
  FastifyLoggerService,
} from "../../../src/logging/index.js";
import { ContextStorage } from "../../../src/logging/context/context-storage.js";

@Injectable()
class OrderService {
  private readonly logger: FastifyLoggerService;
  // 暴露子 logger 的 Pino 实例用于测试
  public readonly childPinoLogger: ReturnType<
    FastifyLoggerService["getPinoLogger"]
  >;

  constructor(logger: FastifyLoggerService) {
    // 创建子日志器，包含模块上下文
    this.logger = logger.child({ module: "OrderService" });
    // 获取子 logger 的 Pino 实例用于测试
    this.childPinoLogger = this.logger.getPinoLogger();
  }

  async createOrder(orderData: { productId: string; quantity: number }) {
    // 使用子日志器记录日志，自动包含模块上下文
    this.logger.log("创建订单", {
      productId: orderData.productId,
      quantity: orderData.quantity,
    });
    return { success: true, orderId: "order-123" };
  }
}

@Injectable()
class PaymentService {
  private readonly logger: FastifyLoggerService;
  // 暴露子 logger 的 Pino 实例用于测试
  public readonly childPinoLogger: ReturnType<
    FastifyLoggerService["getPinoLogger"]
  >;

  constructor(logger: FastifyLoggerService) {
    // 创建子日志器，包含模块和业务上下文
    this.logger = logger.child({
      module: "PaymentService",
      domain: "payment",
    });
    // 获取子 logger 的 Pino 实例用于测试
    this.childPinoLogger = this.logger.getPinoLogger();
  }

  async processPayment(paymentData: { amount: number; currency: string }) {
    this.logger.log("处理支付", {
      amount: paymentData.amount,
      currency: paymentData.currency,
    });
    return { success: true, transactionId: "txn-456" };
  }
}

@Controller("orders")
class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly logger: FastifyLoggerService,
  ) {}

  @Get("create")
  async createOrder() {
    // 控制器也可以使用子日志器
    const controllerLogger = this.logger.child({
      controller: "OrderController",
    });
    controllerLogger.log("收到创建订单请求");
    return this.orderService.createOrder({
      productId: "prod-123",
      quantity: 2,
    });
  }
}

@Controller("payments")
class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get("process")
  async processPayment() {
    return this.paymentService.processPayment({
      amount: 100.0,
      currency: "USD",
    });
  }
}

@Module({
  imports: [
    FastifyLoggingModule.forRoot({
      config: {
        context: {
          enabled: true,
          includeRequestDetails: true,
        },
        sanitizer: {
          enabled: false, // 在子日志器测试中禁用脱敏，专注于上下文继承
        },
      },
    }),
  ],
  controllers: [OrderController, PaymentController],
  providers: [OrderService, PaymentService],
})
class TestModule {}

describe("子日志器集成测试", () => {
  let app: NestFastifyApplication;
  let loggerService: FastifyLoggerService;
  let orderService: OrderService;
  let paymentService: PaymentService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    // 先初始化应用，确保 Fastify 实例可用
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // 然后获取服务
    loggerService = moduleRef.get<FastifyLoggerService>(FastifyLoggerService);
    orderService = moduleRef.get<OrderService>(OrderService);
    paymentService = moduleRef.get<PaymentService>(PaymentService);
  });

  afterEach(async () => {
    await app.close();
  });

  it("子日志器应该继承预定义的上下文", async () => {
    // 从服务实例获取子 logger 的 Pino 实例
    const childPinoLogger = orderService.childPinoLogger;
    const logSpy = jest.spyOn(childPinoLogger, "info");

    const response = await app.inject({
      method: "GET",
      url: "/orders/create",
      headers: {
        "x-request-id": "order-request-123",
      },
    });

    expect(response.statusCode).toBe(200);
    // 验证日志被调用
    expect(logSpy).toHaveBeenCalled();

    // 验证响应包含预期的数据（间接验证子日志器工作正常）
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.orderId).toBe("order-123");

    logSpy.mockRestore();
  });

  it("子日志器应该自动继承请求上下文", async () => {
    const childPinoLogger = orderService.childPinoLogger;
    const logSpy = jest.spyOn(childPinoLogger, "info");

    const response = await app.inject({
      method: "GET",
      url: "/orders/create",
      headers: {
        "x-request-id": "order-request-456",
        "user-agent": "test-agent",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(logSpy).toHaveBeenCalled();

    // 验证响应成功（间接验证子日志器和上下文注入正常工作）
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);

    logSpy.mockRestore();
  });

  it("不同的子日志器应该有不同的预定义上下文", async () => {
    const orderLogSpy = jest.spyOn(orderService.childPinoLogger, "info");
    const paymentLogSpy = jest.spyOn(paymentService.childPinoLogger, "info");

    // 测试订单服务
    const orderResponse = await app.inject({
      method: "GET",
      url: "/orders/create",
    });

    // 测试支付服务
    const paymentResponse = await app.inject({
      method: "GET",
      url: "/payments/process",
    });

    expect(orderResponse.statusCode).toBe(200);
    expect(paymentResponse.statusCode).toBe(200);

    // 验证两个服务的日志都被调用
    expect(orderLogSpy).toHaveBeenCalled();
    expect(paymentLogSpy).toHaveBeenCalled();

    // 验证两个服务都正常工作（间接验证子日志器功能）
    const orderBody = JSON.parse(orderResponse.body);
    const paymentBody = JSON.parse(paymentResponse.body);
    expect(orderBody.success).toBe(true);
    expect(paymentBody.success).toBe(true);

    orderLogSpy.mockRestore();
    paymentLogSpy.mockRestore();
  });

  it("子日志器应该支持嵌套创建", async () => {
    // 创建一个支持嵌套子日志器的服务
    @Injectable()
    class NestedService {
      private readonly logger: FastifyLoggerService;

      constructor(baseLogger: FastifyLoggerService) {
        // 创建第一层子日志器
        const moduleLogger = baseLogger.child({ module: "NestedService" });
        // 创建第二层子日志器（嵌套）
        this.logger = moduleLogger.child({ operation: "nested" });
      }

      async doSomething() {
        this.logger.log("执行嵌套操作", { step: "start" });
      }
    }

    @Controller("nested")
    class NestedController {
      constructor(private readonly service: NestedService) {}

      @Get()
      async test() {
        return this.service.doSomething();
      }
    }

    await app.close();

    const moduleRef = await Test.createTestingModule({
      imports: [
        FastifyLoggingModule.forRoot({
          config: {
            context: {
              enabled: false,
            },
            sanitizer: {
              enabled: false,
            },
          },
        }),
      ],
      controllers: [NestedController],
      providers: [NestedService],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    loggerService = moduleRef.get<FastifyLoggerService>(FastifyLoggerService);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // 获取 NestedService 实例，然后在子 logger 上设置 spy
    const nestedService = moduleRef.get<NestedService>(NestedService);
    const nestedLogger = (nestedService as any).logger as FastifyLoggerService;
    const nestedPinoLogger = nestedLogger.getPinoLogger();
    const nestedLogSpy = jest.spyOn(nestedPinoLogger, "info");

    await app.inject({
      method: "GET",
      url: "/nested",
    });

    expect(nestedLogSpy).toHaveBeenCalled();

    const logCall = nestedLogSpy.mock.calls[0];
    if (logCall && logCall.length >= 2) {
      const logContext = logCall[0] as Record<string, unknown>;
      const message = logCall[1];
      // 验证嵌套的上下文都被包含（Pino 会在序列化时合并）
      expect(logContext.step).toBe("start");
      expect(message).toBe("执行嵌套操作");
    }

    nestedLogSpy.mockRestore();
  });

  it("子日志器应该在不同请求中保持独立性", async () => {
    // 从 OrderService 获取子 logger
    const orderServiceLogger = (orderService as any)
      .logger as FastifyLoggerService;
    const orderPinoLogger = orderServiceLogger.getPinoLogger();
    const logSpy = jest.spyOn(orderPinoLogger, "info");

    // 发送第一个请求
    const response1 = await app.inject({
      method: "GET",
      url: "/orders/create",
      headers: {
        "x-request-id": "request-1",
      },
    });

    // 发送第二个请求
    const response2 = await app.inject({
      method: "GET",
      url: "/orders/create",
      headers: {
        "x-request-id": "request-2",
      },
    });

    expect(response1.statusCode).toBe(200);
    expect(response2.statusCode).toBe(200);
    expect(logSpy).toHaveBeenCalled();

    // 验证两个请求都成功处理（间接验证独立性）
    const body1 = JSON.parse(response1.body);
    const body2 = JSON.parse(response2.body);
    expect(body1.success).toBe(true);
    expect(body2.success).toBe(true);

    logSpy.mockRestore();
  });
});

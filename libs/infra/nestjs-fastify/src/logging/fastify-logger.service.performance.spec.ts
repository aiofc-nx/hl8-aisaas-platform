/**
 * 性能监控开销测试
 *
 * @description 验证性能监控开销 < 0.5ms
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import pino from "pino";
import { FastifyLoggerService } from "./fastify-logger.service.js";
import { LoggingConfig } from "../config/logging.config.js";
import { MetricsService } from "../performance/metrics/metrics.service.js";
import { PrometheusService } from "../performance/metrics/prometheus.service.js";

describe("性能监控开销测试", () => {
  let loggerService: FastifyLoggerService;
  let metricsService: MetricsService;
  let loggerServiceWithMetrics: FastifyLoggerService;
  let loggerServiceWithoutMetrics: FastifyLoggerService;

  beforeEach(() => {
    const pinoLogger = pino({ level: "info" });

    // 创建带性能监控的配置
    const configWithMetrics = new LoggingConfig();
    configWithMetrics.performance = {
      enabled: true,
      trackLogWriteTime: true,
    };

    // 创建不带性能监控的配置
    const configWithoutMetrics = new LoggingConfig();
    configWithoutMetrics.performance = {
      enabled: false,
      trackLogWriteTime: false,
    };

    // 创建 MetricsService
    const prometheusService = new PrometheusService({
      defaultLabels: { app: "test" },
      enableDefaultMetrics: false,
    });
    metricsService = new MetricsService(prometheusService);

    // 创建带性能监控的 logger
    loggerServiceWithMetrics = new FastifyLoggerService(
      pinoLogger,
      configWithMetrics,
      metricsService,
    );

    // 创建不带性能监控的 logger
    loggerServiceWithoutMetrics = new FastifyLoggerService(
      pinoLogger,
      configWithoutMetrics,
    );

    loggerService = loggerServiceWithMetrics;
  });

  it("性能监控开销应该 < 0.5ms", () => {
    const iterations = 1000;

    // 预热
    for (let i = 0; i < 100; i++) {
      loggerServiceWithMetrics.log("预热日志");
      loggerServiceWithoutMetrics.log("预热日志");
    }

    // 测试带性能监控的日志写入
    const startWithMetrics = performance.now();
    for (let i = 0; i < iterations; i++) {
      loggerServiceWithMetrics.log("测试日志", { index: i });
    }
    const endWithMetrics = performance.now();

    // 测试不带性能监控的日志写入
    const startWithoutMetrics = performance.now();
    for (let i = 0; i < iterations; i++) {
      loggerServiceWithoutMetrics.log("测试日志", { index: i });
    }
    const endWithoutMetrics = performance.now();

    const avgTimeWithMetrics = (endWithMetrics - startWithMetrics) / iterations;
    const avgTimeWithoutMetrics =
      (endWithoutMetrics - startWithoutMetrics) / iterations;

    // 计算性能监控开销（差值）
    const overhead = avgTimeWithMetrics - avgTimeWithoutMetrics;

    console.log(
      `性能监控开销: ${overhead.toFixed(4)}ms (${iterations} 次迭代)`,
    );
    console.log(`  带性能监控: ${avgTimeWithMetrics.toFixed(4)}ms/次`);
    console.log(`  不带性能监控: ${avgTimeWithoutMetrics.toFixed(4)}ms/次`);

    // 验证性能监控开销 < 0.5ms
    expect(overhead).toBeLessThan(0.5);
  });

  it("性能监控开销应该 < 0.5ms（不同日志级别）", () => {
    const iterations = 500;

    // 预热
    for (let i = 0; i < 50; i++) {
      loggerServiceWithMetrics.log("预热");
      loggerServiceWithMetrics.warn("预热");
      loggerServiceWithMetrics.error("预热");
      loggerServiceWithoutMetrics.log("预热");
      loggerServiceWithoutMetrics.warn("预热");
      loggerServiceWithoutMetrics.error("预热");
    }

    // 测试不同级别的日志
    const levels = [
      { method: "log", name: "info" },
      { method: "warn", name: "warn" },
      { method: "error", name: "error" },
      { method: "debug", name: "debug" },
      { method: "verbose", name: "trace" },
    ];

    for (const level of levels) {
      const startWithMetrics = performance.now();
      for (let i = 0; i < iterations; i++) {
        (loggerServiceWithMetrics as any)[level.method]("测试日志");
      }
      const endWithMetrics = performance.now();

      const startWithoutMetrics = performance.now();
      for (let i = 0; i < iterations; i++) {
        (loggerServiceWithoutMetrics as any)[level.method]("测试日志");
      }
      const endWithoutMetrics = performance.now();

      const avgTimeWithMetrics =
        (endWithMetrics - startWithMetrics) / iterations;
      const avgTimeWithoutMetrics =
        (endWithoutMetrics - startWithoutMetrics) / iterations;
      const overhead = avgTimeWithMetrics - avgTimeWithoutMetrics;

      console.log(`性能监控开销 (${level.name}): ${overhead.toFixed(4)}ms`);

      // 验证性能监控开销 < 0.5ms
      expect(overhead).toBeLessThan(0.5);
    }
  });

  it("性能监控开销应该 < 0.5ms（包含上下文）", () => {
    const iterations = 500;

    // 预热
    for (let i = 0; i < 50; i++) {
      loggerServiceWithMetrics.log("预热", { context: "test" });
      loggerServiceWithoutMetrics.log("预热", { context: "test" });
    }

    const context = {
      username: "testuser",
      action: "test",
      metadata: {
        source: "test",
        timestamp: Date.now(),
      },
    };

    // 测试带上下文的日志写入
    const startWithMetrics = performance.now();
    for (let i = 0; i < iterations; i++) {
      loggerServiceWithMetrics.log("测试日志", context);
    }
    const endWithMetrics = performance.now();

    const startWithoutMetrics = performance.now();
    for (let i = 0; i < iterations; i++) {
      loggerServiceWithoutMetrics.log("测试日志", context);
    }
    const endWithoutMetrics = performance.now();

    const avgTimeWithMetrics = (endWithMetrics - startWithMetrics) / iterations;
    const avgTimeWithoutMetrics =
      (endWithoutMetrics - startWithoutMetrics) / iterations;
    const overhead = avgTimeWithMetrics - avgTimeWithoutMetrics;

    console.log(
      `性能监控开销（含上下文）: ${overhead.toFixed(4)}ms (${iterations} 次迭代)`,
    );

    // 验证性能监控开销 < 0.5ms
    expect(overhead).toBeLessThan(0.5);
  });
});

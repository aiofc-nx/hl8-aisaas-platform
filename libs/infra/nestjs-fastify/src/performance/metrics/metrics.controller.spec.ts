/**
 * @fileoverview MetricsController 单元测试
 */

import { MetricsController } from "./metrics.controller";
import { MetricsService } from "./metrics.service";

describe("MetricsController", () => {
  let controller: MetricsController;
  let metricsService: MetricsService;

  beforeEach(() => {
    const getMetricsCalls: any[] = [];

    metricsService = {
      getMetrics: async () => {
        getMetricsCalls.push(true);
        return '# HELP http_requests_total\n# TYPE http_requests_total counter\nhttp_requests_total{method="GET"} 10';
      },
      getMetricsCalls, // 暴露调用记录
    } as any;

    controller = new MetricsController(metricsService);
  });

  describe("getMetrics()", () => {
    it("应该返回 Prometheus 格式的指标", async () => {
      const metrics = await controller.getMetrics();

      expect(metrics).toBeDefined();
      expect(typeof metrics).toBe("string");
      expect(metrics).toContain("http_requests_total");
      expect((metricsService as any).getMetricsCalls.length).toBeGreaterThan(0);
    });
  });
});

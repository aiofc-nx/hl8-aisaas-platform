/**
 * @fileoverview MetricsService 单元测试
 */

import { MetricsService } from "./metrics.service";
import { PrometheusService } from "./prometheus.service";

describe("MetricsService", () => {
  let service: MetricsService;
  let prometheusService: PrometheusService;

  beforeEach(() => {
    prometheusService = new PrometheusService({
      defaultLabels: { app: "test" },
      enableDefaultMetrics: false,
    });

    service = new MetricsService(prometheusService);
  });

  describe("基础功能", () => {
    it("应该正确创建服务实例", () => {
      expect(service).toBeDefined();
    });
  });

  describe("recordHttpRequest()", () => {
    it("应该记录 HTTP 请求", () => {
      const incCalls: any[] = [];
      const observeCalls: any[] = [];

      prometheusService.httpRequestsTotal.inc = ((labels: any) => {
        incCalls.push(labels);
      }) as any;

      prometheusService.httpRequestDuration.observe = ((
        labels: any,
        value: number,
      ) => {
        observeCalls.push({ labels, value });
      }) as any;

      service.recordHttpRequest("GET", "/api/users", 200, 50);

      expect(incCalls[0]).toEqual({
        method: "GET",
        path: "/api/users",
        status: "200",
      });

      expect(observeCalls[0].value).toBe(0.05); // 50ms = 0.05s
    });

    it("应该记录错误请求", () => {
      const incCalls: any[] = [];
      const errorCalls: any[] = [];

      prometheusService.httpRequestsTotal.inc = ((labels: any) => {
        incCalls.push(labels);
      }) as any;

      prometheusService.httpErrorsTotal.inc = ((labels: any) => {
        errorCalls.push(labels);
      }) as any;

      service.recordHttpRequest("GET", "/api/users", 404, 10);

      expect(incCalls.length).toBeGreaterThan(0);
      expect(errorCalls[0]).toEqual({
        method: "GET",
        path: "/api/users",
        status: "404",
      });
    });

    it("应该记录服务器错误", () => {
      const errorCalls: any[] = [];
      prometheusService.httpErrorsTotal.inc = ((labels: any) => {
        errorCalls.push(labels);
      }) as any;

      service.recordHttpRequest("POST", "/api/users", 500, 200);

      expect(errorCalls[0]).toEqual({
        method: "POST",
        path: "/api/users",
        status: "500",
      });
    });
  });

  describe("getMetrics()", () => {
    it("应该返回 Prometheus 格式的指标", async () => {
      const metrics = await service.getMetrics();

      expect(metrics).toBeDefined();
      expect(typeof metrics).toBe("string");
      expect(metrics).toContain("http_requests_total");
    });
  });
});

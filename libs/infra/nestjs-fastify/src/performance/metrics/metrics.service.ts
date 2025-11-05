/**
 * @fileoverview Metrics 服务
 */

import { Injectable } from "@nestjs/common";
import { PrometheusService } from "./prometheus.service.js";

@Injectable()
export class MetricsService {
  constructor(private readonly prometheusService: PrometheusService) {}

  /**
   * 记录 HTTP 请求
   */
  recordHttpRequest(
    method: string,
    path: string,
    status: number,
    duration: number,
  ): void {
    const labels = {
      method,
      path,
      status: status.toString(),
    };

    // 增加请求计数
    this.prometheusService.httpRequestsTotal.inc(labels);

    // 记录响应时间
    this.prometheusService.httpRequestDuration.observe(labels, duration / 1000);

    // 如果是错误，增加错误计数
    if (status >= 400) {
      this.prometheusService.httpErrorsTotal.inc(labels);
    }
  }

  /**
   * 获取指标
   */
  async getMetrics(): Promise<string> {
    return this.prometheusService.getMetrics();
  }
}

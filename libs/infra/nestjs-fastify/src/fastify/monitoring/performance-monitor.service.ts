/**
 * 性能监控服务
 *
 * @description 收集和报告应用性能指标
 *
 * @since 0.2.0
 */

import { Injectable } from "@nestjs/common";

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  /** 总请求数 */
  totalRequests: number;
  /** 平均响应时间（毫秒） */
  avgResponseTime: number;
  /** 最小响应时间（毫秒） */
  minResponseTime: number;
  /** 最大响应时间（毫秒） */
  maxResponseTime: number;
  /** 按状态码分组的请求数 */
  statusCodes: Record<number, number>;
  /** 按路由分组的请求数 */
  routes: Record<string, RouteMetrics>;
}

/**
 * 路由指标
 */
export interface RouteMetrics {
  count: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
}

/**
 * 性能监控服务
 */
@Injectable()
export class PerformanceMonitorService {
  private metrics: PerformanceMetrics = {
    totalRequests: 0,
    avgResponseTime: 0,
    minResponseTime: Infinity,
    maxResponseTime: 0,
    statusCodes: {},
    routes: {},
  };

  private responseTimes: number[] = [];

  /**
   * 记录请求指标
   *
   * @param route - 路由
   * @param method - HTTP 方法
   * @param statusCode - 状态码
   * @param responseTime - 响应时间（毫秒）
   */
  recordRequest(
    route: string,
    method: string,
    statusCode: number,
    responseTime: number,
  ): void {
    this.metrics.totalRequests++;

    // 更新总体响应时间统计
    this.responseTimes.push(responseTime);
    this.metrics.minResponseTime = Math.min(
      this.metrics.minResponseTime,
      responseTime,
    );
    this.metrics.maxResponseTime = Math.max(
      this.metrics.maxResponseTime,
      responseTime,
    );
    this.metrics.avgResponseTime =
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;

    // 限制存储的响应时间数量
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }

    // 更新状态码统计
    this.metrics.statusCodes[statusCode] =
      (this.metrics.statusCodes[statusCode] || 0) + 1;

    // 更新路由统计
    const routeKey = `${method} ${route}`;
    if (!this.metrics.routes[routeKey]) {
      this.metrics.routes[routeKey] = {
        count: 0,
        avgResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
      };
    }

    const routeMetrics = this.metrics.routes[routeKey];
    routeMetrics.count++;
    routeMetrics.minResponseTime = Math.min(
      routeMetrics.minResponseTime,
      responseTime,
    );
    routeMetrics.maxResponseTime = Math.max(
      routeMetrics.maxResponseTime,
      responseTime,
    );

    // 计算路由的平均响应时间（简单移动平均）
    routeMetrics.avgResponseTime =
      (routeMetrics.avgResponseTime * (routeMetrics.count - 1) + responseTime) /
      routeMetrics.count;
  }

  /**
   * 获取性能指标
   *
   * @returns 性能指标
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 重置指标
   */
  reset(): void {
    this.metrics = {
      totalRequests: 0,
      avgResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      statusCodes: {},
      routes: {},
    };
    this.responseTimes = [];
  }
}

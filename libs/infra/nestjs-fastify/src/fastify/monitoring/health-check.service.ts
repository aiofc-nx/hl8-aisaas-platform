/**
 * 健康检查服务
 *
 * @description 提供应用健康状态检查功能
 *
 * @since 0.2.0
 */

import { Injectable } from "@nestjs/common";

/**
 * 健康检查结果
 */
export interface HealthCheckResult {
  /** 整体状态 */
  status: "ok" | "degraded" | "down";
  /** 时间戳 */
  timestamp: string;
  /** 运行时间（秒） */
  uptime: number;
  /** 内存使用 */
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  /** 各组件状态 */
  components?: Record<string, ComponentHealth>;
}

/**
 * 组件健康状态
 */
export interface ComponentHealth {
  status: "up" | "down";
  message?: string;
  responseTime?: number;
}

/**
 * 健康检查服务
 */
@Injectable()
export class HealthCheckService {
  private checks: Map<string, () => Promise<ComponentHealth>> = new Map();

  /**
   * 注册健康检查
   *
   * @param name - 组件名称
   * @param checkFn - 检查函数
   */
  registerCheck(name: string, checkFn: () => Promise<ComponentHealth>): void {
    this.checks.set(name, checkFn);
  }

  /**
   * 执行所有健康检查
   *
   * @returns 健康检查结果
   */
  async check(): Promise<HealthCheckResult> {
    const components: Record<string, ComponentHealth> = {};
    let overallStatus: "ok" | "degraded" | "down" = "ok";

    // 执行所有注册的检查
    for (const [name, checkFn] of this.checks) {
      try {
        components[name] = await checkFn();
        if (components[name].status === "down") {
          overallStatus = "degraded";
        }
      } catch (error) {
        components[name] = {
          status: "down",
          message: error instanceof Error ? error.message : String(error),
        };
        overallStatus = "down";
      }
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      components: this.checks.size > 0 ? components : undefined,
    };
  }
}

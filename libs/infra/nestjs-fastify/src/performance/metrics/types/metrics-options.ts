/**
 * @fileoverview Prometheus Metrics 配置类型
 */

/**
 * Metrics 配置选项
 */
export interface MetricsOptions {
  /**
   * 默认标签
   */
  defaultLabels?: Record<string, string>;

  /**
   * Metrics 端点路径
   */
  path?: string;

  /**
   * 是否启用默认指标
   */
  enableDefaultMetrics?: boolean;
}

/**
 * 默认 Metrics 配置
 */
export const DEFAULT_METRICS_OPTIONS: MetricsOptions = {
  defaultLabels: {
    app: "hl8-saas",
  },
  path: "/metrics",
  enableDefaultMetrics: true,
};

/**
 * @fileoverview Helmet 安全头配置类型
 *
 * @description
 * 定义 Helmet 安全头模块的配置接口和类型
 *
 * ## 安全头说明
 *
 * - Content-Security-Policy (CSP): 防止 XSS 攻击
 * - X-Frame-Options: 防止点击劫持
 * - Strict-Transport-Security (HSTS): 强制 HTTPS
 * - X-Content-Type-Options: 防止 MIME 类型嗅探
 * - X-DNS-Prefetch-Control: 控制 DNS 预取
 *
 * @module security/helmet
 */

import type { FastifyHelmetOptions } from "@fastify/helmet";

/**
 * Helmet 配置选项
 *
 * @description
 * 基于 @fastify/helmet 的配置选项
 *
 * ## 业务规则
 *
 * ### CSP 策略规则
 * - defaultSrc: 默认资源策略
 * - scriptSrc: JavaScript 资源策略
 * - styleSrc: CSS 资源策略
 * - imgSrc: 图片资源策略
 * - fontSrc: 字体资源策略
 *
 * ### HSTS 规则
 * - maxAge: 有效期（秒）
 * - includeSubDomains: 是否包含子域名
 * - preload: 是否预加载
 *
 * @example
 * ```typescript
 * const options: HelmetOptions = {
 *   contentSecurityPolicy: {
 *     directives: {
 *       defaultSrc: ["'self'"],
 *       scriptSrc: ["'self'", "'unsafe-inline'"],
 *     },
 *   },
 *   hsts: {
 *     maxAge: 31536000,
 *     includeSubDomains: true,
 *   },
 * };
 * ```
 */
export type HelmetOptions = FastifyHelmetOptions;

/**
 * Helmet 默认配置
 *
 * @description
 * SAAS 平台的默认安全配置
 *
 * ## 配置说明
 *
 * ### CSP 策略
 * - defaultSrc: 仅允许同源资源
 * - scriptSrc: 允许同源脚本
 * - styleSrc: 允许同源样式和内联样式
 * - imgSrc: 允许同源图片、data URI 和 HTTPS 图片
 * - fontSrc: 允许同源字体和 data URI
 * - connectSrc: 允许同源连接
 * - frameSrc: 禁止嵌入
 *
 * ### HSTS
 * - maxAge: 1 年
 * - includeSubDomains: 包含子域名
 * - preload: 启用预加载
 *
 * @example
 * ```typescript
 * const config = DEFAULT_HELMET_OPTIONS;
 * ```
 */
export const DEFAULT_HELMET_OPTIONS: HelmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 年
    includeSubDomains: true,
    preload: true,
  },
  xContentTypeOptions: false, // false = 启用 nosniff
  xDnsPrefetchControl: { allow: false },
  xDownloadOptions: false, // false = 启用 noopen
  xFrameOptions: { action: "deny" },
  xPermittedCrossDomainPolicies: { permittedPolicies: "none" },
};

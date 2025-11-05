/**
 * @fileoverview CORS 配置类型
 */

import type { FastifyCorsOptions } from "@fastify/cors";

export type CorsOptions = FastifyCorsOptions;

export const DEFAULT_CORS_OPTIONS: CorsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  exposedHeaders: [
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
    "X-Request-Id",
  ],
  maxAge: 86400,
};

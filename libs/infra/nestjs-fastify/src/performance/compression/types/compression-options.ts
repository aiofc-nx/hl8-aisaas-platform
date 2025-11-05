/**
 * @fileoverview 压缩配置类型
 */

import type { FastifyCompressOptions } from "@fastify/compress";

export type CompressionOptions = FastifyCompressOptions;

export const DEFAULT_COMPRESSION_OPTIONS: CompressionOptions = {
  global: true,
  threshold: 1024, // 1KB
  encodings: ["br", "gzip", "deflate"],
};

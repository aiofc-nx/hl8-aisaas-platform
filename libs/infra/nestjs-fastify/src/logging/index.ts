/**
 * @fileoverview 日志模块导出
 */

export * from "./fastify-logger.service.js";
export * from "./logging.module.js";
export * from "./pino-config.factory.js";
export * from "./context/context-storage.js";
export * from "./context/context-extractor.js";
export * from "./context/request-context.types.js";
export * from "./sanitizer/sanitizer.js";
export * from "./sanitizer/default-fields.js";
export * from "./hooks/request-context.hook.js";

// 导出 Logger 别名，使其更接近 NestJS 的导入方式
// import { Logger } from '@hl8/nestjs-fastify';
export { FastifyLoggerService as Logger } from "./fastify-logger.service.js";

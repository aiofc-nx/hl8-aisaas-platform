/**
 * @fileoverview CompressionModule 单元测试
 */

import { Test } from "@nestjs/testing";
import { CompressionModule } from "./compression.module.js";
import { DEFAULT_COMPRESSION_OPTIONS } from "./types/compression-options.js";

describe("CompressionModule", () => {
  describe("forRoot", () => {
    it("应该使用默认配置创建模块", () => {
      const module = CompressionModule.forRoot();
      expect(module).toBeDefined();
      expect(module.global).toBe(true);
      expect(module.module).toBe(CompressionModule);
      expect(module.providers).toBeDefined();
      expect(module.exports).toContain("COMPRESSION_OPTIONS");
    });

    it("应该合并用户配置和默认配置", () => {
      const customOptions = {
        threshold: 2048,
        encodings: ["gzip"] as const,
      };
      const module = CompressionModule.forRoot(customOptions);

      const optionsProvider = module.providers?.find(
        (p: any) => p.provide === "COMPRESSION_OPTIONS",
      );
      expect(optionsProvider).toBeDefined();
      expect(optionsProvider?.useValue).toEqual({
        ...DEFAULT_COMPRESSION_OPTIONS,
        ...customOptions,
      });
    });

    it("应该正确导出配置选项", () => {
      const module = CompressionModule.forRoot();
      expect(module.exports).toContain("COMPRESSION_OPTIONS");
    });
  });

  describe("forRootAsync", () => {
    it("应该使用工厂函数创建模块", async () => {
      const module = CompressionModule.forRootAsync({
        useFactory: () => ({
          threshold: 512,
          encodings: ["br", "gzip"] as const,
        }),
      });

      expect(module).toBeDefined();
      expect(module.global).toBe(true);
      expect(module.module).toBe(CompressionModule);
      expect(module.providers).toBeDefined();
      expect(module.imports).toEqual([]);
    });

    it("应该支持异步工厂函数", async () => {
      const module = CompressionModule.forRootAsync({
        useFactory: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return {
            threshold: 1024,
            encodings: ["gzip"] as const,
          };
        },
      });

      expect(module).toBeDefined();
      const factoryProvider = module.providers?.find(
        (p: any) => p.provide === "COMPRESSION_OPTIONS",
      );
      expect(factoryProvider?.useFactory).toBeDefined();
    });

    it("应该支持依赖注入", () => {
      class MockConfig {
        compression = {
          threshold: 2048,
          encodings: ["br"] as const,
        };
      }

      const module = CompressionModule.forRootAsync({
        imports: [],
        inject: [MockConfig],
        useFactory: (config: MockConfig) => config.compression,
      });

      const factoryProvider = module.providers?.find(
        (p: any) => p.provide === "COMPRESSION_OPTIONS",
      );
      expect(factoryProvider?.inject).toContain(MockConfig);
    });

    it("缺少 useFactory 时应该抛出错误", () => {
      expect(() => {
        CompressionModule.forRootAsync({} as any);
      }).toThrow("CompressionModule.forRootAsync() 必须提供 useFactory");
    });

    it("应该正确导出配置选项", () => {
      const module = CompressionModule.forRootAsync({
        useFactory: () => ({}),
      });
      expect(module.exports).toContain("COMPRESSION_OPTIONS");
    });
  });

  describe("模块集成", () => {
    it("应该能够被 NestJS 测试模块使用", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          CompressionModule.forRoot({
            threshold: 1024,
          }),
        ],
      }).compile();

      const options = moduleRef.get("COMPRESSION_OPTIONS");
      expect(options).toBeDefined();
      expect(options.threshold).toBe(1024);
    });

    it("应该能够使用异步配置", async () => {
      class TestConfig {
        getCompression() {
          return {
            threshold: 2048,
            encodings: ["gzip"] as const,
          };
        }
      }

      const config = new TestConfig();

      const moduleRef = await Test.createTestingModule({
        imports: [
          CompressionModule.forRootAsync({
            useFactory: () => config.getCompression(),
          }),
        ],
      }).compile();

      const options = moduleRef.get("COMPRESSION_OPTIONS");
      expect(options).toBeDefined();
      expect(options.threshold).toBe(2048);
      expect(options.encodings).toEqual(["gzip"]);
    });
  });
});

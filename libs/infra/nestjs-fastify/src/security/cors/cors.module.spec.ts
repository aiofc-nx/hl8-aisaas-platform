/**
 * @fileoverview CorsModule 单元测试
 */

import { Test } from "@nestjs/testing";
import { CorsModule } from "./cors.module.js";
import { DEFAULT_CORS_OPTIONS } from "./types/cors-options.js";

describe("CorsModule", () => {
  describe("forRoot", () => {
    it("应该使用默认配置创建模块", () => {
      const module = CorsModule.forRoot();
      expect(module).toBeDefined();
      expect(module.global).toBe(true);
      expect(module.module).toBe(CorsModule);
      expect(module.providers).toBeDefined();
      expect(module.exports).toContain("CORS_OPTIONS");
    });

    it("应该合并用户配置和默认配置", () => {
      const customOptions = {
        origin: ["https://example.com"],
        credentials: false,
      };
      const module = CorsModule.forRoot(customOptions);

      const optionsProvider = module.providers?.find(
        (p: any) => p.provide === "CORS_OPTIONS",
      );
      expect(optionsProvider).toBeDefined();
      expect(optionsProvider?.useValue).toEqual({
        ...DEFAULT_CORS_OPTIONS,
        ...customOptions,
      });
    });

    it("应该支持 origin 为 true", () => {
      const module = CorsModule.forRoot({
        origin: true,
      });

      const optionsProvider = module.providers?.find(
        (p: any) => p.provide === "CORS_OPTIONS",
      );
      expect(optionsProvider?.useValue.origin).toBe(true);
    });

    it("应该支持 origin 为函数", () => {
      const originFunction = (origin: string, callback: any) => {
        callback(null, true);
      };

      const module = CorsModule.forRoot({
        origin: originFunction,
      });

      const optionsProvider = module.providers?.find(
        (p: any) => p.provide === "CORS_OPTIONS",
      );
      expect(optionsProvider?.useValue.origin).toBe(originFunction);
    });

    it("应该正确导出配置选项", () => {
      const module = CorsModule.forRoot();
      expect(module.exports).toContain("CORS_OPTIONS");
    });
  });

  describe("forRootAsync", () => {
    it("应该使用工厂函数创建模块", () => {
      const module = CorsModule.forRootAsync({
        useFactory: () => ({
          origin: ["https://app.example.com"],
          credentials: true,
        }),
      });

      expect(module).toBeDefined();
      expect(module.global).toBe(true);
      expect(module.module).toBe(CorsModule);
      expect(module.providers).toBeDefined();
      expect(module.imports).toEqual([]);
    });

    it("应该支持异步工厂函数", () => {
      const module = CorsModule.forRootAsync({
        useFactory: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return {
            origin: ["https://api.example.com"],
            credentials: false,
          };
        },
      });

      expect(module).toBeDefined();
      const factoryProvider = module.providers?.find(
        (p: any) => p.provide === "CORS_OPTIONS",
      );
      expect(factoryProvider?.useFactory).toBeDefined();
    });

    it("应该支持依赖注入", () => {
      class MockConfig {
        cors = {
          origin: ["https://example.com"],
          credentials: true,
          allowedHeaders: ["Authorization"],
        };
      }

      const module = CorsModule.forRootAsync({
        imports: [],
        inject: [MockConfig],
        useFactory: (config: MockConfig) => config.cors,
      });

      const factoryProvider = module.providers?.find(
        (p: any) => p.provide === "CORS_OPTIONS",
      );
      expect(factoryProvider?.inject).toContain(MockConfig);
    });

    it("缺少 useFactory 时应该抛出错误", () => {
      expect(() => {
        CorsModule.forRootAsync({} as any);
      }).toThrow("CorsModule.forRootAsync() 必须提供 useFactory");
    });

    it("应该正确导出配置选项", () => {
      const module = CorsModule.forRootAsync({
        useFactory: () => ({}),
      });
      expect(module.exports).toContain("CORS_OPTIONS");
    });
  });

  describe("模块集成", () => {
    it("应该能够被 NestJS 测试模块使用", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          CorsModule.forRoot({
            origin: ["https://example.com"],
            credentials: true,
          }),
        ],
      }).compile();

      const options = moduleRef.get("CORS_OPTIONS");
      expect(options).toBeDefined();
      expect(options.origin).toEqual(["https://example.com"]);
      expect(options.credentials).toBe(true);
    });

    it("应该能够使用异步配置", async () => {
      class TestConfig {
        getCors() {
          return {
            origin:
              process.env.NODE_ENV === "development"
                ? true
                : ["https://example.com"],
            credentials: true,
          };
        }
      }

      const config = new TestConfig();

      const moduleRef = await Test.createTestingModule({
        imports: [
          CorsModule.forRootAsync({
            useFactory: () => config.getCors(),
          }),
        ],
      }).compile();

      const options = moduleRef.get("CORS_OPTIONS");
      expect(options).toBeDefined();
      expect(options.credentials).toBe(true);
    });
  });
});

/**
 * @fileoverview SecurityModule 单元测试
 */

import { Test } from "@nestjs/testing";
import { SecurityModule } from "./security.module.js";
import { DEFAULT_HELMET_OPTIONS } from "./types/helmet-options.js";

describe("SecurityModule", () => {
  describe("forRoot", () => {
    it("应该使用默认配置创建模块", () => {
      const module = SecurityModule.forRoot();
      expect(module).toBeDefined();
      expect(module.global).toBe(true);
      expect(module.module).toBe(SecurityModule);
      expect(module.providers).toBeDefined();
      expect(module.exports).toContain("HELMET_OPTIONS");
    });

    it("应该合并用户配置和默认配置", () => {
      const customOptions = {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
        },
      };
      const module = SecurityModule.forRoot(customOptions);

      const optionsProvider = module.providers?.find(
        (p: any) => p.provide === "HELMET_OPTIONS",
      ) as any;
      expect(optionsProvider).toBeDefined();
      const mergedOptions = optionsProvider?.useValue;
      expect(mergedOptions.hsts).toEqual(customOptions.hsts);
    });

    it("应该深度合并 CSP 配置", () => {
      const customOptions = {
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'", "https://cdn.example.com"],
            scriptSrc: ["'self'"],
          },
        },
      };
      const module = SecurityModule.forRoot(customOptions);

      const optionsProvider = module.providers?.find(
        (p: any) => p.provide === "HELMET_OPTIONS",
      ) as any;
      const mergedOptions = optionsProvider?.useValue;

      // 应该合并 directives
      expect(
        mergedOptions.contentSecurityPolicy?.directives?.defaultSrc,
      ).toContain("'self'");
      expect(
        mergedOptions.contentSecurityPolicy?.directives?.defaultSrc,
      ).toContain("https://cdn.example.com");
      // 应该保留默认的 scriptSrc
      expect(
        mergedOptions.contentSecurityPolicy?.directives?.scriptSrc,
      ).toBeDefined();
    });

    it("应该正确导出配置选项", () => {
      const module = SecurityModule.forRoot();
      expect(module.exports).toContain("HELMET_OPTIONS");
    });
  });

  describe("forRootAsync", () => {
    it("应该使用工厂函数创建模块", () => {
      const module = SecurityModule.forRootAsync({
        useFactory: () => ({
          hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
          },
        }),
      });

      expect(module).toBeDefined();
      expect(module.global).toBe(true);
      expect(module.module).toBe(SecurityModule);
      expect(module.providers).toBeDefined();
      expect(module.imports).toEqual([]);
    });

    it("应该支持异步工厂函数", () => {
      const module = SecurityModule.forRootAsync({
        useFactory: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return {
            hsts: {
              maxAge: 31536000,
            },
          };
        },
      });

      expect(module).toBeDefined();
      const factoryProvider = module.providers?.find(
        (p: any) => p.provide === "HELMET_OPTIONS",
      ) as any;
      expect(factoryProvider?.useFactory).toBeDefined();
    });

    it("应该支持依赖注入", () => {
      class MockConfig {
        security = {
          hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
          },
        };
      }

      const module = SecurityModule.forRootAsync({
        imports: [],
        inject: [MockConfig],
        useFactory: (config: MockConfig) => config.security,
      });

      const factoryProvider = module.providers?.find(
        (p: any) => p.provide === "HELMET_OPTIONS",
      ) as any;
      expect(factoryProvider?.inject).toContain(MockConfig);
    });

    it("应该深度合并异步配置的 CSP", async () => {
      class TestConfig {
        getSecurity() {
          return {
            contentSecurityPolicy: {
              directives: {
                defaultSrc: ["'self'", "https://api.example.com"],
              },
            },
          };
        }
      }

      const config = new TestConfig();

      const module = SecurityModule.forRootAsync({
        useFactory: () => config.getSecurity(),
      });

      const moduleRef = await Test.createTestingModule({
        imports: [module],
      }).compile();

      const options = moduleRef.get("HELMET_OPTIONS");
      expect(options).toBeDefined();
      // 应该合并默认 CSP 配置
      expect(options.contentSecurityPolicy?.directives?.defaultSrc).toContain(
        "'self'",
      );
      expect(options.contentSecurityPolicy?.directives?.defaultSrc).toContain(
        "https://api.example.com",
      );
      // 应该保留其他默认 directives
      expect(
        options.contentSecurityPolicy?.directives?.scriptSrc,
      ).toBeDefined();
    });

    it("缺少 useFactory 时应该抛出错误", () => {
      expect(() => {
        SecurityModule.forRootAsync({} as any);
      }).toThrow("SecurityModule.forRootAsync() 必须提供 useFactory");
    });

    it("应该正确导出配置选项", () => {
      const module = SecurityModule.forRootAsync({
        useFactory: () => ({}),
      });
      expect(module.exports).toContain("HELMET_OPTIONS");
    });
  });

  describe("模块集成", () => {
    it("应该能够被 NestJS 测试模块使用", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          SecurityModule.forRoot({
            hsts: {
              maxAge: 31536000,
              includeSubDomains: true,
            },
          }),
        ],
      }).compile();

      const options = moduleRef.get("HELMET_OPTIONS");
      expect(options).toBeDefined();
      expect(options.hsts?.maxAge).toBe(31536000);
      expect(options.hsts?.includeSubDomains).toBe(true);
    });

    it("应该能够使用异步配置", async () => {
      class TestConfig {
        getSecurity() {
          return {
            contentSecurityPolicy: {
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
              },
            },
          };
        }
      }

      const config = new TestConfig();

      const moduleRef = await Test.createTestingModule({
        imports: [
          SecurityModule.forRootAsync({
            useFactory: () => config.getSecurity(),
          }),
        ],
      }).compile();

      const options = moduleRef.get("HELMET_OPTIONS");
      expect(options).toBeDefined();
      expect(options.contentSecurityPolicy?.directives?.defaultSrc).toContain(
        "'self'",
      );
      expect(options.contentSecurityPolicy?.directives?.scriptSrc).toContain(
        "'self'",
      );
      expect(options.contentSecurityPolicy?.directives?.scriptSrc).toContain(
        "'unsafe-inline'",
      );
    });
  });
});

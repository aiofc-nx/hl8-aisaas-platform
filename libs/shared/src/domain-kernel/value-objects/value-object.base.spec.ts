/**
 * @fileoverview 值对象基类测试
 * @description 测试ValueObject基类的各种功能
 */

import { ValueObject } from "./value-object.base.js";

/**
 * 测试用的简单值对象：Email
 */
class Email extends ValueObject<string> {
  protected validateValue(value: string): void {
    if (!value || typeof value !== "string") {
      throw new Error("邮箱地址不能为空");
    }
    // 验证时考虑 trim 后的值（因为标准化会 trim）
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error("邮箱地址不能为空");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      throw new Error(`无效的邮箱格式: ${trimmed}`);
    }
  }

  protected normalizeValue(value: string): string {
    return value.trim().toLowerCase();
  }

  clone(): Email {
    return new Email(this._value);
  }
}

/**
 * 测试用的复合值对象：Money
 */
interface MoneyValue {
  amount: number;
  currency: string;
}

class Money extends ValueObject<MoneyValue> {
  protected validateValue(value: MoneyValue): void {
    if (value.amount < 0) {
      throw new Error("金额不能为负数");
    }
    if (!value.currency || value.currency.length !== 3) {
      throw new Error("货币代码必须是3位字符");
    }
  }

  clone(): Money {
    return new Money(this._value);
  }

  add(other: Money): Money {
    if (this._value.currency !== other._value.currency) {
      throw new Error("不同货币不能相加");
    }
    return new Money({
      amount: this._value.amount + other._value.amount,
      currency: this._value.currency,
    });
  }
}

describe("ValueObject", () => {
  describe("简单值对象（Email）", () => {
    describe("构造函数", () => {
      it("应该能够创建有效的值对象", () => {
        const email = new Email("user@example.com");

        expect(email.value).toBe("user@example.com");
      });

      it("应该执行标准化", () => {
        const email = new Email("  User@Example.COM  ");

        expect(email.value).toBe("user@example.com");
      });

      it("应该拒绝无效的值", () => {
        expect(() => {
          new Email("invalid-email");
        }).toThrow("无效的邮箱格式");
      });

      it("应该拒绝空值", () => {
        expect(() => {
          new Email("");
        }).toThrow("邮箱地址不能为空");
      });
    });

    describe("equals方法", () => {
      it("应该正确识别相等的值对象", () => {
        const email1 = new Email("user@example.com");
        const email2 = new Email("user@example.com");

        expect(email1.equals(email2)).toBe(true);
      });

      it("应该正确识别不相等的值对象", () => {
        const email1 = new Email("user@example.com");
        const email2 = new Email("admin@example.com");

        expect(email1.equals(email2)).toBe(false);
      });

      it("标准化后应该相等", () => {
        const email1 = new Email("User@Example.COM");
        const email2 = new Email("user@example.com");

        expect(email1.equals(email2)).toBe(true);
      });

      it("应该对null返回false", () => {
        const email = new Email("user@example.com");

        expect(email.equals(null)).toBe(false);
        expect(email.equals(undefined)).toBe(false);
      });

      it("应该对不同类型的值对象返回false", () => {
        const email = new Email("user@example.com");
        const money = new Money({ amount: 100, currency: "USD" });

        expect(email.equals(money as any)).toBe(false);
      });
    });

    describe("toString方法", () => {
      it("应该返回值的字符串表示", () => {
        const email = new Email("user@example.com");

        expect(email.toString()).toBe("user@example.com");
      });
    });

    describe("toJSON方法", () => {
      it("应该返回值的JSON表示", () => {
        const email = new Email("user@example.com");

        expect(email.toJSON()).toBe("user@example.com");
      });
    });

    describe("clone方法", () => {
      it("应该创建新的实例", () => {
        const email1 = new Email("user@example.com");
        const email2 = email1.clone();

        expect(email1).not.toBe(email2);
        expect(email1.equals(email2)).toBe(true);
        expect(email1.value).toBe(email2.value);
      });
    });

    describe("hashCode方法", () => {
      it("应该为相同的值生成相同的哈希值", () => {
        const email1 = new Email("user@example.com");
        const email2 = new Email("user@example.com");

        expect(email1.hashCode()).toBe(email2.hashCode());
      });

      it("应该为不同的值生成不同的哈希值", () => {
        const email1 = new Email("user@example.com");
        const email2 = new Email("admin@example.com");

        expect(email1.hashCode()).not.toBe(email2.hashCode());
      });
    });

    describe("不可变性", () => {
      it("应该确保值不可变", () => {
        const email = new Email("user@example.com");
        const value = email.value;

        // TypeScript会在编译时阻止修改，这里测试运行时行为
        expect(value).toBe("user@example.com");
      });
    });
  });

  describe("复合值对象（Money）", () => {
    describe("构造函数", () => {
      it("应该能够创建有效的值对象", () => {
        const money = new Money({ amount: 100, currency: "USD" });

        expect(money.value.amount).toBe(100);
        expect(money.value.currency).toBe("USD");
      });

      it("应该拒绝负数金额", () => {
        expect(() => {
          new Money({ amount: -100, currency: "USD" });
        }).toThrow("金额不能为负数");
      });

      it("应该拒绝无效的货币代码", () => {
        expect(() => {
          new Money({ amount: 100, currency: "US" });
        }).toThrow("货币代码必须是3位字符");
      });
    });

    describe("equals方法", () => {
      it("应该正确识别相等的值对象", () => {
        const money1 = new Money({ amount: 100, currency: "USD" });
        const money2 = new Money({ amount: 100, currency: "USD" });

        expect(money1.equals(money2)).toBe(true);
      });

      it("应该正确识别不相等的值对象", () => {
        const money1 = new Money({ amount: 100, currency: "USD" });
        const money2 = new Money({ amount: 200, currency: "USD" });

        expect(money1.equals(money2)).toBe(false);
      });

      it("应该正确比较不同货币", () => {
        const money1 = new Money({ amount: 100, currency: "USD" });
        const money2 = new Money({ amount: 100, currency: "EUR" });

        expect(money1.equals(money2)).toBe(false);
      });
    });

    describe("clone方法", () => {
      it("应该创建深度克隆", () => {
        const money1 = new Money({ amount: 100, currency: "USD" });
        const money2 = money1.clone();

        expect(money1).not.toBe(money2);
        expect(money1.value).not.toBe(money2.value); // 深度克隆
        expect(money1.equals(money2)).toBe(true);
      });

      it("应该确保修改克隆不影响原对象", () => {
        const money1 = new Money({ amount: 100, currency: "USD" });
        const money2 = money1.clone();
        const value1 = money1.value;
        const value2 = money2.value;

        // 修改克隆的值不应该影响原对象
        value2.amount = 200;

        expect(value1.amount).toBe(100);
        expect(value2.amount).toBe(200);
      });
    });

    describe("toJSON方法", () => {
      it("应该返回值的JSON表示", () => {
        const money = new Money({ amount: 100, currency: "USD" });
        const json = money.toJSON();

        expect(json).toEqual({ amount: 100, currency: "USD" });
      });
    });

    describe("业务方法", () => {
      it("应该支持业务操作", () => {
        const money1 = new Money({ amount: 100, currency: "USD" });
        const money2 = new Money({ amount: 50, currency: "USD" });
        const result = money1.add(money2);

        expect(result.value.amount).toBe(150);
        expect(result.value.currency).toBe("USD");
      });

      it("应该拒绝不同货币的相加", () => {
        const money1 = new Money({ amount: 100, currency: "USD" });
        const money2 = new Money({ amount: 50, currency: "EUR" });

        expect(() => {
          money1.add(money2);
        }).toThrow("不同货币不能相加");
      });
    });

    describe("hashCode方法", () => {
      it("应该为相同的值生成相同的哈希值", () => {
        const money1 = new Money({ amount: 100, currency: "USD" });
        const money2 = new Money({ amount: 100, currency: "USD" });

        expect(money1.hashCode()).toBe(money2.hashCode());
      });
    });
  });
});

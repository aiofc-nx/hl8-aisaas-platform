/**
 * @fileoverview 实体基类测试
 * @description 测试Entity基类的各种功能
 */

import { Entity } from "./entity.base.js";
import { EntityId } from "../value-objects/identifiers/entity-id.js";

/**
 * 测试用的实体类
 */
class TestEntity extends Entity {
  private _name: string;

  constructor(id: EntityId, name: string) {
    super(id);
    this._name = name;
  }

  get name(): string {
    return this._name;
  }

  clone(): Entity {
    return new TestEntity(this.id, this._name);
  }
}

describe("Entity", () => {
  describe("构造函数", () => {
    it("应该能够自动生成ID", () => {
      const entity = new TestEntity(EntityId.generate(), "测试实体");

      expect(entity.id).toBeDefined();
      expect(entity.id).toBeInstanceOf(EntityId);
      expect(entity.isValid()).toBe(true);
    });

    it("应该能够使用提供的ID", () => {
      const id = EntityId.generate();
      const entity = new TestEntity(id, "测试实体");

      expect(entity.id).toBe(id);
      expect(entity.id.equals(id)).toBe(true);
    });
  });

  describe("equals", () => {
    it("应该正确比较相等的实体", () => {
      const id = EntityId.generate();
      const entity1 = new TestEntity(id, "实体1");
      const entity2 = new TestEntity(id, "实体2");

      expect(entity1.equals(entity2)).toBe(true);
    });

    it("应该正确比较不相等的实体", () => {
      const entity1 = new TestEntity(EntityId.generate(), "实体1");
      const entity2 = new TestEntity(EntityId.generate(), "实体1");

      expect(entity1.equals(entity2)).toBe(false);
    });

    it("应该正确处理null和undefined", () => {
      const entity = new TestEntity(EntityId.generate(), "实体");

      expect(entity.equals(null)).toBe(false);
      expect(entity.equals(undefined)).toBe(false);
    });

    it("应该正确处理非Entity对象", () => {
      const entity = new TestEntity(EntityId.generate(), "实体");
      const other = { id: "some-id" };

      expect(entity.equals(other as any)).toBe(false);
    });

    it("应该正确处理同一个实例", () => {
      const entity = new TestEntity(EntityId.generate(), "实体");

      expect(entity.equals(entity)).toBe(true);
    });
  });

  describe("hashCode", () => {
    it("应该为相同的实体生成相同的哈希值", () => {
      const id = EntityId.generate();
      const entity1 = new TestEntity(id, "实体1");
      const entity2 = new TestEntity(id, "实体2");

      expect(entity1.hashCode()).toBe(entity2.hashCode());
    });

    it("应该为不同的实体生成不同的哈希值", () => {
      const entity1 = new TestEntity(EntityId.generate(), "实体1");
      const entity2 = new TestEntity(EntityId.generate(), "实体2");

      expect(entity1.hashCode()).not.toBe(entity2.hashCode());
    });
  });

  describe("toString", () => {
    it("应该返回正确的字符串表示", () => {
      const id = EntityId.generate();
      const entity = new TestEntity(id, "测试实体");

      const str = entity.toString();

      expect(str).toContain("TestEntity");
      expect(str).toContain(id.toString());
    });
  });

  describe("toJSON", () => {
    it("应该返回包含ID的JSON对象", () => {
      const id = EntityId.generate();
      const entity = new TestEntity(id, "测试实体");

      const json = entity.toJSON();

      expect(json).toHaveProperty("id");
      expect(json.id).toBe(id.value);
    });
  });

  describe("isValid", () => {
    it("应该验证有效的实体", () => {
      const entity = new TestEntity(EntityId.generate(), "测试实体");

      expect(entity.isValid()).toBe(true);
    });
  });

  describe("在集合中使用", () => {
    it("应该为相同ID的实体生成相同的hashCode", () => {
      const id = EntityId.generate();
      const entity1 = new TestEntity(id, "实体1");
      const entity2 = new TestEntity(id, "实体2");
      const entity3 = new TestEntity(EntityId.generate(), "实体3");

      // 验证相同ID的实体具有相同的hashCode
      expect(entity1.hashCode()).toBe(entity2.hashCode());
      // 验证不同ID的实体具有不同的hashCode（在大多数情况下）
      expect(entity1.hashCode()).not.toBe(entity3.hashCode());

      // 注意：JavaScript的Set使用引用相等性，不会自动使用hashCode
      // 如果需要基于ID的相等性，应使用equals方法或自定义集合实现
      const entitySet = new Set<Entity>();
      entitySet.add(entity1);
      entitySet.add(entity2); // 虽然ID相同，但引用不同，所以会被添加
      entitySet.add(entity3);

      // Set会包含所有3个元素，因为它们是不同的对象引用
      expect(entitySet.size).toBe(3);
      // 但我们可以通过equals方法验证它们逻辑上相等
      expect(entity1.equals(entity2)).toBe(true);
    });

    it("应该能够在Map中作为键使用", () => {
      const entity1 = new TestEntity(EntityId.generate(), "实体1");
      const entity2 = new TestEntity(EntityId.generate(), "实体2");

      const entityMap = new Map<Entity, string>();
      entityMap.set(entity1, "值1");
      entityMap.set(entity2, "值2");

      expect(entityMap.get(entity1)).toBe("值1");
      expect(entityMap.get(entity2)).toBe("值2");
    });
  });

  describe("clone", () => {
    it("应该能够克隆实体", () => {
      const entity = new TestEntity(EntityId.generate(), "测试实体");
      const cloned = entity.clone();

      expect(cloned).not.toBe(entity);
      expect(cloned.equals(entity)).toBe(true);
      expect(cloned.id).toBeInstanceOf(EntityId);
    });
  });
});

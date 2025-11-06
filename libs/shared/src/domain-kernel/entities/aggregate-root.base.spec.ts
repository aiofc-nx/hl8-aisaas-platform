/**
 * @fileoverview 聚合根基类测试
 * @description 测试AggregateRoot基类的各种功能
 */

import { AggregateRoot, DomainEvent } from "./aggregate-root.base.js";
import { EntityId } from "../value-objects/identifiers/entity-id.js";
import { UserId } from "../value-objects/identifiers/user-id.js";
import { TenantId } from "../value-objects/identifiers/tenant-id.js";

/**
 * 测试用的领域事件
 */
class TestDomainEvent implements DomainEvent {
  readonly eventType = "TestEvent";
  readonly aggregateId: EntityId;
  readonly occurredAt: Date;
  readonly eventVersion = 1;

  constructor(
    aggregateId: EntityId,
    public readonly data: string,
  ) {
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
  }
}

/**
 * 测试用的聚合根类
 */
class TestAggregateRoot extends AggregateRoot {
  private _name: string;

  constructor(
    id?: EntityId,
    name?: string,
    createdBy?: UserId,
    addEvent?: boolean,
  ) {
    super(id, undefined, undefined, undefined, undefined, createdBy);
    this._name = name || "测试聚合";
    if (addEvent) {
      this.addDomainEvent(
        new TestDomainEvent(this.id, `Created: ${this._name}`),
      );
    }
  }

  get name(): string {
    return this._name;
  }

  updateName(newName: string, updatedBy?: UserId): void {
    this._name = newName;
    this.markAsUpdated(updatedBy);
    this.addDomainEvent(new TestDomainEvent(this.id, `Updated: ${newName}`));
  }

  clone(): AggregateRoot {
    return new TestAggregateRoot(this.id, this._name, this.createdBy, false);
  }
}

describe("AggregateRoot", () => {
  // 测试用的租户ID
  const testTenantId = TenantId.generate();

  // 辅助函数：生成测试用的UserId
  const createTestUserId = (): UserId => {
    return UserId.generate(testTenantId);
  };

  describe("构造函数", () => {
    it("应该能够创建聚合根", () => {
      const aggregate = new TestAggregateRoot();

      expect(aggregate.id).toBeDefined();
      expect(aggregate.id).toBeInstanceOf(EntityId);
      expect(aggregate.isValid()).toBe(true);
    });

    it("应该继承AuditableEntity的所有功能", () => {
      const createdBy = createTestUserId();
      const aggregate = new TestAggregateRoot(
        EntityId.generate(),
        "测试聚合",
        createdBy,
      );

      expect(aggregate.createdBy).toBe(createdBy);
      expect(aggregate.isActive()).toBe(true);
      expect(aggregate.version).toBe(1);
    });
  });

  describe("领域事件管理", () => {
    describe("addDomainEvent", () => {
      it("应该能够添加领域事件", () => {
        const aggregate = new TestAggregateRoot();

        const event = new TestDomainEvent(aggregate.id, "测试数据");
        aggregate["addDomainEvent"](event);

        expect(aggregate.hasDomainEvents()).toBe(true);
        expect(aggregate.getDomainEventCount()).toBe(1);
      });

      it("应该能够添加多个领域事件", () => {
        const aggregate = new TestAggregateRoot();

        aggregate["addDomainEvent"](new TestDomainEvent(aggregate.id, "事件1"));
        aggregate["addDomainEvent"](new TestDomainEvent(aggregate.id, "事件2"));
        aggregate["addDomainEvent"](new TestDomainEvent(aggregate.id, "事件3"));

        expect(aggregate.getDomainEventCount()).toBe(3);
      });

      it("应该在构造函数中添加事件", () => {
        const aggregate = new TestAggregateRoot(
          EntityId.generate(),
          "测试聚合",
          createTestUserId(),
          true,
        );

        expect(aggregate.hasDomainEvents()).toBe(true);
        expect(aggregate.getDomainEventCount()).toBe(1);
      });
    });

    describe("getDomainEvents", () => {
      it("应该返回所有领域事件", () => {
        const aggregate = new TestAggregateRoot();

        aggregate["addDomainEvent"](new TestDomainEvent(aggregate.id, "事件1"));
        aggregate["addDomainEvent"](new TestDomainEvent(aggregate.id, "事件2"));

        const events = aggregate.getDomainEvents();

        expect(events).toHaveLength(2);
        expect(events[0]).toBeInstanceOf(TestDomainEvent);
        expect(events[1]).toBeInstanceOf(TestDomainEvent);
      });

      it("应该返回事件的副本", () => {
        const aggregate = new TestAggregateRoot();

        aggregate["addDomainEvent"](new TestDomainEvent(aggregate.id, "事件1"));

        const events1 = aggregate.getDomainEvents();
        const events2 = aggregate.getDomainEvents();

        expect(events1).not.toBe(events2);
        expect(events1).toEqual(events2);
      });

      it("应该返回空数组当没有事件时", () => {
        const aggregate = new TestAggregateRoot();

        const events = aggregate.getDomainEvents();

        expect(events).toHaveLength(0);
        expect(events).toEqual([]);
      });

      it("返回的事件应该包含正确的聚合ID", () => {
        const id = EntityId.generate();
        const aggregate = new TestAggregateRoot(id);

        aggregate["addDomainEvent"](new TestDomainEvent(id, "测试"));

        const events = aggregate.getDomainEvents();

        expect(events[0]?.aggregateId.equals(id)).toBe(true);
      });
    });

    describe("clearDomainEvents", () => {
      it("应该清除所有领域事件", () => {
        const aggregate = new TestAggregateRoot();

        aggregate["addDomainEvent"](new TestDomainEvent(aggregate.id, "事件1"));
        aggregate["addDomainEvent"](new TestDomainEvent(aggregate.id, "事件2"));

        expect(aggregate.hasDomainEvents()).toBe(true);

        aggregate.clearDomainEvents();

        expect(aggregate.hasDomainEvents()).toBe(false);
        expect(aggregate.getDomainEventCount()).toBe(0);
        expect(aggregate.getDomainEvents()).toHaveLength(0);
      });

      it("对空事件列表调用应该是幂等的", () => {
        const aggregate = new TestAggregateRoot();

        aggregate.clearDomainEvents();
        aggregate.clearDomainEvents();

        expect(aggregate.hasDomainEvents()).toBe(false);
      });
    });

    describe("hasDomainEvents", () => {
      it("应该正确识别有事件的聚合", () => {
        const aggregate = new TestAggregateRoot();

        aggregate["addDomainEvent"](new TestDomainEvent(aggregate.id, "事件1"));

        expect(aggregate.hasDomainEvents()).toBe(true);
      });

      it("应该正确识别无事件的聚合", () => {
        const aggregate = new TestAggregateRoot();

        expect(aggregate.hasDomainEvents()).toBe(false);
      });

      it("应该在清除事件后返回false", () => {
        const aggregate = new TestAggregateRoot();

        aggregate["addDomainEvent"](new TestDomainEvent(aggregate.id, "事件1"));
        expect(aggregate.hasDomainEvents()).toBe(true);

        aggregate.clearDomainEvents();
        expect(aggregate.hasDomainEvents()).toBe(false);
      });
    });

    describe("getDomainEventCount", () => {
      it("应该返回正确的事件数量", () => {
        const aggregate = new TestAggregateRoot();

        expect(aggregate.getDomainEventCount()).toBe(0);

        aggregate["addDomainEvent"](new TestDomainEvent(aggregate.id, "事件1"));
        expect(aggregate.getDomainEventCount()).toBe(1);

        aggregate["addDomainEvent"](new TestDomainEvent(aggregate.id, "事件2"));
        expect(aggregate.getDomainEventCount()).toBe(2);
      });

      it("应该在清除事件后返回0", () => {
        const aggregate = new TestAggregateRoot();

        aggregate["addDomainEvent"](new TestDomainEvent(aggregate.id, "事件1"));
        aggregate["addDomainEvent"](new TestDomainEvent(aggregate.id, "事件2"));

        expect(aggregate.getDomainEventCount()).toBe(2);

        aggregate.clearDomainEvents();

        expect(aggregate.getDomainEventCount()).toBe(0);
      });
    });
  });

  describe("业务方法中的领域事件", () => {
    it("应该在业务方法中添加事件", () => {
      const aggregate = new TestAggregateRoot();
      const updatedBy = createTestUserId();

      aggregate.updateName("新名称", updatedBy);

      expect(aggregate.hasDomainEvents()).toBe(true);
      expect(aggregate.getDomainEventCount()).toBe(1);

      const events = aggregate.getDomainEvents();
      expect(events[0]?.eventType).toBe("TestEvent");
    });
  });

  describe("继承AuditableEntity的功能", () => {
    it("应该继承所有审计功能", () => {
      const createdBy = createTestUserId();
      const aggregate = new TestAggregateRoot(
        EntityId.generate(),
        "测试聚合",
        createdBy,
      );

      expect(aggregate.createdBy).toBe(createdBy);
      expect(aggregate.isActive()).toBe(true);
      expect(aggregate.version).toBe(1);
    });

    it("应该支持激活/失活功能", () => {
      const aggregate = new TestAggregateRoot();
      const deactivatorId = createTestUserId();

      aggregate.deactivate(deactivatorId);
      expect(aggregate.isActive()).toBe(false);

      const activatorId = createTestUserId();
      aggregate.activate(activatorId);
      expect(aggregate.isActive()).toBe(true);
    });

    it("应该支持软删除功能", () => {
      const aggregate = new TestAggregateRoot();
      const deleterId = createTestUserId();

      aggregate.softDelete(deleterId);
      expect(aggregate.isDeleted()).toBe(true);

      aggregate.restore();
      expect(aggregate.isDeleted()).toBe(false);
    });

    it("应该支持equals方法", () => {
      const id = EntityId.generate();
      const aggregate1 = new TestAggregateRoot(id, "聚合1");
      const aggregate2 = new TestAggregateRoot(id, "聚合2");

      expect(aggregate1.equals(aggregate2)).toBe(true);
    });

    it("应该支持hashCode方法", () => {
      const id = EntityId.generate();
      const aggregate1 = new TestAggregateRoot(id, "聚合1");
      const aggregate2 = new TestAggregateRoot(id, "聚合2");

      expect(aggregate1.hashCode()).toBe(aggregate2.hashCode());
    });
  });

  describe("事件发布流程", () => {
    it("应该支持完整的事件发布流程", () => {
      const aggregate = new TestAggregateRoot();

      // 添加事件
      aggregate["addDomainEvent"](new TestDomainEvent(aggregate.id, "事件1"));
      aggregate["addDomainEvent"](new TestDomainEvent(aggregate.id, "事件2"));

      // 获取事件
      const events = aggregate.getDomainEvents();
      expect(events).toHaveLength(2);

      // 模拟发布事件
      // await eventBus.publishAll(events);

      // 清除事件
      aggregate.clearDomainEvents();
      expect(aggregate.hasDomainEvents()).toBe(false);
      expect(aggregate.getDomainEvents()).toHaveLength(0);
    });
  });
});

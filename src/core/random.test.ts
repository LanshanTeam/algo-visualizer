import { describe, expect, it } from "vitest";
import { queue } from "../topics/linear/queue";
import { graphTraversal } from "../topics/graph/graph-traversal";
import { dijkstra } from "../topics/graph/dijkstra";
import { randomCount, randomValues } from "./random";

describe("专题随机数据", () => {
  it("为要求升序的专题生成升序数据，并遵守容量", () => {
    const values = randomValues({ sorted: true, limit: 5 });
    expect(values).toHaveLength(5);
    expect(values).toEqual([...values].sort((a, b) => a - b));
    expect(values.every((value) => Number.isInteger(value) && value >= 10 && value <= 99)).toBe(true);
  });
  it("优先使用专题生成器，保留其返回数据", () => {
    const generated = [5, 0];
    expect(randomValues({ sorted: true, limit: 1, randomValues: () => generated })).toBe(generated);
  });

  it("两个图专题的随机起点始终合法且可以生成轨迹", () => {
    for (const topic of [graphTraversal, dijkstra]) {
      for (let attempt = 0; attempt < 20; attempt++) {
        const values = randomValues(topic.controls);
        expect(values).toHaveLength(1);
        expect(Number.isInteger(values[0])).toBe(true);
        expect(values[0]).toBeGreaterThanOrEqual(0);
        expect(values[0]).toBeLessThanOrEqual(5);
        expect(() => topic.trace({ values, operation: "bfs", index: 0, value: 0 })).not.toThrow();
      }
    }
  });


  it("定长结构的随机条数要给插入留空位", () => {
    // 顺序表容量 8：留一个空位
    expect(randomCount({ limit: 8, capacity: 8 })).toBe(7);
    // 栈容量 6：只能 5 个，否则一入栈就溢出
    expect(randomCount({ limit: 6, capacity: 6 })).toBe(5);
    // 队列 front = 3：只剩 4 个槽位可写
    expect(randomCount({ limit: 8, capacity: 8, reserved: 3 })).toBe(4);
    // front 顶到末端时至少给 1 条
    expect(randomCount({ limit: 8, capacity: 8, reserved: 7 })).toBe(1);
    // 没有定长容量时沿用数据上限
    expect(randomCount({ limit: 5 })).toBe(5);
  });

  it("队列在非零 front 下随机生成的数据仍能入队", () => {
    const values = randomValues({ limit: 8, capacity: 8 }, 2);
    expect(values.length).toBeLessThanOrEqual(5);
    expect(() => queue.trace({ values, operation: "enqueue", index: 2, value: 31 })).not.toThrow();
  });
});

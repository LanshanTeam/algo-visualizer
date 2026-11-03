import { describe, expect, it } from "vitest";
import { graphTraversal } from "../topics/graph/graph-traversal";
import { dijkstra } from "../topics/graph/dijkstra";
import { randomValues } from "./random";

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

});

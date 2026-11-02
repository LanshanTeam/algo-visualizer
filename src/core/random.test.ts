import { describe, expect, it } from "vitest";
import { randomValues } from "./random";

describe("专题随机数据", () => {
  it("为要求升序的专题生成升序数据，并遵守容量", () => {
    const values = randomValues({ sorted: true, limit: 5 });
    expect(values).toHaveLength(5);
    expect(values).toEqual([...values].sort((a, b) => a - b));
    expect(values.every((value) => Number.isInteger(value) && value >= 10 && value <= 99)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { clampIndex, parseValues, randomCount } from "./trace";

describe("输入校验", () => {
  it("接受中英文逗号与空格分隔", () => {
    expect(parseValues("1， -2, 3")).toEqual([1, -2, 3]);
    expect(parseValues("")).toEqual([]);
  });
  it("拒绝非整数与越界值", () => {
    for (const input of [
      "1.5",
      "NaN",
      "1000",
      "0x12",
      Array(14).fill(1).join(","),
    ])
      expect(() => parseValues(input)).toThrow();
  });
  it("按专题声明的上限拒绝超长输入", () => {
    expect(() => parseValues("1,2,3", 2)).toThrow();
    expect(parseValues("1,2,3", 3)).toEqual([1, 2, 3]);
  });
});

describe("索引与随机数据", () => {
  it("索引夹到合法区间，换数据后旧索引不会越界", () => {
    expect(clampIndex(2, 1)).toBe(1);
    expect(clampIndex(-3, 5)).toBe(0);
    expect(clampIndex(4, 5)).toBe(4);
    expect(clampIndex(2.7, 5)).toBe(2);
    expect(clampIndex(Number.NaN, 5)).toBe(0);
  });
  it("随机条数同时受数据上限、容量与已占槽位约束", () => {
    // 链表、排序没有定长容量，沿用 7 条
    expect(randomCount({})).toBe(7);
    // 顺序表容量 8：留一个空位
    expect(randomCount({ limit: 8, capacity: 8 })).toBe(7);
    // 栈容量 6：只能 5 个，否则入栈直接溢出
    expect(randomCount({ limit: 6, capacity: 6 })).toBe(5);
    // 队列容量 8 且 front = 2：只剩 5 个槽位可用
    expect(randomCount({ limit: 8, capacity: 8, reserved: 2 })).toBe(5);
    // front 顶到末端时至少给 1 条
    expect(randomCount({ limit: 8, capacity: 8, reserved: 7 })).toBe(1);
  });
});

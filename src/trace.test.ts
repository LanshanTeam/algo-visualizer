import { describe, expect, it } from "vitest";
import { linkedListTrace, parseValues, quickSortTrace } from "./trace";
import { getCode, languages } from "./code";
describe("快速排序", () => {
  for (const values of [[], [1], [4, 3, 2, 1], [2, 2, 2], [-3, 7, 0, -3]]) {
    it(`排序 ${JSON.stringify(values)}`, () => {
      const frames = quickSortTrace(values);
      expect(frames.at(-1)!.items.map((item) => item.value)).toEqual(
        [...values].sort((a, b) => a - b),
      );
      expect(frames[0].items.map((item) => item.value)).toEqual(values);
      for (const frame of frames) {
        expect(frame.items.map((item) => item.id).sort()).toEqual(
          values.map((_, i) => i).sort(),
        );
        for (const language of languages)
          expect(
            getCode("quick-sort", language, "insert").some(
              (line) => line.anchor === frame.anchor,
            ),
          ).toBe(true);
      }
    });
  }
});
describe("链表", () => {
  for (const index of [0, 1, 3])
    it(`插入 ${index}`, () => {
      const frames = linkedListTrace([10, 20, 30], "insert", index, 99);
      const expected = [10, 20, 30];
      expected.splice(index, 0, 99);
      expect(frames.at(-1)!.items.map((item) => item.value)).toEqual(expected);
      expect(frames[0].items).toHaveLength(3);
      const last = frames.at(-1)!;
      expect(last.links).toHaveLength(3);
      for (let i = 1; i < last.items.length; i++)
        expect(last.links).toContainEqual([
          last.items[i - 1].id,
          last.items[i].id,
        ]);
    });
  it("空链表插入", () =>
    expect(linkedListTrace([], "insert", 0, 7).at(-1)!.items[0].value).toBe(7));
  for (const index of [0, 1, 2])
    it(`删除 ${index}`, () => {
      const frames = linkedListTrace([10, 20, 30], "delete", index, 0);
      expect(frames.at(-1)!.items.map((item) => item.value)).toEqual(
        [10, 20, 30].filter((_, i) => i !== index),
      );
      expect(frames.at(-1)!.links).toHaveLength(1);
    });
  it("拒绝越界", () => {
    expect(() => linkedListTrace([], "delete", 0, 0)).toThrow();
    expect(() => linkedListTrace([1], "find", -1, 0)).toThrow();
  });
  it("所有语言覆盖每个语义步骤", () => {
    for (const operation of ["insert", "delete", "find"] as const)
      for (const frame of linkedListTrace([1, 2, 3], operation, 1, 9))
        for (const language of languages)
          expect(
            getCode("linked-list", language, operation).some(
              (line) => line.anchor === frame.anchor,
            ),
          ).toBe(true);
  });
});
it("校验输入", () => {
  expect(parseValues("1， -2, 3")).toEqual([1, -2, 3]);
  expect(parseValues("")).toEqual([]);
  for (const input of [
    "1.5",
    "NaN",
    "1000",
    "0x12",
    Array(14).fill(1).join(","),
  ])
    expect(() => parseValues(input)).toThrow();
});

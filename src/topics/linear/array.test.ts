import { describe, expect, it } from "vitest";
import { languages } from "../../core/code";
import { ARRAY_CAPACITY, array, arrayTrace } from "./array";

describe("顺序表", () => {
  for (const index of [0, 2, 4, 5])
    it(`插入 ${index}`, () => {
      const frames = arrayTrace([10, 20, 30, 40, 50], "insert", index, 99);
      const expected = [10, 20, 30, 40, 50];
      expected.splice(index, 0, 99);
      expect(frames.at(-1)!.items.map((item) => item.value)).toEqual(expected);
      expect(frames[0].items).toHaveLength(5);
      const inserted = frames.at(-1)!.items[index];
      expect(inserted.id).toBe(5);
      expect(frames.at(-1)!.items).toHaveLength(6);
    });
  it("插入新元素在腾位那一帧才出现", () => {
    const frames = arrayTrace([10, 20, 30], "insert", 1, 7);
    const shift = frames.findIndex((frame) => frame.anchor === "shift");
    expect(frames[shift - 1].items).toHaveLength(3);
    expect(frames[shift].items).toHaveLength(4);
    expect(frames[shift].items[1].value).toBe(7);
  });
  for (const index of [0, 2, 4])
    it(`删除 ${index}`, () => {
      const frames = arrayTrace([10, 20, 30, 40, 50], "delete", index, 0);
      expect(frames.at(-1)!.items.map((item) => item.value)).toEqual(
        [10, 20, 30, 40, 50].filter((_, i) => i !== index),
      );
    });
  it("删除后剩余元素保持原有身份", () => {
    const frames = arrayTrace([10, 20, 30], "delete", 1, 0);
    expect(frames.at(-1)!.items.map((item) => item.id)).toEqual([0, 2]);
  });
  it("查询直接定位到目标位置", () => {
    const frames = arrayTrace([10, 20, 30], "find", 2, 0);
    expect(frames.at(-1)!.narration).toContain("30");
    expect(frames[1].active).toEqual([2]);
    expect(frames[1].pointers).toEqual({ index: 2 });
  });
  it("空表插入与满表拒绝", () => {
    expect(
      arrayTrace([], "insert", 0, 7).at(-1)!.items.map((item) => item.value),
    ).toEqual([7]);
    const full = Array.from({ length: ARRAY_CAPACITY }, (_, i) => i);
    expect(() => arrayTrace(full, "insert", 0, 1)).toThrow();
  });
  it("拒绝越界位置与非整数元素值", () => {
    expect(() => arrayTrace([], "delete", 0, 0)).toThrow();
    expect(() => arrayTrace([1], "find", -1, 0)).toThrow();
    expect(() => arrayTrace([1], "insert", 2, 0)).toThrow();
    expect(() => arrayTrace([1], "insert", 0, 1.5)).toThrow();
  });
  it("所有语言覆盖每个语义步骤", () => {
    for (const operation of ["insert", "delete", "find"] as const)
      for (const frame of arrayTrace([1, 2, 3], operation, 1, 9))
        for (const language of languages)
          expect(
            array.code(language, operation).some(
              (line) => line.anchor === frame.anchor,
            ),
          ).toBe(true);
  });
  it("索引上界随操作变化", () => {
    const max = array.controls.index!.max;
    expect(max({ length: 4, operation: "insert" })).toBe(4);
    expect(max({ length: 4, operation: "delete" })).toBe(3);
    expect(max({ length: 0, operation: "find" })).toBe(0);
  });
  it("声明了固定容量，供画布绘制空槽位", () => {
    expect(array.controls.capacity).toBe(ARRAY_CAPACITY);
    expect(array.controls.limit).toBe(ARRAY_CAPACITY);
  });
});

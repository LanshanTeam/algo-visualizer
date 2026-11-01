import { describe, expect, it } from "vitest";
import { languages } from "../../core/code";
import { linkedList, linkedListTrace } from "./linked-list";

describe("单链表", () => {
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
            linkedList.code(language, operation).some(
              (line) => line.anchor === frame.anchor,
            ),
          ).toBe(true);
  });
  it("索引上界随操作变化", () => {
    const max = linkedList.controls.index!.max;
    expect(max({ length: 4, operation: "insert" })).toBe(4);
    expect(max({ length: 4, operation: "delete" })).toBe(3);
    expect(max({ length: 0, operation: "find" })).toBe(0);
  });
});

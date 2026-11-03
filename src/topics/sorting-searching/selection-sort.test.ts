import { describe, expect, it } from "vitest";
import { languages } from "../../core/code";
import { selectionSort, selectionSortTrace } from "./selection-sort";

describe("选择排序", () => {
  it("六语言锚点完整一致，已就位时不交换", () => {
    expect(selectionSort.status).toBe("ready");
    expect(selectionSort.trace({ values: [2, 1], value: 0, operation: "", index: 0 })).toEqual(selectionSortTrace([2, 1]));
    expect(selectionSortTrace([1, 2, 3]).filter((frame) => frame.anchor === "swap")).toHaveLength(0);
    const anchors = ["start", "pass", "compare", "minimum", "swap", "settle", "done"].sort();
    for (const language of languages) {
      const lines = selectionSort.code(language, "");
      expect(lines.filter((line) => line.anchor).map((line) => line.anchor).sort()).toEqual(anchors);
      expect(lines.every((line) => !line.text.includes("@"))).toBe(true);
    }
  });
  it("每轮选择剩余最小值并最多交换一次，升序排序且快照独立", () => {
    for (const values of [[], [1], [1, 2, 3], [4, 3, 2, 1], [2, 2, 2], [-3, 7, 0, -3]]) {
      const original = [...values];
      const expected = [...values].sort((a, b) => a - b);
      const frames = selectionSortTrace(values);
      expect(frames.at(-1)!.items.map((item) => item.value)).toEqual(expected);
      expect(values).toEqual(original);
      expect(frames[0].items.map((item) => item.value)).toEqual(original);
      expect(frames.at(-1)!.settled.slice().sort()).toEqual(values.map((_, i) => i).sort());
      let swaps = 0;
      for (const frame of frames) {
        if (frame.anchor === "pass") swaps = 0;
        if (frame.anchor === "swap") expect(++swaps).toBeLessThanOrEqual(1);
        if (frame.anchor === "settle") {
          const i = frame.variables.i as number;
          expect(frame.items[i].value).toBe(expected[i]);
        }
        expect(frame.items.map((item) => item.id).sort()).toEqual(values.map((_, i) => i).sort());
        expect(frame.narration).toMatch(/[\u4e00-\u9fff]/);
        for (const index of [...Object.values(frame.pointers), ...frame.active, ...frame.settled]) {
          expect(index).toBeGreaterThanOrEqual(0);
          expect(index).toBeLessThan(values.length);
        }
        for (const language of languages)
          expect(selectionSort.code(language, "").some((line) => line.anchor === frame.anchor)).toBe(true);
      }
    }
    const frames = selectionSortTrace([3, 1, 2]);
    expect(frames.filter((frame) => frame.anchor === "swap")).toHaveLength(2);
  });
});

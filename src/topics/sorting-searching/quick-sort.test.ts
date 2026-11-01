import { describe, expect, it } from "vitest";
import { languages } from "../../core/code";
import { quickSort, quickSortTrace } from "./quick-sort";

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
            quickSort.code(language, "insert").some(
              (line) => line.anchor === frame.anchor,
            ),
          ).toBe(true);
      }
    });
  }
  it("每行代码的锚点标记不会残留在展示文本里", () => {
    for (const language of languages)
      for (const line of quickSort.code(language, ""))
        expect(line.text).not.toContain("@");
  });
});

import { describe, expect, it } from "vitest";
import { languages } from "../../core/code";
import { bubbleSort, bubbleSortTrace } from "./bubble-sort";

describe("冒泡排序", () => {
  it("无交换的一轮后提前退出，重复值保持稳定", () => {
    const frames = bubbleSortTrace([1, 2, 2, 3]);
    expect(frames.filter((frame) => frame.anchor === "compare")).toHaveLength(3);
    expect(frames.some((frame) => frame.anchor === "early")).toBe(true);
    expect(frames.some((frame) => frame.anchor === "swap")).toBe(false);
    expect(bubbleSortTrace([2, 1, 2, 1]).at(-1)!.items.map((item) => item.id)).toEqual([1, 3, 0, 2]);
  });
  it("六语言锚点完整一致且专题接口可运行", () => {
    expect(bubbleSort.status).toBe("ready");
    expect(bubbleSort.trace({ values: [2, 1], value: 0, operation: "", index: 0 })).toEqual(bubbleSortTrace([2, 1]));
    const anchors = ["start", "pass", "compare", "swap", "settle", "early", "done"].sort();
    for (const language of languages) {
      const lines = bubbleSort.code(language, "");
      expect(lines.filter((line) => line.anchor).map((line) => line.anchor).sort()).toEqual(anchors);
      expect(lines.every((line) => !line.text.includes("@"))).toBe(true);
    }
  });
  it("升序排序，保留身份且不修改输入或历史快照", () => {
    for (const values of [[], [1], [1, 2, 3], [4, 3, 2, 1], [2, 2, 2], [-3, 7, 0, -3]]) {
      const original = [...values];
      const frames = bubbleSortTrace(values);
      expect(frames.at(-1)!.items.map((item) => item.value)).toEqual([...values].sort((a, b) => a - b));
      expect(values).toEqual(original);
      expect(frames[0].items.map((item) => item.value)).toEqual(original);
      expect(frames.at(-1)!.settled.slice().sort()).toEqual(values.map((_, i) => i).sort());
      for (const frame of frames) {
        expect(frame.items.map((item) => item.id).sort()).toEqual(values.map((_, i) => i).sort());
        expect(frame.narration).toMatch(/[\u4e00-\u9fff]/);
        for (const index of [...Object.values(frame.pointers), ...frame.active, ...frame.settled]) {
          expect(index).toBeGreaterThanOrEqual(0);
          expect(index).toBeLessThan(values.length);
        }
        for (const language of languages)
          expect(bubbleSort.code(language, "").some((line) => line.anchor === frame.anchor)).toBe(true);
      }
    }
  });
});

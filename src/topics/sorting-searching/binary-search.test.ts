import { describe, expect, it } from "vitest";
import { languages } from "../../core/code";
import { binarySearch, binarySearchTrace } from "./binary-search";

describe("二分搜索", () => {
  it("拒绝非整数及超出 -999..999 的目标，包括空数组调用", () => {
    for (const target of [NaN, Infinity, -Infinity, 0.5, -1.5, -1000, 1000]) {
      for (const values of [[], [1, 2, 3]]) {
        expect(() => binarySearchTrace(values, target)).toThrow(/目标.*整数.*-999.*999/);
        expect(() => binarySearch.trace({ values, value: target, operation: "", index: 0 }))
          .toThrow(/目标.*整数.*-999.*999/);
      }
    }
    for (const target of [-999, 0, 999]) {
      expect(binarySearchTrace([-999, 0, 999], target).at(-1)!.anchor).toBe("found");
      expect(binarySearchTrace([], target).at(-1)!.anchor).toBe("missing");
    }
  });
  it("拒绝逆序及局部乱序输入", () => {
    for (const values of [[3, 2, 1], [1, 3, 2]])
      expect(() => binarySearchTrace(values, 2)).toThrow(/升序/);
  });
  it("完整专题复用目标控件，随机数组有序且六语言锚点一致", () => {
    expect(binarySearch.status).toBe("ready");
    expect(binarySearch.controls.sorted).toBe(true);
    expect(binarySearch.controls.defaultValues).toContain(31);
    expect(binarySearch.controls.value).toEqual({ label: "目标值" });
    expect(binarySearch.trace({ values: [1, 31], value: 31, operation: "", index: 0 }).at(-1)!.variables.result).toBe(1);
    const anchors = ["start", "mid", "compare", "found", "left", "right", "missing"].sort();
    for (const language of languages) {
      const lines = binarySearch.code(language, "");
      expect(lines.filter((line) => line.anchor).map((line) => line.anchor).sort()).toEqual(anchors);
      expect(lines.every((line) => !line.text.includes("@"))).toBe(true);
    }
  });
  it("在升序数组内查找，支持空数组、重复值、负数和未找到", () => {
    for (const values of [[], [1], [-4, -1, 0, 3], [2, 2, 2], [1, 2, 3, 4]]) {
      for (const target of [-5, -1, 0, 1, 2, 4, 9]) {
        const before = [...values];
        const frames = binarySearchTrace(values, target);
        const result = frames.at(-1)!.variables.result as number;
        if (values.includes(target)) expect(values[result]).toBe(target);
        else expect(result).toBe(-1);
        expect(values).toEqual(before);
        for (const frame of frames) {
          expect(frame.items.map((item) => item.value)).toEqual(values);
          expect(frame.items.map((item) => item.id)).toEqual(values.map((_, i) => i));
          expect(frame.variables).toHaveProperty("low");
          expect(frame.variables).toHaveProperty("high");
          expect(frame.narration).toMatch(/[\u4e00-\u9fff]/);
          for (const index of [...Object.values(frame.pointers), ...frame.active, ...frame.settled]) {
            expect(index).toBeGreaterThanOrEqual(0);
            expect(index).toBeLessThan(values.length);
          }
          for (const language of languages)
            expect(binarySearch.code(language, "").some((line) => line.anchor === frame.anchor)).toBe(true);
        }
      }
    }
  });
});

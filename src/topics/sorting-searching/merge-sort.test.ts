import { describe, expect, it } from "vitest";
import { languages } from "../../core/code";
import { mergeSort, mergeSortTrace } from "./merge-sort";

describe("归并排序", () => {
  it("奇数区间左半较长，Rust 与轨迹使用相同闭区间递归边界", () => {
    const splits = mergeSortTrace([5, 4, 3, 2, 1])
      .filter(frame => frame.anchor === "split")
      .map(frame => frame.variables);
    expect(splits).toEqual([
      { low: 0, mid: 2, high: 4 },
      { low: 0, mid: 1, high: 2 },
      { low: 0, mid: 0, high: 1 },
      { low: 3, mid: 3, high: 4 },
    ]);
    const rust = mergeSort.code("Rust", "");
    const step = (anchor: string) => rust.find(line => line.anchor === anchor)!.text;
    expect(step("split")).toContain("low + (high - low) / 2");
    expect(step("left")).toContain("sort(a, aux, low, mid)");
    expect(step("right")).toContain("sort(a, aux, mid + 1, high)");
    expect(step("merge")).toContain("(low, mid + 1)");
    expect(step("compare")).toContain("i <= mid && (j > high || a[i] <= a[j])");
    expect(step("copy")).toContain("a[low..=high].copy_from_slice(&aux[low..=high])");
    expect(rust.map(line => line.text).join("\n")).toContain("if n > 0 { sort(a, &mut aux, 0, n - 1); }");
  });
  it("完整专题与六语言模板覆盖递归和合并的每个步骤", () => {
    expect(mergeSort.status).toBe("ready");
    expect(mergeSort.theory!.length).toBeGreaterThanOrEqual(3);
    expect(languages).toHaveLength(6);
    for (const language of languages) {
      const lines = mergeSort.code(language, "");
      for (const frame of mergeSortTrace([3, 1, 2]))
        expect(lines.some(line => line.anchor === frame.anchor)).toBe(true);
      expect(lines.every(line => !line.text.includes("@"))).toBe(true);
    }
  });
  it("自顶向下递归，逐项写辅助区再整体写回，保持稳定性与逐帧身份", () => {
    for (const values of [[], [1], [1, 2, 3], [4, 3, 2, 1], [2, 2, 2], [-3, 7, 0, -3]]) {
      const input = [...values];
      const frames = mergeSortTrace(input);
      expect(input).toEqual(values);
      expect(frames[0].items.map(item => item.value)).toEqual(values);
      expect(frames.at(-1)!.items).toEqual(values.map((value, id) => ({ id, value })).sort((a, b) => a.value - b.value));
      expect(frames.at(-1)!.stack).toEqual([]);
      for (const [index, frame] of frames.entries()) {
        expect(frame.items.map(item => item.id).sort()).toEqual(values.map((_, id) => id).sort());
        for (const position of [...frame.active, ...Object.values(frame.pointers)]) {
          expect(position).toBeGreaterThanOrEqual(0);
          expect(position).toBeLessThan(values.length);
        }
        expect(frame.auxiliary!.slots).toHaveLength(values.length);
        const occupied = frame.auxiliary!.slots.filter(item => item !== null);
        expect(new Set(occupied.map(item => item.id)).size).toBe(occupied.length);
        if (frame.anchor === "write") {
          const previous = frames[index - 1];
          expect(frame.items).toEqual(previous.items);
          expect(occupied.length).toBe(previous.auxiliary!.slots.filter(item => item !== null).length + 1);
          expect(frame.range).toBeDefined();
          expect(frame.stack.length).toBeGreaterThan(0);
        }
        if (frame.anchor === "copy") {
          const previous = frames[index - 1];
          const { low, high } = frame.range!;
          expect(frame.items.slice(low, high + 1)).toEqual(previous.auxiliary!.slots.slice(low, high + 1));
          expect(occupied).toEqual([]);
          expect(frame.items.slice(0, low)).toEqual(previous.items.slice(0, low));
          expect(frame.items.slice(high + 1)).toEqual(previous.items.slice(high + 1));
        }
      }
    }
    const frames = mergeSortTrace([4, 3, 2, 1]);
    expect(frames.filter(frame => frame.anchor === "write")).toHaveLength(8);
    expect(frames.filter(frame => frame.anchor === "copy")).toHaveLength(3);
    expect(Math.max(...frames.map(frame => frame.stack.length))).toBe(3);
    const snapshot = JSON.stringify(frames[0]);
    frames.at(-1)!.items[0].value = 999;
    expect(JSON.stringify(frames[0])).toBe(snapshot);
  });
});

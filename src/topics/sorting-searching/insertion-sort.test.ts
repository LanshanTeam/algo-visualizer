import { describe, expect, it } from "vitest";
import { languages } from "../../core/code";
import { insertionSort, insertionSortTrace } from "./insertion-sort";

describe("插入排序", () => {
  it("Rust 使用有符号扫描指针，shift 递减 j 后再在 j + 1 插入", () => {
    const rust = insertionSort.code("Rust", "");
    const step = (anchor: string) => rust.find(line => line.anchor === anchor)!.text;
    expect(step("hold")).toContain("let mut j = i as isize - 1");
    expect(step("compare")).toContain("j >= 0 && a[j as usize] > key");
    expect(step("shift")).toContain("a[(j + 1) as usize] = a[j as usize]; j -= 1");
    expect(step("insert")).toContain("a[(j + 1) as usize] = key");
  });
  it("shift 后扫描指针已左移，insert 保留真实 j 并单独记录 hole", () => {
    for (const values of [[2, 1], [3, 2, 1], [1, 3, 2], [1, 2]]) {
      const frames = insertionSortTrace(values);
      for (const [index, frame] of frames.entries()) {
        if (frame.anchor === "shift") {
          const previous = frames[index - 1];
          expect(frame.variables.j).toBe((previous.variables.j as number) - 1);
          expect(frame.variables.hole).toBe((frame.variables.j as number) + 1);
          expect(frame.arraySlots![frame.variables.hole as number]).toBeNull();
          expect(frame.held).toEqual(previous.held);
        }
        if (frame.anchor === "insert") {
          const previous = frames[index - 1];
          expect(frame.variables.j).toBe(previous.variables.j);
          expect(frame.variables.hole).toBe((frame.variables.j as number) + 1);
          expect(frame.arraySlots![frame.variables.hole as number]).toEqual(previous.held);
          expect(frame.held).toBeUndefined();
        }
        if (frame.variables.j === -1) {
          expect(frame.pointers).not.toHaveProperty("j");
          expect(frame.active).not.toContain(-1);
        }
      }
    }
    const frames = insertionSortTrace([2, 1]);
    for (const anchor of ["shift", "insert"]) {
      expect(frames.find(frame => frame.anchor === anchor)!.variables).toMatchObject({ i: 1, j: -1, hole: 0 });
    }
  });
  it("完整专题与六语言模板覆盖每个实际步骤", () => {
    expect(insertionSort.status).toBe("ready");
    expect(insertionSort.theory!.length).toBeGreaterThanOrEqual(3);
    expect(languages).toHaveLength(6);
    for (const language of languages) {
      const lines = insertionSort.code(language, "");
      for (const frame of insertionSortTrace([3, 1, 2]))
        expect(lines.some(line => line.anchor === frame.anchor)).toBe(true);
      expect(lines.every(line => !line.text.includes("@"))).toBe(true);
    }
  });
  it("暂存当前项，逐个右移而非交换，再稳定插入；快照保持身份与空洞不变量", () => {
    for (const values of [[], [1], [1, 2, 3], [4, 3, 2, 1], [2, 2, 2], [-3, 7, 0, -3]]) {
      const input = [...values];
      const frames = insertionSortTrace(input);
      const expected = values.map((value, id) => ({ value, id })).sort((a, b) => a.value - b.value);
      expect(frames.at(-1)!.items).toEqual(expected);
      expect(input).toEqual(values);
      expect(frames[0].items.map(item => item.value)).toEqual(values);
      expect(frames.at(-1)!.held).toBeUndefined();
      for (const [index, frame] of frames.entries()) {
        expect(frame.items.map(item => item.id).sort()).toEqual(values.map((_, id) => id).sort());
        expect(frame.arraySlots).toHaveLength(values.length);
        const visible = [...frame.arraySlots!.filter(item => item !== null), ...(frame.held ? [frame.held] : [])];
        expect(visible.map(item => item.id).sort()).toEqual(values.map((_, id) => id).sort());
        expect(frame.arraySlots!.filter(item => item === null)).toHaveLength(frame.held ? 1 : 0);
        for (const position of [...frame.active, ...Object.values(frame.pointers)]) {
          expect(position).toBeGreaterThanOrEqual(0);
          expect(position).toBeLessThan(values.length);
        }
        if (frame.anchor === "shift") {
          const previous = frames[index - 1];
          const hole = previous.arraySlots!.indexOf(null);
          expect(frame.arraySlots![hole]).toEqual(previous.arraySlots![hole - 1]);
          expect(frame.arraySlots![hole - 1]).toBeNull();
          expect(frame.held).toEqual(previous.held);
        }
      }
    }
    const frames = insertionSortTrace([3, 2, 1]);
    expect(frames.filter(frame => frame.anchor === "shift")).toHaveLength(3);
    expect(frames.some(frame => frame.anchor === "hold" && frame.held?.value === 1)).toBe(true);
    const snapshot = JSON.stringify(frames[0]);
    frames.at(-1)!.items[0].value = 999;
    expect(JSON.stringify(frames[0])).toBe(snapshot);
  });
});

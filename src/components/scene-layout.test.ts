import { describe, expect, it } from "vitest";
import type { Frame } from "../core/types";
import { mergeSortTrace } from "../topics/sorting-searching/merge-sort";
import { createAnimationScene } from "./animation-scene";

const a = { id: 0, value: 8 }, b = { id: 1, value: 3 };
const base: Frame = {
  items: [a, b], active: [], settled: [], pointers: {},
  anchor: "compare", narration: "", variables: {}, stack: [],
  auxiliary: { label: "辅助数组", slots: [a, null] },
};
const scene = (frame: Frame, previous?: Frame) =>
  createAnimationScene({ frame, previous, kind: "array", capacity: frame.items.length });

describe("auxiliary data does not determine primary motion", () => {
  it("animates a non-writeback swap carrying auxiliary data in both directions", () => {
    const swapped: Frame = { ...base, anchor: "swap", items: [b, a] };
    for (const [previous, frame] of [[base, swapped], [swapped, base]]) {
      const result = scene(frame, previous);
      expect(result.hasMotion).toBe(true);
      for (const node of result.nodes) {
        expect(node.x[0]).toBe(scene(previous).nodes.find(n => n.id === node.id)!.x[0]);
        expect(new Set(node.x).size).toBe(2);
        expect(new Set(node.y).size).toBe(2);
      }
    }
  });

  it("keeps real merge copy transitions atomic forward and backward", () => {
    const frames = mergeSortTrace([8, 3, 5, 1]);
    const copies = frames.flatMap((frame, i) => frame.anchor === "copy" ? [[frames[i - 1], frame]] : []);
    expect(copies.length).toBeGreaterThan(0);
    expect(copies.some(([before, after]) => before.items.some((item, i) => item.id !== after.items[i].id))).toBe(true);
    for (const [before, after] of copies) {
      expect(before.anchor).toBe("write");
      for (const [previous, frame] of [[before, after], [after, before]]) {
        const result = scene(frame, previous);
        for (const node of result.nodes) {
          const destination = scene(frame).nodes.find(n => n.id === node.id)!;
          expect(node.x).toEqual(result.times.map(() => destination.x[0]));
          expect(node.y).toEqual(result.times.map(() => destination.y[0]));
        }
      }
    }
  });
});

import { describe, expect, it } from "vitest";
import { sortingSearchingTopics } from "../topics/sorting-searching";
import { createAnimationScene } from "./animation-scene";

describe("sorting/searching first-frame boundaries", () => {
  it("keeps every main slot at the original quick-sort baseline, including every insertion/merge frame", () => {
    for (const topic of sortingSearchingTopics) {
      if (topic.status !== "ready") continue;
      const frames = topic.trace({ values: [1, 3, 5], value: 3, index: 0, operation: "" });
      for (const frame of frames) {
        const scene = createAnimationScene({ frame, kind: "array", capacity: 3 });
        expect(scene.slots.map(slot => slot.y)).toEqual([72, 72, 72]);
        if (scene.auxiliary) expect(scene.auxiliary.slots[0].y).toBeGreaterThan(72 + 52 + 46);
      }
    }
  });
  for (const topic of sortingSearchingTopics) {
    if (topic.status !== "ready") continue;
    it(`${topic.id} shows full visual bounds without inventing algorithm variables`, () => {
      for (const values of [[], [7], [1, 3, 5]]) {
        const frame = topic.trace({ values, value: 3, index: 0, operation: "" })[0];
        const scene = createAnimationScene({ frame, kind: "array", capacity: values.length });
        expect(frame.active).toEqual([]);
        if (!values.length) {
          expect(scene.range).toBeUndefined();
          expect(scene.pointers).toEqual([]);
          continue;
        }
        const names = scene.pointers.flatMap(pointer => pointer.name.split(","));
        expect(names).toContain("low");
        expect(names).toContain("high");
        expect(scene.range).toEqual({ x: 18, y: scene.slots[0].y - 8, width: (values.length - 1) * 68 + 78, height: 68 });
        expect(frame.pointers.low).toBe(0);
        expect(frame.pointers.high).toBe(values.length - 1);
      }
    });
  }
});

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { largerComparedId } from "./comparison";
import { AnimationCanvas } from "./animation-canvas";
import { SceneComparisonCrown } from "./canvas-primitives";
import { createAnimationScene } from "./animation-scene";
import { motionValue } from "motion/react";
import { bubbleSortTrace } from "../topics/sorting-searching/bubble-sort";
import { selectionSortTrace } from "../topics/sorting-searching/selection-sort";
import { insertionSortTrace } from "../topics/sorting-searching/insertion-sort";
import { mergeSortTrace } from "../topics/sorting-searching/merge-sort";
import { quickSortTrace } from "../topics/sorting-searching/quick-sort";

const algorithms = { bubbleSortTrace, selectionSortTrace, insertionSortTrace, mergeSortTrace, quickSortTrace };
describe("sorting comparison crowns", () => {
  for (const [name, trace] of Object.entries(algorithms)) {
    it(`${name}: marks only the larger comparison operand`, () => {
      for (const input of [[], [1], [5, 5], [-9, -2, 0, -9], [8, 3, 6, 1]]) {
        for (const frame of trace(input)) {
          const expectedPair = frame.anchor !== "compare" ? undefined
            : name === "insertionSortTrace" ? [frame.arraySlots![frame.pointers.j]!, frame.held!]
            : name === "mergeSortTrace" ? (frame.pointers.i !== undefined && frame.pointers.j !== undefined ? [frame.items[frame.pointers.i], frame.items[frame.pointers.j]] : undefined)
            : frame.active.map(index => frame.items[index]);
          expect(frame.comparison).toEqual(expectedPair?.map(item => item.id));
          const winner = expectedPair && expectedPair[0].value !== expectedPair[1].value
            ? (expectedPair[0].value > expectedPair[1].value ? expectedPair[0] : expectedPair[1]).id : undefined;
          expect(largerComparedId(frame)).toBe(winner);
          const html = renderToStaticMarkup(<AnimationCanvas frame={frame} kind="array" capacity={input.length} duration={0} />);
          expect((html.match(/data-comparison-crown=/g) ?? []).length).toBe(winner === undefined ? 0 : 1);
          if (winner !== undefined) expect(html).toContain(`data-comparison-crown="${winner}"`);
        }
      }
    });
  }
  it("paints crowns after all cards and annotations", () => {
    const frame = insertionSortTrace([38, 16]).find(f => f.anchor === "compare")!;
    const html = renderToStaticMarkup(<AnimationCanvas frame={frame} kind="array" capacity={2} duration={0} />);
    expect(html.indexOf("data-comparison-crown")).toBeGreaterThan(html.lastIndexOf("data-node-id"));
    expect(html).toMatch(/data-comparison-crown[\s\S]*?<\/g><\/svg>/);
  });
  it("keeps the crown within the canvas on an upper exchange track", () => {
    const frames = bubbleSortTrace([8, 3]);
    const frame = frames.find(f => f.anchor === "compare")!;
    const previous = frames.find(f => f.anchor === "swap")!;
    const scene = createAnimationScene({ frame, previous, kind: "array", capacity: 2 });
    const node = scene.nodes.find(n => n.id === largerComparedId(frame))!;
    // The returning larger item travels on the lower lane; explicitly test
    // the same crown primitive on the existing upper-lane geometry as well.
    const upper = { ...node, y: [72, 8, 8, 72] };
    const html = renderToStaticMarkup(<svg><SceneComparisonCrown node={upper} times={scene.times} progress={motionValue(0.5)} /></svg>);
    expect(html).toContain("translateY(2px)");
  });
  it("includes the held key and pivot when they are larger", () => {
    const held = insertionSortTrace([1, 9]).find(f => f.anchor === "compare")!;
    expect(largerComparedId(held)).toBe(held.held!.id);
    const pivot = quickSortTrace([1, 9]).find(f => f.anchor === "compare")!;
    expect(largerComparedId(pivot)).toBe(pivot.items[pivot.pointers.pivot].id);
  });
});

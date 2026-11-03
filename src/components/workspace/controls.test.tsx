import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { binarySearch } from "../../topics/sorting-searching/binary-search";
import type { ReadyTopic } from "../../topics/types";
import { TooltipProvider } from "../ui/tooltip";
import { AnimationCard } from "./animation-card";
import { useTopicTrace } from "./use-topic-trace";

const declaredControls: ReadyTopic = {
  ...binarySearch,
  controls: {
    ...binarySearch.controls,
    operations: [{ id: "find", label: "查找" }],
    index: { label: "起始位置", max: ({ length }) => length - 1 },
  },
};

function FirstFrame({ topic }: { topic: ReadyTopic }) {
  return <TooltipProvider><AnimationCard topic={topic} trace={useTopicTrace(topic)} /></TooltipProvider>;
}

describe("declaration-driven workspace controls", () => {
  it("does not apply array-only layout to a future non-array scene", () => {
    // Runtime boundary probe only: graph is not yet an implemented ReadyTopic scene.
    const futureTopic: ReadyTopic = {
      ...declaredControls,
      // @ts-expect-error Graph support is deliberately not merged into this branch.
      scene: "graph",
    };
    const html = renderToStaticMarkup(<FirstFrame topic={futureTopic} />);
    expect(html.includes("data-array-controls")).toBe(false);
    expect(html.includes("data-array-stage")).toBe(false);
    expect(html.includes("data-array-composition")).toBe(false);
    expect(html).toContain('id="operation"');
    expect(html).toContain('id="index"');
    expect(html.match(/id="node-value"/g)).toHaveLength(1);
  });

  it("renders declared operations and index for an array topic", () => {
    const html = renderToStaticMarkup(<FirstFrame topic={declaredControls} />);
    expect(html).toContain('id="operation"');
    expect(html).toContain('id="index"');
    expect(html).toContain("起始位置");
    expect(html.match(/id="node-value"/g)).toHaveLength(1);
  });
});

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { treeHashTopics } from "../../topics/tree-hash";
import { graphTraversal } from "../../topics/graph/graph-traversal";
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

function WorkspaceFrame({ topic, frameIndex = 0 }: { topic: ReadyTopic; frameIndex?: number }) {
  const trace = useTopicTrace(topic);
  return <TooltipProvider><AnimationCard topic={topic} trace={{ ...trace, frame: trace.frames[frameIndex], step: frameIndex }} /></TooltipProvider>;
}

describe("declaration-driven workspace controls", () => {
  it("树与散列专题首帧使用对应场景，保留随机按钮声明", () => {
    for (const topic of treeHashTopics) {
      if (topic.status !== "ready") continue;
      const html = renderToStaticMarkup(<WorkspaceFrame topic={topic} />);
      expect(html).toContain("data-animation-stage");
      expect(html).not.toContain("data-graph-tree-stage");
      expect(html).not.toContain("data-array-stage");
      expect(html).toContain('id="operation"');
      expect(html.includes('aria-label="随机数据"')).toBe(topic.controls.randomizable !== false);
    }
  });
  it("为真实图专题保留操作选择器和独立画布", () => {
    const html = renderToStaticMarkup(<WorkspaceFrame topic={graphTraversal} />);
    expect(html).not.toContain("data-array-controls");
    expect(html).not.toContain("data-array-stage");
    expect(html).not.toContain("data-array-composition");
    expect(html).toContain('id="operation"');
    expect(html).toContain("data-graph-tree-stage");
    expect(html).not.toContain("data-animation-stage");
    const frames = graphTraversal.trace({ values: [0], operation: "bfs", index: 2, value: 31 });
    const frameIndex = frames.findIndex((frame) => (frame.queue?.length ?? 0) > 0);
    expect(frameIndex).toBeGreaterThanOrEqual(0);
    const queuedHtml = renderToStaticMarkup(<WorkspaceFrame topic={graphTraversal} frameIndex={frameIndex} />);
    expect(queuedHtml).toContain('aria-label="BFS 队列"');
  });

  it("renders declared operations and index for an array topic", () => {
    const html = renderToStaticMarkup(<WorkspaceFrame topic={declaredControls} />);
    expect(html).toContain('id="operation"');
    expect(html).toContain('id="index"');
    expect(html).toContain("起始位置");
    expect(html.match(/id="node-value"/g)).toHaveLength(1);
  });
});

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { sortingSearchingTopics } from "../../topics/sorting-searching";
import type { ReadyTopic } from "../../topics/types";
import { AnimationCard } from "./animation-card";
import { useTopicTrace } from "./use-topic-trace";
import { TooltipProvider } from "../ui/tooltip";

function FirstFrame({ topic }: { topic: ReadyTopic }) {
  return <TooltipProvider><AnimationCard topic={topic} trace={useTopicTrace(topic)} /></TooltipProvider>;
}

describe("array screen alignment contract", () => {
  it("centers the complete compact array/legend composition rather than pinning SVGs to a corner", () => {
    for (const topic of sortingSearchingTopics) {
      if (topic.status !== "ready") continue;
      const html = renderToStaticMarkup(<FirstFrame topic={topic} />);
      expect(html).toContain('data-array-controls="true"');
      expect(html).toContain('grid-cols-[minmax(0,1fr)_6rem]');
      expect(html).toMatch(/data-array-controls="true"[^>]*>[\s\S]*id="values"[\s\S]*<\/div><\/div><div data-orientation="horizontal"/);
      const region = html.match(/<div data-array-stage[^>]*>/)?.[0];
      expect(region).toContain("flex-1");
      expect(region).toContain("items-center");
      expect(region).toContain("justify-center");
      expect(html).toMatch(/data-array-composition[^>]*gap-2[^>]*>[\s\S]*<svg data-animation-stage[\s\S]*<\/svg>[\s\S]*aria-label="图例"/);
      const stage = html.match(/<svg data-animation-stage[^>]*>/)?.[0];
      expect(stage).toContain('preserveAspectRatio="xMidYMid meet"');
      expect(stage).toContain('mx-auto');
      expect(stage).toContain('max-width:626.4px');
      expect(stage).toContain('width="522"');
      expect(stage).toContain(topic.id === "merge-sort" ? 'height="284"' : 'height="208"');
      if (topic.id === "binary-search") expect(html).toContain('id="node-value"');
    }
  });
});

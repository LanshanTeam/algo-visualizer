import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AnimationCanvas } from "./animation-canvas";
import { sortingSearchingTopics } from "../topics/sorting-searching";
import { createAnimationScene } from "./animation-scene";

describe("responsive array display bounds", () => {
  it("fits ordinary arrays without a mobile width floor and keeps long inputs scrollable without changing logical geometry", () => {
    for (const topic of sortingSearchingTopics) {
      if (topic.status !== "ready") continue;
      for (const count of [6, 12]) {
        const frame = topic.trace({ values: Array.from({ length: count }, (_, i) => i + 1), operation: "", index: 0, value: 3 })[0];
        const scene = createAnimationScene({ frame, kind: "array", capacity: count });
        const html = renderToStaticMarkup(<AnimationCanvas frame={frame} linked={false} capacity={count} duration={1} />);
        const svg = html.match(/<svg data-animation-stage[^>]*>/)![0];
        expect(html).toContain('[&amp;_[data-radix-scroll-area-viewport]&gt;div]:!block');
        expect(svg).toContain('width:100%');
        expect(svg).toContain(`max-width:${scene.width * 1.2}px`);
        expect(svg).toContain('min-w-0');
        expect(svg).not.toContain('min-w-[516px]');
        expect(svg).toContain(`viewBox="0 0 ${scene.width} ${scene.height}"`);
        if (count > 8) expect(svg).toContain(`min-width:${scene.width * 1.2}px`);
        else expect(svg).not.toContain('min-width:');
      }
    }
  });
});

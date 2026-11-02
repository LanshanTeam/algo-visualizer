import { describe, expect, it } from "vitest";
import { graphTraversal } from "./graph-traversal";
import { dijkstraTrace } from "./dijkstra";
import { templates } from "./graph-traversal-templates";
import { languages } from "../../core/code";

describe("graph topics", () => {
  it("records BFS and DFS discovery order without mutating prior frames", () => {
    const bfs = graphTraversal.trace({ values: [0], operation: "bfs", index: 0, value: 0 });
    const dfs = graphTraversal.trace({ values: [0], operation: "dfs", index: 0, value: 0 });
    expect(bfs.at(-1)?.narration).toContain("A → B → C");
    expect(dfs.at(-1)?.narration).toContain("A → B → D");
    expect(bfs[0].items).not.toBe(bfs[1].items);
    expect(bfs[0].links).not.toBe(bfs[1].links);
    const queued = bfs.find((frame) => frame.anchor === "discover" && frame.queue?.length === 2);
    expect(queued?.queue).toEqual([1, 2]);
    expect(queued?.queue).not.toBe(bfs.find((frame) => frame.anchor === "enqueue")?.queue);
  });

  it("settles Dijkstra distances from every valid start", () => {
    const frames = dijkstraTrace(0);
    const done = frames.at(-1)!;
    expect(done.narration).toContain("A=0");
    expect(done.narration).toContain("C=2");
    expect(done.narration).toContain("E=3");
    expect(done.narration).toContain("F=5");
    expect(done.settled).toHaveLength(6);
    expect(() => dijkstraTrace(6)).toThrow();
  });

  it("defines every traversal trace anchor in every language", () => {
    const anchors = ["start", "enqueue", "dequeue", "visit", "scan", "discover", "recurse", "backtrack", "done"];
    for (const language of languages) {
      for (const source of [templates[language].bfs, templates[language].dfs]) {
        for (const anchor of anchors.filter((name) => source.includes(`@${name}`))) expect(source).toContain(`@${anchor}`);
      }
    }
  });
});

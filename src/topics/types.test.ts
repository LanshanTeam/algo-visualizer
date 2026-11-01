import { describe, expect, it } from "vitest";
import { plannedTopic } from "./types";

describe("plannedTopic", () => {
  it("默认使用数组场景并标记为 planned", () => {
    const topic = plannedTopic({
      id: "demo",
      group: "linear",
      title: "演示",
      summary: "",
      icon: () => null,
    });
    expect(topic.status).toBe("planned");
    expect(topic.scene).toBe("array");
  });
  it("显式场景优先于默认值", () => {
    expect(
      plannedTopic({
        id: "demo",
        group: "tree-hash",
        title: "演示",
        summary: "",
        icon: () => null,
        scene: "tree",
      }).scene,
    ).toBe("tree");
  });
});

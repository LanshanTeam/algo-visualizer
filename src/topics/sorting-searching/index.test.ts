import { describe, expect, it } from "vitest";
import { sortingSearchingTopics } from "./index";

describe("排序与搜索专题接入", () => {
  it("全部六个专题均已实现，具有六语言代码及可运行初始轨迹", () => {
    expect(sortingSearchingTopics.map((topic) => topic.id)).toEqual([
      "binary-search", "bubble-sort", "selection-sort", "insertion-sort", "merge-sort", "quick-sort",
    ]);
    for (const topic of sortingSearchingTopics) {
      expect(topic.status).toBe("ready");
      if (topic.status !== "ready") throw new Error(topic.id);
      const frames = topic.trace({ values: topic.controls.defaultValues, operation: "", index: 2, value: 31 });
      expect(frames.length).toBeGreaterThan(0);
      for (const language of ["C", "C++", "Python", "Go", "Java", "Rust"] as const) {
        const code = topic.code(language, "");
        expect(code.length).toBeGreaterThan(0);
        for (const frame of frames) expect(code.some((line) => line.anchor === frame.anchor)).toBe(true);
      }
    }
  });
});

import { describe, expect, it } from "vitest";
import { array } from "./array";
import { linkedList } from "./linked-list";
import { queue } from "./queue";
import { stack } from "./stack";

const topics = [array, linkedList, stack, queue];

describe("线性结构原理文案", () => {
  for (const topic of topics) {
    it(`${topic.title}包含核心思路、复杂度与易错点`, () => {
      const blocks = topic.theory ?? [];
      const titles = blocks.map((block) => block.title);
      expect(titles).toEqual(
        expect.arrayContaining(["核心思路", "复杂度", "易错点"]),
      );
      expect(blocks.length).toBeGreaterThanOrEqual(3);

      for (const block of blocks) {
        expect(block.body.trim().length).toBeGreaterThan(20);
        expect(block.icon).toBeDefined();
      }

      const complexity = blocks.find((block) => block.title === "复杂度");
      expect(complexity?.rows?.length).toBeGreaterThanOrEqual(4);
      for (const row of complexity?.rows ?? []) {
        expect(row.label.trim()).not.toBe("");
        expect(row.value).toMatch(/^O\(/);
      }

      const pitfalls = blocks.find((block) => block.title === "易错点");
      expect(pitfalls?.items?.length).toBeGreaterThanOrEqual(3);
    });
  }
});

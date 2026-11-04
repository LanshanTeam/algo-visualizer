import { describe, expect, it } from "vitest";
import type { Frame } from "../core/types";
import { hashTableTrace, parseHashInput } from "../topics/tree-hash/hash-table";
import { createAnimationScene } from "./animation-scene";
import { verifyTrace } from "./animation-scene.test-helpers";
import { hashChainCapacityOf } from "./hash-layout";

const values = parseHashInput("50, 23, 15, 36, 44, 8, 60");

function traceScene(frames: Frame[]) {
  const capacity = Math.max(...frames.map((frame) => frame.items.length));
  const hashChainCapacity = Math.max(...frames.map(hashChainCapacityOf));
  return (frame: Frame, previous?: Frame) =>
    createAnimationScene({
      frame,
      previous,
      kind: "hash",
      capacity,
      hashChainCapacity,
    });
}

const defaultScenes = (frames: Frame[]) => {
  const at = traceScene(frames);
  return at(frames.at(-1)!, frames.at(-2));
};

describe("哈希表场景", () => {
  it("所有操作的轨迹尺寸稳定且节点不碰撞", () => {
    for (const frames of [
      hashTableTrace(values, "create"),
      hashTableTrace(values, "search", 8),
      hashTableTrace(values, "search", 29),
      hashTableTrace(values, "search", 10),
      hashTableTrace(values, "search", -3),
      hashTableTrace(values, "insert", 29),
      hashTableTrace(values, "insert", 44),
      hashTableTrace(values, "insert", 10),
      hashTableTrace(values, "delete", 15),
      hashTableTrace(values, "delete", 50),
      hashTableTrace(values, "delete", 8),
      hashTableTrace(values, "delete", 60),
      hashTableTrace(values, "delete", 23),
      hashTableTrace(values, "delete", 29),
    ])
      verifyTrace(frames, "hash");
  });

  it("公式条始终存在，准备帧显示通用形式，哈希帧显示代入结果", () => {
    const frames = hashTableTrace(values, "search", 8);
    const at = traceScene(frames);
    const start = at(frames[0]);
    expect(start.formula).toMatchObject({
      text: "除留余数法  h(key) = ((key % 7) + 7) % 7",
      active: false,
    });

    const hash = at(frames[1], frames[0]);
    expect(hash.formula).toMatchObject({
      text: "h(8) = ((8 % 7) + 7) % 7 = 1",
      active: true,
    });
    expect(hash.formula!.x).toBeGreaterThanOrEqual(0);
    expect(hash.formula!.y).toBeGreaterThanOrEqual(0);
    expect(hash.formula!.x + hash.formula!.width).toBeLessThanOrEqual(
      hash.width,
    );
    expect(hash.formula!.y + hash.formula!.height).toBeLessThanOrEqual(
      hash.height,
    );
  });

  it("固定 7 行桶，空桶没有链头，非空桶链头绑定首个节点", () => {
    const frames = hashTableTrace(values, "create");
    const scene = defaultScenes(frames);
    expect(scene.buckets).toHaveLength(7);
    scene.buckets.forEach((bucket, index) => {
      expect(bucket.index).toBe(index);
      expect(bucket.x).toBe(18);
      expect(bucket.width).toBe(36);
      expect(bucket.y).toBe(30 + index * 24);
      expect(bucket.y + bucket.height).toBeLessThanOrEqual(scene.height);
    });

    const last = frames.at(-1)!;
    const nodesById = new Map(scene.nodes.map((node) => [node.id, node]));
    scene.buckets.forEach((bucket, index) => {
      const headId = last.bucketHeads?.[index] ?? null;
      if (headId === null) {
        expect(bucket.head).toBeUndefined();
        return;
      }
      const head = nodesById.get(headId)!;
      expect(bucket.head).toBeDefined();
      expect(bucket.head!.x.at(-1)).toBe(head.x.at(-1));
      expect(bucket.head!.y.at(-1)).toBe(head.y.at(-1)! + head.height / 2);
      expect(bucket.active).toBe(index === 4);
    });
    expect(scene.buckets.filter((bucket) => bucket.head)).toHaveLength(3);
  });

  it("哈希帧高亮当前桶", () => {
    const frames = hashTableTrace(values, "search", 8);
    const at = traceScene(frames);
    const hash = at(frames[1], frames[0]);
    expect(hash.buckets.map((bucket) => bucket.active)).toEqual([
      false,
      true,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it("默认表最长链为 4，宽度 430、高度 208", () => {
    const frames = hashTableTrace(values, "create");
    const scene = defaultScenes(frames);
    expect(Math.max(...frames.map(hashChainCapacityOf))).toBe(4);
    expect([scene.width, scene.height]).toEqual([430, 208]);
  });

  it("15 个同桶键把画布撑到 912，节点仍不重叠", () => {
    const long = Array.from({ length: 15 }, (_, index) => 1 + index * 7);
    const frames = hashTableTrace(long, "search", 99);
    verifyTrace(frames, "hash");
    const scene = defaultScenes(frames);
    expect(Math.max(...frames.map(hashChainCapacityOf))).toBe(15);
    expect([scene.width, scene.height]).toEqual([912, 208]);
    expect(scene.nodes).toHaveLength(15);
    expect(new Set(scene.nodes.map((node) => node.x.at(-1))).size).toBe(15);
  });

  it("键分散到不同桶时不会因总键数变宽", () => {
    const scattered = [1, 2, 3, 4, 5, 6, 7];
    const frames = hashTableTrace(scattered, "search", 7);
    verifyTrace(frames, "hash");
    const scene = defaultScenes(frames);
    expect(scene.width).toBe(430);
    expect(scene.nodes).toHaveLength(7);
  });

  it("删除唯一节点后仍有 7 个空桶与公式条", () => {
    const frames = hashTableTrace([60], "delete", 60);
    verifyTrace(frames, "hash");
    const scene = defaultScenes(frames);
    expect(scene.nodes).toEqual([]);
    expect(scene.buckets).toHaveLength(7);
    expect(scene.buckets.every((bucket) => bucket.head === undefined)).toBe(
      true,
    );
    expect(scene.formula?.text).toBe("h(60) = ((60 % 7) + 7) % 7 = 4");
    expect(scene.empty).toBeUndefined();
  });
});

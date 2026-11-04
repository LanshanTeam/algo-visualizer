import { describe, expect, it } from "vitest";
import type { Frame } from "../core/types";
import { bstTrace, parseBstInput } from "../topics/tree-hash/bst";
import { createAnimationScene } from "./animation-scene";
import { verifyScene, verifyTrace } from "./animation-scene.test-helpers";
import { treeDepthOf } from "./tree-layout";

const values = parseBstInput("50, 30, 70, 20, 40, 60, 80");

function sceneOf(
  frame: Frame,
  previous: Frame | undefined,
  capacity: number,
  treeDepth: number,
) {
  return createAnimationScene({
    frame,
    previous,
    kind: "tree",
    capacity,
    treeDepth,
  });
}

function traceScene(frames: Frame[]) {
  const capacity = Math.max(...frames.map((frame) => frame.items.length));
  const treeDepth = Math.max(...frames.map(treeDepthOf));
  return (frame: Frame, previous?: Frame) =>
    sceneOf(frame, previous, capacity, treeDepth);
}

function expectBadgeInside(scene: ReturnType<typeof sceneOf>) {
  for (const badge of scene.badges) {
    const left = badge.x.at(-1)! - badge.width / 2;
    const top = badge.y.at(-1)! - badge.height / 2;
    expect(left).toBeGreaterThanOrEqual(0);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(left + badge.width).toBeLessThanOrEqual(scene.width);
    expect(top + badge.height).toBeLessThanOrEqual(scene.height);
  }
}

describe("二叉搜索树场景", () => {
  it("所有操作的轨迹尺寸稳定且节点不碰撞", () => {
    for (const frames of [
      bstTrace(values, "create"),
      bstTrace(values, "search", 40),
      bstTrace(values, "search", 35),
      bstTrace(values, "insert", 35),
      bstTrace(values, "delete", 40),
      bstTrace(values, "delete", 30),
      bstTrace(values, "delete", 50),
      bstTrace([50, 30, 20], "delete", 30),
      bstTrace([50, 30], "delete", 50),
      bstTrace([50], "delete", 50),
    ])
      verifyTrace(frames, "tree");
  });

  it("准备帧没有徽章，比较时徽章绑定当前节点并滑动", () => {
    const frames = bstTrace(values, "search", 40);
    const at = traceScene(frames);
    expect(at(frames[0]).badges).toEqual([]);

    const first = at(frames[1], frames[0]);
    expect(first.badges).toHaveLength(1);
    expect(first.badges[0]).toMatchObject({
      text: "target = 40",
      targetId: 0,
      tone: "pivot",
      placement: "upper-right",
    });
    expectBadgeInside(first);

    const second = at(frames[2], frames[1]);
    expect(second.badges[0].targetId).toBe(1);
    expect(second.badges[0].x[0]).not.toBe(second.badges[0].x[1]);
    expect(second.badges[0].y[0]).not.toBe(second.badges[0].y[1]);
    expectBadgeInside(second);
  });

  it("目标 80 靠右时徽章翻到左上方", () => {
    const frames = bstTrace(values, "search", 80);
    const at = traceScene(frames);
    const last = frames.at(-1)!;
    const scene = at(last, frames.at(-2));
    expect(scene.badges[0]).toMatchObject({
      text: "target = 80",
      targetId: 6,
      placement: "upper-left",
    });
    expectBadgeInside(scene);
    expect(() => verifyScene(last, frames.at(-2), "tree", 7, 2)).not.toThrow();
  });

  it("三位数目标值的徽章仍不越界", () => {
    const frames = bstTrace(values, "search", 100);
    verifyTrace(frames, "tree");
    const at = traceScene(frames);
    const last = frames.at(-1)!;
    const scene = at(last, frames.at(-2));
    expect(scene.badges[0].text).toBe("target = 100");
    expect(scene.badges[0].width).toBeGreaterThan(80);
    expectBadgeInside(scene);
  });

  it("插入帧的徽章跟随新节点", () => {
    const frames = bstTrace(values, "insert", 35);
    const at = traceScene(frames);
    const last = frames.at(-1)!;
    const scene = at(last, frames.at(-2));
    expect(scene.badges[0]).toMatchObject({
      text: "target = 35",
      targetId: 7,
      placement: "upper-right",
    });
    expect(last.items[last.active[0]]).toEqual({ id: 7, value: 35 });
    expectBadgeInside(scene);
  });

  it("删除的修改帧不显示目标徽章", () => {
    const modifications = new Set([
      "leaf",
      "one_child",
      "successor",
      "copy",
      "remove",
    ]);
    for (const frames of [
      bstTrace(values, "delete", 40),
      bstTrace(values, "delete", 30),
      bstTrace([50, 30, 20], "delete", 30),
      bstTrace([50, 30], "delete", 50),
    ]) {
      const at = traceScene(frames);
      for (const frame of frames.filter((entry) =>
        modifications.has(entry.anchor),
      )) {
        expect(frame.target).toBeUndefined();
        expect(at(frame).badges).toEqual([]);
      }
    }
  });

  it("删除唯一节点后显示空树", () => {
    const frames = bstTrace([50], "delete", 50);
    const at = traceScene(frames);
    const scene = at(frames.at(-1)!, frames.at(-2));
    expect(scene.nodes).toHaveLength(0);
    expect(scene.badges).toEqual([]);
    expect(scene.empty?.text).toBe("空树");
  });
});

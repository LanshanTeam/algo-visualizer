import { describe, expect, it } from "vitest";
import { linkedListTrace } from "../topics/linear/linked-list";
import { quickSortTrace } from "../topics/sorting-searching/quick-sort";
import { connectionPathAt, createAnimationScene } from "./animation-scene";
import { verifyScene, verifyTrace } from "./animation-scene.test-helpers";

describe("紧凑场景与统一时钟", () => {
  for (const values of [
    [],
    [1],
    [4, 1, 3],
    [38, 16, 54, 27, 8, 42, 23],
    [2, 2, 2],
    [-999, 0, 999, -2],
    Array.from({ length: 12 }, (_, i) => 12 - i),
  ])
    it(`数组所有步骤前进、回退、跳转均保持边界与画布尺寸 ${JSON.stringify(values)}`, () =>
      verifyTrace(quickSortTrace(values), "array"));
  for (const operation of ["insert", "delete", "find"] as const)
    for (const length of [0, 1, 4])
      it(`链表 ${operation} 长度 ${length} 全部索引与连线满足运动约束`, () => {
        const values = Array.from({ length }, (_, i) => i * 10);
        for (
          let index = 0;
          index < (operation === "insert" ? length + 1 : length);
          index++
        )
          verifyTrace(
            linkedListTrace(values, operation, index, 7),
            "linked-list",
          );
      });
  it("交换真正移动两个具有稳定身份的元素，正反向都使用独立轨道", () => {
    const frames = quickSortTrace([4, 1, 3]);
    const index = frames.findIndex((frame) => frame.anchor === "swap");
    for (const [frame, previous] of [
      [frames[index], frames[index - 1]],
      [frames[index - 1], frames[index]],
    ]) {
      const scene = verifyScene(frame, previous, "array", 3);
      const moved = scene.nodes.filter((node) => new Set(node.x).size > 1);
      expect(moved).toHaveLength(2);
      expect(moved[0].y[1]).not.toBe(moved[1].y[1]);
      expect(scene.hasMotion).toBe(true);
      for (const node of moved) {
        expect(node.value).toBe(
          previous.items.find((item) => item.id === node.id)!.value,
        );
        expect(node.x[0]).not.toBe(node.x.at(-1));
      }
    }
  });
  it("标注靠近数组，只对实际穿过的标注避让，完成时恢复", () => {
    const frames = quickSortTrace([4, 1, 3]);
    const step = frames.findIndex((frame) => frame.anchor === "swap");
    const still = createAnimationScene({
      frame: frames[0],
      kind: "array",
      capacity: 3,
    });
    expect(
      still.indices[0].y - (still.nodes[0].y[0] + still.nodes[0].height),
    ).toBe(16);
    expect(still.indices.every((index) => !index.revealAfterMotion)).toBe(true);
    const moving = createAnimationScene({
      frame: frames[step],
      previous: frames[step - 1],
      kind: "array",
      capacity: 3,
    });
    expect(moving.indices[0].revealAfterMotion).toBe(true);
    expect(moving.indices[2].revealAfterMotion).toBe(false);
  });
  it("直接跳转呈现目标状态，不伪造交换", () => {
    const frame = quickSortTrace([3, 1, 2]).at(-1)!;
    const scene = createAnimationScene({ frame, kind: "array", capacity: 3 });
    expect(scene.hasMotion).toBe(false);
    expect(
      scene.nodes.every(
        (node) => new Set(node.x).size === 1 && new Set(node.y).size === 1,
      ),
    ).toBe(true);
  });
  it("合并同一位置的指针，避免标签重叠", () => {
    const frame = quickSortTrace([1])[0];
    frame.pointers = { i: 0, j: 0, pivot: 0 };
    const scene = verifyScene(frame, undefined, "array", 1);
    expect(scene.pointers).toHaveLength(1);
    expect(scene.pointers[0].name).toBe("i,j,pivot");
  });
  it("31 的 newNode 与 36 的 curr 绑定不同身份，插入前的链路仍保留", () => {
    const frames = linkedListTrace([12, 24, 36, 48], "insert", 2, 31);
    const connected = frames.find((frame) => frame.anchor === "connect")!;
    const scene = verifyScene(connected, undefined, "linked-list", 5);
    const next = scene.pointers.find((pointer) =>
      pointer.name.includes("newNode"),
    )!;
    const curr = scene.pointers.find((pointer) =>
      pointer.name.includes("curr"),
    )!;
    expect(next.targetId).toBe(4);
    expect(curr.targetId).toBe(2);
    expect(next.key).not.toBe(curr.key);
    expect(next.placement).toBe("above");
    expect(curr.placement).toBe("below");
    expect(scene.nodes.find((node) => node.id === 4)!.x[0]).toBeLessThan(
      scene.nodes.find((node) => node.id === 2)!.x[0],
    );
    expect(connected.links).toContainEqual([1, 2]);
    expect(connected.links).toContainEqual([4, 2]);
    const path = connectionPathAt(
      scene.links.find((link) => link.id === "4-2")!,
      scene.times,
      1,
    );
    const target = scene.nodes.find((node) => node.id === 2)!;
    expect(
      path.endsWith(`${target.x[0] + target.width / 2} ${target.y[0] - 6}`),
    ).toBe(true);
  });
  it("链表插入先让位后接入，回退先脱离后收拢", () => {
    const frames = linkedListTrace([10, 20, 30], "insert", 1, 7);
    const before = frames.find((frame) => frame.anchor === "connect")!;
    const after = frames.find((frame) => frame.anchor === "commit")!;
    const forward = createAnimationScene({
      frame: after,
      previous: before,
      kind: "linked-list",
      capacity: 4,
    });
    const incoming = forward.nodes.find((node) => node.id === before.detached)!;
    expect(incoming.y[0]).toBe(incoming.y[1]);
    const reverse = createAnimationScene({
      frame: before,
      previous: after,
      kind: "linked-list",
      capacity: 4,
    });
    const existing = reverse.nodes.find((node) => node.id === 1)!;
    expect(existing.x[0]).toBe(existing.x[1]);
  });
});

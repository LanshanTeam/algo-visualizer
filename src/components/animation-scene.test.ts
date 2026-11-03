import { describe, expect, it } from "vitest";
import { ARRAY_CAPACITY, arrayTrace } from "../topics/linear/array";
import { linkedListTrace } from "../topics/linear/linked-list";
import { QUEUE_CAPACITY, queueTrace } from "../topics/linear/queue";
import { STACK_CAPACITY, stackTrace } from "../topics/linear/stack";
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

describe("线性结构其余布局", () => {
  for (const operation of ["insert", "delete", "find"] as const)
    it(`顺序表 ${operation} 的移动都在画布内`, () => {
      for (const index of operation === "insert" ? [0, 2, 4, 5] : [0, 2, 4])
        verifyTrace(
          arrayTrace([10, 20, 30, 40, 50], operation, index, 9),
          "array",
          ARRAY_CAPACITY,
        );
    });
  it("顺序表始终绘制固定容量的空槽位", () => {
    const frames = arrayTrace([10, 20, 30], "delete", 0, 0);
    const scene = createAnimationScene({
      frame: frames[0],
      kind: "array",
      capacity: ARRAY_CAPACITY,
    });
    expect(scene.slots).toHaveLength(ARRAY_CAPACITY);
    expect(scene.slots[3].x).toBeGreaterThan(scene.slots[2].x);
  });
  for (const operation of ["push", "pop", "peek"] as const)
    it(`栈 ${operation} 的槽位与 top 标注不冲突`, () => {
      for (const values of [
        [],
        [7],
        [1, 2, 3],
        Array.from({ length: STACK_CAPACITY }, (_, i) => i * 10),
      ])
        verifyTrace(stackTrace(values, operation, 55), "stack", STACK_CAPACITY);
    });
  it("栈是竖排，槽位自下而上堆叠", () => {
    const scene = createAnimationScene({
      frame: stackTrace([1, 2, 3], "push", 4)[0],
      kind: "stack",
      capacity: STACK_CAPACITY,
    });
    expect(scene.vertical).toBe(true);
    expect(scene.slots[0].y).toBeGreaterThan(scene.slots[5].y);
    expect(scene.nodes.map((node) => node.y[0])).toEqual([158, 128, 98]);
    expect(scene.pointers[0].placement).toBe("right");
    expect(scene.pointers[0].targetId).toBe(2);
  });
  it("栈满与栈空只提示，不产生移动", () => {
    const full = Array.from({ length: STACK_CAPACITY }, (_, i) => i);
    const scene = verifyScene(
      stackTrace(full, "push", 9).at(-1)!,
      undefined,
      "stack",
      STACK_CAPACITY,
    );
    expect(scene.hasMotion).toBe(false);
    expect(scene.nodes).toHaveLength(STACK_CAPACITY);
  });
  for (const operation of ["enqueue", "dequeue", "peek"] as const)
    it(`队列 ${operation} 的元素始终落在槽位内`, () => {
      for (const values of [[], [14], [14, 28, 42], [7, 7, 7, 7, 7]])
        verifyTrace(queueTrace(values, operation, 9), "queue", QUEUE_CAPACITY);
    });
  it("队列出队只移动 front，其余元素原地不动", () => {
    const frames = queueTrace([14, 28, 42], "dequeue", 0);
    const index = frames.findIndex((frame) => frame.anchor === "dequeue");
    const scene = verifyScene(
      frames[index],
      frames[index - 1],
      "queue",
      QUEUE_CAPACITY,
    );
    expect(scene.hasMotion).toBe(true);
    for (const id of [1, 2]) {
      const node = scene.nodes.find((entry) => entry.id === id)!;
      expect(new Set(node.x).size).toBe(1);
      expect(new Set(node.y).size).toBe(1);
    }
    // 队头槽位空出后，剩余元素仍占原来的槽位：front 右移恰好抵消下标左移。
    const front = Number(frames[index].variables.front);
    expect(front).toBe(1);
    expect(scene.indices.map((entry) => entry.label)).toEqual(
      Array.from({ length: QUEUE_CAPACITY }, (_, slot) => String(slot)),
    );
    expect(scene.nodes.map((node) => node.x[0])).toEqual([
      scene.slots[1].x,
      scene.slots[2].x,
    ]);
  });
  it("队列能画出被空出和尚未使用的槽位", () => {
    const frames = queueTrace([14, 28], "dequeue", 0);
    const scene = createAnimationScene({
      frame: frames.at(-1)!,
      kind: "queue",
      capacity: QUEUE_CAPACITY,
    });
    expect(scene.slots).toHaveLength(QUEUE_CAPACITY);
    expect(scene.nodes).toHaveLength(1);
    expect(scene.nodes[0].x[0]).toBe(scene.slots[1].x);
  });
});

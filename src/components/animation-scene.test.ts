import { describe, expect, it } from "vitest";
import { linkedListTrace, quickSortTrace, type Frame } from "../trace";
import {
  connectionPathAt,
  createAnimationScene,
  sampleTrack,
} from "./animation-scene";

type Box = { x: number; y: number; width: number; height: number };
function overlaps(a: Box, b: Box) {
  return (
    a.x < b.x + b.width - 0.01 &&
    a.x + a.width > b.x + 0.01 &&
    a.y < b.y + b.height - 0.01 &&
    a.y + a.height > b.y + 0.01
  );
}
function verifyScene(
  frame: Frame,
  previous: Frame | undefined,
  kind: "array" | "linked-list",
  capacity: number,
) {
  const scene = createAnimationScene({ frame, previous, kind, capacity });
  expect(scene.height).toBeLessThanOrEqual(220);
  for (const pointer of scene.pointers)
    for (const name of pointer.name.split(",")) {
      if (frame.items[frame.pointers[name]]?.id !== pointer.targetId)
        throw new Error("指针标签绑定了错误的节点");
    }
  for (let tick = 0; tick <= 100; tick++) {
    const t = tick / 100;
    const nodes = scene.nodes.map((node) => ({
      ...node,
      x: sampleTrack(node.x, scene.times, t),
      y: sampleTrack(node.y, scene.times, t),
    }));
    const labels = scene.pointers.map((pointer) => ({
      x: sampleTrack(pointer.x, scene.times, t) - pointer.width / 2,
      y:
        sampleTrack(pointer.y, scene.times, t) -
        (pointer.placement === "above" ? 12 : 27),
      width: pointer.width,
      height: pointer.placement === "above" ? 16 : 34,
      hidden: pointer.revealAfterMotion,
    }));
    for (let a = 0; a < labels.length; a++)
      for (let b = a + 1; b < labels.length; b++)
        if (overlaps(labels[a], labels[b])) throw new Error("指针标注相交");
    const visibleLabels = [
      ...labels,
      ...scene.indices.map((index) => ({
        x: index.x - 8,
        y: index.y - 12,
        width: 16,
        height: 16,
        hidden: index.revealAfterMotion,
      })),
    ].filter((label) => !label.hidden || t === 1);
    for (let a = 0; a < nodes.length; a++) {
      const node = nodes[a];
      if (
        node.x < 0 ||
        node.y < 0 ||
        node.x + node.width > scene.width ||
        node.y + node.height > scene.height
      )
        throw new Error(`节点 ${node.id} 越界`);
      for (let b = a + 1; b < nodes.length; b++)
        if (overlaps(node, nodes[b]))
          throw new Error(
            `${frame.anchor} 节点 ${node.id} / ${nodes[b].id} 在 ${t} 相交`,
          );
      for (const label of visibleLabels)
        if (overlaps(node, label))
          throw new Error(`${frame.anchor} 节点 ${node.id} 在 ${t} 压住标注`);
    }
    for (const link of scene.links) {
      const [from, to] = link.id.split("-").map(Number);
      const a = nodes.find((node) => node.id === from)!;
      const b = nodes.find((node) => node.id === to)!;
      const path = connectionPathAt(link, scene.times, t);
      const numbers = path
        .match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)!
        .map(Number);
      const [ex, ey] = numbers.slice(-2);
      const onLeft =
        Math.abs(ex - (b.x - 6)) < 0.001 &&
        ey >= b.y - 6 - 0.001 &&
        ey <= b.y + b.height / 2 + 0.001;
      const onTop =
        Math.abs(ey - (b.y - 6)) < 0.001 &&
        ex >= b.x - 6 - 0.001 &&
        ex <= b.x + b.width / 2 + 0.001;
      if (
        !path.startsWith(`M ${a.x + a.width} ${a.y + a.height / 2} `) ||
        (!onLeft && !onTop)
      )
        throw new Error("连线端点没有沿目标节点外边界移动");
      for (let step = 1; step < 20; step++) {
        const u = step / 20,
          v = 1 - u;
        const x =
          v * v * v * numbers[0] +
          3 * v * v * u * numbers[2] +
          3 * v * u * u * numbers[4] +
          u * u * u * numbers[6];
        const y =
          v * v * v * numbers[1] +
          3 * v * v * u * numbers[3] +
          3 * v * u * u * numbers[5] +
          u * u * u * numbers[7];
        for (const other of nodes)
          if (
            other.id !== from &&
            other.id !== to &&
            x > other.x &&
            x < other.x + other.width &&
            y > other.y &&
            y < other.y + other.height
          )
            throw new Error(
              JSON.stringify({
                anchor: frame.anchor,
                previous: previous?.anchor,
                t,
                link: link.id,
                other: other.id,
                x,
                y,
                nodes,
              }),
            );
        for (const label of visibleLabels)
          if (
            x > label.x &&
            x < label.x + label.width &&
            y > label.y &&
            y < label.y + label.height
          )
            throw new Error("next 连线穿过标注");
      }
    }
  }
  return scene;
}
function verifyTrace(frames: Frame[], kind: "array" | "linked-list") {
  const capacity = Math.max(...frames.map((frame) => frame.items.length));
  const first = createAnimationScene({ frame: frames[0], kind, capacity });
  for (let i = 0; i < frames.length; i++) {
    const scene = verifyScene(frames[i], undefined, kind, capacity);
    expect([scene.width, scene.height]).toEqual([first.width, first.height]);
    if (i > 0) {
      verifyScene(frames[i], frames[i - 1], kind, capacity);
      verifyScene(frames[i - 1], frames[i], kind, capacity);
    }
  }
}

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

import { describe, expect, it } from "vitest";
import type { Frame } from "../core/types";
import { heapTrace, parseHeapInput } from "../topics/tree-hash/heap";
import { createAnimationScene } from "./animation-scene";
import { verifyTrace } from "./animation-scene.test-helpers";

const values = parseHeapInput("50, 30, 70, 20, 40, 60, 80");

function traceScene(frames: Frame[]) {
  const capacity = Math.max(...frames.map((frame) => frame.items.length));
  return (frame: Frame, previous?: Frame) =>
    createAnimationScene({
      frame,
      previous,
      kind: "heap",
      capacity,
    });
}

const defaultScenes = (frames: Frame[]) => {
  const at = traceScene(frames);
  return at(frames.at(-1)!, frames.at(-2));
};

describe("二叉堆场景", () => {
  it("所有操作的轨迹尺寸稳定且节点不碰撞", () => {
    const cases: [number[], string, number?][] = [
      [values, "create"],
      [values, "insert", 15],
      [values, "insert", 100],
      [values, "insert", 20],
      [values, "extract"],
      [[10, 20, 30], "extract"],
      [[10, 100, 20], "extract"],
      [[50], "extract"],
      [[10, 10], "extract"],
      [Array.from({ length: 15 }, (_, index) => index), "extract"],
    ];
    for (const [input, operation, value] of cases)
      verifyTrace(heapTrace(input, operation, value), "heap");
  });

  it("默认堆宽度 430、高度 208，完整显示树与数组", () => {
    const frames = heapTrace(values, "create");
    const scene = defaultScenes(frames);
    expect([scene.width, scene.height]).toEqual([430, 208]);
    expect(scene.nodes).toHaveLength(7);
    expect(scene.heapCells).toHaveLength(7);
    expect(scene.links).toHaveLength(6);
  });

  it("树节点在上方分层，数组格在底部同一行", () => {
    const frames = heapTrace(values, "create");
    const scene = defaultScenes(frames);
    const nodes = [...scene.nodes].sort(
      (a, b) => a.x.at(-1)! - b.x.at(-1)!,
    );
    const rows = [...new Set(nodes.map((node) => node.y.at(-1)))].sort(
      (a, b) => a! - b!,
    );
    expect(rows).toHaveLength(3);
    expect(scene.heapCells.map((cell) => cell.y)).toEqual(
      Array(7).fill(174),
    );
    for (const cell of scene.heapCells) {
      expect(cell.y + cell.height).toBeLessThanOrEqual(scene.height);
      expect(cell.x).toBeGreaterThanOrEqual(0);
      expect(cell.x + cell.width).toBeLessThanOrEqual(scene.width);
    }
  });

  it("数组格按 heapOrder 绑定节点 id 与值", () => {
    const frames = heapTrace(values, "create");
    const body = frames.at(-1)!;
    const scene = defaultScenes(frames);
    expect(scene.heapCells.map((cell) => cell.id)).toEqual(body.heapOrder);
    expect(scene.heapCells.map((cell) => cell.value)).toEqual([
      20, 30, 60, 50, 40, 70, 80,
    ]);
    scene.heapCells.forEach((cell, index) => {
      expect(cell.index).toBe(index);
      expect(cell.value).toBe(
        body.items.find((item) => item.id === cell.id)!.value,
      );
    });
  });

  it("当前节点与对应数组格同时使用琥珀色", () => {
    const frames = heapTrace(values, "insert", 15);
    const at = traceScene(frames);
    const firstSwap = frames.findIndex((frame) => frame.anchor === "swap");
    const scene = at(frames[firstSwap], frames[firstSwap - 1]);
    const activeId = frames[firstSwap].items[frames[firstSwap].active[0]].id;
    const node = scene.nodes.find((entry) => entry.id === activeId)!;
    const cell = scene.heapCells.find((entry) => entry.id === activeId)!;
    expect(node.tone).toBe("pivot");
    expect(cell.tone).toBe("pivot");
  });

  it("删除堆顶后旧根消失，末元素移到根", () => {
    const frames = heapTrace(values, "extract");
    const scene = defaultScenes(frames);
    expect(scene.nodes.map((node) => node.id)).not.toContain(3);
    const rootId = frames.at(-1)!.rootId!;
    const root = scene.nodes.find((node) => node.id === rootId)!;
    expect(root.y.at(-1)).toBe(6);
  });

  it("单节点删除后显示空堆，保留稳定宽度", () => {
    const frames = heapTrace([50], "extract");
    const scene = defaultScenes(frames);
    expect(scene.nodes).toEqual([]);
    expect(scene.heapCells).toEqual([]);
    expect(scene.links).toEqual([]);
    expect(scene.empty?.text).toBe("空堆");
    expect([scene.width, scene.height]).toEqual([430, 208]);
  });

  it("15 个节点把画布撑到 572，数组格仍不重叠", () => {
    const fifteen = Array.from({ length: 15 }, (_, index) => index);
    const frames = heapTrace(fifteen, "extract");
    const scene = defaultScenes(frames);
    expect([scene.width, scene.height]).toEqual([572, 208]);
    verifyTrace(frames, "heap");
    expect(scene.nodes).toHaveLength(14);
    expect(scene.heapCells).toHaveLength(14);
    expect(
      new Set(scene.heapCells.map((cell) => cell.x)).size,
    ).toBe(14);
  });
});

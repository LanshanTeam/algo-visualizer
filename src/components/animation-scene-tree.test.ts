import { describe, expect, it } from "vitest";
import type { Frame } from "../core/types";
import { binaryTreeTrace, parseTreeInput } from "../topics/tree-hash/binary-tree";
import { createAnimationScene } from "./animation-scene";
import { verifyScene, verifyTrace } from "./animation-scene.test-helpers";
import { readTree, treeDepthOf } from "./tree-layout";

const INPUT = "1, 2, 4, #, #, 5, #, #, 3, 6, #, #, 7, #, #";
const values = parseTreeInput(INPUT);
const operations = [
  "create",
  "preorder",
  "inorder",
  "postorder",
  "levelorder",
];

function sceneOf(frame: Frame, previous?: Frame, capacity = 7, treeDepth = 2) {
  return createAnimationScene({
    frame,
    previous,
    kind: "tree",
    capacity,
    treeDepth,
  });
}

describe("树场景几何", () => {
  it.each(operations)("%s 的每帧都不越界且尺寸稳定", (operation) => {
    const frames = binaryTreeTrace(values, operation);
    verifyTrace(frames, "tree");
    const widths = new Set(
      frames.map(
        (frame) => sceneOf(frame).width,
      ),
    );
    expect(widths.size).toBe(1);
  });

  it("单节点、只有右孩子与 15 节点斜树", () => {
    verifyTrace(binaryTreeTrace([1, NaN, NaN], "preorder"), "tree");
    verifyTrace(binaryTreeTrace([1, NaN, 2, NaN, NaN], "preorder"), "tree");
    const chain = [
      ...Array.from({ length: 15 }, (_, index) => index + 1),
      ...Array(16).fill(NaN),
    ];
    const frames = binaryTreeTrace(chain, "preorder");
    verifyTrace(frames, "tree");
    const scene = sceneOf(frames[0], undefined, 15, 14);
    expect(scene.width).toBe(546);
    expect(scene.nodes.every((node) => node.width === 8)).toBe(true);
    expect(scene.height).toBe(208);
  });

  it("空树居中显示空树提示", () => {
    const empty: Frame = {
      items: [],
      active: [],
      settled: [],
      pointers: {},
      anchor: "start",
      narration: "",
      variables: {},
      stack: [],
      links: [],
      rootId: null,
    };
    const scene = verifyScene(empty, undefined, "tree", 0, 0);
    expect(scene.width).toBe(430);
    expect(scene.empty?.text).toBe("空树");
    expect(scene.nodes).toHaveLength(0);
  });

  it("只有右孩子时画在父节点右侧", () => {
    const frames = binaryTreeTrace([1, NaN, 2, NaN, NaN], "preorder");
    const scene = sceneOf(frames[0], undefined, 2, 1);
    const [root, child] = scene.nodes;
    expect(root.x.at(-1)!).toBeLessThan(child.x.at(-1)!);
  });

  it("只有左孩子时画在父节点左侧", () => {
    const frames = binaryTreeTrace([1, 2, NaN, NaN, NaN], "preorder");
    const scene = sceneOf(frames[0], undefined, 2, 1);
    const [root, child] = scene.nodes;
    expect(root.x.at(-1)!).toBeGreaterThan(child.x.at(-1)!);
  });
});

describe("树场景配色与父边", () => {
  it("准备帧全部灰色，访问后当前琥珀、已访问蓝色", () => {
    const frames = binaryTreeTrace(values, "preorder");
    const prepare = sceneOf(frames[0]);
    expect(prepare.nodes.every((node) => node.tone === "idle")).toBe(true);
    expect(prepare.links.every((link) => !link.highlighted)).toBe(true);

    const second = sceneOf(frames[2], frames[1]);
    expect(second.nodes.find((node) => node.id === 0)!.tone).toBe("active");
    expect(second.nodes.find((node) => node.id === 1)!.tone).toBe("pivot");
    expect(second.nodes.find((node) => node.id === 2)!.tone).toBe("idle");
    const highlighted = second.links
      .filter((link) => link.highlighted)
      .map((link) => link.id);
    expect(highlighted).toEqual(["0-1"]);
  });

  it("创建帧只有最新节点是琥珀色，只有它的父边高亮", () => {
    const frames = binaryTreeTrace(values, "create");
    frames.forEach((frame, index) => {
      const scene = sceneOf(frame, index ? frames[index - 1] : undefined);
      expect(
        scene.nodes.find((node) => node.id === frame.active[0])!.tone,
      ).toBe("pivot");
      expect(
        scene.nodes
          .filter((node) => node.id !== frame.active[0])
          .every((node) => node.tone === "idle"),
      ).toBe(true);
      const children = scene.links
        .filter((link) => link.highlighted)
        .map((link) => Number(link.id.split("-")[1]));
      expect(children).toEqual(index ? [index] : []);
    });
  });

  it("边只在子节点访问后高亮", () => {
    const frames = binaryTreeTrace(values, "levelorder");
    frames.slice(1).forEach((frame) => {
      const scene = sceneOf(frame);
      const visited = new Set([...frame.active, ...frame.settled]);
      for (const link of scene.links) {
        const child = Number(link.id.split("-")[1]);
        expect(link.highlighted).toBe(visited.has(child));
      }
    });
  });
});

describe("森林与根推断", () => {
  function frameWith(links: [number, number, "left" | "right"][]): Frame {
    return {
      items: [
        { id: 10, value: 1 },
        { id: 11, value: 2 },
      ],
      active: [],
      settled: [],
      pointers: {},
      anchor: "start",
      narration: "",
      variables: {},
      stack: [],
      links,
      rootId: null,
    };
  }

  it("缺少 rootId 时按无父节点的节点推断根", () => {
    const frame = { ...frameWith([[10, 11, "left"]]), rootId: undefined };
    expect(readTree(frame).roots).toEqual([10]);
    const scene = verifyScene(frame, undefined, "tree", 2, 1);
    expect(scene.nodes).toHaveLength(2);
  });

  it("成环节点不会丢失，并追加为额外根", () => {
    const frame = {
      ...frameWith([
        [10, 11, "left"],
        [11, 10, "left"],
      ]),
      rootId: undefined,
    };
    const shape = readTree(frame);
    expect(shape.roots).toEqual([10]);
    expect(shape.size).toBe(2);
    expect(shape.rank.size).toBe(2);
    expect(() => verifyScene(frame, undefined, "tree", 2, 1)).not.toThrow();
  });

  it("根在顶层，深度决定行位置", () => {
    const frame = binaryTreeTrace(values, "preorder")[0];
    const scene = sceneOf(frame);
    const root = scene.nodes.find((node) => node.id === 0)!;
    const deepest = Math.max(
      ...scene.nodes.map((node) => node.y.at(-1)!),
    );
    expect(root.y.at(-1)!).toBe(Math.min(...scene.nodes.map((node) => node.y.at(-1)!)));
    expect(root.y.at(-1)!).toBeLessThan(deepest);
  });
});

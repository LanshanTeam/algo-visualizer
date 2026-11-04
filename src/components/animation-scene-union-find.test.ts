import { describe, expect, it } from "vitest";
import type { Frame } from "../core/types";
import {
  parseUnionFindInput,
  unionFindTrace,
} from "../topics/tree-hash/union-find";
import { createAnimationScene } from "./animation-scene";
import { verifyTrace } from "./animation-scene.test-helpers";

const values = parseUnionFindInput("{0,1,2,3}, {4,5}, {6,7}");

function traceScene(frames: Frame[]) {
  const capacity = Math.max(...frames.map((frame) => frame.items.length));
  return (frame: Frame, previous?: Frame) =>
    createAnimationScene({
      frame,
      previous,
      kind: "union-find",
      capacity,
    });
}

const defaultScenes = (frames: Frame[]) => {
  const at = traceScene(frames);
  return at(frames.at(-1)!, frames.at(-2));
};

describe("并查集场景", () => {
  it("所有操作的轨迹尺寸稳定且节点不碰撞", () => {
    const grouped = parseUnionFindInput("{0,1}, {2,3}");
    const fifteen = parseUnionFindInput(
      `{${Array.from({ length: 15 }, (_, index) => index).join(",")}}`,
    );
    const cases: [number[], string, number, number?][] = [
      [values, "create", 0],
      [values, "find", 3],
      [values, "find", 0],
      [values, "find", 2],
      [values, "union", 3, 7],
      [values, "union", 3, 2],
      [values, "connected", 3, 7],
      [values, "connected", 3, 2],
      [grouped, "union", 1, 3],
      [parseUnionFindInput("{5}"), "find", 5],
      [fifteen, "create", 0],
    ];
    for (const [input, operation, value, value2] of cases)
      verifyTrace(
        unionFindTrace(input, operation, value, value2),
        "union-find",
      );
  });

  it("默认 8 个元素宽度 430、高度 208，树与双行数组同时显示", () => {
    const scene = defaultScenes(unionFindTrace(values, "create"));
    expect([scene.width, scene.height]).toEqual([430, 208]);
    expect(scene.nodes).toHaveLength(8);
    expect(scene.unionColumns).toHaveLength(8);
    expect(scene.unionRowLabels.map((row) => row.label)).toEqual([
      "parent",
      "rank",
    ]);
    expect(scene.links).toHaveLength(5);
  });

  it("数组列绑定 parent / rank，根节点和根格同步为绿色", () => {
    const scene = defaultScenes(unionFindTrace(values, "create"));
    const frame = unionFindTrace(values, "create").at(-1)!;
    expect(scene.unionColumns.map((column) => column.parentId)).toEqual([
      0, 0, 0, 2, 4, 4, 6, 6,
    ]);
    expect(scene.unionColumns.map((column) => column.parent)).toEqual([
      0, 0, 0, 2, 4, 4, 6, 6,
    ]);
    expect(scene.unionColumns.map((column) => column.rank)).toEqual([
      2, 0, 1, 0, 1, 0, 1, 0,
    ]);
    expect(scene.unionColumns.map((column) => column.root)).toEqual([
      true,
      false,
      false,
      false,
      true,
      false,
      true,
      false,
    ]);
    expect(scene.unionColumns[0].tone).toBe("settled");
    expect(scene.unionColumns[4].tone).toBe("settled");
    expect(scene.unionColumns[6].tone).toBe("pivot");
    expect(scene.unionColumns[7].tone).toBe("active");
    for (const index of [0, 4, 6, 7]) {
      const id = frame.items[index].id;
      const node = scene.nodes.find((entry) => entry.id === id)!;
      expect(node.tone).toBe(scene.unionColumns[index].tone);
    }
  });

  it("父指针边从孩子指向父节点并带箭头", () => {
    const scene = defaultScenes(unionFindTrace(values, "create"));
    for (const link of scene.links) {
      expect(link.geometry).toBe("parent");
      expect(link.arrow).toBe(true);
    }
  });

  it("查找压缩后数组列与树节点同步更新", () => {
    const frames = unionFindTrace(values, "find", 3);
    const scene = defaultScenes(frames);
    expect(scene.unionColumns[3].parentId).toBe(0);
    expect(scene.unionColumns[3].parent).toBe(0);
    expect(scene.unionColumns[3].tone).toBe("pivot");
    const node = scene.nodes.find((entry) => entry.id === 3)!;
    expect(node.tone).toBe("pivot");
  });

  it("合并后根 6 的父指针改为 0，数组列同步", () => {
    const frames = unionFindTrace(values, "union", 3, 7);
    const scene = defaultScenes(frames);
    expect(scene.unionColumns[6].parentId).toBe(0);
    expect(scene.unionColumns[6].parent).toBe(0);
    expect(scene.unionColumns[7].parentId).toBe(6);
    expect(scene.links.map((link) => link.id)).toContain("6-0");
  });

  it("单元素集合只有一列，画布保持默认宽度", () => {
    const scene = defaultScenes(
      unionFindTrace(parseUnionFindInput("{5}"), "find", 5),
    );
    expect([scene.width, scene.height]).toEqual([430, 208]);
    expect(scene.nodes).toHaveLength(1);
    expect(scene.unionColumns).toHaveLength(1);
    expect(scene.links).toEqual([]);
  });

  it("15 个元素把画布撑到 572，15 个根与数组列不重叠", () => {
    const fifteen = parseUnionFindInput(
      `{${Array.from({ length: 15 }, (_, index) => index).join(",")}}`,
    );
    const frames = unionFindTrace(fifteen, "create");
    const scene = defaultScenes(frames);
    expect([scene.width, scene.height]).toEqual([572, 208]);
    expect(scene.nodes).toHaveLength(15);
    expect(scene.unionColumns).toHaveLength(15);
    expect(new Set(scene.unionColumns.map((column) => column.x)).size).toBe(
      15,
    );
  });
});

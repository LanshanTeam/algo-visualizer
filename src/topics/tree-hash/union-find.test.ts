import { describe, expect, it } from "vitest";
import { languages, parseCode } from "../../core/code";
import type { Frame } from "../../core/types";
import {
  DEFAULT_VALUES,
  MAX_ELEMENTS,
  parseUnionFindInput,
  unionFind,
  unionFindGroups,
  unionFindTrace,
} from "./union-find";
import { templates } from "./union-find-templates";

const INPUT = "{0,1,2,3}, {4,5}, {6,7}";
const values = parseUnionFindInput(INPUT);

function parents(frame: Frame) {
  return frame.unionParents ?? [];
}

function ranks(frame: Frame) {
  return frame.unionRanks ?? [];
}

function activeValues(frame: Frame) {
  return frame.active.map((index) => frame.items[index].value);
}

function settledValues(frame: Frame) {
  return frame.settled.map((index) => frame.items[index].value);
}

function expectFrameContract(frames: Frame[]) {
  for (const frame of frames) {
    const ids = frame.items.map((item) => item.id);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
    expect(parents(frame)).toHaveLength(frame.items.length);
    expect(ranks(frame)).toHaveLength(frame.items.length);
    expect(frame.stack).toEqual([]);
    expect(frame.queue).toEqual([]);
    expect(frame.pointers).toEqual({});
    expect(frame.target).toBeUndefined();
    expect(frame.rootId).toBeUndefined();
    expect(frame.variables.size).toBe(frame.items.length);
    expect(frame.variables.sets).toBe(
      parents(frame).filter((parent, id) => parent === ids[id]).length,
    );
    const known = new Set(ids);
    parents(frame).forEach((parent, index) => {
      expect(parent).toBeGreaterThanOrEqual(0);
      expect(known.has(parent)).toBe(true);
      let node = ids[index];
      const seen = new Set<number>();
      while (parents(frame)[ids.indexOf(node)] !== node) {
        expect(seen.has(node)).toBe(false);
        seen.add(node);
        node = parents(frame)[ids.indexOf(node)];
      }
    });
    const expectedLinks = parents(frame)
      .map((parent, index) =>
        parent === ids[index] ? null : `${ids[index]}-${parent}`,
      )
      .filter((link): link is string => link !== null);
    expect((frame.links ?? []).map(([from, to]) => `${from}-${to}`)).toEqual(
      expectedLinks,
    );
    for (const index of [...frame.active, ...frame.settled]) {
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(frame.items.length);
    }
  }
}

describe("并查集输入", () => {
  it("解析 {} 分组并用 NaN 分隔集合", () => {
    expect(values).toEqual([0, 1, 2, 3, NaN, 4, 5, NaN, 6, 7]);
    expect(parseUnionFindInput(" { 0 1 }, { 2 } ")).toEqual([
      0, 1, NaN, 2,
    ]);
    expect(parseUnionFindInput("{10,-3},{-8}")).toEqual([
      10, -3, NaN, -8,
    ]);
    expect(unionFindGroups(values)).toEqual([
      [0, 1, 2, 3],
      [4, 5],
      [6, 7],
    ]);
    expect(unionFindGroups([0, 1, 2])).toEqual([[0, 1, 2]]);
  });

  it("拒绝空输入、缺少花括号与非法元素", () => {
    expect(() => parseUnionFindInput(" ")).toThrow("请输入集合");
    expect(() => parseUnionFindInput("0,1,2")).toThrow("请用 `{}`");
    expect(() => parseUnionFindInput("{0,1")).toThrow("请用 `{}`");
    expect(() => parseUnionFindInput("{}")).toThrow("集合不能为空");
    expect(() => parseUnionFindInput("{0,1},{}, {2}")).toThrow(
      "集合不能为空",
    );
    expect(() => parseUnionFindInput("{0,1.5}")).toThrow("范围 -999 到 999");
    expect(() => parseUnionFindInput("{0,1000}")).toThrow("范围 -999 到 999");
  });

  it("拒绝跨组重复元素与超大输入", () => {
    expect(() => parseUnionFindInput("{0,1},{1,2}")).toThrow(
      "元素 1 重复出现",
    );
    expect(() =>
      parseUnionFindInput(
        `{${Array.from({ length: MAX_ELEMENTS + 1 }, (_, index) =>
          index,
        ).join(",")}}`,
      ),
    ).toThrow("最多展示 15 个元素");
  });

  it("直接调用 trace 时校验输入、目标与操作名", () => {
    expect(() => unionFindTrace([], "create")).toThrow("请输入集合");
    expect(() => unionFindTrace(values, "bogus")).toThrow("未知操作");
    expect(() => unionFindTrace(values, "find", 99)).toThrow(
      "查找元素 99 不在集合中",
    );
    expect(() => unionFindTrace(values, "find", 1.5)).toThrow(
      "查找元素 须为",
    );
    expect(() => unionFindTrace(values, "union", 3, 99)).toThrow(
      "元素 b 99 不在集合中",
    );
    expect(() => unionFindTrace(values, "connected", 99, 7)).toThrow(
      "元素 a 99 不在集合中",
    );
  });
});

describe("创建", () => {
  it("初始化后逐组按秩成对合并，共 21 帧", () => {
    const frames = unionFindTrace(values, "create");
    expect(frames).toHaveLength(21);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "init",
      "root",
      "root",
      "compare",
      "link",
      "root",
      "root",
      "compare",
      "link",
      "root",
      "root",
      "compare",
      "link",
      "root",
      "root",
      "compare",
      "link",
      "root",
      "root",
      "compare",
      "link",
    ]);
    expectFrameContract(frames);
  });

  it("首帧全部为根，最后一帧得到三棵树", () => {
    const frames = unionFindTrace(values, "create");
    const first = frames[0];
    expect(first.anchor).toBe("init");
    expect(parents(first)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(ranks(first)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(first.narration).toBe(
      "初始化：8 个元素各自成为一个集合。",
    );

    const last = frames.at(-1)!;
    expect(parents(last)).toEqual([0, 0, 0, 2, 4, 4, 6, 6]);
    expect(ranks(last)).toEqual([2, 0, 1, 0, 1, 0, 1, 0]);
    expect(last.variables.sets).toBe(3);
    expect(last.narration).toContain("创建完成");
    expect(last.narration).toContain("3 个集合");
    expect(last.links).toEqual([
      [1, 0],
      [2, 0],
      [3, 2],
      [5, 4],
      [7, 6],
    ]);
  });

  it("单元素集合只有初始化帧", () => {
    const frames = unionFindTrace(
      parseUnionFindInput("{5}"),
      "create",
    );
    expect(frames).toHaveLength(1);
    expect(frames[0].anchor).toBe("init");
    expect(parents(frames[0])).toEqual([0]);
    expect(frames[0].narration).toContain("创建完成");
  });
});

describe("查找", () => {
  it("3 → 2 → 0，找到根后压缩 3，共 5 帧", () => {
    const frames = unionFindTrace(values, "find", 3);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "visit",
      "visit",
      "root",
      "compress",
    ]);
    expect(frames.map(activeValues)).toEqual([[3], [3], [2], [0], [3]]);
    expect(frames.map(settledValues)).toEqual([
      [],
      [],
      [3],
      [3, 2],
      [3, 2, 0],
    ]);
    const last = frames.at(-1)!;
    expect(parents(last)).toEqual([0, 0, 0, 0, 4, 4, 6, 6]);
    expect(ranks(last)).toEqual([2, 0, 1, 0, 1, 0, 1, 0]);
    expect(last.narration).toContain("查找完成");
    expect(last.narration).toContain("3 的根是 0");
    expectFrameContract(frames);
  });

  it("查找根只发准备与根两帧", () => {
    const frames = unionFindTrace(values, "find", 0);
    expect(frames.map((frame) => frame.anchor)).toEqual(["start", "root"]);
    expect(frames.at(-1)!.narration).toContain("0 本身是根");
  });

  it("直接指向根的节点不再重复压缩", () => {
    const frames = unionFindTrace(values, "find", 2);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "visit",
      "root",
    ]);
  });
});

describe("合并", () => {
  it("合并 3 与 7：先压缩 3，再把根 6 挂到根 0，共 9 帧", () => {
    const frames = unionFindTrace(values, "union", 3, 7);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "visit",
      "visit",
      "root",
      "compress",
      "visit",
      "root",
      "compare",
      "link",
    ]);
    const last = frames.at(-1)!;
    expect(parents(last)).toEqual([0, 0, 0, 0, 4, 4, 0, 6]);
    expect(ranks(last)).toEqual([2, 0, 1, 0, 1, 0, 1, 0]);
    expect(last.variables.sets).toBe(2);
    expect(last.narration).toContain("3 与 7 连通");
    expect(last.narration).toContain("根为 0");
    expectFrameContract(frames);
  });

  it("合并同集合元素时不发 link", () => {
    const frames = unionFindTrace(values, "union", 3, 2);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "visit",
      "visit",
      "root",
      "compress",
      "visit",
      "root",
      "compare",
    ]);
    expect(frames.at(-1)!.narration).toContain("已连通");
    expect(parents(frames.at(-1)!)).toEqual([
      0, 0, 0, 0, 4, 4, 6, 6,
    ]);
  });

  it("rank 相等时右根挂到左根下并让左根 rank 加一", () => {
    const grouped = parseUnionFindInput("{0,1}, {2,3}");
    const frames = unionFindTrace(grouped, "union", 1, 3);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "visit",
      "root",
      "visit",
      "root",
      "compare",
      "link",
    ]);
    const last = frames.at(-1)!;
    expect(parents(last)).toEqual([0, 0, 0, 2]);
    expect(ranks(last)).toEqual([2, 0, 1, 0]);
    const compare = frames.find((frame) => frame.anchor === "compare")!;
    expect(compare.narration).toContain("rank 都是 1");
    expect(compare.narration).toContain("加一");
  });
});

describe("连通", () => {
  it("3 与 7 分别属于根 0 和 6，不连通，共 8 帧", () => {
    const frames = unionFindTrace(values, "connected", 3, 7);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "visit",
      "visit",
      "root",
      "compress",
      "visit",
      "root",
      "answer",
    ]);
    const last = frames.at(-1)!;
    expect(parents(last)).toEqual([0, 0, 0, 0, 4, 4, 6, 6]);
    expect(last.variables.sets).toBe(3);
    expect(last.narration).toContain("不连通");
    expect(last.narration).toContain("3 与 7 不连通");
    expectFrameContract(frames);
  });

  it("同集合元素判定连通，只压缩路径不合并", () => {
    const frames = unionFindTrace(values, "connected", 3, 2);
    const last = frames.at(-1)!;
    expect(last.narration).toContain("连通");
    expect(last.narration).toContain("根是 0");
    expect(parents(last)).toEqual([0, 0, 0, 0, 4, 4, 6, 6]);
    expect(last.variables.sets).toBe(3);
  });
});

describe("代码锚点与专题元数据", () => {
  it("每一帧的锚点都在对应语言的模板中", () => {
    const traces = [
      unionFindTrace(values, "create"),
      unionFindTrace(values, "find", 3),
      unionFindTrace(values, "union", 3, 7),
      unionFindTrace(values, "connected", 3, 7),
    ];
    for (const frames of traces) {
      const anchor = frames.some((frame) => frame.anchor === "init")
        ? "create"
        : frames.some((frame) => frame.anchor === "start")
          ? frames.some(
              (frame) => frame.anchor === "compare" || frame.anchor === "link",
            )
            ? "union"
            : frames.some((frame) => frame.anchor === "answer")
              ? "connected"
              : "find"
          : "find";
      const anchors = new Set(frames.map((frame) => frame.anchor));
      for (const language of languages) {
        const lines = parseCode(templates[language][anchor]);
        for (const name of anchors)
          expect(
            lines.some((line) => line.anchor === name),
            `${language}/${anchor} 缺少 ${name}`,
          ).toBe(true);
        expect(lines.every((line) => !line.text.includes("@"))).toBe(true);
      }
    }
  });

  it("未知操作回退到查找模板", () => {
    expect(
      unionFind.code("C", "bogus").map((line) => line.text),
    ).toEqual(unionFind.code("C", "find").map((line) => line.text));
  });

  it("专题元数据与默认输入", () => {
    expect(unionFind.status).toBe("ready");
    expect(unionFind.scene).toBe("union-find");
    expect(unionFind.controls.defaultOperation).toBe("find");
    expect(unionFind.controls.randomizable).toBe(false);
    expect(unionFind.controls.value?.defaultValue).toBe(3);
    expect(unionFind.controls.value2?.defaultValue).toBe(7);
    expect(unionFind.controls.operations!.map((entry) => entry.id)).toEqual([
      "create",
      "find",
      "union",
      "connected",
    ]);
    expect(DEFAULT_VALUES).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(
      unionFind.trace({
        values,
        operation: "union",
        index: 0,
        value: 3,
        value2: 7,
      }),
    ).toHaveLength(9);
  });
});

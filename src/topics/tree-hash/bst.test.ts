import { describe, expect, it } from "vitest";
import { languages, parseCode } from "../../core/code";
import type { Frame } from "../../core/types";
import { bst, bstTrace, parseBstInput } from "./bst";
import { templates } from "./bst-templates";

const INPUT = "50, 30, 70, 20, 40, 60, 80";
const values = parseBstInput(INPUT);

function activeValues(frames: Frame[]) {
  return frames.map((frame) =>
    frame.active.length ? frame.items[frame.active[0]].value : undefined,
  );
}

function settledValues(frame: Frame) {
  return frame.settled.map((index) => frame.items[index].value);
}

function inorderOf(frame: Frame): number[] {
  const children = new Map<number, { left?: number; right?: number }>();
  for (const [from, to, side] of frame.links ?? []) {
    const slots = children.get(from) ?? {};
    if (side) slots[side] = to;
    else if (slots.left === undefined) slots.left = to;
    else slots.right = to;
    children.set(from, slots);
  }
  const valuesById = new Map(
    frame.items.map((item) => [item.id, item.value] as const),
  );
  const result: number[] = [];
  const walk = (id: number | undefined) => {
    if (id === undefined) return;
    const slots = children.get(id);
    walk(slots?.left);
    result.push(valuesById.get(id)!);
    walk(slots?.right);
  };
  walk(frame.rootId ?? undefined);
  return result;
}

describe("二叉搜索树输入", () => {
  it("解析默认插入序列", () => {
    expect(values).toEqual([50, 30, 70, 20, 40, 60, 80]);
    expect(parseBstInput(" 50  30,70 ")).toEqual([50, 30, 70]);
  });

  it("拒绝空输入、重复值、非法值与超大输入", () => {
    expect(() => parseBstInput("  ")).toThrow("请输入插入序列");
    expect(() => parseBstInput("50, 30, 50")).toThrow("重复值 50");
    expect(() => parseBstInput("50, 1.5")).toThrow("范围 -999 到 999");
    expect(() => parseBstInput("50, 1000")).toThrow("范围 -999 到 999");
    expect(() =>
      parseBstInput(Array.from({ length: 16 }, (_, index) => index).join(", ")),
    ).toThrow("最多展示 15 个节点");
  });

  it("直接调用 trace 时也校验插入序列与目标值", () => {
    expect(() => bstTrace([], "search", 1)).toThrow("请输入插入序列");
    expect(() => bstTrace([50, 30, 50], "search", 1)).toThrow("重复值 50");
    expect(() => bstTrace(values, "search", 1.5)).toThrow("目标值");
    expect(() => bstTrace(values, "delete", 1000)).toThrow("目标值");
    expect(() => bstTrace(values, "bogus", 1)).toThrow("未知操作");
  });
});

describe("创建", () => {
  it("逐值展示比较路径并建立默认树", () => {
    const frames = bstTrace(values, "create");
    expect(frames).toHaveLength(17);
    expect(frames.filter((frame) => frame.anchor === "compare")).toHaveLength(
      10,
    );
    expect(frames.filter((frame) => frame.anchor === "insert")).toHaveLength(7);

    const first = frames[0];
    expect(first.items.map((item) => item.value)).toEqual([50]);
    expect(first.links).toEqual([]);
    expect(first.active).toEqual([0]);
    expect(first.settled).toEqual([]);
    expect(first.target).toBe(50);
    expect(first.narration).toBe("创建根节点 50。");

    const compare = frames[1];
    expect(compare.anchor).toBe("compare");
    expect(activeValues([compare])).toEqual([50]);
    expect(compare.settled).toEqual([]);
    expect(compare.target).toBe(30);
    expect(compare.narration).toContain("30 < 50");

    const inserted = frames[2];
    expect(inserted.anchor).toBe("insert");
    expect(inserted.items.map((item) => item.value)).toEqual([50, 30]);
    expect(activeValues([inserted])).toEqual([30]);
    expect(settledValues(inserted)).toEqual([50]);
    expect(inserted.links).toEqual([[0, 1, "left"]]);

    const last = frames.at(-1)!;
    expect(last.items.map((item) => item.value)).toEqual([
      50, 30, 70, 20, 40, 60, 80,
    ]);
    expect(last.links).toEqual([
      [0, 1, "left"],
      [0, 2, "right"],
      [1, 3, "left"],
      [1, 4, "right"],
      [2, 5, "left"],
      [2, 6, "right"],
    ]);
    expect(last.rootId).toBe(0);
    expect(last.active).toEqual([6]);
    expect(last.narration).toContain("建树完成，共 7 个节点");
  });

  it("创建帧的 items 按 id 升序，比较帧只包含已出现的节点", () => {
    const frames = bstTrace(values, "create");
    frames.forEach((frame) => {
      expect(frame.items.map((item) => item.id)).toEqual(
        [...frame.items.map((item) => item.id)].sort((a, b) => a - b),
      );
      expect(frame.links!.every(([, to]) => to < frame.items.length)).toBe(
        true,
      );
    });
  });
});

describe("查找", () => {
  it("命中 40 时依次比较 50、30、40", () => {
    const frames = bstTrace(values, "search", 40);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "compare",
      "compare",
      "found",
    ]);
    expect(activeValues(frames)).toEqual([undefined, 50, 30, 40]);
    expect(frames[0].active).toEqual([]);
    expect(frames[0].target).toBeUndefined();
    expect(settledValues(frames[2])).toEqual([50]);
    expect(settledValues(frames[3])).toEqual([50, 30]);
    expect(frames.at(-1)!.target).toBe(40);
    expect(frames.at(-1)!.narration).toContain("找到目标节点");
  });

  it("未命中 35 时在 40 处停止", () => {
    const frames = bstTrace(values, "search", 35);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "compare",
      "compare",
      "miss",
    ]);
    const last = frames.at(-1)!;
    expect(activeValues([last])).toEqual([40]);
    expect(settledValues(last)).toEqual([50, 30]);
    expect(last.target).toBe(35);
    expect(last.narration).toContain("左孩子为空，未找到");
  });
});

describe("插入", () => {
  it("在 40 左侧创建 35", () => {
    const frames = bstTrace(values, "insert", 35);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "compare",
      "compare",
      "compare",
      "insert",
    ]);
    const last = frames.at(-1)!;
    expect(last.items).toHaveLength(8);
    expect(last.items.at(-1)).toEqual({ id: 7, value: 35 });
    expect(last.links).toContainEqual([4, 7, "left"]);
    expect(activeValues([last])).toEqual([35]);
    expect(settledValues(last)).toEqual([50, 30, 40]);
    expect(last.target).toBe(35);
    expect(last.narration).toContain("共 8 个节点");
  });

  it("已存在的值不重复插入", () => {
    const frames = bstTrace(values, "insert", 40);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "compare",
      "compare",
      "exists",
    ]);
    const last = frames.at(-1)!;
    expect(last.items).toHaveLength(7);
    expect(activeValues([last])).toEqual([40]);
    expect(last.target).toBe(40);
    expect(last.narration).toContain("不重复插入");
  });

  it("插入超过 15 个节点时报错，但已存在的值仍可访问", () => {
    const fifteen = Array.from({ length: 15 }, (_, index) => index + 1);
    expect(() => bstTrace(fifteen, "insert", 16)).toThrow("无法继续插入");
    expect(bstTrace(fifteen, "insert", 15).at(-1)!.anchor).toBe("exists");
  });
});

describe("删除", () => {
  it("删除叶子 40", () => {
    const frames = bstTrace(values, "delete", 40);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "compare",
      "compare",
      "found",
      "leaf",
    ]);
    const last = frames.at(-1)!;
    expect(last.items).toHaveLength(6);
    expect(last.items.map((item) => item.value)).not.toContain(40);
    expect(last.links).not.toContainEqual([1, 4, "right"]);
    expect(last.target).toBeUndefined();
    expect(last.narration).toContain("删除完成");
  });

  it("删除双孩子节点 30：复制后继 40 再删除它", () => {
    const frames = bstTrace(values, "delete", 30);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "compare",
      "found",
      "successor",
      "copy",
      "remove",
    ]);
    const successor = frames[3];
    expect(activeValues([successor])).toEqual([40]);
    expect(settledValues(successor)).toEqual([50, 30]);
    expect(successor.target).toBeUndefined();

    const copy = frames[4];
    expect(copy.items.map((item) => item.value)).toContain(40);
    expect(
      copy.items.filter((item) => item.value === 40),
    ).toHaveLength(2);
    expect(activeValues([copy])).toEqual([40]);
    expect(copy.target).toBeUndefined();

    const last = frames.at(-1)!;
    expect(last.items.map((item) => item.value)).toEqual([
      50, 40, 70, 20, 60, 80,
    ]);
    expect(inorderOf(last)).toEqual([20, 40, 50, 60, 70, 80]);
    expect(last.rootId).toBe(0);
    expect(last.narration).toContain("删除后继节点 40");
  });

  it("删除只有一个孩子的 30，并让孩子接替", () => {
    const frames = bstTrace([50, 30, 20], "delete", 30);
    expect(frames.at(-1)!.anchor).toBe("one_child");
    const last = frames.at(-1)!;
    expect(last.items).toEqual([
      { id: 0, value: 50 },
      { id: 2, value: 20 },
    ]);
    expect(last.links).toEqual([[0, 2, "left"]]);
    expect(last.active).toEqual([1]);
    expect(last.items[last.active[0]].id).toBe(2);
    expect(last.settled).toEqual([0]);
    expect(last.narration).toContain("用 20 接替");
  });

  it("删除只有一个右孩子的 30，并让孩子接替", () => {
    const frames = bstTrace([50, 30, 40], "delete", 30);
    expect(frames[2].links).toContainEqual([1, 2, "right"]);
    const last = frames.at(-1)!;
    expect(last.anchor).toBe("one_child");
    expect(last.items).toEqual([
      { id: 0, value: 50 },
      { id: 2, value: 40 },
    ]);
    expect(last.links).toEqual([[0, 2, "left"]]);
    expect(last.active).toEqual([1]);
    expect(last.narration).toContain("用 40 接替");
  });

  it("删除只有一个孩子的根，孩子成为新根", () => {
    const frames = bstTrace([50, 30], "delete", 50);
    const last = frames.at(-1)!;
    expect(last.anchor).toBe("one_child");
    expect(last.items).toEqual([{ id: 1, value: 30 }]);
    expect(last.links).toEqual([]);
    expect(last.rootId).toBe(1);
    expect(last.active).toEqual([0]);
  });

  it("删除双孩子根 50：后继 60 写入根，根 id 不变", () => {
    const frames = bstTrace(values, "delete", 50);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "found",
      "successor",
      "copy",
      "remove",
    ]);
    const last = frames.at(-1)!;
    expect(last.rootId).toBe(0);
    expect(last.items.find((item) => item.id === 0)!.value).toBe(60);
    expect(last.items.some((item) => item.id === 5)).toBe(false);
    expect(inorderOf(last)).toEqual([20, 30, 40, 60, 70, 80]);
  });

  it("删除唯一节点后成为空树", () => {
    const frames = bstTrace([50], "delete", 50);
    const last = frames.at(-1)!;
    expect(last.anchor).toBe("leaf");
    expect(last.items).toEqual([]);
    expect(last.links).toEqual([]);
    expect(last.rootId).toBeNull();
  });

  it("未命中时不修改结构", () => {
    const frames = bstTrace(values, "delete", 35);
    const last = frames.at(-1)!;
    expect(last.anchor).toBe("miss");
    expect(last.items).toHaveLength(7);
    expect(last.links).toHaveLength(6);
    expect(last.target).toBe(35);
    expect(last.narration).toContain("删除取消");
  });
});

describe("代码锚点与专题元数据", () => {
  const cases = [
    ["create", values, 0],
    ["search", values, 40],
    ["search", values, 35],
    ["insert", values, 35],
    ["insert", values, 40],
    ["delete", values, 40],
    ["delete", values, 30],
    ["delete", values, 35],
  ] as const;

  it("每一帧的锚点都在六种语言模板中", () => {
    for (const [operation, input, target] of cases) {
      const anchors = new Set(
        bstTrace([...input], operation, target).map((frame) => frame.anchor),
      );
      for (const language of languages) {
        const lines = parseCode(templates[language][operation]);
        for (const anchor of anchors)
          expect(
            lines.some((line) => line.anchor === anchor),
            `${language}/${operation} 缺少 ${anchor}`,
          ).toBe(true);
        expect(lines.every((line) => !line.text.includes("@"))).toBe(true);
      }
    }
  });

  it("未知操作回退到查找模板", () => {
    expect(bst.code("C", "bogus").map((line) => line.text)).toEqual(
      bst.code("C", "search").map((line) => line.text),
    );
  });

  it("专题元数据与默认操作", () => {
    expect(bst.status).toBe("ready");
    expect(bst.scene).toBe("tree");
    expect(bst.controls.defaultOperation).toBe("search");
    expect(bst.controls.randomizable).toBe(false);
    expect(bst.controls.value?.defaultValue).toBe(40);
    expect(bst.controls.operations!.map((entry) => entry.id)).toEqual([
      "create",
      "search",
      "insert",
      "delete",
    ]);
    expect(
      bst.trace({ values, operation: "search", index: 0, value: 40 }),
    ).toHaveLength(4);
  });
});

import { describe, expect, it } from "vitest";
import { languages, parseCode } from "../../core/code";
import type { Frame } from "../../core/types";
import {
  DEFAULT_VALUES,
  heap,
  heapTrace,
  parseHeapInput,
  parentIndex,
} from "./heap";
import { templates } from "./heap-templates";

const INPUT = "50, 30, 70, 20, 40, 60, 80";
const values = parseHeapInput(INPUT);

function activeValues(frame: Frame) {
  return frame.active.map((index) => frame.items[index].value);
}

function settledValues(frame: Frame) {
  return frame.settled.map((index) => frame.items[index].value);
}

/** heapOrder 是数组顺序；把节点 id 还原成当前数组值。 */
function heapValues(frame: Frame): number[] {
  const valueById = new Map(
    frame.items.map((item) => [item.id, item.value] as const),
  );
  return (frame.heapOrder ?? []).map((id) => valueById.get(id)!);
}

function expectHeapProperty(array: number[]) {
  for (let index = 1; index < array.length; index++)
    expect(array[parentIndex(index)]).toBeLessThanOrEqual(array[index]);
}

function expectFrameContract(frames: Frame[]) {
  for (const frame of frames) {
    const ids = frame.items.map((item) => item.id);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
    expect(frame.stack).toEqual([]);
    expect(frame.queue).toEqual([]);
    expect(frame.pointers).toEqual({});
    expect(frame.target).toBeUndefined();
    expect(frame.variables.size).toBe(frame.items.length);

    const order = frame.heapOrder ?? [];
    expect(order).toHaveLength(frame.items.length);
    expect(new Set(order).size).toBe(order.length);
    expect(order.every((id) => ids.includes(id))).toBe(true);
    expect(frame.rootId).toBe(order[0] ?? null);

    const links = frame.links ?? [];
    expect(links).toHaveLength(Math.max(0, order.length - 1));
    links.forEach(([from, to, side], index) => {
      const child = index + 1;
      expect(from).toBe(order[parentIndex(child)]);
      expect(to).toBe(order[child]);
      expect(side).toBe(child % 2 === 1 ? "left" : "right");
    });

    for (const index of [...frame.active, ...frame.settled]) {
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(frame.items.length);
    }
  }
}

describe("二叉堆输入", () => {
  it("解析默认键序列，允许重复值", () => {
    expect(values).toEqual(DEFAULT_VALUES);
    expect(parseHeapInput(" 50  30,70 ")).toEqual([50, 30, 70]);
    expect(parseHeapInput("10, 10, -3")).toEqual([10, 10, -3]);
  });

  it("拒绝空输入、非法值与超大输入", () => {
    expect(() => parseHeapInput(" ")).toThrow("请输入键序列");
    expect(() => parseHeapInput("50, 1.5")).toThrow("范围 -999 到 999");
    expect(() => parseHeapInput("50, 1000")).toThrow("范围 -999 到 999");
    expect(() =>
      parseHeapInput(
        Array.from({ length: 16 }, (_, index) => index).join(", "),
      ),
    ).toThrow("最多展示 15 个节点");
  });

  it("直接调用 trace 时校验输入、插入值与操作名", () => {
    expect(() => heapTrace([], "create")).toThrow("请输入键序列");
    expect(() => heapTrace(values, "insert", 1.5)).toThrow("插入值");
    expect(() => heapTrace(values, "insert", 1000)).toThrow("插入值");
    expect(() => heapTrace(values, "bogus")).toThrow("未知操作");
    expect(heapTrace(values, "extract", 1000)).toHaveLength(6);
  });

  it("父节点下标与完全二叉树的数组映射一致", () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(parentIndex)).toEqual([
      -1, 0, 0, 1, 1, 2, 2,
    ]);
  });
});

describe("创建", () => {
  it("逐值追加、比较并上浮，共 19 帧", () => {
    const frames = heapTrace(values, "create");
    expect(frames).toHaveLength(19);
    expect(
      frames.filter((frame) => frame.anchor === "append"),
    ).toHaveLength(7);
    expect(
      frames.filter((frame) => frame.anchor === "compare"),
    ).toHaveLength(8);
    expect(frames.filter((frame) => frame.anchor === "swap")).toHaveLength(4);
    expectFrameContract(frames);
  });

  it("首帧只追加根节点，最后一帧完成建堆", () => {
    const frames = heapTrace(values, "create");
    const first = frames[0];
    expect(first.anchor).toBe("append");
    expect(first.items).toEqual([{ id: 0, value: 50 }]);
    expect(first.heapOrder).toEqual([0]);
    expect(activeValues(first)).toEqual([50]);
    expect(first.narration).toBe("把 50 放到数组下标 0。");

    const last = frames.at(-1)!;
    expect(last.narration).toContain("建堆完成，共 7 个节点");
    expect(heapValues(last)).toEqual([20, 30, 60, 50, 40, 70, 80]);
    expect(last.heapOrder).toEqual([3, 1, 5, 0, 4, 2, 6]);
    expect(last.rootId).toBe(3);
    expectHeapProperty(heapValues(last));
  });

  it("父子边按数组下标连接，并标记左右孩子", () => {
    const last = heapTrace(values, "create").at(-1)!;
    expect(last.links).toEqual([
      [3, 1, "left"],
      [3, 5, "right"],
      [1, 0, "left"],
      [1, 4, "right"],
      [5, 2, "left"],
      [5, 6, "right"],
    ]);
  });

  it("上浮时交换节点 id，数组值同步换位", () => {
    const frames = heapTrace(values, "create");
    const swaps = frames.filter((frame) => frame.anchor === "swap");
    expect(swaps.map(heapValues)).toEqual([
      [30, 50],
      [30, 20, 70, 50],
      [20, 30, 70, 50],
      [20, 30, 60, 50, 40, 70],
    ]);
  });
});

describe("插入", () => {
  it("插入 15 一路交换到根，共 8 帧", () => {
    const frames = heapTrace(values, "insert", 15);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "append",
      "compare",
      "swap",
      "compare",
      "swap",
      "compare",
      "swap",
    ]);
    const last = frames.at(-1)!;
    expect(heapValues(last)).toEqual([15, 20, 60, 30, 40, 70, 80, 50]);
    expect(last.heapOrder).toEqual([7, 3, 5, 1, 4, 2, 6, 0]);
    expect(activeValues(last)).toEqual([15]);
    expect(last.narration).toContain("插入完成，共 8 个节点");
    expectHeapProperty(heapValues(last));
    expectFrameContract(frames);
  });

  it("插入 100 与父节点比较后立即停止，共 3 帧", () => {
    const frames = heapTrace(values, "insert", 100);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "append",
      "compare",
    ]);
    const last = frames.at(-1)!;
    expect(heapValues(last)).toEqual([20, 30, 60, 50, 40, 70, 80, 100]);
    expect(last.narration).toContain("100 >= 50");
    expect(last.narration).toContain("停止上浮");
  });

  it("插入与根相等的 20 时遇等号停止，共 7 帧", () => {
    const frames = heapTrace(values, "insert", 20);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "append",
      "compare",
      "swap",
      "compare",
      "swap",
      "compare",
    ]);
    const last = frames.at(-1)!;
    expect(heapValues(last)).toEqual([20, 20, 60, 30, 40, 70, 80, 50]);
    expect(last.heapOrder).toEqual([3, 7, 5, 1, 4, 2, 6, 0]);
    expect(last.narration).toContain("20 >= 20");
    expect(last.narration).toContain("停止上浮");
  });

  it("达到 15 个节点后拒绝继续插入", () => {
    const fifteen = Array.from({ length: 15 }, (_, index) => index);
    expect(() => heapTrace(fifteen, "insert", 15)).toThrow(
      "无法继续插入",
    );
  });

  it("所有插入帧都满足堆帧契约", () => {
    for (const target of [15, 100, 20, -5, 80])
      expectFrameContract(heapTrace(values, "insert", target));
  });
});

describe("删除堆顶", () => {
  it("末元素 80 移到根后下沉两次，共 6 帧", () => {
    const frames = heapTrace(values, "extract");
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "replace",
      "compare",
      "swap",
      "compare",
      "swap",
    ]);
    const last = frames.at(-1)!;
    expect(last.items).toHaveLength(6);
    expect(heapValues(last)).toEqual([30, 40, 60, 50, 80, 70]);
    expect(last.heapOrder).toEqual([1, 4, 5, 0, 6, 2]);
    expect(last.rootId).toBe(1);
    expect(last.narration).toContain("删除完成，当前堆顶为 30");
    expectHeapProperty(heapValues(last));
    expectFrameContract(frames);
  });

  it("10, 20, 30 删除堆顶后 20 上移，共 4 帧", () => {
    const frames = heapTrace([10, 20, 30], "extract");
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "replace",
      "compare",
      "swap",
    ]);
    expect(heapValues(frames.at(-1)!)).toEqual([20, 30]);
  });

  it("10, 100, 20 删除堆顶后 20 不需交换，共 3 帧", () => {
    const frames = heapTrace([10, 100, 20], "extract");
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "replace",
      "compare",
    ]);
    const last = frames.at(-1)!;
    expect(heapValues(last)).toEqual([20, 100]);
    expect(last.narration).toContain("20 <= 100");
    expect(last.narration).toContain("停止下沉");
  });

  it("单节点堆删除后为空，共 2 帧", () => {
    const frames = heapTrace([50], "extract");
    expect(frames.map((frame) => frame.anchor)).toEqual(["start", "replace"]);
    const last = frames.at(-1)!;
    expect(last.items).toEqual([]);
    expect(last.heapOrder).toEqual([]);
    expect(last.links).toEqual([]);
    expect(last.rootId).toBeNull();
    expect(last.active).toEqual([]);
    expect(last.narration).toBe("删除堆顶 50，堆变空。删除完成，堆为空。");
  });

  it("所有删除帧都满足堆帧契约", () => {
    for (const input of [
      values,
      [10, 20, 30],
      [10, 100, 20],
      [50],
      [10, 10],
      Array.from({ length: 15 }, (_, index) => index),
    ])
      expectFrameContract(heapTrace(input, "extract"));
  });
});

describe("代码锚点与专题元数据", () => {
  const cases = [
    ["create", 0],
    ["insert", 15],
    ["insert", 100],
    ["insert", 20],
    ["extract", 0],
  ] as const;
  const extracts: [number[], string][] = [
    [values, "extract"],
    [[10, 20, 30], "extract"],
    [[10, 100, 20], "extract"],
    [[50], "extract"],
  ];

  it("每一帧的锚点都在对应语言的模板中", () => {
    const traces = [
      ...cases.map(([operation, target]) =>
        heapTrace(values, operation, target),
      ),
      ...extracts.map(([input, operation]) => heapTrace(input, operation)),
    ];
    for (const frames of traces) {
      const anchors = new Set(frames.map((frame) => frame.anchor));
      const operation = frames.some((frame) => frame.anchor === "replace")
        ? "extract"
        : frames.some((frame) => frame.anchor === "start")
          ? "insert"
          : "create";
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

  it("未知操作回退到插入模板", () => {
    expect(heap.code("C", "bogus").map((line) => line.text)).toEqual(
      heap.code("C", "insert").map((line) => line.text),
    );
  });

  it("专题元数据与默认操作", () => {
    expect(heap.status).toBe("ready");
    expect(heap.scene).toBe("heap");
    expect(heap.controls.defaultOperation).toBe("insert");
    expect(heap.controls.randomizable).toBe(false);
    expect(heap.controls.value?.defaultValue).toBe(15);
    expect(heap.controls.operations!.map((entry) => entry.id)).toEqual([
      "create",
      "insert",
      "extract",
    ]);
    expect(
      heap.trace({ values, operation: "insert", index: 0, value: 15 }),
    ).toHaveLength(8);
  });
});

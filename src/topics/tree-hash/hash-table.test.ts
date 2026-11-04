import { describe, expect, it } from "vitest";
import { languages, parseCode } from "../../core/code";
import { hashSlot } from "../../core/hash";
import type { Frame } from "../../core/types";
import {
  DEFAULT_VALUES,
  hashTable,
  hashTableTrace,
  parseHashInput,
} from "./hash-table";
import { templates } from "./hash-table-templates";

const INPUT = "50, 23, 15, 36, 44, 8, 60";
const values = parseHashInput(INPUT);

function activeValues(frames: Frame[]) {
  return frames.map((frame) =>
    frame.active.length ? frame.items[frame.active[0]].value : undefined,
  );
}

function settledValues(frame: Frame) {
  return frame.settled.map((index) => frame.items[index].value);
}

/** 从桶头沿链边还原指定桶，验证结构与画面使用同一套 id。 */
function chainValues(frame: Frame, bucket: number): number[] {
  const next = new Map(frame.links?.map(([from, to]) => [from, to]) ?? []);
  const valuesById = new Map(
    frame.items.map((item) => [item.id, item.value] as const),
  );
  const chain: number[] = [];
  const seen = new Set<number>();
  let id = frame.bucketHeads?.[bucket] ?? null;
  while (typeof id === "number" && !seen.has(id)) {
    chain.push(valuesById.get(id)!);
    seen.add(id);
    id = next.get(id) ?? null;
  }
  return chain;
}

function expectFrameContract(frames: Frame[]) {
  for (const frame of frames) {
    expect(frame.items.map((item) => item.id)).toEqual(
      [...frame.items.map((item) => item.id)].sort((a, b) => a - b),
    );
    expect(frame.bucketHeads).toHaveLength(7);
    expect(frame.stack).toEqual([]);
    expect(frame.queue).toEqual([]);
    expect(frame.pointers).toEqual({});
    expect(frame.target).toBeUndefined();
    const ids = new Set(frame.items.map((item) => item.id));
    for (const head of frame.bucketHeads ?? [])
      if (head !== null) expect(ids.has(head)).toBe(true);
    for (const [from, to] of frame.links ?? []) {
      expect(ids.has(from)).toBe(true);
      expect(ids.has(to)).toBe(true);
    }
    for (const index of [...frame.active, ...frame.settled]) {
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(frame.items.length);
    }
    for (const bucket of frame.activeBuckets ?? []) {
      expect(bucket).toBeGreaterThanOrEqual(0);
      expect(bucket).toBeLessThan(7);
    }
    const visited = new Set<number>();
    for (let bucket = 0; bucket < 7; bucket++)
      for (const id of chainValues(frame, bucket)) visited.add(id);
    expect(visited.size).toBe(frame.items.length);
  }
}

describe("哈希表输入", () => {
  it("解析默认键序列", () => {
    expect(values).toEqual(DEFAULT_VALUES);
    expect(parseHashInput(" 50  23,15 ")).toEqual([50, 23, 15]);
    expect(parseHashInput("-8, -1, 6")).toEqual([-8, -1, 6]);
  });

  it("拒绝空输入、重复键、非法值与超大输入", () => {
    expect(() => parseHashInput("  ")).toThrow("请输入键序列");
    expect(() => parseHashInput("50, 23, 50")).toThrow("重复键 50");
    expect(() => parseHashInput("50, 1.5")).toThrow("范围 -999 到 999");
    expect(() => parseHashInput("50, 1000")).toThrow("范围 -999 到 999");
    expect(() =>
      parseHashInput(
        Array.from({ length: 16 }, (_, index) => index * 2).join(", "),
      ),
    ).toThrow("最多展示 15 个键");
  });

  it("直接调用 trace 时也校验输入与目标键", () => {
    expect(() => hashTableTrace([], "search", 1)).toThrow("请输入键序列");
    expect(() => hashTableTrace([50, 23, 50], "search", 1)).toThrow(
      "重复键 50",
    );
    expect(() => hashTableTrace(values, "search", 1.5)).toThrow("目标键");
    expect(() => hashTableTrace(values, "delete", 1000)).toThrow("目标键");
    expect(() => hashTableTrace(values, "bogus", 1)).toThrow("未知操作");
  });

  it("除留余数法对负键也归一到 0..6", () => {
    expect([0, 6, 7, -1, -7, -8].map(hashSlot)).toEqual([0, 6, 0, 6, 0, 6]);
  });
});

describe("创建", () => {
  it("逐键先哈希再比较，最后尾插，共 21 帧", () => {
    const frames = hashTableTrace(values, "create");
    expect(frames).toHaveLength(21);
    expect(frames.filter((frame) => frame.anchor === "hash")).toHaveLength(7);
    expect(frames.filter((frame) => frame.anchor === "compare")).toHaveLength(
      7,
    );
    expect(frames.filter((frame) => frame.anchor === "insert")).toHaveLength(7);

    const first = frames[0];
    expect(first.anchor).toBe("hash");
    expect(first.items).toEqual([]);
    expect(first.activeBuckets).toEqual([1]);
    expect(first.variables).toMatchObject({ key: 50, bucket: 1, size: 0 });
    expect(first.narration).toContain("定位到 1 号桶");

    const second = frames[1];
    expect(second.anchor).toBe("insert");
    expect(second.items).toEqual([{ id: 0, value: 50 }]);
    expect(second.bucketHeads).toEqual([null, 0, null, null, null, null, null]);
    expect(activeValues([second])).toEqual([50]);
    expect(second.activeBuckets).toEqual([1]);
  });

  it("最终桶分布与冲突链符合默认数据", () => {
    const last = hashTableTrace(values, "create").at(-1)!;
    expect(last.items.map((item) => item.value)).toEqual(DEFAULT_VALUES);
    expect(last.bucketHeads).toEqual([null, 0, 1, null, 6, null, null]);
    expect(last.links).toEqual([
      [0, 2],
      [2, 3],
      [3, 5],
      [1, 4],
    ]);
    expect(chainValues(last, 1)).toEqual([50, 15, 36, 8]);
    expect(chainValues(last, 2)).toEqual([23, 44]);
    expect(chainValues(last, 4)).toEqual([60]);
    expect(activeValues([last])).toEqual([60]);
    expect(last.narration).toContain("建表完成，共 7 个键");
  });

  it("所有帧都满足哈希帧契约", () => {
    expectFrameContract(hashTableTrace(values, "create"));
  });
});

describe("查找", () => {
  it("命中 8 时沿 1 号桶依次比较 50、15、36、8", () => {
    const frames = hashTableTrace(values, "search", 8);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "hash",
      "compare",
      "compare",
      "compare",
      "found",
    ]);
    expect(activeValues(frames)).toEqual([
      undefined,
      undefined,
      50,
      15,
      36,
      8,
    ]);
    expect(frames[0].activeBuckets).toEqual([]);
    expect(frames[1].activeBuckets).toEqual([1]);
    expect(frames[1].variables).toMatchObject({ key: 8, bucket: 1 });
    expect(settledValues(frames.at(-1)!)).toEqual([50, 15, 36]);
    expect(frames.at(-1)!.narration).toContain("找到 8");
  });

  it("未命中 29 时沿链走到链尾 8", () => {
    const frames = hashTableTrace(values, "search", 29);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "hash",
      "compare",
      "compare",
      "compare",
      "miss",
    ]);
    const last = frames.at(-1)!;
    expect(activeValues([last])).toEqual([8]);
    expect(settledValues(last)).toEqual([50, 15, 36]);
    expect(last.narration).toContain("链结束，未找到 29");
  });

  it("空桶 3 直接未命中，只有三帧", () => {
    const frames = hashTableTrace(values, "search", 10);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "hash",
      "miss",
    ]);
    expect(frames.at(-1)!.activeBuckets).toEqual([3]);
    expect(frames.at(-1)!.narration).toContain("3 号桶为空");
    expectFrameContract(frames);
  });

  it("负键 -3 定位到 4 号桶", () => {
    const frames = hashTableTrace(values, "search", -3);
    expect(frames[1].variables).toMatchObject({ key: -3, bucket: 4 });
    expect(frames.at(-1)!.activeBuckets).toEqual([4]);
    expect(frames.at(-1)!.anchor).toBe("miss");
    expect(frames.at(-1)!.narration).toContain("未找到 -3");
  });

  it("所有查找帧都满足哈希帧契约", () => {
    for (const target of [8, 29, 10, -3, 60, 50])
      expectFrameContract(hashTableTrace(values, "search", target));
  });
});

describe("插入", () => {
  it("29 追加到 1 号桶链尾", () => {
    const frames = hashTableTrace(values, "insert", 29);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "hash",
      "compare",
      "compare",
      "compare",
      "compare",
      "insert",
    ]);
    const last = frames.at(-1)!;
    expect(last.items).toHaveLength(8);
    expect(last.items.at(-1)).toEqual({ id: 7, value: 29 });
    expect(chainValues(last, 1)).toEqual([50, 15, 36, 8, 29]);
    expect(last.links).toContainEqual([5, 7]);
    expect(activeValues([last])).toEqual([29]);
    expect(settledValues(last)).toEqual([50, 15, 36, 8]);
    expect(last.narration).toContain("插入完成，共 8 个键");
  });

  it("已存在的 44 不重复插入", () => {
    const frames = hashTableTrace(values, "insert", 44);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "hash",
      "compare",
      "exists",
    ]);
    const last = frames.at(-1)!;
    expect(last.items).toHaveLength(7);
    expect(last.links).toEqual(hashTableTrace(values, "create").at(-1)!.links);
    expect(activeValues([last])).toEqual([44]);
    expect(settledValues(last)).toEqual([23]);
    expect(last.narration).toContain("不重复插入");
  });

  it("空桶 3 直接插入 10", () => {
    const frames = hashTableTrace(values, "insert", 10);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "hash",
      "insert",
    ]);
    const last = frames.at(-1)!;
    expect(last.bucketHeads?.[3]).toBe(7);
    expect(chainValues(last, 3)).toEqual([10]);
  });

  it("达到 15 个键后拒绝新键，但已存在的键仍返回 exists", () => {
    const fifteen = Array.from({ length: 15 }, (_, index) => index + 1);
    expect(() => hashTableTrace(fifteen, "insert", 16)).toThrow(
      "无法继续插入",
    );
    expect(hashTableTrace(fifteen, "insert", 15).at(-1)!.anchor).toBe(
      "exists",
    );
  });

  it("所有插入帧都满足哈希帧契约", () => {
    for (const target of [29, 44, 10, -3])
      expectFrameContract(hashTableTrace(values, "insert", target));
  });
});

describe("删除", () => {
  it("删除链中 15：前驱 50 指向后继 36", () => {
    const frames = hashTableTrace(values, "delete", 15);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "hash",
      "compare",
      "found",
      "remove",
    ]);
    const last = frames.at(-1)!;
    expect(chainValues(last, 1)).toEqual([50, 36, 8]);
    expect(last.links).toEqual([
      [0, 3],
      [3, 5],
      [1, 4],
    ]);
    expect(activeValues([last])).toEqual([50]);
    expect(last.narration).toContain("前驱 50 指向后继 36");
    expect(last.items.map((item) => item.value)).not.toContain(15);
  });

  it("删除链头 50：15 成为新链头", () => {
    const frames = hashTableTrace(values, "delete", 50);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "hash",
      "found",
      "remove",
    ]);
    const last = frames.at(-1)!;
    expect(last.bucketHeads?.[1]).toBe(2);
    expect(chainValues(last, 1)).toEqual([15, 36, 8]);
    expect(activeValues([last])).toEqual([15]);
    expect(last.narration).toContain("链头 50");
    expect(last.narration).toContain("链头改为 15");
  });

  it("删除链尾 8：前驱 36 指向空", () => {
    const frames = hashTableTrace(values, "delete", 8);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "hash",
      "compare",
      "compare",
      "compare",
      "found",
      "remove",
    ]);
    const last = frames.at(-1)!;
    expect(chainValues(last, 1)).toEqual([50, 15, 36]);
    expect(last.links).toEqual([
      [0, 2],
      [2, 3],
      [1, 4],
    ]);
    expect(activeValues([last])).toEqual([36]);
    expect(last.narration).toContain("指向空");
  });

  it("删除唯一节点 60：4 号桶变空", () => {
    const frames = hashTableTrace(values, "delete", 60);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "hash",
      "found",
      "remove",
    ]);
    const last = frames.at(-1)!;
    expect(last.bucketHeads?.[4]).toBeNull();
    expect(chainValues(last, 4)).toEqual([]);
    expect(last.active).toEqual([]);
    expect(last.narration).toContain("桶变空");
  });

  it("删除 2 号桶链头 23：44 成为新链头", () => {
    const last = hashTableTrace(values, "delete", 23).at(-1)!;
    expect(last.bucketHeads?.[2]).toBe(4);
    expect(chainValues(last, 2)).toEqual([44]);
    expect(last.narration).toContain("链头改为 44");
  });

  it("未命中 29 时不修改结构", () => {
    const frames = hashTableTrace(values, "delete", 29);
    expect(frames.map((frame) => frame.anchor)).toEqual([
      "start",
      "hash",
      "compare",
      "compare",
      "compare",
      "miss",
    ]);
    const last = frames.at(-1)!;
    expect(last.items).toHaveLength(7);
    expect(last.bucketHeads).toEqual([null, 0, 1, null, 6, null, null]);
    expect(last.links).toEqual(hashTableTrace(values, "create").at(-1)!.links);
    expect(last.narration).toContain("删除取消");
  });

  it("所有删除帧都满足哈希帧契约", () => {
    for (const target of [15, 50, 8, 60, 23, 29])
      expectFrameContract(hashTableTrace(values, "delete", target));
  });
});

describe("代码锚点与专题元数据", () => {
  const cases = [
    ["create", 0],
    ["search", 8],
    ["search", 29],
    ["search", 10],
    ["insert", 29],
    ["insert", 44],
    ["insert", 10],
    ["delete", 15],
    ["delete", 50],
    ["delete", 8],
    ["delete", 60],
    ["delete", 29],
  ] as const;

  it("每一帧的锚点都在六种语言模板中", () => {
    for (const [operation, target] of cases) {
      const anchors = new Set(
        hashTableTrace(values, operation, target).map(
          (frame) => frame.anchor,
        ),
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
    expect(hashTable.code("C", "bogus").map((line) => line.text)).toEqual(
      hashTable.code("C", "search").map((line) => line.text),
    );
  });

  it("专题元数据与默认操作", () => {
    expect(hashTable.status).toBe("ready");
    expect(hashTable.scene).toBe("hash");
    expect(hashTable.controls.defaultOperation).toBe("search");
    expect(hashTable.controls.randomizable).toBe(false);
    expect(hashTable.controls.value?.defaultValue).toBe(8);
    expect(hashTable.controls.operations!.map((entry) => entry.id)).toEqual([
      "create",
      "search",
      "insert",
      "delete",
    ]);
    expect(
      hashTable.trace({ values, operation: "search", index: 0, value: 8 }),
    ).toHaveLength(6);
  });
});

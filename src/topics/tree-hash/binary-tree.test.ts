import { describe, expect, it } from "vitest";
import { languages, parseCode } from "../../core/code";
import { treeDepthOf } from "../../components/tree-layout";
import { binaryTree, binaryTreeTrace, parseTreeInput } from "./binary-tree";
import { templates } from "./binary-tree-templates";

const INPUT = "1, 2, 4, #, #, 5, #, #, 3, 6, #, #, 7, #, #";
const values = parseTreeInput(INPUT);

function visited(frames: ReturnType<typeof binaryTreeTrace>) {
  return frames
    .filter((frame) => frame.anchor === "visit")
    .map((frame) => frame.items[frame.active[0]].value);
}

function stackOf(
  frames: ReturnType<typeof binaryTreeTrace>,
  narration: string,
) {
  return frames.find((frame) => frame.narration.startsWith(narration))!.stack;
}

describe("前序序列解析", () => {
  it("按默认输入生成记号，并用 NaN 表示空位", () => {
    expect(values).toHaveLength(15);
    expect(values.filter(Number.isNaN)).toHaveLength(8);
    expect(values.slice(0, 6)).toEqual([1, 2, 4, NaN, NaN, 5]);
    expect(parseTreeInput("1, null, 2, #, #")).toEqual([
      1,
      NaN,
      2,
      NaN,
      NaN,
    ]);
  });

  it("拒绝空输入、未知记号与越界值", () => {
    expect(() => parseTreeInput("  ")).toThrow("请输入前序序列");
    expect(() => parseTreeInput("1, x, #, #, #")).toThrow("无法识别记号");
    expect(() => parseTreeInput("1, 1000, #, #, #")).toThrow("节点值");
    expect(() => parseTreeInput("1.5, #, #")).toThrow("无法识别记号");
  });

  it("限制记号数与非空节点数", () => {
    expect(() => parseTreeInput(Array(32).fill("#").join(", "))).toThrow(
      "最多展示 15 个节点",
    );
    expect(() =>
      parseTreeInput(Array.from({ length: 16 }, () => "1").join(", ")),
    ).toThrow("最多展示 15 个节点");
  });
});

describe("建树", () => {
  it("每帧创建一个节点，并按前序记录父子边", () => {
    const frames = binaryTreeTrace(values, "create");
    expect(frames).toHaveLength(7);
    expect(frames.map((frame) => frame.active[0])).toEqual([
      0, 1, 2, 3, 4, 5, 6,
    ]);
    expect(frames.at(-1)!.narration).toContain("建树完成，共 7 个节点");
    expect(frames.at(-1)!.items.map((item) => item.value)).toEqual([
      1, 2, 4, 5, 3, 6, 7,
    ]);
    expect(frames.at(-1)!.links).toEqual([
      [0, 1, "left"],
      [0, 4, "right"],
      [1, 2, "left"],
      [1, 3, "right"],
      [4, 5, "left"],
      [4, 6, "right"],
    ]);
    expect(frames.every((frame) => frame.rootId === 0)).toBe(true);
    expect(frames[0].narration).toBe("读取 1，创建根节点。");
    expect(frames[1].narration).toBe("读取 2，作为 1 的左孩子。");
    expect(frames[2].narration).toBe("读取 4，作为 2 的左孩子。");
  });

  it("创建帧只包含已经出现的节点与边", () => {
    const frames = binaryTreeTrace(values, "create");
    frames.forEach((frame, index) => {
      expect(frame.items).toHaveLength(index + 1);
      expect(frame.links!.every(([, to]) => to <= index)).toBe(true);
      expect(frame.settled).toEqual([]);
    });
  });
});

describe("四种遍历", () => {
  it.each([
    ["preorder", [1, 2, 4, 5, 3, 6, 7]],
    ["inorder", [4, 2, 5, 1, 6, 3, 7]],
    ["postorder", [4, 5, 2, 6, 7, 3, 1]],
    ["levelorder", [1, 2, 3, 4, 5, 6, 7]],
  ])("%s 的访问顺序", (operation, expected) => {
    const frames = binaryTreeTrace(values, operation);
    expect(visited(frames)).toEqual(expected);
    expect(frames).toHaveLength(8);
  });

  it.each(["preorder", "inorder", "postorder", "levelorder"])(
    "%s 的准备帧与收尾帧",
    (operation) => {
      const frames = binaryTreeTrace(values, operation);
      const prepare = frames[0];
      expect(prepare.anchor).toBe("start");
      expect(prepare.active).toEqual([]);
      expect(prepare.settled).toEqual([]);
      expect(prepare.items).toHaveLength(7);
      expect(prepare.links).toHaveLength(6);
      expect(frames.at(-1)!.narration).toContain("遍历完成");
      const last = frames.at(-1)!;
      expect(last.settled).toHaveLength(6);
      expect(last.active).toHaveLength(1);
      expect(last.settled).not.toContain(last.active[0]);
    },
  );

  it("递归栈显示当前路径", () => {
    expect(stackOf(binaryTreeTrace(values, "preorder"), "访问 4")).toEqual([
      "preorder(1)",
      "preorder(2)",
      "preorder(4)",
    ]);
    expect(stackOf(binaryTreeTrace(values, "inorder"), "左子树处理完，访问 4"))
      .toEqual(["inorder(1)", "inorder(2)", "inorder(4)"]);
    expect(stackOf(binaryTreeTrace(values, "postorder"), "左右子树处理完，访问 4"))
      .toEqual(["postorder(1)", "postorder(2)", "postorder(4)"]);
  });

  it("层序遍历维护队列", () => {
    const frames = binaryTreeTrace(values, "levelorder");
    expect(frames[0].queue).toEqual(["1"]);
    expect(frames[0].narration).toBe(
      "准备层序遍历：根节点 1 入队，逐层访问。",
    );
    expect(frames[1].queue).toEqual(["2", "3"]);
    expect(frames[1].narration).toBe(
      "出队 1，访问；左孩子 2、右孩子 3 入队。",
    );
    expect(frames.at(-1)!.queue).toEqual([]);
    expect(frames.every((frame) => frame.stack.length === 0)).toBe(true);
  });
});

describe("特殊形状", () => {
  it("只有右孩子时用 right 标记", () => {
    const frames = binaryTreeTrace([1, NaN, 2, NaN, NaN], "preorder");
    expect(frames[0].links).toEqual([[0, 1, "right"]]);
    expect(visited(frames)).toEqual([1, 2]);
  });

  it("只有左孩子时用 left 标记", () => {
    const frames = binaryTreeTrace([1, 2, NaN, NaN, NaN], "preorder");
    expect(frames[0].links).toEqual([[0, 1, "left"]]);
    expect(visited(frames)).toEqual([1, 2]);
  });

  it("15 节点左斜树", () => {
    const tokens = [
      ...Array.from({ length: 15 }, (_, index) => index + 1),
      ...Array(16).fill(NaN),
    ];
    const frames = binaryTreeTrace(tokens, "preorder");
    expect(frames[0].items).toHaveLength(15);
    expect(treeDepthOf(frames[0])).toBe(14);
    expect(frames[0].links!.every(([, , side]) => side === "left")).toBe(true);
    expect(binaryTreeTrace(tokens, "preorder")).toHaveLength(16);
  });
});

describe("锚点与错误", () => {
  it("每一帧的锚点都在六种语言模板中", () => {
    for (const operation of [
      "create",
      "preorder",
      "inorder",
      "postorder",
      "levelorder",
    ]) {
      const anchors = new Set(
        binaryTreeTrace(values, operation).map((frame) => frame.anchor),
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

  it("未知操作回退到前序模板", () => {
    expect(() => binaryTreeTrace(values, "bogus")).toThrow("未知操作");
    expect(
      binaryTree.code("C", "bogus").map((line) => line.text),
    ).toEqual(binaryTree.code("C", "preorder").map((line) => line.text));
  });

  it("序列不完整、多余或根为空", () => {
    expect(() => binaryTreeTrace([1, NaN], "preorder")).toThrow(
      "前序序列不完整",
    );
    expect(() => binaryTreeTrace([1, NaN, NaN, 2], "preorder")).toThrow(
      "多余记号",
    );
    expect(() => binaryTreeTrace([NaN], "preorder")).toThrow("根节点不能为空");
    expect(() => binaryTreeTrace([], "preorder")).toThrow("请输入前序序列");
  });

  it("专题元数据与默认操作", () => {
    expect(binaryTree.status).toBe("ready");
    expect(binaryTree.scene).toBe("tree");
    expect(binaryTree.controls.defaultOperation).toBe("preorder");
    expect(binaryTree.controls.randomizable).toBe(false);
    expect(binaryTree.controls.operations!.map((entry) => entry.id)).toEqual([
      "create",
      "preorder",
      "inorder",
      "postorder",
      "levelorder",
    ]);
    expect(
      binaryTree.trace({ values, operation: "inorder", index: 0, value: 0 }),
    ).toHaveLength(8);
  });
});

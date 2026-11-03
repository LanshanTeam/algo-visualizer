import { describe, expect, it } from "vitest";
import { languages } from "../../core/code";
import { STACK_CAPACITY, stack, stackTrace } from "./stack";

describe("栈", () => {
  it("入栈只追加到末尾，栈底元素不动", () => {
    const frames = stackTrace([43, 27, 65], "push", 99);
    const last = frames.at(-1)!;
    expect(last.items.map((item) => item.value)).toEqual([43, 27, 65, 99]);
    expect(last.items[0].id).toBe(0);
    expect(last.pointers).toEqual({ top: 3 });
  });
  it("出栈移除栈顶，其余元素保持原位置", () => {
    const frames = stackTrace([43, 27, 65], "pop", 0);
    const last = frames.at(-1)!;
    expect(last.items.map((item) => item.value)).toEqual([43, 27]);
    expect(last.items.map((item) => item.id)).toEqual([0, 1]);
    expect(last.pointers).toEqual({ top: 1 });
  });
  it("取栈顶不改变内容", () => {
    const frames = stackTrace([43, 27, 65], "peek", 0);
    expect(frames.at(-1)!.items).toHaveLength(3);
    expect(frames[2].anchor).toBe("top");
    expect(frames[2].narration).toContain("65");
  });
  it("栈满时不再入栈，只提示溢出", () => {
    const full = Array.from({ length: STACK_CAPACITY }, (_, i) => i);
    const frames = stackTrace(full, "push", 9);
    expect(frames.at(-1)!.anchor).toBe("check");
    expect(frames.at(-1)!.items).toHaveLength(STACK_CAPACITY);
    expect(frames.at(-1)!.narration).toContain("栈满");
  });
  it("空栈出栈与取栈顶只提示下溢", () => {
    for (const operation of ["pop", "peek"])
      expect(stackTrace([], operation, 0).at(-1)!.narration).toContain("栈空");
  });
  it("top 指针始终指向栈顶", () => {
    for (const operation of ["push", "pop", "peek"] as const)
      for (const frame of stackTrace([1, 2, 3], operation, 8))
        if (frame.items.length)
          expect(frame.pointers.top).toBe(frame.items.length - 1);
        else expect(frame.pointers).toEqual({});
  });
  it("拒绝超长初始栈与非整数入栈值", () => {
    expect(() => stackTrace(Array(7).fill(0), "push", 1)).toThrow();
    expect(() => stackTrace([], "push", 1.5)).toThrow();
  });
  it("所有语言覆盖每个语义步骤", () => {
    for (const operation of ["push", "pop", "peek"] as const)
      for (const frame of stackTrace([1, 2, 3], operation, 9))
        for (const language of languages)
          expect(
            stack.code(language, operation).some(
              (line) => line.anchor === frame.anchor,
            ),
          ).toBe(true);
  });
  it("栈对队列一样声明固定容量", () => {
    expect(stack.controls.capacity).toBe(STACK_CAPACITY);
    expect(stack.scene).toBe("stack");
  });
});

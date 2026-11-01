export type Topic = "linked-list" | "quick-sort";
export type Language = "C" | "C++" | "Python" | "Go" | "Rust";
export type Operation = "insert" | "delete" | "find";
export interface Item {
  id: number;
  value: number;
}
export interface Frame {
  items: Item[];
  active: number[];
  settled: number[];
  pointers: Record<string, number>;
  anchor: string;
  narration: string;
  variables: Record<string, number | string>;
  stack: string[];
  links?: Array<[number, number]>;
  detached?: number;
  headId?: number | null;
}
export function parseValues(text: string): number[] {
  if (!text.trim()) return [];
  const tokens = text.trim().split(/[,，\s]+/);
  if (
    tokens.length > 12 ||
    tokens.some(
      (token) => !/^-?\d+$/.test(token) || Math.abs(Number(token)) > 999,
    )
  )
    throw new Error("请输入最多 12 个整数，范围 -999 到 999。");
  return tokens.map(Number);
}
export function quickSortTrace(values: number[]): Frame[] {
  const items = values.map((value, id) => ({ id, value }));
  const frames: Frame[] = [];
  const settled: number[] = [];
  const stack: string[] = [];
  function emit(
    anchor: string,
    narration: string,
    pointers: Record<string, number> = {},
    active: number[] = [],
    variables: Frame["variables"] = {},
  ) {
    frames.push({
      items: items.map((item) => ({ ...item })),
      anchor,
      narration,
      pointers,
      active,
      variables,
      settled: [...settled],
      stack: [...stack],
    });
  }
  emit(
    "start",
    values.length > 1
      ? "从 low 到 high，对当前区间进行分区。"
      : "区间长度不超过 1，无需分区。",
    values.length ? { low: 0, high: values.length - 1 } : {},
    [],
    { low: 0, high: values.length - 1 },
  );
  function sort(low: number, high: number) {
    if (low > high) return;
    if (low === high) {
      settled.push(low);
      emit("base", "区间只有一个元素，无需排序。", {}, [low]);
      return;
    }
    stack.push(`[${low}, ${high}]`);
    const pivot = items[high].value;
    let i = low;
    emit(
      "pivot",
      `以 ${pivot} 为基准，i 标记下一个较小元素的位置。`,
      { i, pivot: high },
      [high],
      { low, high, pivot, i },
    );
    for (let j = low; j < high; j++) {
      emit(
        "compare",
        `比较 ${items[j].value} 与基准 ${pivot}。`,
        { i, j, pivot: high },
        [j, high],
        { low, high, pivot, i, j },
      );
      if (items[j].value < pivot) {
        [items[i], items[j]] = [items[j], items[i]];
        emit(
          "swap",
          i === j
            ? `位置 ${i} 已在较小元素区间，保持原位。`
            : `将较小元素移到左侧分区，交换位置 ${i} 和 ${j}。`,
          { i, j, pivot: high },
          [i, j],
          { low, high, pivot, i, j },
        );
        i++;
        emit(
          "advance",
          "左侧分区扩大，i 向右移动。",
          { i, j, pivot: high },
          [],
          { low, high, pivot, i, j },
        );
      }
    }
    [items[i], items[high]] = [items[high], items[i]];
    settled.push(i);
    emit("place", `基准 ${pivot} 归位到索引 ${i}。`, { pivot: i }, [i], {
      low,
      high,
      pivot,
      i,
    });
    emit("recurse", "分别排序基准左侧和右侧的子区间。", {}, [], {
      low,
      high,
      i,
    });
    sort(low, i - 1);
    sort(i + 1, high);
    stack.pop();
  }
  sort(0, items.length - 1);
  emit("done", "排序完成，所有元素按升序排列。");
  return frames;
}
export function linkedListTrace(
  values: number[],
  operation: Operation,
  index: number,
  value: number,
): Frame[] {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index > values.length ||
    (operation !== "insert" && index === values.length)
  )
    throw new Error("操作位置超出链表范围。");
  if (!Number.isInteger(value) || Math.abs(value) > 999)
    throw new Error("节点值须为 -999 到 999 的整数。");
  if (operation === "insert" && values.length >= 12)
    throw new Error("最多展示 12 个节点。");
  let items = values.map((value, id) => ({ id, value }));
  let links: Array<[number, number]> = items
    .slice(1)
    .map((item, i) => [items[i].id, item.id]);
  const frames: Frame[] = [];
  let headId: number | null = items[0]?.id ?? null;
  function emit(
    anchor: string,
    narration: string,
    active: number[] = [],
    pointers: Record<string, number> = {},
    detached?: number,
  ) {
    frames.push({
      items: items.map((item) => ({ ...item })),
      links: links.map((link) => [...link] as [number, number]),
      active,
      pointers: {
        ...(headId === null
          ? {}
          : { head: items.findIndex((item) => item.id === headId) }),
        ...pointers,
      },
      detached,
      headId,
      settled: [],
      anchor,
      narration,
      variables:
        operation === "insert"
          ? { index, value, length: items.length }
          : { index, length: items.length },
      stack: [],
    });
  }
  emit(
    "start",
    "head 指向首节点，每个节点通过 next 连接后继。",
    [],
    items.length ? { head: 0 } : {},
  );
  const context = {
    ...(index > 0 ? { prev: index - 1 } : {}),
    ...(index < values.length ? { curr: index } : {}),
  };
  for (let current = 1; current <= index; current++) {
    const atEnd = current === values.length;
    emit(
      "walk",
      atEnd
        ? "抵达尾部，curr 为空。"
        : `沿 next 移到索引 ${current}，节点值为 ${items[current].value}。`,
      [atEnd ? current - 1 : current],
      {
        ...(operation !== "find" ? { prev: current - 1 } : {}),
        ...(atEnd ? {} : { curr: current }),
      },
    );
  }
  if (operation === "find")
    emit(
      "result",
      `找到索引 ${index}，节点值为 ${items[index].value}。`,
      [index],
      { curr: index },
    );
  if (operation === "insert") {
    const newNode = { id: values.length, value };
    items = [...items, newNode];
    emit(
      "allocate",
      `创建值为 ${value} 的新节点。`,
      [items.length - 1],
      { ...context, newNode: items.length - 1 },
      newNode.id,
    );
    if (index < values.length) links.push([newNode.id, index]);
    emit(
      "connect",
      "先让新节点指向原来的后继，保留后续链路。",
      [items.length - 1],
      { ...context, newNode: items.length - 1 },
      newNode.id,
    );
    if (index > 0) {
      links = links.filter(([from]) => from !== index - 1);
      links.push([index - 1, newNode.id]);
    }
    items = [...items.slice(0, index), newNode, ...items.slice(index, -1)];
    if (index === 0) headId = newNode.id;
    emit(
      "commit",
      index === 0
        ? "更新 head，让它指向新节点。"
        : "将前驱的 next 指向新节点，插入完成。",
      [index],
      { ...(index > 0 ? { prev: index - 1 } : {}), newNode: index },
    );
  }
  if (operation === "delete") {
    const target = items[index];
    links = links.filter(([, to]) => to !== target.id);
    if (index > 0 && index + 1 < items.length)
      links.push([items[index - 1].id, items[index + 1].id]);
    if (index === 0) headId = items[index + 1]?.id ?? null;
    emit(
      "bypass",
      index === 0
        ? "将 head 移到后继节点。"
        : "让前驱绕过目标节点，直接连接后继。",
      [index],
      context,
      target.id,
    );
    items = items.filter((item) => item.id !== target.id);
    links = links.filter(([from]) => from !== target.id);
    emit(
      "remove",
      "移除目标节点，后续链路保持完整。",
      [],
      items.length ? { head: 0 } : {},
    );
  }
  emit("done", "操作完成。");
  return frames;
}

import { GitBranch } from "lucide-react";
import { parseCode } from "../../core/code";
import type { Frame, Language } from "../../core/types";
import type { ReadyTopic } from "../types";

const templates: Record<Language, Record<string, string>> = {
  C: {
    insert: `Node* insert(Node* head, int index, int value) { // @start
  Node *prev = NULL, *curr = head;
  for (int i = 0; i < index; i++) {
    prev = curr; curr = curr->next; // @walk
  }
  Node* node = malloc(sizeof *node); // @allocate
  if (!node) return head;
  node->value = value;
  node->next = curr; // @connect
  if (prev) prev->next = node; else head = node; // @commit
  return head;
} // @done`,
    delete: `Node* removeAt(Node* head, int index) { // @start
  Node *prev = NULL, *curr = head;
  for (int i = 0; i < index; i++) {
    prev = curr; curr = curr->next; // @walk
  }
  if (prev) prev->next = curr->next; else head = curr->next; // @bypass
  free(curr); // @remove
  return head;
} // @done`,
    find: `int get(Node* head, int index) { // @start
  Node* curr = head;
  for (int i = 0; i < index; i++) {
    curr = curr->next; // @walk
  }
  return curr->value; // @result
} // @done`,
  },
  Python: {
    insert: `def insert(head, index, value): # @start
    prev, curr = None, head
    for _ in range(index):
        prev, curr = curr, curr.next # @walk
    node = Node(value) # @allocate
    node.next = curr # @connect
    if prev: prev.next = node # @commit
    else: head = node
    return head # @done`,
    delete: `def remove(head, index): # @start
    prev, curr = None, head
    for _ in range(index):
        prev, curr = curr, curr.next # @walk
    if prev: prev.next = curr.next # @bypass
    else: head = curr.next
    curr = None # @remove
    return head # @done`,
    find: `def get(head, index): # @start
    curr = head
    for _ in range(index):
        curr = curr.next # @walk
    return curr.value # @result
# @done`,
  },
  "C++": {
    insert: `Node* insert(Node* head, int index, int value) { // @start
  Node *prev = nullptr, *curr = head;
  for (int i = 0; i < index; ++i) {
    prev = curr; curr = curr->next; // @walk
  }
  Node* node = new Node{value, nullptr}; // @allocate
  node->next = curr; // @connect
  if (prev) prev->next = node; else head = node; // @commit
  return head;
} // @done`,
    delete: `Node* remove(Node* head, int index) { // @start
  Node *prev = nullptr, *curr = head;
  for (int i = 0; i < index; ++i) {
    prev = curr; curr = curr->next; // @walk
  }
  if (prev) prev->next = curr->next; else head = curr->next; // @bypass
  delete curr; // @remove
  return head;
} // @done`,
    find: `int get(Node* head, int index) { // @start
  Node* curr = head;
  for (int i = 0; i < index; ++i) {
    curr = curr->next; // @walk
  }
  return curr->value; // @result
} // @done`,
  },
  Go: {
    insert: `func insert(head *Node, index, value int) *Node { // @start
    var prev *Node
    curr := head
    for i := 0; i < index; i++ {
        prev, curr = curr, curr.next // @walk
    }
    node := &Node{value: value} // @allocate
    node.next = curr // @connect
    if prev != nil { prev.next = node } else { head = node } // @commit
    return head
} // @done`,
    delete: `func remove(head *Node, index int) *Node { // @start
    var prev *Node
    curr := head
    for i := 0; i < index; i++ {
        prev, curr = curr, curr.next // @walk
    }
    if prev != nil { prev.next = curr.next } else { head = curr.next } // @bypass
    curr = nil // @remove
    return head
} // @done`,
    find: `func get(head *Node, index int) int { // @start
    curr := head
    for i := 0; i < index; i++ {
        curr = curr.next // @walk
    }
    return curr.value // @result
} // @done`,
  },
  Rust: {
    insert: `fn insert(head: &mut Option<Box<Node>>, index: usize, value: i32) { // @start
    let mut link = head;
    for _ in 0..index {
        link = &mut link.as_mut().unwrap().next; // @walk
    }
    let mut node = Box::new(Node { value, next: None }); // @allocate
    node.next = link.take(); // @connect
    *link = Some(node); // @commit
} // @done`,
    delete: `fn remove(head: &mut Option<Box<Node>>, index: usize) { // @start
    let mut link = head;
    for _ in 0..index {
        link = &mut link.as_mut().unwrap().next; // @walk
    }
    let mut removed = link.take().unwrap();
    *link = removed.next.take(); // @bypass
    drop(removed); // @remove
} // @done`,
    find: `fn get(head: &Option<Box<Node>>, index: usize) -> i32 { // @start
    let mut curr = head.as_ref();
    for _ in 0..index {
        curr = curr.unwrap().next.as_ref(); // @walk
    }
    curr.unwrap().value // @result
} // @done`,
  },
};

export function linkedListTrace(
  values: number[],
  operation: string,
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

export const linkedList: ReadyTopic = {
  id: "linked-list",
  group: "linear",
  title: "单链表",
  badge: "O(n)",
  summary: "按索引沿 next 遍历，插入与删除只改指针。",
  status: "ready",
  scene: "linked-list",
  icon: GitBranch,
  controls: {
    dataLabel: "初始链表",
    defaultValues: [12, 24, 36, 48],
    operations: [
      { id: "insert", label: "插入" },
      { id: "delete", label: "删除" },
      { id: "find", label: "查询" },
    ],
    index: {
      label: "索引",
      max: ({ length, operation }) =>
        operation === "insert" ? length : Math.max(0, length - 1),
    },
    value: { label: "节点值", onlyFor: ["insert"] },
  },
  legend: [
    { label: "当前操作", tone: "active" },
    { label: "未处理", tone: "idle" },
  ],
  theory: [
    {
      title: "链式存储",
      body: "每个节点包含 value 和 next。head 指向首节点，尾节点的 next 为空；节点无需连续存储。",
    },
    {
      title: "指针操作",
      body: "插入时先连接新节点与后继，再更新前驱或 head。删除时让前驱绕过目标节点。索引从 0 开始。",
    },
    {
      title: "复杂度",
      body: "查询及按索引增删为 O(n)；已知前驱时，指针修改为 O(1)。额外空间 O(1)。",
    },
  ],
  trace: ({ values, operation, index, value }) =>
    linkedListTrace(values, operation, index, value),
  code: (language, operation) =>
    parseCode(templates[language][operation] ?? templates[language].insert),
};

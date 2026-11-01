/** 全站共享的数据契约。专题模块只依赖这里，不互相引用。 */

export type Language = "C" | "C++" | "Python" | "Go" | "Java" | "Rust";

/**
 * 动画画布支持的布局模型。
 * 新增布局时同步扩展 `ImplementedSceneKind`，否则专题无法标记为 ready。
 */
export type SceneKind = "array" | "linked-list" | "graph" | "tree";

/** 渲染器当前真正实现的布局。 */
export type ImplementedSceneKind = "array" | "linked-list";

export interface Item {
  id: number;
  value: number;
}

/** 一个可回放的演示快照。 */
export interface Frame {
  items: Item[];
  /** 当前操作涉及的节点，渲染为高亮。 */
  active: number[];
  /** 已归位的节点。 */
  settled: number[];
  /** 指针名到 `items` 下标的映射。 */
  pointers: Record<string, number>;
  /** 语义步骤标识，与代码行的 `@anchor` 对应。 */
  anchor: string;
  narration: string;
  variables: Record<string, number | string>;
  /** 递归 / 调用栈，非空时工作台会展示。 */
  stack: string[];
  /** 有向连线，元素为 `[fromId, toId]`。 */
  links?: Array<[number, number]>;
  detached?: number;
  headId?: number | null;
  /** 树 / 图场景的显式节点坐标（逻辑单位），由 scene 层消费。 */
  positions?: Record<number, { x: number; y: number }>;
}

export interface CodeLine {
  text: string;
  anchor?: string;
}

/** 专题的 trace 函数收到的统一输入。 */
export interface TraceInput {
  values: number[];
  operation: string;
  index: number;
  value: number;
}

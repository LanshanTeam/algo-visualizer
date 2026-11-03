/** 全站共享的数据契约。专题模块只依赖这里，不互相引用。 */

export type Language = "C" | "C++" | "Python" | "Go" | "Java" | "Rust";

/**
 * 动画画布支持的布局模型。
 * 新增布局时同步扩展 `ImplementedSceneKind`，否则专题无法标记为 ready。
 */
export type SceneKind =
  | "array"
  | "linked-list"
  | "graph"
  | "tree"
  | "hash";

/** 渲染器当前真正实现的布局。 */
export type ImplementedSceneKind =
  | "array"
  | "linked-list"
  | "tree"
  | "hash";

export interface Item {
  id: number;
  value: number;
}

/** 树连线指向的是父节点的左孩子还是右孩子。 */
export type FrameLinkSide = "left" | "right";

/** 有向连线；树布局用第三项区分左右孩子，其他布局可省略。 */
export type FrameLink = [from: number, to: number, side?: FrameLinkSide];

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
  /** 层序遍历队列，非空时工作台会展示。 */
  queue?: string[];
  /** 哈希表桶头；下标为桶号，值为链头节点 id 或 null。 */
  bucketHeads?: (number | null)[];
  /** 当前正在检查/高亮的桶号。 */
  activeBuckets?: number[];
  /**
   * 有向连线，元素为 `[fromId, toId]`。
   * 树布局用可选的第三项标记左/右孩子；缺省时按同一父节点的连线顺序回退。
   */
  links?: FrameLink[];
  detached?: number;
  headId?: number | null;
  /**
   * 二叉树根节点身份。
   * 省略时按 `links` 推断（没有被任何连线指向的首个节点）；
   * `null` 表示未声明根，非空 `items` 会按森林布局展示。
   */
  rootId?: number | null;
  /**
   * 搜索类帧的目标值；树场景会渲染为跟随当前节点的徽章。
   * 结构修改帧省略；`active` 为空时即使设置也不显示。
   */
  target?: number;
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

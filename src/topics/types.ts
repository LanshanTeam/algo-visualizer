import type { ComponentType } from "react";
import type {
  CodeLine,
  Frame,
  ImplementedSceneKind,
  Language,
  SceneKind,
  TraceInput,
} from "../core/types";

/** 侧边栏的一级分组，顺序即导航顺序。 */
export const TOPIC_GROUPS = [
  { id: "linear", label: "线性结构" },
  { id: "tree-hash", label: "树与散列" },
  { id: "graph", label: "图论算法" },
  { id: "sorting-searching", label: "排序与搜索" },
] as const;

export type TopicGroupId = (typeof TOPIC_GROUPS)[number]["id"];

/** 动画图例，tone 对应画布的配色。 */
export interface LegendEntry {
  label: string;
  tone: "active" | "pivot" | "settled" | "idle";
}

export interface IndexControl {
  label: string;
  /** 合法上界；由专题按当前数据与操作决定。 */
  max: (context: { length: number; operation: string }) => number;
  /** 初始值；缺省用工作台统一的下标默认值。 */
  default?: number;
  /**
   * 该索引会占用槽位（例如队列的初始 front 挤占左侧槽位）。
   * 置为 true 时，随机数据要给索引留出空间，否则会生成装不下的元素。
   */
  occupiesSlots?: boolean;
}

/** 操作台的输入控件声明。缺省即不渲染。 */
export interface ControlSchema {
  /** 数据输入框的标签，例如「初始链表」「数组」。 */
  dataLabel: string;
  defaultValues: number[];
  /** 数据输入框的初始文本；缺省用 defaultValues 拼接。 */
  defaultInput?: string;
  /** 自定义解析；空位可用 NaN 等哨兵表示，共享 parseValues 不受影响。 */
  parseInput?: (text: string, limit?: number) => number[];
  /** 数据规模上限，默认 12。 */
  limit?: number;
  /**
   * 画布上固定展示的槽位数（定长容量）。
   * 缺省时按所有帧中的最大元素数绘制；顺序表、定长栈、顺序队列用它声明容量。
   */
  capacity?: number;
  /** 初始选中的操作；缺省为 operations 的第一项。 */
  defaultOperation?: string;
  /** 是否显示随机数据按钮，默认显示。 */
  randomizable?: boolean;
  /** 随机数据保持升序；手工输入仍由专题校验，不自动排序。 */
  sorted?: boolean;
  /** 专题自定义随机数据；缺省时按数据上限、容量与已占槽位生成。 */
  randomValues?: () => number[];
  operations?: readonly { id: string; label: string }[];
  index?: IndexControl;
  value?: {
    label: string;
    onlyFor?: readonly string[];
    /** 目标值输入框与首帧 trace 的初始值；缺省为 31。 */
    defaultValue?: number;
  };
  /** 第二个元素输入；并查集的合并与连通查询使用。 */
  value2?: {
    label: string;
    onlyFor?: readonly string[];
    defaultValue?: number;
  };
}

export interface TheoryBlock {
  title: string;
  body: string;
}

interface TopicBase {
  id: string;
  group: TopicGroupId;
  title: string;
  /** 侧边栏右侧角标，通常是复杂度或特征，如 `O(n log n)`、`LIFO`。 */
  badge?: string;
  summary: string;
  icon: ComponentType<{ className?: string }>;
  legend?: readonly LegendEntry[];
  theory?: readonly TheoryBlock[];
}

/** 已完成：必须有可运行的 trace、代码模板，且布局已被渲染器支持。 */
export interface ReadyTopic extends TopicBase {
  status: "ready";
  scene: ImplementedSceneKind;
  controls: ControlSchema;
  trace: (input: TraceInput) => Frame[];
  code: (language: Language, operation: string) => CodeLine[];
}

/** 未完成：只有元数据，工作台渲染占位页。 */
export interface PlannedTopic extends TopicBase {
  status: "planned";
  scene: SceneKind;
}

export type TopicDefinition = ReadyTopic | PlannedTopic;

/**
 * 声明一个待实现的专题。
 * 实现步骤：在所属域目录下新建 `<id>.ts` 写好 trace 与 code，
 * 然后把这里的一条 `plannedTopic(...)` 替换为该模块导出的 ready 定义。
 */
export function plannedTopic(
  entry: Omit<PlannedTopic, "status" | "scene"> & { scene?: SceneKind },
): PlannedTopic {
  return { scene: "array", ...entry, status: "planned" };
}

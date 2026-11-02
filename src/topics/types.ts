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
}

/** 操作台的输入控件声明。缺省即不渲染。 */
export interface ControlSchema {
  /** 数据输入框的标签，例如「初始链表」「数组」。 */
  dataLabel: string;
  defaultValues: number[];
  /** 数据规模上限，默认 12。 */
  limit?: number;
  /** 随机数据保持升序；手工输入仍由专题校验，不自动排序。 */
  sorted?: boolean;
  operations?: readonly { id: string; label: string }[];
  index?: IndexControl;
  value?: { label: string; onlyFor?: readonly string[] };
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

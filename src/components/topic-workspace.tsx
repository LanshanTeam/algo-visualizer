import { AnimationCard } from "./workspace/animation-card";
import { CodeCard } from "./workspace/code-card";
import { useTopicTrace } from "./workspace/use-topic-trace";
import type { ReadyTopic } from "../topics/types";

/**
 * 工作台。所有差异都来自 `topic` 的声明，
 * 新增专题不需要改动这里。
 */
export function TopicWorkspace({ topic }: { topic: ReadyTopic }) {
  const trace = useTopicTrace(topic);
  return (
    <div className="topic-workspace">
      <AnimationCard topic={topic} trace={trace} />
      <CodeCard topic={topic} trace={trace} />
    </div>
  );
}

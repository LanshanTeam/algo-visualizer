import { graphTopics } from "./graph";
import { linearTopics } from "./linear";
import { sortingSearchingTopics } from "./sorting-searching";
import { treeHashTopics } from "./tree-hash";
import { TOPIC_GROUPS, type TopicDefinition } from "./types";

/** 注册顺序即侧边栏顺序。 */
const allTopics: TopicDefinition[] = [
  ...linearTopics,
  ...treeHashTopics,
  ...graphTopics,
  ...sortingSearchingTopics,
];

export const TOPICS: Record<string, TopicDefinition> = {};

for (const topic of allTopics) {
  if (TOPICS[topic.id]) throw new Error(`专题 id 重复：${topic.id}`);
  TOPICS[topic.id] = topic;
}

/** 按分组切分后的侧边栏视图。 */
export const TOPIC_GROUPS_VIEW = TOPIC_GROUPS.map((group) => ({
  ...group,
  items: allTopics.filter((topic) => topic.group === group.id),
}));

export const READY_TOPICS = allTopics.filter(
  (topic) => topic.status === "ready",
);

/** 默认落地页：第一个已实现的专题。 */
export const DEFAULT_TOPIC_ID = READY_TOPICS[0].id;

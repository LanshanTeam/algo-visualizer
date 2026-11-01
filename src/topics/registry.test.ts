import { describe, expect, it } from "vitest";
import {
  DEFAULT_TOPIC_ID,
  READY_TOPICS,
  TOPICS,
  TOPIC_GROUPS_VIEW,
} from "./registry";
import { TOPIC_GROUPS } from "./types";

describe("专题注册表", () => {
  it("id 唯一且可按键取回", () => {
    for (const [id, topic] of Object.entries(TOPICS)) expect(topic.id).toBe(id);
    expect(Object.keys(TOPICS)).toHaveLength(
      new Set(Object.keys(TOPICS)).size,
    );
  });
  it("默认专题是第一个已实现专题", () => {
    expect(TOPICS[DEFAULT_TOPIC_ID].status).toBe("ready");
    expect(READY_TOPICS[0].id).toBe(DEFAULT_TOPIC_ID);
  });
  it("侧边栏分组覆盖全部专题且保持分组顺序", () => {
    expect(TOPIC_GROUPS_VIEW.map((group) => group.id)).toEqual(
      TOPIC_GROUPS.map((group) => group.id),
    );
    expect(TOPIC_GROUPS_VIEW.flatMap((group) => group.items)).toHaveLength(
      Object.keys(TOPICS).length,
    );
    for (const group of TOPIC_GROUPS_VIEW)
      for (const item of group.items) expect(item.group).toBe(group.id);
  });
});

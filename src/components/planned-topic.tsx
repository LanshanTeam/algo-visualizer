import type { PlannedTopic } from "../topics/types";

/** 尚未实现的专题占位页：路由可达，不影响其余页面。 */
export function PlannedTopicPage({ topic }: { topic: PlannedTopic }) {
  return (
    <section className="planned-card" aria-labelledby="planned-title">
      <div className="planned-mark" aria-hidden="true" />
      <h2 id="planned-title" className="planned-title">
        建设中
      </h2>
      <p className="planned-summary">{topic.summary}</p>
      <p className="planned-note">该专题的动画与代码示例尚未上线。</p>
    </section>
  );
}

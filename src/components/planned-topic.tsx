import { Construction } from "lucide-react";
import type { PlannedTopic } from "../topics/types";

/** 尚未实现的专题占位页：路由可达，不影响其余页面。 */
export function PlannedTopicPage({ topic }: { topic: PlannedTopic }) {
  return (
    <section className="panel planned" aria-labelledby="planned-title">
      <div className="panel-head">
        <span className="head-icon"><Construction /></span>
        <div>
          <div className="eyebrow">COMING SOON</div>
          <h2 id="planned-title">建设中</h2>
        </div>
      </div>
      <div className="panel-body">
        <p className="summary">{topic.summary}</p>
        <p className="hint">该专题的动画与代码示例尚未上线。</p>
      </div>
    </section>
  );
}

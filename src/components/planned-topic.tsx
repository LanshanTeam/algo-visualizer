import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { PlannedTopic } from "../topics/types";

/** 尚未实现的专题占位页：路由可达，不影响其余页面。 */
export function PlannedTopicPage({ topic }: { topic: PlannedTopic }) {
  return (
    <Card aria-labelledby="planned-title">
      <CardHeader>
        <CardTitle>
          <h2 id="planned-title">建设中</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm leading-relaxed">
        <p>{topic.summary}</p>
        <p className="text-muted-foreground">
          该专题的动画与代码示例尚未上线。
        </p>
      </CardContent>
    </Card>
  );
}

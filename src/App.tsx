import { useCallback, useEffect, useState } from "react";
import { Braces } from "lucide-react";
import { Badge } from "./components/ui/badge";
import { Separator } from "./components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "./components/ui/sidebar";
import { PlannedTopicPage } from "./components/planned-topic";
import { TopicSidebar } from "./components/topic-sidebar";
import { TopicWorkspace } from "./components/topic-workspace";
import { DEFAULT_TOPIC_ID, TOPICS } from "./topics/registry";

function readTopic(): string {
  const id = location.hash.replace(/^#\/?/, "");
  return TOPICS[id] ? id : DEFAULT_TOPIC_ID;
}

export default function App() {
  const [topicId, setTopicId] = useState(readTopic);
  useEffect(() => {
    const change = () => setTopicId(readTopic());
    addEventListener("hashchange", change);
    return () => removeEventListener("hashchange", change);
  }, []);
  const navigate = useCallback((next: string) => {
    setTopicId(next);
    if (location.hash !== `#/${next}`) location.hash = `/${next}`;
  }, []);
  const topic = TOPICS[topicId];

  return (
    <SidebarProvider>
      <TopicSidebar topic={topicId} onNavigate={navigate} />
      <SidebarInset className="min-w-0 xl:h-dvh">
        <header className="app-header">
          <SidebarTrigger aria-label="切换导航" />
          <Separator orientation="vertical" className="h-5 opacity-60" />
          <div className="app-brand-mark" aria-hidden="true">
            <Braces />
          </div>
          <h1>{topic.title}</h1>
          {topic.status === "planned" && (
            <Badge variant="secondary">建设中</Badge>
          )}
          <div className="app-header-spacer" />
          <div className="app-brand-mark" aria-hidden="true" style={{ width: 26, height: 26, opacity: 0.55 }}><Braces /></div>
        </header>
        <div className="app-content xl:min-h-0 xl:flex-1">
          {topic.status === "ready" ? (
            <TopicWorkspace key={topic.id} topic={topic} />
          ) : (
            <div className="flex flex-col gap-6 xl:h-full xl:flex-row">
              <PlannedTopicPage topic={topic} />
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

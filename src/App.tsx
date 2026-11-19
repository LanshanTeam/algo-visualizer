import { useCallback, useEffect, useState } from "react";
import cquptLogo from "./assets/cqupt-logo.png";
import lanshanHeader from "./assets/lanshan-header.png";
import lanshanHeader2x from "./assets/lanshan-header@2x.png";
import lanshanHeader4x from "./assets/lanshan-header@4x.png";
import lanshanLogo from "./assets/lanshan-logo.png";
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
import { AboutPage } from "./components/about-page";
import { DEFAULT_TOPIC_ID, TOPICS } from "./topics/registry";

function readTopic(): string {
  const id = location.hash.replace(/^#\/?/, "");
  if (id === "about") return id;
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
  const isAbout = topicId === "about";

  return (
    <SidebarProvider>
      <TopicSidebar topic={topicId} onNavigate={navigate} />
      <SidebarInset className="min-w-0 xl:h-dvh">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b px-4 md:px-6">
          <SidebarTrigger aria-label="切换导航" />
          <Separator orientation="vertical" className="h-4" />
          <h1 className="min-w-0 truncate text-lg font-semibold">{isAbout ? "关于" : topic.title}</h1>
          {!isAbout && topic.status === "planned" && (
            <Badge variant="secondary">建设中</Badge>
          )}
          <div
            className="ml-auto flex shrink-0 items-center gap-3 md:gap-4"
            role="group"
            aria-label="重庆邮电大学与蓝山工作室"
          >
            <span className="block w-7 overflow-hidden sm:w-auto">
              <img
                src={cquptLogo}
                alt="重庆邮电大学"
                width={272}
                height={69}
                className="h-7 w-auto max-w-none"
              />
            </span>
            <Separator orientation="vertical" className="h-6" />
            <picture>
              <source
                media="(min-width: 768px)"
                srcSet={`${lanshanHeader} 1x, ${lanshanHeader2x} 2x, ${lanshanHeader4x} 4x`}
              />
              <img
                src={lanshanLogo}
                alt="蓝山工作室"
                width={211}
                height={112}
                className="h-7 w-auto"
              />
            </picture>
          </div>
        </header>
        <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6 xl:min-h-0 xl:flex-1">
          {isAbout ? (
            <AboutPage />
          ) : topic.status === "ready" ? (
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

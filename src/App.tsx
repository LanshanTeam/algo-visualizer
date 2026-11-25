import { useCallback, useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import cquptLogo from "./assets/cqupt-logo-white.svg";
import lanshanHeader from "./assets/lanshan-header-white.svg";
import lanshanLogo from "./assets/lanshan-symbol-edge.svg";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { PlannedTopicPage } from "./components/planned-topic";
import { TopicSidebar } from "./components/topic-sidebar";
import { TopicWorkspace } from "./components/topic-workspace";
import { ABOUT_ROUTE, AboutPage } from "./components/about-page";
import { DEFAULT_TOPIC_ID, TOPICS } from "./topics/registry";
import { TOPIC_GROUPS } from "./topics/types";

function readRoute(): string {
  const id = location.hash.replace(/^#\/?/, "");
  if (id === ABOUT_ROUTE) return ABOUT_ROUTE;
  return TOPICS[id] ? id : DEFAULT_TOPIC_ID;
}

export default function App() {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const change = () => setRoute(readRoute());
    addEventListener("hashchange", change);
    return () => removeEventListener("hashchange", change);
  }, []);
  const navigate = useCallback((next: string) => {
    setRoute(next);
    if (location.hash !== `#/${next}`) location.hash = `/${next}`;
  }, []);
  const topic = route === ABOUT_ROUTE ? undefined : TOPICS[route];
  const group = TOPIC_GROUPS.find((item) => item.id === topic?.group);

  return (
    <SidebarProvider className="app-shell">
      <a className="skip-link" href="#main-content" onClick={(event) => {
        event.preventDefault();
        document.getElementById("main-content")?.focus();
      }}>跳到主要内容</a>
      <header className="app-header">
        <div className="header-brand">
          <SidebarTrigger className="header-menu" aria-label="切换专题导航" />
          <div className="header-titles">
            <strong>数据结构与算法可视化</strong>
          </div>
        </div>
        <div className="header-logos" role="group" aria-label="重庆邮电大学与蓝山工作室">
          <span className="block w-7 overflow-hidden sm:w-auto">
            <img src={cquptLogo} alt="重庆邮电大学" width={272} height={69} className="h-7 w-auto max-w-none" />
          </span>
          <span className="logo-divider" aria-hidden="true" />
          <picture>
            <source media="(min-width: 768px)" srcSet={lanshanHeader} />
            <img src={lanshanLogo} alt="蓝山工作室" width={211} height={112} className="h-7 w-auto" />
          </picture>
        </div>
      </header>
      <div className="shell-body">
        <TopicSidebar topic={route} onNavigate={navigate} />
        <SidebarInset className="app-main">
          <div id="main-content" className="page" tabIndex={-1}>
            <nav className="page-breadcrumb" aria-label="面包屑">
              {group && <><span>{group.label}</span><ChevronRight size={13} aria-hidden="true" /></>}
              <span aria-current="page">{topic?.title ?? "关于项目"}</span>
            </nav>
            <h1 className="sr-only">{topic?.title ?? "关于项目"}</h1>
            <div className={`workspace-content${topic?.status === "ready" ? " workspace-content-ready" : ""}`}>
              {!topic ? <AboutPage /> : topic.status === "ready" ? (
                <TopicWorkspace key={topic.id} topic={topic} />
              ) : <PlannedTopicPage topic={topic} />}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

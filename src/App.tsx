import { useCallback, useEffect, useState } from "react";
import { Braces, Layers, Menu, PanelsTopLeft, Sparkles } from "lucide-react";
import { PlannedTopicPage } from "./components/planned-topic";
import { TopicSidebar } from "./components/topic-sidebar";
import { TopicWorkspace } from "./components/topic-workspace";
import { DEFAULT_TOPIC_ID, TOPICS, TOPIC_GROUPS_VIEW } from "./topics/registry";

function readTopic(): string {
  const id = location.hash.replace(/^#\/?/, "");
  return TOPICS[id] ? id : DEFAULT_TOPIC_ID;
}

const GROUP_ICON: Record<string, typeof Layers> = {
  linear: Layers,
  "tree-hash": Sparkles,
  graph: PanelsTopLeft,
  "sorting-searching": Braces,
};

export default function App() {
  const [topicId, setTopicId] = useState(readTopic);
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => {
    const change = () => setTopicId(readTopic());
    addEventListener("hashchange", change);
    return () => removeEventListener("hashchange", change);
  }, []);
  const navigate = useCallback((next: string) => {
    setTopicId(next);
    setNavOpen(false);
    if (location.hash !== `#/${next}`) location.hash = `/${next}`;
  }, []);
  const topic = TOPICS[topicId];
  const group = TOPIC_GROUPS_VIEW.find((entry) => entry.id === topic.group);
  const GroupIcon = GROUP_ICON[topic.group] ?? Layers;

  return (
    <div className="app">
      <TopicSidebar topic={topicId} onNavigate={navigate} open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="app-main">
        <header className="topbar">
          <button
            type="button"
            className="menu-toggle"
            aria-label="切换导航"
            aria-expanded={navOpen}
            onClick={() => setNavOpen((value) => !value)}
          >
            <Menu />
          </button>
          <span className="topbar-sep" aria-hidden="true" />
          <h1 className="topbar-title">{topic.title}</h1>
          {topic.status === "planned" && <span className="topbar-tag">建设中</span>}
          <div className="topbar-right">
            <span className="topbar-crumb">
              {group?.label}
              <GroupIcon className="pill-icon" aria-hidden="true" />
            </span>
            <span className="topbar-crumb"><span className="pill">算法可视化</span></span>
          </div>
        </header>
        <div className="content">
          <div className="content-inner">
            {topic.status === "ready" ? (
              <TopicWorkspace key={topic.id} topic={topic} />
            ) : (
              <PlannedTopicPage topic={topic} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

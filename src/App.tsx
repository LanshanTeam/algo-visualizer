import { useCallback, useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { PlannedTopicPage } from "./components/planned-topic";
import { TopicSidebar, topicOrdinal } from "./components/topic-sidebar";
import { TopicWorkspace } from "./components/topic-workspace";
import { DEFAULT_TOPIC_ID, TOPICS, TOPIC_GROUPS_VIEW } from "./topics/registry";

function readTopic(): string {
  const id = location.hash.replace(/^#\/?/, "");
  return TOPICS[id] ? id : DEFAULT_TOPIC_ID;
}

export default function App() {
  const [topicId, setTopicId] = useState(readTopic);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const change = () => setTopicId(readTopic());
    addEventListener("hashchange", change);
    return () => removeEventListener("hashchange", change);
  }, []);

  useEffect(() => {
    if (!navOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    addEventListener("keydown", close);
    return () => removeEventListener("keydown", close);
  }, [navOpen]);

  const navigate = useCallback((next: string) => {
    setTopicId(next);
    if (location.hash !== `#/${next}`) location.hash = `/${next}`;
  }, []);
  const topic = TOPICS[topicId];
  const group = TOPIC_GROUPS_VIEW.find((entry) =>
    entry.items.some((item) => item.id === topic.id),
  );
  const ordinal = topicOrdinal(topic.id);

  return (
    <div className="app-shell">
      <TopicSidebar
        topic={topicId}
        onNavigate={navigate}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />
      <div className="app-main">
        <header className="topbar">
          <button
            type="button"
            className="menu-button"
            aria-label="切换导航"
            aria-expanded={navOpen}
            onClick={() => setNavOpen((value) => !value)}
          >
            <Menu size={18} />
          </button>
          <span className="topbar-rule" aria-hidden="true" />
          <div className="topic-heading">
            <div className="eyebrow">
              <span>{group?.label}</span>
              <span className="slash" aria-hidden="true">
                /
              </span>
              <span className="ordinal">{ordinal}</span>
            </div>
            <h1 className="topic-title">
              {topic.title}
              {topic.status === "planned" && (
                <span className="status-badge">建设中</span>
              )}
            </h1>
          </div>
          <div className="topbar-end" aria-hidden="true">
            <div className="topic-stamp">{ordinal}</div>
          </div>
        </header>

        <main className="workspace">
          <div className="workspace-inner">
            {topic.status === "ready" ? (
              <TopicWorkspace key={topic.id} topic={topic} />
            ) : (
              <div className="planned-wrap">
                <PlannedTopicPage topic={topic} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

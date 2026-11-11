import { Layers } from "lucide-react";
import { TOPIC_GROUPS_VIEW } from "../topics/registry";

export function TopicSidebar({
  topic,
  onNavigate,
  open,
  onClose,
}: {
  topic: string;
  onNavigate: (next: string) => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {open && (
        <button
          type="button"
          className="sidebar-scrim"
          aria-label="关闭导航"
          onClick={onClose}
        />
      )}
      <aside className={`sidebar${open ? " is-open" : ""}`} aria-label="专题导航">
        <div className="sidebar-brand">
          <div className="sidebar-mark">
            <span className="glyph" aria-hidden="true">AV</span>
            <div>
              <div className="name">数据结构与算法</div>
              <div className="sub">Visualizer</div>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {TOPIC_GROUPS_VIEW.map((group) => (
            <section className="nav-group" key={group.id}>
              <div className="nav-label">
                <span className="bar" aria-hidden="true" />
                {group.label}
              </div>
              <ul className="nav-list">
                {group.items.map((item) => {
                  const active = topic === item.id;
                  const planned = item.status === "planned";
                  return (
                    <li className="nav-item" key={item.id}>
                      <a
                        href={`#/${item.id}`}
                        aria-current={active ? "page" : undefined}
                        className={[
                          "nav-link",
                          active ? "is-active" : "",
                          planned ? "is-planned" : "",
                        ].filter(Boolean).join(" ")}
                        onClick={(event) => {
                          event.preventDefault();
                          onNavigate(item.id);
                        }}
                      >
                        <item.icon />
                        <span className="nav-text">{item.title}</span>
                        {(planned || item.badge) && (
                          <span className={`nav-badge${planned ? "" : " ready"}`}>
                            {planned ? "WIP" : item.badge}
                          </span>
                        )}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </nav>
        <div className="sidebar-foot">
          <Layers aria-hidden="true" style={{ width: 14, height: 14 }} />
          交互式算法演示 · 边看边学
        </div>
      </aside>
    </>
  );
}

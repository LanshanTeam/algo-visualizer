import { X } from "lucide-react";
import { TOPIC_GROUPS_VIEW } from "../topics/registry";

/** 侧栏里的编号是全局顺序，不是分组内序号。 */
const ORDINALS = new Map<string, string>();
let sequence = 0;
for (const group of TOPIC_GROUPS_VIEW) {
  for (const item of group.items) {
    sequence += 1;
    ORDINALS.set(item.id, String(sequence).padStart(2, "0"));
  }
}

export function topicOrdinal(id: string) {
  return ORDINALS.get(id) ?? "00";
}

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
      <aside
        className={open ? "sidebar is-open" : "sidebar"}
        aria-label="专题导航"
      >
        <button
          type="button"
          className="sidebar-close"
          aria-label="关闭导航"
          onClick={onClose}
        >
          <X size={16} />
        </button>
        <div className="brand">
          <div className="brand-row">
            <span className="brand-mark" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="1.5" y="1.5" width="21" height="21" stroke="currentColor" />
                <path d="M6 17V9.5L12 6l6 3.5V17" stroke="currentColor" strokeWidth="1.2" />
                <path d="M6 13h12" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="12" cy="6" r="1.6" fill="currentColor" />
                <circle cx="6" cy="17" r="1.6" fill="currentColor" />
                <circle cx="18" cy="17" r="1.6" fill="currentColor" />
              </svg>
            </span>
            <div className="brand-title">数据结构与算法</div>
          </div>
          <div className="brand-rule" aria-hidden="true" />
        </div>

        <nav className="nav">
          {TOPIC_GROUPS_VIEW.map((group) => (
            <section className="nav-group" key={group.id}>
              <div className="nav-group-label">{group.label}</div>
              {group.items.map((item) => {
                const active = topic === item.id;
                const Icon = item.icon;
                return (
                  <a
                    key={item.id}
                    href={`#/${item.id}`}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "nav-item",
                      active ? "is-active" : "",
                      item.status === "planned" ? "is-planned" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={(event) => {
                      event.preventDefault();
                      onNavigate(item.id);
                      onClose();
                    }}
                  >
                    <span className="nav-index" aria-hidden="true">
                      {topicOrdinal(item.id)}
                    </span>
                    <Icon className="nav-icon" aria-hidden={true} />
                    <span className="nav-title">{item.title}</span>
                    {(item.status === "planned" || item.badge) && (
                      <span className="nav-badge">
                        {item.status === "planned" ? "WIP" : item.badge}
                      </span>
                    )}
                  </a>
                );
              })}
            </section>
          ))}
        </nav>

        <div className="nav-foot" aria-hidden="true">
          <div className="nav-foot-bars">
            {[8, 14, 6, 19, 11, 16, 5, 13, 9, 18, 7, 12].map((height, index) => (
              <i key={index} style={{ height }} />
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

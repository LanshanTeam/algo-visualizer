import { useState } from "react";
import { Check, Code, Copy } from "lucide-react";
import { IconButton } from "./icon-button";
import { TheoryContent } from "../theory-content";
import { languages } from "../../core/code";
import type { Language } from "../../core/types";
import type { ReadyTopic } from "../../topics/types";
import type { TopicTrace } from "./use-topic-trace";

export function CodeCard({
  topic,
  trace,
}: {
  topic: ReadyTopic;
  trace: TopicTrace;
}) {
  const { language, setLanguage, code, copied, copy, hasTheory, frame } = trace;
  const [tab, setTab] = useState<"code" | "theory">("code");

  return (
    <section className="panel" aria-labelledby="code-title">
      <header className="panel-head">
        <span className="head-icon"><Code /></span>
        <div className="head-title">
          <div className="eyebrow">REFERENCE</div>
          <h2 id="code-title">代码与原理</h2>
        </div>
        <div
          className={`tabseg ${hasTheory ? "grid cols-2" : "grid cols-1"}`}
          aria-label="切换代码与原理"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "code"}
            className={`tab${tab === "code" ? " is-active" : ""}`}
            onClick={() => setTab("code")}
          >
            代码
          </button>
          {hasTheory && (
            <button
              type="button"
              role="tab"
              aria-selected={tab === "theory"}
              className={`tab${tab === "theory" ? " is-active" : ""}`}
              onClick={() => setTab("theory")}
            >
              原理
            </button>
          )}
        </div>
      </header>

      {tab === "code" ? (
        <div className="panel-body">
          <div className="code-head">
            <div className="lang-tabs" aria-label="代码语言" role="tablist">
              {languages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  role="tab"
                  aria-selected={language === lang}
                  className={`lang-tab${language === lang ? " is-active" : ""}`}
                  onClick={() => setLanguage(lang as Language)}
                >
                  {lang}
                </button>
              ))}
            </div>
            <IconButton className="btn-sm" label={copied ? "已复制" : "复制代码"} onClick={copy}>
              {copied ? <Check /> : <Copy />}
            </IconButton>
          </div>
          <div
            className="code-scroll"
            role="region"
            aria-label={`${language} 代码`}
            tabIndex={0}
          >
            <pre className="code-pre">
              {code.map((line, i) => (
                <div
                  key={i}
                  className={`code-line${line.anchor === frame.anchor ? " is-active" : ""}`}
                >
                  <span className="ln" aria-hidden="true">{i + 1}</span>
                  <code>{line.text || " "}</code>
                </div>
              ))}
            </pre>
          </div>
        </div>
      ) : (
        <div className="panel-body">
          <div className="theory">
            <TheoryContent blocks={topic.theory ?? []} />
          </div>
        </div>
      )}
    </section>
  );
}

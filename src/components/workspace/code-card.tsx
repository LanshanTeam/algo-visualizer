import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { TheoryContent } from "../theory-content";
import { highlightCode } from "./highlight-code";
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
  const [view, setView] = useState<"code" | "theory">("code");

  return (
    <section
      className="panel console-panel"
      aria-labelledby="code-title"
    >
      <h2 id="code-title" className="sr-only">
        代码与原理
      </h2>

      <div className="console-head">
        <span className="section-num" aria-hidden="true">
          02
        </span>
        <div
          className="segmented"
          role="tablist"
          aria-label="切换代码与原理"
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === "code"}
            className={view === "code" ? "seg-button is-active" : "seg-button"}
            onClick={() => setView("code")}
          >
            代码
          </button>
          {hasTheory && (
            <button
              type="button"
              role="tab"
              aria-selected={view === "theory"}
              className={
                view === "theory" ? "seg-button is-active" : "seg-button"
              }
              onClick={() => setView("theory")}
            >
              原理
            </button>
          )}
        </div>
        <span className="panel-head-rule console-head-rule" aria-hidden="true" />
      </div>

      {view === "code" ? (
        <div className="console-body" role="tabpanel">
          <div className="console-watermark" aria-hidden="true">
            {"{ }"}
          </div>
          <div className="lang-bar">
            <div className="lang-tabs" role="tablist" aria-label="代码语言">
              {languages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  role="tab"
                  aria-selected={language === lang}
                  className={
                    language === lang ? "lang-tab is-active" : "lang-tab"
                  }
                  onClick={() => setLanguage(lang as Language)}
                >
                  {lang}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="copy-button"
              aria-label={copied ? "已复制" : "复制代码"}
              title={copied ? "已复制" : "复制代码"}
              onClick={copy}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>

          <div
            className="code-scroll"
            role="region"
            aria-label={`${language} 代码`}
            tabIndex={0}
          >
            <pre className="code-block">
              {code.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.anchor === frame.anchor
                      ? "code-line is-active"
                      : "code-line"
                  }
                >
                  <span className="line-no" aria-hidden="true">
                    {i + 1}
                  </span>
                  <code>{highlightCode(line.text, language)}</code>
                </div>
              ))}
            </pre>
          </div>
        </div>
      ) : (
        <div className="theory-scroll" role="tabpanel">
          <TheoryContent blocks={topic.theory ?? []} />
        </div>
      )}
    </section>
  );
}

import { type CSSProperties } from "react";
import { Check, Copy } from "lucide-react";
import { Card, CardHeader } from "../ui/card";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { IconButton } from "./icon-button";
import { TheoryContent } from "../theory-content";
import { cn } from "../../lib/utils";
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

  return (
    <Card
      className="flex min-w-0 flex-col xl:min-h-0 xl:flex-1"
      aria-labelledby="code-title"
    >
      <h2 id="code-title" className="sr-only">
        代码与原理
      </h2>
      <Tabs defaultValue="code" className="flex flex-col xl:min-h-0 xl:flex-1">
        <CardHeader className="gap-3">
          <span className="section-eyebrow" aria-hidden="true" />
          <TabsList
            aria-label="切换代码与原理"
            className={cn(
              "grid w-full",
              hasTheory ? "grid-cols-2" : "grid-cols-1",
            )}
          >
            <TabsTrigger value="code">代码</TabsTrigger>
            {hasTheory && <TabsTrigger value="theory">原理</TabsTrigger>}
          </TabsList>
        </CardHeader>
        <TabsContent
          value="code"
          className="mt-0 flex min-h-0 flex-col px-6 pb-6 pt-0 xl:flex-1"
        >
          <Tabs
            value={language}
            onValueChange={(next) => setLanguage(next as Language)}
            className="flex min-h-0 flex-col xl:flex-1"
          >
            <div className="flex items-center gap-1 sm:gap-2">
              <TabsList
                aria-label="代码语言"
                style={{ "--lang-cols": String(languages.length) } as CSSProperties}
                className="grid h-auto w-full grid-cols-3 min-[360px]:h-9 min-[360px]:[grid-template-columns:repeat(var(--lang-cols),minmax(0,1fr))]"
              >
                {languages.map((lang) => (
                  <TabsTrigger
                    key={lang}
                    value={lang}
                    className="px-1 text-[11px] min-[400px]:text-xs sm:px-2 sm:text-sm"
                  >
                    {lang}
                  </TabsTrigger>
                ))}
              </TabsList>
              <IconButton
                className="shrink-0"
                label={copied ? "已复制" : "复制代码"}
                onClick={copy}
              >
                {copied ? <Check /> : <Copy />}
              </IconButton>
            </div>
            {languages.map((lang) => (
              <TabsContent
                key={lang}
                value={lang}
                className="flex flex-col xl:min-h-0 xl:flex-1"
              >
                <ScrollArea
                  className="code-scroll h-[440px] xl:min-h-0 xl:flex-1"
                  role="region"
                  aria-label={`${lang} 代码`}
                  tabIndex={0}
                >
                  <pre className="code-pre font-mono text-xs leading-7">
                    {code.map((line, i) => (
                      <div
                        key={i}
                        data-active={line.anchor === frame.anchor ? "true" : undefined}
                        className="code-line"
                      >
                        <span
                          className="code-line-number"
                        >
                          {i + 1}
                        </span>
                        <code>{line.text || " "}</code>
                      </div>
                    ))}
                  </pre>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>
        {hasTheory && (
          <TabsContent
            value="theory"
            className="mt-0 grid content-start gap-6 px-6 pb-6 pt-0 text-sm leading-relaxed md:grid-cols-2 xl:min-h-0 xl:flex-1 xl:grid-cols-1 xl:overflow-y-auto"
          >
            <TheoryContent blocks={topic.theory ?? []} />
          </TabsContent>
        )}
      </Tabs>
    </Card>
  );
}

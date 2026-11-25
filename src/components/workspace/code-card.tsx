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
      className="workspace-panel code-card flex min-w-0 flex-col xl:flex-1"
      aria-labelledby="code-title"
    >
      <h2 id="code-title" className="sr-only">
        代码与原理
      </h2>
      <Tabs defaultValue="code" className="workspace-fill flex flex-col">
        <CardHeader className="workspace-card-header">
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
          className="workspace-fill workspace-card-content mt-0 flex min-h-0 flex-col pt-0"
        >
          <Tabs
            value={language}
            onValueChange={(next) => setLanguage(next as Language)}
            className="workspace-fill flex min-h-0 flex-col"
          >
            <div className="flex items-center gap-1 sm:gap-2">
              <TabsList
                aria-label="代码语言"
                className="language-tabs grid h-auto min-w-0 w-full"
              >
                {languages.map((lang) => (
                  <TabsTrigger
                    key={lang}
                    value={lang}
                    className="min-h-8 px-1 text-xs"
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
                className="workspace-fill flex min-h-0 flex-col"
              >
                <ScrollArea
                  className="code-scroll"
                  role="region"
                  aria-label={`${lang} 代码`}
                  tabIndex={0}
                >
                  <pre className="w-max min-w-full py-4 font-mono text-xs leading-7">
                    {code.map((line, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex border-l-2 border-transparent pr-4",
                          line.anchor === frame.anchor &&
                            "border-primary bg-accent text-accent-foreground",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className="w-10 shrink-0 select-none pr-4 text-right text-muted-foreground"
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
            className="theory-panel workspace-fill workspace-card-content mt-0 grid content-start gap-6 pt-0 text-sm leading-relaxed md:grid-cols-2 xl:grid-cols-1"
          >
            <TheoryContent blocks={topic.theory ?? []} />
          </TabsContent>
        )}
      </Tabs>
    </Card>
  );
}

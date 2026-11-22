import type { ComponentType, ReactNode } from "react";
import { ArrowUpRight, Building2, Code2, Lightbulb, Users } from "lucide-react";
import { version } from "../../package.json";
import { Button } from "./ui/button";

export const ABOUT_ROUTE = "about";

const REPO_URL = "https://github.com/LanshanTeam/algo-visualizer";

const CONTRIBUTORS = [
  "a-dastra",
  "SkyAerope",
  "91king69",
  "YoruAmeKaze",
  "KirisameMarisa114514",
] as const;

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function AboutBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </article>
  );
}

export function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-10 py-2 sm:py-6">
      <section className="max-w-3xl space-y-4">
        <h2 className="text-3xl font-semibold">数据结构与算法可视化</h2>
        <p className="text-base leading-7 text-muted-foreground">
          同步呈现逐步动画、代码高亮与原理说明，直观观察数据结构如何变化，以及算法每一步的执行过程。
        </p>
        <Button variant="outline" asChild>
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            <GitHubIcon />
            项目仓库
            <ArrowUpRight />
          </a>
        </Button>
      </section>

      <section className="grid gap-8 border-t pt-7 sm:grid-cols-2" aria-label="团队与项目初衷">
        <AboutBlock icon={Building2} title="我们是谁">
          <p className="text-sm leading-6 text-muted-foreground">
            我们是重庆邮电大学蓝山工作室。本项目由工作室成员共同开发与维护，希望以更直观的交互方式，陪伴大家学习数据结构与算法。
          </p>
        </AboutBlock>
        <AboutBlock icon={Lightbulb} title="为什么做">
          <p className="text-sm leading-6 text-muted-foreground">
            学习算法时，纸面推导与最终代码之间往往隔着一段难以想象的动态过程。我们希望把这段过程展开，让结构变化、条件判断与代码执行同步可见，帮助学习者真正看懂每一步为何如此发生。
          </p>
        </AboutBlock>
      </section>

      <section className="grid gap-8 border-t pt-7 sm:grid-cols-2" aria-label="参与成员与技术实现">
        <AboutBlock icon={Users} title="参与成员">
          <div className="flex flex-wrap gap-2">
            {CONTRIBUTORS.map((name) => (
              <Button key={name} variant="outline" size="sm" asChild>
                <a href={`https://github.com/${name}`} target="_blank" rel="noreferrer">
                  @{name}
                </a>
              </Button>
            ))}
          </div>
        </AboutBlock>
        <AboutBlock icon={Code2} title="技术实现">
          <p className="text-sm leading-6 text-muted-foreground">
            基于 React、TypeScript 与 Vite 构建，界面采用 shadcn/ui，算法动画由 SVG 画布与 Motion 驱动。
          </p>
        </AboutBlock>
      </section>

      <footer className="border-t pt-5 text-xs text-muted-foreground">
        数据结构与算法可视化 · v{version}
      </footer>
    </div>
  );
}

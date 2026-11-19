import { ArrowUpRight, BookOpen, Code2, GitBranch, Layers3, Lightbulb, Users } from "lucide-react";
import { Button } from "./ui/button";

const categories = [
  { title: "线性结构", items: "顺序表、单链表、栈、队列" },
  { title: "树与散列", items: "二叉树、二叉搜索树、二叉堆、哈希表、并查集" },
  { title: "图论算法", items: "BFS、DFS、Dijkstra" },
  { title: "排序与搜索", items: "二分搜索及常见排序算法" },
];

export function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 py-2 sm:py-6">
      <section className="max-w-3xl space-y-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Layers3 className="size-5" aria-hidden="true" />
          <span className="text-sm">交互式学习工具</span>
        </div>
        <h2 className="text-3xl font-semibold">数据结构与算法可视化</h2>
        <p className="text-base leading-7 text-muted-foreground">
          通过逐步动画、同步代码和简明原理说明，观察数据结构如何变化、算法如何做出每一步选择。
        </p>
        <Button variant="outline" asChild>
          <a href="https://github.com/LongLime/algo-visualizer" target="_blank" rel="noreferrer">
            <GitBranch />
            项目仓库
            <ArrowUpRight />
          </a>
        </Button>
      </section>

      <section className="grid gap-8 border-t pt-7 sm:grid-cols-2" aria-label="团队与项目初衷">
        <article className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" aria-hidden="true" />
            <h3 className="font-semibold">我们是谁</h3>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            我们是重庆邮电大学蓝山工作室。这个项目由工作室成员共同打造，记录我们对算法学习与交互式表达的探索。
          </p>
        </article>
        <article className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="size-4 text-muted-foreground" aria-hidden="true" />
            <h3 className="font-semibold">为什么做</h3>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            学算法时，纸面上的步骤和最终答案之间常常隔着一段难以想象的过程。我们希望把这段过程展开：让数据结构的变化、算法的判断和代码的执行同步呈现，帮助初学者看懂每一步为什么发生。
          </p>
        </article>
      </section>

      <section className="border-t pt-7" aria-labelledby="about-topics">
        <div className="mb-5 flex items-center gap-2">
          <BookOpen className="size-4 text-muted-foreground" aria-hidden="true" />
          <h3 id="about-topics" className="font-semibold">专题范围</h3>
        </div>
        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {categories.map((category) => (
            <div className="space-y-1 border-l-2 pl-4" key={category.title}>
              <dt className="font-medium">{category.title}</dt>
              <dd className="text-sm leading-6 text-muted-foreground">{category.items}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="grid gap-8 border-t pt-7 sm:grid-cols-2" aria-label="项目说明">
        <article className="space-y-3">
          <div className="flex items-center gap-2">
            <Layers3 className="size-4 text-muted-foreground" aria-hidden="true" />
            <h3 className="font-semibold">学习方式</h3>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            选择一个专题后，可以输入或随机生成示例数据，逐步查看状态变化；播放控制支持单步、回退、跳转和倍速。原理页解释关键步骤，代码页提供多种语言的对应片段。
          </p>
        </article>
        <article className="space-y-3">
          <div className="flex items-center gap-2">
            <Code2 className="size-4 text-muted-foreground" aria-hidden="true" />
            <h3 className="font-semibold">技术</h3>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            使用 React、TypeScript 与 Vite 构建；界面基于 shadcn/ui，算法轨迹由 SVG 画布和 Motion 呈现。页面在浏览器本地运行，不需要账号。
          </p>
        </article>
      </section>

      <footer className="border-t pt-5 text-xs text-muted-foreground">
        数据结构与算法可视化 · v1.0.0
      </footer>
    </main>
  );
}

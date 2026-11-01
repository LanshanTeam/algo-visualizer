# 数据结构与算法可视化

React + TypeScript + Vite，纯前端。界面使用 shadcn/ui；算法动画使用 SVG 与 Motion。

## 开发与验证

```sh
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

## 页面

已上线：单链表（按索引查询、插入、删除）、快速排序（Lomuto 分区与递归调用栈）。两者均提供原理、动画、C / C++ / Python / Go / Rust 代码，支持单步、回退、倍速与跳转。

其余专题已在侧边栏注册并标记 `WIP`，点击后展示占位页；实现后把该条 `plannedTopic(...)` 换成 ready 定义即可上线。

## 扩展专题

1. 在所属域目录下新建 `<id>.ts`，导出 `ReadyTopic`：`trace` 产出 `Frame[]`，`code` 用 `parseCode` 解析带 `@anchor` 的多语言模板，元数据声明 `controls`、`legend` 与 `theory`。
2. 把该域 `index.ts` 中对应的 `plannedTopic(...)` 替换为新模块。
3. 需要新画布布局时，先扩展 `SceneKind` 与 `ImplementedSceneKind`，再在 `createAnimationScene` 中实现；类型会阻止未实现的布局被标记为 ready。

`src/App.tsx` 只负责路由与外壳，工作台完全由 `TopicDefinition` 驱动，新增专题无需改动它。

## 组件与样式

`src/components/ui/` 由 shadcn 官方 CLI 生成。页面直接使用 Sidebar、Card、Button、Input、Label、Select、Slider、Tabs、Badge、Alert、Table、Separator、ScrollArea 和 Tooltip；移动导航复用 Sidebar 内置的 Sheet。

`src/styles.css` 仅保留 Tailwind / shadcn 的白色主题变量和基础样式。没有额外的按钮、卡片、表单或导航样式。

部分生成模板使用旧版 Tailwind 变量写法，已适配为 Tailwind 4 的 `var()` 语法，并修正移动断点 Hook 的导入路径。标签已本地化；Slider 将无障碍名称传给滑块。

## 模块

- `src/core/types.ts`：`Frame`、`Language`、`CodeLine` 等共享契约。
- `src/core/code.ts`：`parseCode` 与语言列表。
- `src/core/trace.ts`：输入校验。
- `src/topics/types.ts`：`TopicDefinition` 判别联合（ready / planned）与注册工具。
- `src/topics/<domain>/`：按线性结构、树与散列、图论、排序与搜索划分的专题实现，各自持有 trace、代码模板与元数据。
- `src/topics/registry.ts`：聚合专题、校验重复 id、产出侧边栏分组。
- `src/App.tsx`：路由、页头与侧边栏外壳。
- `src/components/topic-workspace.tsx`：由专题声明驱动的工作台与播放控制。
- `src/components/topic-sidebar.tsx`：按分组渲染的专题导航。
- `src/components/animation-scene.ts`：统一生成节点、标注、连线及分阶段轨迹，拥有空间约束。
- `src/components/animation-canvas.tsx`：将场景模型绘制为 SVG，不决定布局和动作顺序。

代码面板提供教学片段，不在浏览器中执行。链表代码假定已定义包含 `value` 与 `next` 的 `Node`，C 片段需要 `<stdlib.h>`，C++ 片段需要标准库头文件。索引由界面校验。演示快照的存储不计入算法空间复杂度。

## 动画约束

数组保留稳定的元素身份，交换时沿上下轨道真实移动；索引和指针紧邻单元格，只在轨迹穿过时暂时隐藏。链表新节点从上方接入，先让位后连接，回退时先脱离再收拢。仅指向同一节点的指针合并显示；新节点在插入空位上方单独标注 newNode，原后继提前让位。上方的 next 进入后继顶边，原链路进入左侧，避免两条箭头混在一起。

场景高度固定为 208 个逻辑单位，静止和播放的页面布局一致。节点、连线、尾指针和标注全部由同一动画时钟采样；暂停冻结当前动作，恢复从原进度继续，调整倍速不会重放当前动作。单步按钮在移动中暂时禁用；进度条可以取消动作并跳转。手机上的控制条保持单行，播放键使用图标并保留无障碍名称。系统要求减少动态效果时直接呈现目标状态。

几何测试覆盖前进、后退、跳转及运动中的节点、标注碰撞。测试与渲染使用同一轨迹采样函数；浏览器验证仍需检查实际 DOM 边界、暂停和单步锁定，不能以几何单测替代渲染验证。

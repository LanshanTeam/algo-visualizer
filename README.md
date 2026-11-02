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

已上线：单链表（按索引查询、插入、删除）、快速排序（Lomuto 分区与递归调用栈）、二叉树遍历（前序建树与创建、前序、中序、后序、层序）、二叉搜索树（创建、查找、插入与叶子 / 单孩子 / 双孩子删除）。以上专题均提供原理、动画、C / C++ / Python / Go / Java / Rust 代码，支持单步、回退、倍速与跳转。

二叉树的输入格式、帧模型与代码锚点见 [`docs/二叉树遍历.md`](docs/二叉树遍历.md)；二叉搜索树的删除情形与目标值徽章见 [`docs/二叉搜索树.md`](docs/二叉搜索树.md)。

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
- `src/components/topic-workspace.tsx`：组合动画面板与代码面板。
- `src/components/workspace/`：`use-topic-trace.ts` 持有播放状态与交互，`animation-card.tsx`、`playback-bar.tsx`、`code-card.tsx` 负责呈现。
- `src/components/topic-sidebar.tsx`：按分组渲染的专题导航。
- `src/components/animation-scene.ts`：组装节点、标注、连线及分阶段轨迹，按数组、链表、树三种场景分支。
- `src/components/scene-geometry.ts`：轨迹插值与连线路径计算。
- `src/components/scene-layout.ts`：数组与链表的节点尺寸、轨道与让位时序。
- `src/components/tree-layout.ts`：二叉树的森林还原、中序 rank 与深度行布局。
- `src/components/animation-canvas.tsx`：将场景模型绘制为 SVG，不决定布局和动作顺序。
- `src/components/canvas-primitives.tsx`：节点、连线、尾指针、目标徽章与标注等 SVG 原语。

代码面板提供教学片段，不在浏览器中执行。链表代码假定已定义包含 `value` 与 `next` 的 `Node`，C 片段需要 `<stdlib.h>`，C++ 片段需要标准库头文件。二叉树代码假定已定义 `TreeNode`、`visit` 与空位哨兵；二叉搜索树代码假定已定义 `TreeNode` 与 `new_node` / `newNode`，Rust 版用数组下标表示节点链接。索引由界面校验。演示快照的存储不计入算法空间复杂度。

## 动画约束

数组保留稳定的元素身份，交换时沿上下轨道真实移动；索引和指针紧邻单元格，只在轨迹穿过时暂时隐藏。链表新节点从上方接入，先让位后连接，回退时先脱离再收拢。仅指向同一节点的指针合并显示；新节点在插入空位上方单独标注 newNode，原后继提前让位。上方的 next 进入后继顶边，原链路进入左侧，避免两条箭头混在一起。

场景高度固定为 208 个逻辑单位，静止和播放的页面布局一致。节点、连线、尾指针和标注全部由同一动画时钟采样；暂停冻结当前动作，恢复从原进度继续，调整倍速不会重放当前动作。单步按钮在移动中暂时禁用；进度条可以取消动作并跳转。手机上的控制条保持单行，播放键使用图标并保留无障碍名称。系统要求减少动态效果时直接呈现目标状态。

二叉树用中序 rank 定 x、深度定 y，节点为圆形；直径按整段演示的最大深度收缩，画布宽度按最大节点数固定，创建过程中只有位置平滑变化。未访问节点灰色，当前节点琥珀，已访问节点蓝色；子节点被访问后，它与父节点的连线高亮。创建时按前序逐节点出现；层序遍历在调用栈下方显示队列。二叉搜索树复用同一布局；查找与插入时，`target = 值` 徽章跟随当前比较节点滑动，默认位于节点右上方，靠近右边界时翻到左上方。删除先完整搜索，再按叶子、单孩子、双孩子修改结构；修改帧不显示目标徽章。固定 208 高度下允许徽章与边或节点局部重叠，但保证不越出画布。

几何测试覆盖前进、后退、跳转及运动中的节点、标注碰撞。测试与渲染使用同一轨迹采样函数；浏览器验证仍需检查实际 DOM 边界、暂停和单步锁定，不能以几何单测替代渲染验证。

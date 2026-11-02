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

已上线：单链表（按索引查询、插入、删除）、二分搜索、冒泡排序、选择排序、插入排序、归并排序、快速排序。所有专题均提供原理、动画、C / C++ / Python / Go / Java / Rust 代码，支持单步、回退、倍速与跳转。

排序与搜索：
- 二分搜索使用升序（非递减）数组，手工输入未排序时提示错误，不自动排序；随机数据生成升序数组。重复值返回任意匹配索引，未找到返回 -1。
- 冒泡排序在一轮无交换时提前结束；选择排序每轮选最小值交换到前端。
- 插入排序展示暂存 key、空洞及逐项右移，不使用交换代替插入。
- 归并排序自顶向下递归，展示调用栈和逐项写入辅助数组，区间合并完成后整体写回。
- 快速排序保留原有 Lomuto 分区实现。所有排序均为升序。

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
- `src/components/animation-scene.ts`：组装节点、标注、连线及分阶段轨迹。
- `src/components/scene-geometry.ts`：轨迹插值与连线路径计算。
- `src/components/scene-layout.ts`：节点尺寸、轨道与让位时序。
- `src/components/animation-canvas.tsx`：将场景模型绘制为 SVG，不决定布局和动作顺序。
- `src/components/canvas-primitives.tsx`：节点、连线、尾指针与标注等 SVG 原语。

代码面板提供教学片段，不在浏览器中执行。链表代码假定已定义包含 `value` 与 `next` 的 `Node`，C 片段需要 `<stdlib.h>`，C++ 片段需要标准库头文件。索引由界面校验。演示快照的存储不计入算法空间复杂度。

## 动画约束

数组保留稳定的元素身份，交换时沿上下轨道真实移动；索引和指针紧邻单元格，只在轨迹穿过时暂时隐藏。链表新节点从上方接入，先让位后连接，回退时先脱离再收拢。仅指向同一节点的指针合并显示；新节点在插入空位上方单独标注 newNode，原后继提前让位。上方的 next 进入后继顶边，原链路进入左侧，避免两条箭头混在一起。

六个排序/搜索专题的主数组统一使用原快速排序的 y=72 基线；输入区统一预留同一行的目标值列，二分搜索不再额外增加一行。数组舞台将 SVG、就近图例（间隔 8px）和调用栈作为整体在可用画布区域居中；SVG 显式提供宽高，最大显示宽度限制为逻辑宽度，避免桌面端放大空白。主行逻辑基线一致，归并因增加辅助行而整体居中，屏幕上的主行不再强制同高。六专题非空首帧均显示 low/high 和覆盖全数组的浅色虚线范围；这些可以是可视化边界，不要求算法代码存在同名变量。空数组不绘制范围或越界指针。

链表、普通数组与插入场景高度固定为 208 个逻辑单位；归并场景固定为 284，所有帧持续保留 `arraySlots` 或 `auxiliary`（清空时保留 null 槽位）以避免高度跳动。插入暂存节点位于 y=16，与 y=72 主行保持间隙，正反向移动均先升起、横移再落下；归并辅助数组保持在主数组下方 y=208，行标签位于 y=196，与主行指针徽章留出间隙。长输入仍在画布内部横向滚动。交换仍沿上下轨道移动，不改变排序语义。静止和播放的页面布局一致。节点、连线、尾指针和标注全部由同一动画时钟采样；暂停冻结当前动作，恢复从原进度继续，调整倍速不会重放当前动作。单步按钮在移动中暂时禁用；进度条可以取消动作并跳转。手机上的控制条保持单行，播放键使用图标并保留无障碍名称。系统要求减少动态效果时直接呈现目标状态。

几何测试覆盖前进、后退、跳转及运动中的节点、标注碰撞。测试与渲染使用同一轨迹采样函数；浏览器验证仍需检查实际 DOM 边界、暂停和单步锁定，不能以几何单测替代渲染验证。

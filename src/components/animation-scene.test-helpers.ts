import { expect } from "vitest";
import type { Frame, ImplementedSceneKind } from "../core/types";
import {
  connectionPathAt,
  createAnimationScene,
  sampleTrack,
} from "./animation-scene";
import { hashChainCapacityOf } from "./hash-layout";
import { treeDepthOf } from "./tree-layout";

/** 测试里可用的布局就是渲染器已实现的布局。 */
export type SceneKind = ImplementedSceneKind;
export type Box = { x: number; y: number; width: number; height: number };
export function overlaps(a: Box, b: Box) {
  return (
    a.x < b.x + b.width - 0.01 &&
    a.x + a.width > b.x + 0.01 &&
    a.y < b.y + b.height - 0.01 &&
    a.y + a.height > b.y + 0.01
  );
}
export function verifyScene(
  frame: Frame,
  previous: Frame | undefined,
  kind: SceneKind,
  capacity: number,
  treeDepth = 0,
  hashChainCapacity = 0,
) {
  const scene = createAnimationScene({
    frame,
    previous,
    kind,
    capacity,
    treeDepth,
    hashChainCapacity,
  });
  const tree = kind === "tree";
  const hash = kind === "hash";
  const heap = kind === "heap";
  const union = kind === "union-find";
  const treeLike = tree || heap;
  expect(scene.height).toBeLessThanOrEqual(220);
  for (const pointer of scene.pointers)
    for (const name of pointer.name.split(",")) {
      if (frame.items[frame.pointers[name]]?.id !== pointer.targetId)
        throw new Error("指针标签绑定了错误的节点");
    }
  for (const badge of scene.badges) {
    const active = frame.items[frame.active[0]];
    if (active?.id !== badge.targetId)
      throw new Error("目标值徽章绑定了错误的节点");
    if (
      frame.target === undefined ||
      !badge.text.includes(String(frame.target))
    )
      throw new Error("目标值徽章缺少目标值");
  }
  if (scene.formula) {
    const formula = scene.formula;
    if (
      formula.x < 0 ||
      formula.y < 0 ||
      formula.x + formula.width > scene.width ||
      formula.y + formula.height > scene.height
    )
      throw new Error("哈希公式条越界");
    if (!hash) throw new Error("只有哈希场景应显示公式条");
  } else if (hash) {
    throw new Error("哈希场景缺少公式条");
  }
  if (union) {
    const parents = frame.unionParents ?? [];
    const ranks = frame.unionRanks ?? [];
    const ids = frame.items.map((item) => item.id);
    const known = new Set(ids);
    const indexById = new Map(
      ids.map((id, index) => [id, index] as const),
    );
    const parentOf = (id: number) => parents[indexById.get(id)!];
    if (parents.length !== ids.length)
      throw new Error("并查集 parent 没有覆盖全部元素");
    if (ranks.length !== ids.length)
      throw new Error("并查集 rank 没有覆盖全部元素");
    const expectedLinks = new Set<string>();
    parents.forEach((parent, index) => {
      if (!known.has(parent))
        throw new Error("并查集 parent 指向不存在的元素");
      if (parent !== ids[index])
        expectedLinks.add(`${ids[index]}-${parent}`);
      const seen = new Set<number>();
      let node = ids[index];
      while (parentOf(node) !== node) {
        if (seen.has(node)) throw new Error("并查集 parent 成环");
        seen.add(node);
        node = parentOf(node);
      }
      if (seen.size > ids.length) throw new Error("并查集 parent 成环");
    });
    if (scene.unionColumns.length !== frame.items.length)
      throw new Error("并查集数组列数量与元素数不一致");
    if (scene.unionRowLabels.length !== 2)
      throw new Error("并查集缺少 parent / rank 行名");
    const boxes = scene.unionColumns.map((column) => ({
      x: column.x,
      y: column.parentY,
      width: column.width,
      height:
        column.rankY + column.rankHeight - column.parentY,
    }));
    scene.unionColumns.forEach((column, index) => {
      const item = frame.items[index];
      const parentId = parents[index];
      const parentItem = frame.items.find((entry) => entry.id === parentId);
      if (
        column.index !== index ||
        column.id !== item.id ||
        column.element !== item.value ||
        column.parentId !== parentId ||
        column.parent !== parentItem?.value ||
        column.rank !== ranks[index] ||
        column.root !== (parentId === item.id) ||
        column.x < 0 ||
        column.parentY < 0 ||
        column.x + column.width > scene.width ||
        column.rankY + column.rankHeight > scene.height
      )
        throw new Error("并查集数组列与帧数据不一致");
      for (let other = index + 1; other < boxes.length; other++)
        if (overlaps(boxes[index], boxes[other]))
          throw new Error("并查集数组列相交");
      for (const node of scene.nodes)
        if (
          overlaps(boxes[index], {
            x: node.x.at(-1)!,
            y: node.y.at(-1)!,
            width: node.width,
            height: node.height,
          })
        )
          throw new Error("并查集数组列压住树节点");
    });
    const actualLinks = new Set(scene.links.map((link) => link.id));
    for (const id of expectedLinks)
      if (!actualLinks.has(id)) throw new Error("并查集缺少父子连线");
    for (const id of actualLinks)
      if (!expectedLinks.has(id)) throw new Error("并查集多出父子连线");
  }
  if (heap) {
    const order = frame.heapOrder ?? [];
    if (order.length !== frame.items.length)
      throw new Error("堆数组顺序没有覆盖全部节点");
    if (new Set(order).size !== order.length)
      throw new Error("堆数组顺序包含重复节点");
    const valueById = new Map(
      frame.items.map((item) => [item.id, item.value] as const),
    );
    if (scene.heapCells.length !== order.length)
      throw new Error("堆数组格数量与节点数不一致");
    const boxes = scene.heapCells.map((cell) => ({
      x: cell.x,
      y: cell.y,
      width: cell.width,
      height: cell.height,
    }));
    scene.heapCells.forEach((cell, index) => {
      if (
        cell.index !== index ||
        cell.id !== order[index] ||
        cell.value !== valueById.get(cell.id)
      )
        throw new Error("堆数组格与 heapOrder 绑定错误");
      if (
        cell.x < 0 ||
        cell.y < 0 ||
        cell.x + cell.width > scene.width ||
        cell.y + cell.height > scene.height
      )
        throw new Error("堆数组格越界");
      for (let other = index + 1; other < boxes.length; other++)
        if (overlaps(boxes[index], boxes[other]))
          throw new Error("堆数组格相交");
      for (const node of scene.nodes)
        if (
          overlaps(boxes[index], {
            x: node.x.at(-1)!,
            y: node.y.at(-1)!,
            width: node.width,
            height: node.height,
          })
        )
          throw new Error("堆数组格压住树节点");
    });
  }
  for (let tick = 0; tick <= 100; tick++) {
    const t = tick / 100;
    // 树、堆、哈希与并查集的动画会让已有节点滑动，中间时刻允许短暂交叠，只检查静态帧与终点。
    const checkCollisions =
      (!treeLike && !hash && !union) || !previous || t === 1;
    const nodes = scene.nodes.map((node) => ({
      ...node,
      x: sampleTrack(node.x, scene.times, t),
      y: sampleTrack(node.y, scene.times, t),
    }));
    if (scene.formula)
      for (const node of nodes)
        if (overlaps(node, scene.formula))
          throw new Error(`${frame.anchor} 公式条压住节点 ${node.id}`);
    const labels = scene.pointers.map((pointer) => {
      const px = sampleTrack(pointer.x, scene.times, t);
      const py = sampleTrack(pointer.y, scene.times, t);
      return {
        x: pointer.placement === "right" ? px : px - pointer.width / 2,
        y:
          py -
          (pointer.placement === "above"
            ? 12
            : pointer.placement === "right"
              ? 11
              : 27),
        width: pointer.width,
        height:
          pointer.placement === "above"
            ? 16
            : pointer.placement === "right"
              ? 22
              : 34,
        hidden: pointer.revealAfterMotion,
      };
    });
    for (let a = 0; a < labels.length; a++)
      for (let b = a + 1; b < labels.length; b++)
        if (overlaps(labels[a], labels[b])) throw new Error("指针标注相交");
    const visibleLabels = [
      ...labels,
      ...scene.indices.map((index) => ({
        x: index.x - 8,
        y: index.y - 12,
        width: 16,
        height: 16,
        hidden: index.revealAfterMotion,
      })),
    ].filter((label) => !label.hidden || t === 1);
    for (const badge of scene.badges) {
      const box = {
        x: sampleTrack(badge.x, scene.times, t) - badge.width / 2,
        y: sampleTrack(badge.y, scene.times, t) - badge.height / 2,
        width: badge.width,
        height: badge.height,
      };
      if (
        box.x < 0 ||
        box.y < 0 ||
        box.x + box.width > scene.width ||
        box.y + box.height > scene.height
      )
        throw new Error("目标值徽章越界");
    }
    for (let a = 0; a < nodes.length; a++) {
      const node = nodes[a];
      if (
        node.x < 0 ||
        node.y < 0 ||
        node.x + node.width > scene.width ||
        node.y + node.height > scene.height
      )
        throw new Error(`节点 ${node.id} 越界`);
      if (checkCollisions)
        for (let b = a + 1; b < nodes.length; b++)
          if (overlaps(node, nodes[b]))
            throw new Error(
              `${frame.anchor} 节点 ${node.id} / ${nodes[b].id} 在 ${t} 相交`,
            );
      for (const label of visibleLabels)
        if (overlaps(node, label))
          throw new Error(`${frame.anchor} 节点 ${node.id} 在 ${t} 压住标注`);
    }
    for (const link of scene.links) {
      const [from, to] = link.id.split("-").map(Number);
      const a = nodes.find((node) => node.id === from)!;
      const b = nodes.find((node) => node.id === to)!;
      const path = connectionPathAt(link, scene.times, t);
      const numbers = path
        .match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)!
        .map(Number);
      const [ex, ey] = numbers.slice(-2);
      if (union) {
        if (!link.arrow || link.geometry !== "parent")
          throw new Error("并查集边应为带箭头的孩子到父节点连线");
        if (
          Math.abs(numbers[0] - (a.x + a.width / 2)) > 1e-6 ||
          Math.abs(numbers[1] - a.y) > 1e-6 ||
          Math.abs(ex - (b.x + b.width / 2)) > 1e-6 ||
          Math.abs(ey - (b.y + b.height)) > 1e-6
        )
          throw new Error("并查集边端点没有连接孩子顶边与父节点底边");
        if (checkCollisions)
          for (let step = 1; step < 20; step++) {
            const u = step / 20;
            const x = numbers[0] + (numbers[2] - numbers[0]) * u;
            const y = numbers[1] + (numbers[3] - numbers[1]) * u;
            for (const other of nodes)
              if (
                other.id !== from &&
                other.id !== to &&
                x > other.x &&
                x < other.x + other.width &&
                y > other.y &&
                y < other.y + other.height
              )
                throw new Error("并查集边穿过非端点节点");
          }
        continue;
      }
      if (hash) {
        if (!link.arrow || link.geometry !== "hash")
          throw new Error("哈希链应为带箭头的水平连线");
        if (
          Math.abs(numbers[0] - (a.x + a.width)) > 1e-6 ||
          Math.abs(numbers[1] - (a.y + a.height / 2)) > 1e-6 ||
          Math.abs(ex - (b.x - 6)) > 1e-6 ||
          Math.abs(ey - (b.y + b.height / 2)) > 1e-6
        )
          throw new Error("哈希链端点没有连接相邻键节点");
        continue;
      }
      if (treeLike) {
        if (link.arrow || link.geometry !== "tree")
          throw new Error("树边应为无箭头的父子连线");
        if (
          Math.abs(numbers[0] - (a.x + a.width / 2)) > 1e-6 ||
          Math.abs(numbers[1] - (a.y + a.height)) > 1e-6 ||
          Math.abs(ex - (b.x + b.width / 2)) > 1e-6 ||
          Math.abs(ey - b.y) > 1e-6
        )
          throw new Error("树边端点没有连接父子节点的边界中点");
        if (checkCollisions)
          for (let step = 1; step < 20; step++) {
            const u = step / 20;
            const x =
              numbers[0] + (numbers[2] - numbers[0]) * u;
            const y =
              numbers[1] + (numbers[3] - numbers[1]) * u;
            for (const other of nodes)
              if (
                other.id !== from &&
                other.id !== to &&
                x > other.x &&
                x < other.x + other.width &&
                y > other.y &&
                y < other.y + other.height
              )
                throw new Error("树边穿过非端点节点");
          }
        continue;
      }
      const onLeft =
        Math.abs(ex - (b.x - 6)) < 0.001 &&
        ey >= b.y - 6 - 0.001 &&
        ey <= b.y + b.height / 2 + 0.001;
      const onTop =
        Math.abs(ey - (b.y - 6)) < 0.001 &&
        ex >= b.x - 6 - 0.001 &&
        ex <= b.x + b.width / 2 + 0.001;
      if (
        !path.startsWith(`M ${a.x + a.width} ${a.y + a.height / 2} `) ||
        (!onLeft && !onTop)
      )
        throw new Error("连线端点没有沿目标节点外边界移动");
      for (let step = 1; step < 20; step++) {
        const u = step / 20,
          v = 1 - u;
        const x =
          v * v * v * numbers[0] +
          3 * v * v * u * numbers[2] +
          3 * v * u * u * numbers[4] +
          u * u * u * numbers[6];
        const y =
          v * v * v * numbers[1] +
          3 * v * v * u * numbers[3] +
          3 * v * u * u * numbers[5] +
          u * u * u * numbers[7];
        for (const other of nodes)
          if (
            other.id !== from &&
            other.id !== to &&
            x > other.x &&
            x < other.x + other.width &&
            y > other.y &&
            y < other.y + other.height
          )
            throw new Error(
              JSON.stringify({
                anchor: frame.anchor,
                previous: previous?.anchor,
                t,
                link: link.id,
                other: other.id,
                x,
                y,
                nodes,
              }),
            );
        for (const label of visibleLabels)
          if (
            x > label.x &&
            x < label.x + label.width &&
            y > label.y &&
            y < label.y + label.height
          )
            throw new Error("next 连线穿过标注");
      }
    }
  }
  return scene;
}
export function verifyTrace(
  frames: Frame[],
  kind: SceneKind,
  capacityOverride?: number,
) {
  const capacity =
    capacityOverride ?? Math.max(...frames.map((frame) => frame.items.length));
  const treeDepth =
    kind === "tree" ? Math.max(...frames.map(treeDepthOf)) : 0;
  const hashChainCapacity =
    kind === "hash" ? Math.max(...frames.map(hashChainCapacityOf)) : 0;
  const first = createAnimationScene({
    frame: frames[0],
    kind,
    capacity,
    treeDepth,
    hashChainCapacity,
  });
  for (let i = 0; i < frames.length; i++) {
    const scene = verifyScene(
      frames[i],
      undefined,
      kind,
      capacity,
      treeDepth,
      hashChainCapacity,
    );
    expect([scene.width, scene.height]).toEqual([first.width, first.height]);
    if (i > 0) {
      verifyScene(
        frames[i],
        frames[i - 1],
        kind,
        capacity,
        treeDepth,
        hashChainCapacity,
      );
      verifyScene(
        frames[i - 1],
        frames[i],
        kind,
        capacity,
        treeDepth,
        hashChainCapacity,
      );
    }
  }
}

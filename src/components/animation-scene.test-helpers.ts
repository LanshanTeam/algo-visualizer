import { expect } from "vitest";
import type { Frame } from "../core/types";
import {
  connectionPathAt,
  createAnimationScene,
  sampleTrack,
} from "./animation-scene";

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
  kind: "array" | "linked-list",
  capacity: number,
) {
  const scene = createAnimationScene({ frame, previous, kind, capacity });
  expect(scene.height).toBeLessThanOrEqual(220);
  for (const pointer of scene.pointers)
    for (const name of pointer.name.split(",")) {
      if (frame.items[frame.pointers[name]]?.id !== pointer.targetId)
        throw new Error("指针标签绑定了错误的节点");
    }
  for (let tick = 0; tick <= 100; tick++) {
    const t = tick / 100;
    const nodes = scene.nodes.map((node) => ({
      ...node,
      x: sampleTrack(node.x, scene.times, t),
      y: sampleTrack(node.y, scene.times, t),
    }));
    const labels = scene.pointers.map((pointer) => ({
      x: sampleTrack(pointer.x, scene.times, t) - pointer.width / 2,
      y:
        sampleTrack(pointer.y, scene.times, t) -
        (pointer.placement === "above" ? 12 : 27),
      width: pointer.width,
      height: pointer.placement === "above" ? 16 : 34,
      hidden: pointer.revealAfterMotion,
    }));
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
    for (let a = 0; a < nodes.length; a++) {
      const node = nodes[a];
      if (
        node.x < 0 ||
        node.y < 0 ||
        node.x + node.width > scene.width ||
        node.y + node.height > scene.height
      )
        throw new Error(`节点 ${node.id} 越界`);
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
export function verifyTrace(frames: Frame[], kind: "array" | "linked-list") {
  const capacity = Math.max(...frames.map((frame) => frame.items.length));
  const first = createAnimationScene({ frame: frames[0], kind, capacity });
  for (let i = 0; i < frames.length; i++) {
    const scene = verifyScene(frames[i], undefined, kind, capacity);
    expect([scene.width, scene.height]).toEqual([first.width, first.height]);
    if (i > 0) {
      verifyScene(frames[i], frames[i - 1], kind, capacity);
      verifyScene(frames[i - 1], frames[i], kind, capacity);
    }
  }
}

import type { Frame } from "../core/types";

/** 比较由专题显式声明，不从高亮状态或指针名称推断。 */
export function largerComparedId(frame: Frame): number | undefined {
  if (!frame.comparison) return undefined;
  const [leftId, rightId] = frame.comparison;
  const left = frame.items.find(item => item.id === leftId);
  const right = frame.items.find(item => item.id === rightId);
  if (!left || !right || left.value === right.value) return undefined;
  return left.value > right.value ? left.id : right.id;
}

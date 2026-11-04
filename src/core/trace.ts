/**
 * 解析逗号 / 空格分隔的整数输入。
 * `limit` 由各专题按画布容量自行指定。
 */
export function parseValues(text: string, limit = 12): number[] {
  if (!text.trim()) return [];
  const tokens = text.trim().split(/[,，\s]+/);
  if (
    tokens.length > limit ||
    tokens.some(
      (token) => !/^-?\d+$/.test(token) || Math.abs(Number(token)) > 999,
    )
  )
    throw new Error(`请输入最多 ${limit} 个整数，范围 -999 到 999。`);
  return tokens.map(Number);
}

/**
 * 把索引夹到专题声明的合法区间。
 * 换数据或换操作后旧索引可能越界（例如队列前面的元素变多、可用槽位变少），
 * 与其让 trace 抛错，不如先夹住，保证输入框和画布看到的是同一个值。
 */
export function clampIndex(index: number, max: number): number {
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(0, Math.trunc(index)), Math.max(0, max));
}

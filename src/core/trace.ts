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

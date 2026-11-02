/** 随机数据与手工输入分开处理：二分搜索只对随机生成的数据排序。 */
export function randomValues(controls: { sorted?: boolean; limit?: number }): number[] {
  const values = Array.from(
    { length: Math.min(7, controls.limit ?? 12) },
    () => Math.floor(Math.random() * 90) + 10,
  );
  return controls.sorted ? values.sort((a, b) => a - b) : values;
}

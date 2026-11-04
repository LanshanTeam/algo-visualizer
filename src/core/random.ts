/** 随机数据的条数：默认 7 条，给插入类操作留一个空位，并避开被索引占用的槽位。 */
export function randomCount({
  limit = 12,
  capacity,
  reserved = 0,
}: {
  limit?: number;
  capacity?: number;
  reserved?: number;
}): number {
  // 定长结构要留一个空位给插入类操作，并避开被索引占用的槽位；
  // 没有定长容量时（链表、排序、图）沿用数据上限。
  const ceiling = capacity
    ? Math.min(7, limit - 1, capacity - reserved - 1)
    : Math.min(7, limit);
  return Math.max(1, ceiling);
}

/** 随机数据与手工输入分开处理：二分搜索只对随机生成的数据排序。 */
export function randomValues(
  controls: {
    sorted?: boolean;
    limit?: number;
    capacity?: number;
    randomValues?: () => number[];
  },
  reserved = 0,
): number[] {
  if (controls.randomValues) return controls.randomValues();
  const values = Array.from(
    { length: randomCount({ limit: controls.limit, capacity: controls.capacity, reserved }) },
    () => Math.floor(Math.random() * 90) + 10,
  );
  return controls.sorted ? values.sort((a, b) => a - b) : values;
}

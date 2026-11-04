/** 哈希表固定桶数；专题、布局与测试共用。 */
export const HASH_BUCKET_COUNT = 7;

/** 除留余数法，负键也归一到 0..6。 */
export function hashSlot(key: number) {
  return ((key % HASH_BUCKET_COUNT) + HASH_BUCKET_COUNT) % HASH_BUCKET_COUNT;
}

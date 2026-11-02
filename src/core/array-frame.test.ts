import { describe, expect, it } from "vitest";
import type { Frame, Item } from "./types";

describe("array frame contract", () => {
  it("supports stable identities, holes, held values, auxiliary slots and empty ranges", () => {
    const item: Item = { id: 1, value: 7 };
    const frame: Frame = {
      items: [item], active: [], settled: [], pointers: { low: 1 },
      anchor: "hold", narration: "", variables: {}, stack: [],
      arraySlots: [null], held: item,
      auxiliary: { label: "辅助数组", slots: [item] }, range: { low: 1, high: 0 },
    };
    expect(frame.arraySlots).toEqual([null]);
    expect(frame.held).toBe(item);
    expect(frame.auxiliary?.slots[0]).toBe(item);
    expect(frame.range).toEqual({ low: 1, high: 0 });
  });
});

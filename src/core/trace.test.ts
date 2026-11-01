import { describe, expect, it } from "vitest";
import { parseValues } from "./trace";

describe("输入校验", () => {
  it("接受中英文逗号与空格分隔", () => {
    expect(parseValues("1， -2, 3")).toEqual([1, -2, 3]);
    expect(parseValues("")).toEqual([]);
  });
  it("拒绝非整数与越界值", () => {
    for (const input of [
      "1.5",
      "NaN",
      "1000",
      "0x12",
      Array(14).fill(1).join(","),
    ])
      expect(() => parseValues(input)).toThrow();
  });
  it("按专题声明的上限拒绝超长输入", () => {
    expect(() => parseValues("1,2,3", 2)).toThrow();
    expect(parseValues("1,2,3", 3)).toEqual([1, 2, 3]);
  });
});

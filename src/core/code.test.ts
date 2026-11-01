import { describe, expect, it } from "vitest";
import { languages, parseCode } from "./code";

describe("代码模板解析", () => {
  it("剥离行尾锚点并保留展示文本", () => {
    expect(parseCode("int a = 1; // @start\nx = 2 # @walk")).toEqual([
      { text: "int a = 1;", anchor: "start" },
      { text: "x = 2", anchor: "walk" },
    ]);
  });
  it("没有锚点的行原样保留，只去掉行尾空白", () => {
    expect(parseCode("plain   \n  indented")).toEqual([
      { text: "plain", anchor: undefined },
      { text: "  indented", anchor: undefined },
    ]);
  });
  it("只识别行尾标记，行内出现不算锚点", () => {
    expect(parseCode("// @start not at end")).toEqual([
      { text: "// @start not at end", anchor: undefined },
    ]);
  });
  it("语言列表覆盖全部模板语言", () => {
    expect(languages).toEqual(["C", "C++", "Python", "Go", "Java", "Rust"]);
  });
});

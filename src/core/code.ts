import type { CodeLine, Language } from "./types";

export const languages: Language[] = ["C", "C++", "Python", "Go", "Rust"];

/** 行尾的语义标记：`// @anchor` 或 `# @anchor`。 */
const ANCHOR = /\s*(?:\/\/|#)\s*@(\w+)\s*$/;

/**
 * 把带 `@anchor` 标记的代码模板拆成可逐行高亮的代码。
 * 标记本身不会出现在展示文本里。
 */
export function parseCode(template: string): CodeLine[] {
  return template.split("\n").map((line) => {
    const match = line.match(ANCHOR);
    return {
      text: (match ? line.slice(0, match.index) : line).trimEnd(),
      anchor: match?.[1],
    };
  });
}

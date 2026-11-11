import type { ReactNode } from "react";
import type { Language } from "../../core/types";

const KEYWORDS = new Set([
  // C / C++ / Java / Go / Rust
  "auto", "break", "case", "char", "class", "const", "continue", "default",
  "defer", "do", "double", "else", "enum", "extern", "false", "final", "float",
  "for", "func", "go", "goto", "if", "impl", "import", "in", "int", "interface",
  "let", "long", "loop", "map", "match", "mod", "mut", "new", "nil", "null",
  "nullptr", "package", "private", "pub", "public", "range", "return", "select",
  "short", "signed", "sizeof", "static", "struct", "switch", "this", "true",
  "type", "typeof", "union", "unsigned", "use", "var", "void", "volatile",
  "while", "async", "await", "chan", "fn", "dyn", "ref", "self", "super",
  // Python
  "and", "as", "assert", "def", "elif", "except", "finally", "from", "global",
  "is", "lambda", "None", "nonlocal", "not", "or", "pass", "raise", "try",
  "True", "False", "with", "yield", "print",
]);

const TYPE_WORDS = new Set([
  "bool", "byte", "int8", "int16", "int32", "int64", "uint", "uint8",
  "uint16", "uint32", "uint64", "float32", "float64", "string", "str",
  "usize", "isize", "i8", "i16", "i32", "i64", "u8", "u16", "u32", "u64",
  "f32", "f64", "char", "rune", "error", "any", "Object",
]);

const TOKEN =
  /(\/\/[^\n]*|#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)/g;

/** 轻量语法着色：只改变颜色，不改动原始代码文本。 */
export function highlightCode(text: string, language: Language): ReactNode[] {
  if (!text) return [" "];
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;

  for (const match of text.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    const [token, comment, string, number, word] = match;

    if (comment) {
      // Python 用 # 注释；其余语言里的 # 行更像预处理指令。
      nodes.push(
        <span
          key={key++}
          className={language === "Python" ? "tok-com" : "tok-pre"}
        >
          {token}
        </span>,
      );
    } else if (string) {
      nodes.push(
        <span key={key++} className="tok-str">
          {token}
        </span>,
      );
    } else if (number) {
      nodes.push(
        <span key={key++} className="tok-num">
          {token}
        </span>,
      );
    } else if (word) {
      const after = text.slice(index + token.length);
      const isCall = /^\s*\(/.test(after);
      const className = KEYWORDS.has(word)
        ? "tok-key"
        : TYPE_WORDS.has(word)
          ? "tok-type"
          : isCall
            ? "tok-fn"
            : undefined;
      nodes.push(
        className ? (
          <span key={key++} className={className}>
            {token}
          </span>
        ) : (
          token
        ),
      );
    }
    last = index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

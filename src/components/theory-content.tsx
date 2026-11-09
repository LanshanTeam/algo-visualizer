import type { TheoryBlock } from "../topics/types";
import { BookOpen } from "lucide-react";

export function TheoryContent({ blocks }: { blocks: readonly TheoryBlock[] }) {
  return blocks.map((block) => {
    const Icon = block.icon ?? BookOpen;
    return (
      <article key={block.title}>
        <h3>
          <Icon aria-hidden={true} />
          {block.title}
        </h3>
        <p>{block.body}</p>
        {block.items && (
          <ul>
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
        {block.rows && (
          <table aria-label={block.title}>
            <thead>
              <tr>
                <th scope="col">操作或情况</th>
                <th scope="col" style={{ textAlign: "right" }}>复杂度</th>
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>
    );
  });
}

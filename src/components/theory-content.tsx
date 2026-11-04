import type { TheoryBlock } from "../topics/types";
import { BookOpen } from "lucide-react";

export function TheoryContent({ blocks }: { blocks: readonly TheoryBlock[] }) {
  return blocks.map((block) => {
    const Icon = block.icon ?? BookOpen;
    return (
      <article
        key={block.title}
        className="min-w-0 space-y-3 [overflow-wrap:anywhere]"
      >
        <h3 className="flex items-center gap-2 font-medium">
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden={true} />
          {block.title}
        </h3>
        <p className="text-muted-foreground">{block.body}</p>
        {block.items && (
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
        {block.rows && (
          <table aria-label={block.title} className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th scope="col" className="py-2 pr-3 font-medium">
                  操作或情况
                </th>
                <th scope="col" className="py-2 font-medium">
                  复杂度
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {block.rows.map((row) => (
                <tr key={row.label} className="border-b last:border-0">
                  <th scope="row" className="py-2 pr-3 font-normal">
                    {row.label}
                  </th>
                  <td className="py-2 font-mono">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>
    );
  });
}

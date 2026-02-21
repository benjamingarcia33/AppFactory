"use client";

import { cn } from "@/lib/utils";
import type { CompetitiveMatrixEntry } from "@/lib/types";

interface CompetitiveMatrixProps {
  matrix: CompetitiveMatrixEntry[];
}

function getScoreColor(score: number): string {
  if (score > 7) return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
  if (score >= 4) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
  return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
}

export function CompetitiveMatrix({ matrix }: CompetitiveMatrixProps) {
  if (matrix.length === 0) return null;

  // Collect all unique category names from all entries
  const categories = Array.from(
    new Set(matrix.flatMap((entry) => Object.keys(entry.scores)))
  );

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Competitive Matrix</h3>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-2 px-3 font-medium">Competitor</th>
              {categories.map((cat) => (
                <th key={cat} className="text-center py-2 px-3 font-medium whitespace-nowrap">
                  {cat}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((entry, i) => (
              <tr
                key={i}
                className={cn(
                  "border-b last:border-b-0",
                  entry.isOurs && "bg-primary/5 border-l-2 border-l-primary"
                )}
              >
                <td className={cn("py-2 px-3 font-medium", entry.isOurs && "text-primary")}>
                  {entry.name}
                  {entry.isOurs && (
                    <span className="ml-1.5 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                      Ours
                    </span>
                  )}
                </td>
                {categories.map((cat) => {
                  const score = entry.scores[cat] ?? 0;
                  return (
                    <td key={cat} className="text-center py-2 px-3">
                      <span
                        className={cn(
                          "inline-block min-w-[2rem] rounded px-1.5 py-0.5 text-xs font-medium",
                          getScoreColor(score)
                        )}
                      >
                        {score}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

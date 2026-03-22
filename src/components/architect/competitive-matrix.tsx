"use client";

import { cn } from "@/lib/utils";
import type { CompetitiveMatrixEntry } from "@/lib/types";

interface CompetitiveMatrixProps {
  matrix: CompetitiveMatrixEntry[];
  hideTitle?: boolean;
}

function getScoreColor(score: number): string {
  if (score > 7) return "bg-green-500/10 text-green-400";
  if (score >= 4) return "bg-yellow-500/10 text-yellow-400";
  return "bg-red-500/10 text-red-400";
}

export function CompetitiveMatrix({ matrix, hideTitle }: CompetitiveMatrixProps) {
  if (!matrix || matrix.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        Competitive matrix data not available.
      </div>
    );
  }

  // Collect all unique category names from all entries
  const categories = Array.from(
    new Set(matrix.flatMap((entry) => (entry?.scores ?? []).map((s) => s?.category ?? "Unknown")))
  );

  return (
    <div className="space-y-3">
      {!hideTitle && <h3 className="text-lg font-semibold">Competitive Matrix</h3>}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-surface-1">
              <th className="text-left py-2 px-3 font-medium">Competitor</th>
              {categories.map((cat) => (
                <th key={cat} className="text-center py-2 px-3 font-medium whitespace-nowrap">
                  {cat}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-surface-0">
            {matrix.map((entry, i) => (
              <tr
                key={i}
                className={cn(
                  "border-b last:border-b-0",
                  entry?.isOurs && "bg-primary/5 border-l-2 border-l-primary"
                )}
              >
                <td className={cn("py-2 px-3 font-medium", entry?.isOurs && "text-primary")}>
                  {entry?.name ?? "Unknown"}
                  {entry?.isOurs && (
                    <span className="ml-1.5 text-[11px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                      Ours
                    </span>
                  )}
                </td>
                {categories.map((cat) => {
                  const score = (entry?.scores ?? []).find((s) => s?.category === cat)?.score ?? 0;
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

"use client";

import { Badge } from "@/components/ui/badge";
import type { IdeaEvolution } from "@/lib/types";

interface IdeaEvolutionHistoryProps {
  evolutions: IdeaEvolution[];
  onSelect?: (evolution: IdeaEvolution) => void;
}

const statusColors: Record<string, string> = {
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
  cancelled: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  analyzing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  generating: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  pending: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const feasibilityColors: Record<string, string> = {
  straightforward: "bg-green-500/10 text-green-400 border-green-500/20",
  moderate: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  complex: "bg-red-500/10 text-red-400 border-red-500/20",
};

function isActiveStatus(status: string): boolean {
  return status === "analyzing" || status === "generating";
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "...";
}

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function IdeaEvolutionHistory({
  evolutions,
  onSelect,
}: IdeaEvolutionHistoryProps) {
  if (evolutions.length === 0) return null;

  // Cumulative stats from completed evolutions
  const completedEvolutions = evolutions.filter((e) => e.status === "completed");
  const totalNewScreens = completedEvolutions.reduce(
    (acc, e) => acc + (e.newScreens?.length ?? 0),
    0
  );
  const totalModifiedScreens = completedEvolutions.reduce(
    (acc, e) => acc + (e.modifiedScreens?.length ?? 0),
    0
  );
  const totalNewTables = completedEvolutions.reduce(
    (acc, e) => acc + (e.newTables?.length ?? 0),
    0
  );

  return (
    <div className="rounded-xl border border-border bg-surface-0 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Evolution History</h3>
        <Badge variant="outline">{evolutions.length}</Badge>
      </div>

      {/* Cumulative stats */}
      {completedEvolutions.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground border-b border-border pb-3">
          <span>
            <span className="font-medium text-green-400">{totalNewScreens}</span> new screen{totalNewScreens !== 1 ? "s" : ""}
          </span>
          <span>
            <span className="font-medium text-blue-400">{totalModifiedScreens}</span> modified screen{totalModifiedScreens !== 1 ? "s" : ""}
          </span>
          <span>
            <span className="font-medium text-green-400">{totalNewTables}</span> new table{totalNewTables !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Evolution list */}
      <ul className="space-y-2">
        {evolutions.map((evolution) => {
          const active = isActiveStatus(evolution.status);

          return (
            <li
              key={evolution.id}
              className={`rounded-lg border border-border bg-surface-1 p-3 space-y-2 ${
                onSelect ? "cursor-pointer hover:bg-surface-1/80 transition-colors" : ""
              }`}
              onClick={() => onSelect?.(evolution)}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm leading-snug min-w-0">
                  {truncate(evolution.ideaText, 80)}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge
                    variant="outline"
                    className={`${statusColors[evolution.status] ?? ""} ${
                      active ? "animate-pulse" : ""
                    }`}
                  >
                    {evolution.status}
                  </Badge>
                  {evolution.impactAnalysis && (
                    <Badge
                      variant="outline"
                      className={feasibilityColors[evolution.impactAnalysis.feasibility] ?? ""}
                    >
                      {evolution.impactAnalysis.feasibility}
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(evolution.createdAt)}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

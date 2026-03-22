"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { LayoutList, Table2 } from "lucide-react";
import type { CompetitiveDetail } from "@/lib/types";

interface EnhancedCompetitiveDetailsProps {
  details: CompetitiveDetail[];
  hideTitle?: boolean;
}

export function EnhancedCompetitiveDetails({ details, hideTitle }: EnhancedCompetitiveDetailsProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  if (!details || details.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        Competitive details data not available.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {!hideTitle && <h3 className="text-lg font-semibold">Competitive Deep Dive</h3>}
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => setViewMode("card")} className={cn("p-1.5 rounded", viewMode === "card" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>
            <LayoutList className="h-4 w-4" />
          </button>
          <button onClick={() => setViewMode("table")} className={cn("p-1.5 rounded", viewMode === "table" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>
            <Table2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {viewMode === "card" && (
        <div className="space-y-2">
          {details.map((detail, i) => (
            <Collapsible
              key={i}
              open={openIndex === i}
              onOpenChange={(open) => setOpenIndex(open ? i : null)}
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-surface-0 px-4 py-3 text-left hover:bg-surface-1 transition-colors">
                <div className="flex items-center gap-2">
                  <span className={cn("font-medium text-sm", detail?.isOurs && "text-primary")}>
                    {detail?.name ?? "Unknown Competitor"}
                  </span>
                  {detail?.isOurs && (
                    <Badge variant="default" className="text-[11px]">Ours</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{detail?.pricing ?? "N/A"}</span>
                  <span>{openIndex === i ? "Collapse" : "Expand"}</span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 py-3 border border-t-0 rounded-b-lg space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Market Position</p>
                  <p className="text-sm">{detail?.marketPosition ?? "No data"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">User Base</p>
                  <p className="text-sm">{detail?.userBase ?? "No data"}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Strengths</p>
                    <div className="flex flex-wrap gap-1">
                      {(detail?.strengths ?? []).map((s, j) => (
                        <Badge
                          key={j}
                          variant="outline"
                          className="bg-green-500/10 text-green-400 border-green-500/20 text-[11px]"
                        >
                          {s ?? ""}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Weaknesses</p>
                    <div className="flex flex-wrap gap-1">
                      {(detail?.weaknesses ?? []).map((w, j) => (
                        <Badge
                          key={j}
                          variant="outline"
                          className="bg-red-500/10 text-red-400 border-red-500/20 text-[11px]"
                        >
                          {w ?? ""}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}

      {viewMode === "table" && (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-surface-1">
                <th className="text-left py-2 px-3 font-medium">Name</th>
                <th className="text-left py-2 px-3 font-medium">Pricing</th>
                <th className="text-left py-2 px-3 font-medium">Market Position</th>
                <th className="text-center py-2 px-3 font-medium">Strengths</th>
                <th className="text-center py-2 px-3 font-medium">Weaknesses</th>
              </tr>
            </thead>
            <tbody className="bg-surface-0">
              {details.map((detail, i) => (
                <tr key={i} className="border-b last:border-b-0">
                  <td className="py-2 px-3 font-medium">
                    {detail?.name ?? "Unknown"}
                    {detail?.isOurs && <Badge variant="default" className="ml-1 text-[11px]">Ours</Badge>}
                  </td>
                  <td className="py-2 px-3 text-xs">{detail?.pricing ?? "N/A"}</td>
                  <td className="py-2 px-3 text-xs text-muted-foreground">{detail?.marketPosition ?? "N/A"}</td>
                  <td className="py-2 px-3 text-center text-green-400 font-medium">{(detail?.strengths ?? []).length}</td>
                  <td className="py-2 px-3 text-center text-red-400 font-medium">{(detail?.weaknesses ?? []).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

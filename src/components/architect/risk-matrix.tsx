"use client";

import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { RiskItem } from "@/lib/types";

interface RiskMatrixProps {
  risks: RiskItem[];
  hideTitle?: boolean;
}

const categoryLabels: Record<string, string> = {
  market: "Market",
  technical: "Technical",
  financial: "Financial",
  operational: "Operational",
  competitive: "Competitive",
};

const categoryColors: Record<string, string> = {
  market: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  technical: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  financial: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  operational: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  competitive: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

const levelColors: Record<string, string> = {
  high: "bg-red-500/10 text-red-400 border-red-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  low: "bg-green-500/10 text-green-400 border-green-500/20",
};

export function RiskMatrix({ risks, hideTitle }: RiskMatrixProps) {
  if (!risks || risks.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        Risk assessment data not available.
      </div>
    );
  }

  // Group risks by category
  const grouped = risks.reduce<Record<string, RiskItem[]>>((acc, risk) => {
    const key = risk?.category ?? "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(risk);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  return (
    <div className="space-y-3">
      {!hideTitle && <h3 className="text-lg font-semibold">Risk Assessment</h3>}
      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-xs", categoryColors[category] ?? "")}>
                {categoryLabels[category] ?? category}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {(grouped[category] ?? []).length} risk{(grouped[category] ?? []).length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-1.5 pl-1">
              {(grouped[category] ?? []).map((risk, i) => (
                <Collapsible key={i}>
                  <CollapsibleTrigger className="flex w-full items-start gap-2 rounded-md border border-border bg-surface-0 px-3 py-2 text-left hover:bg-surface-1 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{risk?.risk ?? "Unknown risk"}</p>
                      <div className="flex gap-1.5 mt-1">
                        <Badge
                          variant="outline"
                          className={cn("text-[11px]", levelColors[risk?.probability ?? ""] ?? "")}
                        >
                          P: {risk?.probability ?? "?"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn("text-[11px]", levelColors[risk?.impact ?? ""] ?? "")}
                        >
                          I: {risk?.impact ?? "?"}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 shrink-0">
                      Expand
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-3 py-2 ml-1 border-l-2 border-muted">
                    <div className="space-y-1.5">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Mitigation</p>
                        <p className="text-sm">{risk?.mitigation ?? "No mitigation specified"}</p>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

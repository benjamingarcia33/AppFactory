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
}

const categoryLabels: Record<RiskItem["category"], string> = {
  market: "Market",
  technical: "Technical",
  financial: "Financial",
  operational: "Operational",
  competitive: "Competitive",
};

const categoryColors: Record<RiskItem["category"], string> = {
  market: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  technical: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  financial: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  operational: "bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300",
  competitive: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
};

const levelColors: Record<string, string> = {
  high: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800",
  low: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800",
};

export function RiskMatrix({ risks }: RiskMatrixProps) {
  // Group risks by category
  const grouped = risks.reduce<Record<string, RiskItem[]>>((acc, risk) => {
    const key = risk.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(risk);
    return acc;
  }, {});

  const categories = Object.keys(grouped) as RiskItem["category"][];

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Risk Assessment</h3>
      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-xs", categoryColors[category])}>
                {categoryLabels[category]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {grouped[category].length} risk{grouped[category].length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-1.5 pl-1">
              {grouped[category].map((risk, i) => (
                <Collapsible key={i}>
                  <CollapsibleTrigger className="flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{risk.risk}</p>
                      <div className="flex gap-1.5 mt-1">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", levelColors[risk.probability])}
                        >
                          P: {risk.probability}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", levelColors[risk.impact])}
                        >
                          I: {risk.impact}
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
                        <p className="text-sm">{risk.mitigation}</p>
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

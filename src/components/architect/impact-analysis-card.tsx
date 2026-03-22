"use client";

import { Badge } from "@/components/ui/badge";
import type { ImpactAnalysis } from "@/lib/types";

interface ImpactAnalysisCardProps {
  impactAnalysis: ImpactAnalysis;
}

const feasibilityColors: Record<string, string> = {
  straightforward: "bg-green-500/10 text-green-400 border-green-500/20",
  moderate: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  complex: "bg-red-500/10 text-red-400 border-red-500/20",
};

const actionBadgeColors: Record<string, string> = {
  new: "bg-green-500/10 text-green-400 border-green-500/20",
  modify: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const pricingImpactColors: Record<string, string> = {
  minor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  major: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function ImpactAnalysisCard({ impactAnalysis }: ImpactAnalysisCardProps) {
  const {
    feasibility,
    estimatedEffort,
    affectedScreens,
    affectedTables,
    newTechnologies,
    conflictsWithExisting,
    implementationOrder,
    pricingImpact,
    pricingNotes,
  } = impactAnalysis;

  return (
    <div className="rounded-xl border border-border bg-surface-0 p-4 space-y-4">
      {/* Header: feasibility + effort */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className={feasibilityColors[feasibility] ?? ""}>
          {feasibility}
        </Badge>
        <span className="text-sm text-muted-foreground">{estimatedEffort}</span>
      </div>

      {/* Affected screens */}
      {affectedScreens.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Affected Screens</h4>
          <ul className="space-y-1.5">
            {affectedScreens.map((screen) => (
              <li
                key={screen.screenName}
                className="flex items-start gap-2 text-sm"
              >
                <Badge
                  variant="outline"
                  className={actionBadgeColors[screen.action] ?? ""}
                >
                  {screen.action}
                </Badge>
                <div className="min-w-0">
                  <span className="font-medium">{screen.screenName}</span>
                  <span className="text-muted-foreground"> — {screen.changes}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Affected tables */}
      {affectedTables.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Affected Tables</h4>
          <ul className="space-y-1.5">
            {affectedTables.map((table) => (
              <li
                key={table.tableName}
                className="flex items-start gap-2 text-sm"
              >
                <Badge
                  variant="outline"
                  className={actionBadgeColors[table.action] ?? ""}
                >
                  {table.action}
                </Badge>
                <div className="min-w-0">
                  <span className="font-medium">{table.tableName}</span>
                  <span className="text-muted-foreground"> — {table.changes}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* New technologies */}
      {newTechnologies.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">New Technologies</h4>
          <ul className="space-y-1.5">
            {newTechnologies.map((tech) => (
              <li key={tech.slug} className="text-sm">
                <span className="font-mono text-xs rounded bg-surface-1 px-1.5 py-0.5 border border-border">
                  {tech.slug}
                </span>
                <span className="text-muted-foreground ml-2">{tech.justification}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Conflicts */}
      {conflictsWithExisting.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Conflicts</h4>
          <div className="space-y-1.5">
            {conflictsWithExisting.map((conflict, i) => (
              <div
                key={i}
                className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-sm text-yellow-400"
              >
                <div className="flex items-start gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-4 mt-0.5 shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{conflict}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Implementation order */}
      {implementationOrder.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Implementation Order</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            {implementationOrder.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Pricing impact */}
      {pricingImpact !== "none" && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium">Pricing Impact</h4>
            <Badge variant="outline" className={pricingImpactColors[pricingImpact] ?? ""}>
              {pricingImpact}
            </Badge>
          </div>
          {pricingNotes && (
            <p className="text-sm text-muted-foreground">{pricingNotes}</p>
          )}
        </div>
      )}
    </div>
  );
}

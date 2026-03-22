"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { complexityColors, setupComplexityColors, platformLabels } from "@/lib/ui-constants";
import type { Technology } from "@/lib/types";

interface TechnologyCardProps {
  technology: Technology;
}

export function TechnologyCard({ technology }: TechnologyCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="flex flex-col rounded-xl border border-border bg-surface-0">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm leading-tight">{technology.name}</CardTitle>
          <div className="flex gap-1 shrink-0">
            <Badge variant="outline" className={`text-[10px] ${complexityColors[technology.complexity] ?? ""}`}>
              {technology.complexity}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {platformLabels[technology.platforms] ?? technology.platforms}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{technology.description}</p>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pt-0">
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-[10px] font-normal">
            {technology.category}
          </Badge>
          <Badge variant="outline" className={`text-[10px] font-normal ${setupComplexityColors[technology.setupComplexity] ?? ""}`}>
            {technology.setupComplexity}
          </Badge>
          {technology.pricing && (
            <Badge variant="secondary" className="text-[10px] font-normal">
              {technology.pricing}
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Best for:</span> {technology.bestFor}
        </p>

        {expanded && (
          <div className="space-y-3 text-xs">
            <div>
              <h4 className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">Limitations</h4>
              <p className="text-muted-foreground leading-relaxed">{technology.limitations}</p>
            </div>

            {technology.npmPackages.length > 0 && (
              <div>
                <h4 className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">Packages</h4>
                <div className="flex flex-wrap gap-1">
                  {technology.npmPackages.map((pkg, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] font-mono font-normal">
                      {pkg}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">Prompt Fragment</h4>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{technology.promptFragment}</p>
            </div>

            {technology.requires.length > 0 && (
              <div>
                <h4 className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">Requires</h4>
                <div className="flex flex-wrap gap-1">
                  {technology.requires.map((slug, i) => (
                    <Badge key={i} variant="destructive" className="text-[10px] font-normal">
                      {slug}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {technology.pairsWith.length > 0 && (
              <div>
                <h4 className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pairs Well With</h4>
                <div className="flex flex-wrap gap-1">
                  {technology.pairsWith.map((slug, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] font-normal">
                      {slug}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {technology.docsUrl && (
              <a
                href={technology.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-xs block"
              >
                Documentation
              </a>
            )}
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary hover:underline"
        >
          {expanded ? "Show less" : "Show details"}
        </button>
      </CardContent>
    </Card>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScreenPattern } from "@/lib/types";

interface ScreenPatternCardProps {
  pattern: ScreenPattern;
}

const categoryColors: Record<string, string> = {
  auth: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  core: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  content: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  social: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  utility: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export function ScreenPatternCard({ pattern }: ScreenPatternCardProps) {
  return (
    <Card className="flex flex-col rounded-xl border border-border bg-surface-0">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm leading-tight">{pattern.name}</CardTitle>
          <Badge
            variant="outline"
            className={`text-[10px] shrink-0 ${categoryColors[pattern.category] ?? ""}`}
          >
            {pattern.category}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{pattern.description}</p>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pt-0">
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-[10px] font-normal">
            {pattern.layoutPattern}
          </Badge>
          <Badge variant="outline" className="text-[10px] font-normal">
            {pattern.platforms}
          </Badge>
        </div>

        {pattern.requiredTechCategories.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Required Tech</p>
            <div className="flex flex-wrap gap-1">
              {pattern.requiredTechCategories.map((cat, i) => (
                <Badge key={i} variant="outline" className="text-[10px] font-normal bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {pattern.optionalTechCategories.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Optional Tech</p>
            <div className="flex flex-wrap gap-1">
              {pattern.optionalTechCategories.map((cat, i) => (
                <Badge key={i} variant="outline" className="text-[10px] font-normal">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

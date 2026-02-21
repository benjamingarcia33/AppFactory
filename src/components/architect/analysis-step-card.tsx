"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AnalysisStep } from "@/lib/types";

interface AnalysisStepCardProps {
  step: AnalysisStep;
}

const statusConfig: Record<
  AnalysisStep["status"],
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pending", variant: "outline" },
  running: { label: "Running", variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  failed: { label: "Failed", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "outline" },
};

export function AnalysisStepCard({ step }: AnalysisStepCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = statusConfig[step.status];
  const truncatedContent =
    step.content.length > 200
      ? step.content.slice(0, 200) + "..."
      : step.content;

  return (
    <Card
      className={
        step.status === "running"
          ? "border-primary/50 shadow-md"
          : step.status === "completed"
            ? "border-green-500/30"
            : ""
      }
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                step.status === "completed"
                  ? "bg-green-500/10 text-green-600"
                  : step.status === "running"
                    ? "bg-primary/10 text-primary"
                    : step.status === "failed"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
              }`}
            >
              {step.step}
            </div>
            <CardTitle className="text-sm">{step.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {step.status === "running" && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              </span>
            )}
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
        </div>
      </CardHeader>

      {step.status === "completed" && step.content && (
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {expanded ? step.content : truncatedContent}
          </div>
          {step.content.length > 200 && (
            <Button
              variant="link"
              size="xs"
              className="mt-1 h-auto p-0 text-xs"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Show less" : "Show more"}
            </Button>
          )}
        </CardContent>
      )}

      {step.status === "running" && (
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Generating analysis...
          </div>
        </CardContent>
      )}
    </Card>
  );
}

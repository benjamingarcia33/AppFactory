"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

interface ScanProgressProps {
  stage: string;
  message: string;
  progress: number;
  isActive: boolean;
}

const stageLabels: Record<string, string> = {
  starting: "Starting Scan",
  scraping: "Scraping Store",
  filtering: "Filtering Apps",
  reviews: "Fetching Reviews",
  analysis: "Analyzing Sentiment",
  feasibility: "Feasibility Check",
  generating_queries: "Generating Search Queries",
  queries_generated: "Search Queries Ready",
  searching: "Searching App Stores",
  search_strategy: "AI Search Strategy",
  discovery_angle: "Discovering Angle",
  gap_analysis: "Analyzing Competitive Gaps",
  blue_ocean: "Blue Ocean Assessment",
  synthesis: "Synthesizing Master Idea",
  synthesis_warning: "Synthesis Warning",
  complete: "Scan Complete",
  cancelled: "Cancelled",
  error: "Error",
};

export function ScanProgress({
  stage,
  message,
  progress,
  isActive,
}: ScanProgressProps) {
  if (!isActive) return null;

  return (
    <Card className="rounded-xl border border-border/50 bg-surface-0/50 backdrop-blur-sm">
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {stageLabels[stage] ?? stage}
          </span>
          <span className="text-sm text-muted-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="mb-2" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

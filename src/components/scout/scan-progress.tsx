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
  scraping: "Scraping Store",
  filtering: "Filtering Apps",
  reviews: "Fetching Reviews",
  analysis: "AI Analysis",
  feasibility: "Feasibility Check",
  cancelled: "Cancelled",
};

export function ScanProgress({
  stage,
  message,
  progress,
  isActive,
}: ScanProgressProps) {
  if (!isActive) return null;

  return (
    <Card>
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

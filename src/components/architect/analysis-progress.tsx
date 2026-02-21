"use client";

import { AnalysisStepCard } from "@/components/architect/analysis-step-card";
import type { AnalysisStep } from "@/lib/types";

interface AnalysisProgressProps {
  steps: AnalysisStep[];
  currentStep: number;
}

export function AnalysisProgress({ steps, currentStep }: AnalysisProgressProps) {
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const totalSteps = steps.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Analysis Progress</h2>
        <span className="text-sm text-muted-foreground">
          {completedCount === totalSteps
            ? "All steps completed"
            : `Step ${currentStep} of ${totalSteps}`}
        </span>
      </div>

      <div className="relative space-y-3">
        {/* Vertical timeline connector */}
        <div className="absolute left-[2.05rem] top-6 bottom-6 w-px bg-border" />

        {steps.map((step) => (
          <div key={step.step} className="relative">
            <AnalysisStepCard step={step} />
          </div>
        ))}
      </div>
    </div>
  );
}

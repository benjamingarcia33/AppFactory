"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TimelinePhase } from "@/lib/types";

interface TimelineVisualProps {
  timeline: TimelinePhase[];
}

export function TimelineVisual({ timeline }: TimelineVisualProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Development Timeline</h3>
      <div className="flex gap-0 overflow-x-auto pb-2">
        {timeline.map((phase, i) => (
          <div key={i} className="flex items-start shrink-0">
            <Card className="min-w-[240px] max-w-[280px]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px]">
                    Phase {i + 1}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{phase.duration}</span>
                </div>
                <CardTitle className="text-sm mt-1">{phase.phase}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium mb-1">Milestones</p>
                  <ul className="space-y-0.5">
                    {phase.milestones.map((m, j) => (
                      <li key={j} className="text-xs text-muted-foreground flex gap-1.5">
                        <span className="shrink-0">&#8226;</span>
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium mb-1">Deliverables</p>
                  <div className="flex flex-wrap gap-1">
                    {phase.keyDeliverables.map((d, j) => (
                      <Badge key={j} variant="secondary" className="text-[10px]">
                        {d}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            {i < timeline.length - 1 && (
              <div className="flex items-center self-center px-1">
                <div className="w-6 h-0.5 bg-border" />
                <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[6px] border-l-border" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

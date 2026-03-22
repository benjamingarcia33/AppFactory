"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BlueOceanResult } from "@/lib/types";

interface BlueOceanCardProps {
  blueOcean: BlueOceanResult;
  opportunityId?: string;
  scanId?: string;
  inline?: boolean;
}

function ConfidenceMeter({ confidence }: { confidence: number }) {
  const color =
    confidence >= 70
      ? "bg-green-500"
      : confidence >= 40
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Confidence</span>
        <span className="font-bold">{confidence}%</span>
      </div>
      <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${confidence}%` }}
        />
      </div>
    </div>
  );
}

export function BlueOceanCard({ blueOcean, opportunityId, scanId, inline = false }: BlueOceanCardProps) {
  const isBlue = blueOcean.isBlueOcean;

  const content = (
    <>
      <ConfidenceMeter confidence={blueOcean.confidence} />

      <p className="text-sm text-muted-foreground leading-relaxed">
        {blueOcean.reasoning}
      </p>

      {blueOcean.adjacentMarkets.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Adjacent Markets
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {blueOcean.adjacentMarkets.map((market, i) => (
              <Badge key={i} variant="secondary" className="text-xs font-normal">
                {market}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {blueOcean.risks.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Risks
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {blueOcean.risks.map((risk, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-xs font-normal bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
              >
                {risk}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {blueOcean.nextSteps.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Next Steps
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            {blueOcean.nextSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {!inline && scanId && (
        <Button asChild className="w-full" size="lg">
          <Link href={`/architect?scanId=${scanId}`}>
            Architect this Idea
          </Link>
        </Button>
      )}
    </>
  );

  if (inline) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          {isBlue ? (
            <>
              <span className="text-blue-400">&#9679;</span>
              Blue Ocean Opportunity Detected
            </>
          ) : (
            <>
              <span className="text-orange-400">&#9679;</span>
              Competitive Market
            </>
          )}
        </h3>
        {content}
      </div>
    );
  }

  return (
    <Card className={`rounded-xl border bg-surface-0 ${isBlue ? "border-blue-500/20" : "border-border"}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {isBlue ? (
            <>
              <span className="text-blue-400">&#9679;</span>
              Blue Ocean Opportunity Detected
            </>
          ) : (
            <>
              <span className="text-orange-400">&#9679;</span>
              Competitive Market
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {content}
      </CardContent>
    </Card>
  );
}

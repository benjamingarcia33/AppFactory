"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Opportunity } from "@/lib/types";

interface OpportunityDetailModalProps {
  opportunity: Opportunity | null;
  allOpportunities?: Opportunity[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const severityColors: Record<string, string> = {
  critical: "bg-red-500",
  major: "bg-orange-500",
  minor: "bg-yellow-500",
};

const demandColors: Record<string, string> = {
  high: "bg-purple-500/10 text-purple-700 border-purple-200",
  medium: "bg-blue-500/10 text-blue-700 border-blue-200",
  low: "bg-slate-500/10 text-slate-700 border-slate-200",
};

const sentimentColors: Record<string, string> = {
  positive: "bg-green-500/10 text-green-700 border-green-200",
  mixed: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  negative: "bg-red-500/10 text-red-700 border-red-200",
};

export function OpportunityDetailModal({
  opportunity,
  allOpportunities = [],
  open,
  onOpenChange,
}: OpportunityDetailModalProps) {
  const competitors = useMemo(() => {
    if (!opportunity) return [];
    return allOpportunities
      .filter((o) => o.id !== opportunity.id)
      .sort((a, b) => b.score.composite - a.score.composite)
      .slice(0, 5);
  }, [opportunity, allOpportunities]);

  if (!opportunity) return null;

  const { scrapedApp, reviews, sentiment, score } = opportunity;

  // Derive improvement opportunities from feature requests + high-severity pain points
  const improvements = [
    ...sentiment.featureRequests.map((fr) => ({
      title: fr.feature,
      source: "feature_request" as const,
      demand: fr.demand,
      description: fr.sampleQuotes[0] || null,
    })),
    ...sentiment.painPoints
      .filter((pp) => pp.severity === "critical" || pp.severity === "major")
      .map((pp) => ({
        title: `Fix: ${pp.issue}`,
        source: "pain_point" as const,
        demand: pp.severity === "critical" ? "high" : ("medium" as string),
        description: pp.sampleQuotes[0] || null,
      })),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-start gap-3">
            {scrapedApp.icon && (
              <div className="relative size-14 rounded-xl overflow-hidden shrink-0 border">
                <Image
                  src={scrapedApp.icon}
                  alt={scrapedApp.title}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            )}
            <div>
              <DialogTitle className="text-left">{scrapedApp.title}</DialogTitle>
              <DialogDescription className="text-left">
                {scrapedApp.developer} &middot;{" "}
                {scrapedApp.store === "google_play"
                  ? "Google Play"
                  : "App Store"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Scores */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Composite", value: score.composite },
                { label: "Market Size", value: score.marketSize },
                { label: "Dissatisfaction", value: score.dissatisfaction },
                { label: "Feasibility", value: score.feasibility },
              ].map(({ label, value }) => (
                <div key={label} className="text-center p-2 rounded-lg bg-muted">
                  <p className="text-lg font-bold">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* App Info */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                Rating: {scrapedApp.score.toFixed(1)}/5
              </Badge>
              <Badge variant="outline">
                {scrapedApp.ratings.toLocaleString()} ratings
              </Badge>
              <Badge variant="outline">
                {scrapedApp.installs} installs{scrapedApp.installs.startsWith("~") ? " (estimated)" : ""}
              </Badge>
              <Badge variant="secondary">{scrapedApp.genre}</Badge>
            </div>

            {/* Overall Sentiment */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Overall Sentiment:</span>
              <Badge
                variant="outline"
                className={sentimentColors[sentiment.overallSentiment] ?? ""}
              >
                {sentiment.overallSentiment}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{sentiment.summary}</p>

            <Separator />

            {/* Flaws & Pain Points */}
            {sentiment.painPoints.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Flaws & Pain Points</h3>
                <div className="space-y-2">
                  {sentiment.painPoints.map((pp, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`size-2 rounded-full shrink-0 ${severityColors[pp.severity] ?? "bg-gray-400"}`}
                        />
                        <span className="text-sm font-medium">{pp.issue}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {pp.severity}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {pp.frequency} freq
                        </Badge>
                      </div>
                      {pp.sampleQuotes.length > 0 && (
                        <div className="pl-4 space-y-1">
                          {pp.sampleQuotes.map((q, qi) => (
                            <p
                              key={qi}
                              className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2"
                            >
                              &ldquo;{q}&rdquo;
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Opportunities for Improvement */}
            {improvements.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Opportunities for Improvement</h3>
                <div className="space-y-2">
                  {improvements.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 mt-0.5 ${demandColors[item.demand] ?? ""}`}
                      >
                        {item.demand}
                      </Badge>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground italic mt-0.5 line-clamp-2">
                            &ldquo;{item.description}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {improvements.length > 0 && <Separator />}

            {/* Main Competitors */}
            {competitors.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Main Competitors</h3>
                <div className="space-y-2">
                  {competitors.map((comp) => (
                    <div
                      key={comp.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                    >
                      {comp.scrapedApp.icon && (
                        <div className="relative size-8 rounded-lg overflow-hidden shrink-0 border">
                          <Image
                            src={comp.scrapedApp.icon}
                            alt={comp.scrapedApp.title}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {comp.scrapedApp.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {comp.scrapedApp.developer}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">{comp.score.composite}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {comp.scrapedApp.score.toFixed(1)} stars
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {competitors.length > 0 && <Separator />}

            {/* Gap Analysis vs Your Idea */}
            {opportunity.gapAnalysis && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Gap Analysis vs Your Idea</h3>
                <p className="text-sm text-muted-foreground">
                  {opportunity.gapAnalysis.ideaSummary}
                </p>

                {opportunity.gapAnalysis.competitorComparisons.length > 0 && (
                  <div className="space-y-3">
                    {opportunity.gapAnalysis.competitorComparisons.map((comp, i) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{comp.competitorName}</span>
                          <span className="text-xs text-muted-foreground">Gap Score</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  comp.gapScore >= 70
                                    ? "bg-green-500"
                                    : comp.gapScore >= 40
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${comp.gapScore}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold w-8 text-right">{comp.gapScore}</span>
                          </div>
                        </div>
                        {comp.painPointsExploited.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {comp.painPointsExploited.map((pp, j) => (
                              <Badge
                                key={j}
                                variant="destructive"
                                className="text-[10px] font-normal"
                              >
                                {pp}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {comp.featureGaps.length > 0 && (
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Feature Gaps:</span>
                            <ul className="list-disc list-inside text-xs text-muted-foreground mt-0.5">
                              {comp.featureGaps.map((gap, j) => (
                                <li key={j}>{gap}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {opportunity.gapAnalysis.uniqueAdvantages.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Unique Advantages
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {opportunity.gapAnalysis.uniqueAdvantages.map((adv, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-xs font-normal bg-green-500/10 text-green-700 border-green-200"
                        >
                          {adv}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground italic">
                  {opportunity.gapAnalysis.marketPositioning}
                </p>
              </div>
            )}

            {opportunity.gapAnalysis && <Separator />}

            {/* Blue Ocean Assessment */}
            {opportunity.blueOcean && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  {opportunity.blueOcean.isBlueOcean ? (
                    <>
                      <span className="text-blue-500">&#9679;</span>
                      Blue Ocean Opportunity
                    </>
                  ) : (
                    <>
                      <span className="text-orange-500">&#9679;</span>
                      Competitive Market Assessment
                    </>
                  )}
                </h3>

                {/* Confidence meter */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-bold">{opportunity.blueOcean.confidence}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        opportunity.blueOcean.confidence >= 70
                          ? "bg-green-500"
                          : opportunity.blueOcean.confidence >= 40
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${opportunity.blueOcean.confidence}%` }}
                    />
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {opportunity.blueOcean.reasoning}
                </p>

                {opportunity.blueOcean.adjacentMarkets.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {opportunity.blueOcean.adjacentMarkets.map((market, i) => (
                      <Badge key={i} variant="secondary" className="text-xs font-normal">
                        {market}
                      </Badge>
                    ))}
                  </div>
                )}

                {opportunity.blueOcean.risks.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {opportunity.blueOcean.risks.map((risk, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-xs font-normal bg-yellow-500/10 text-yellow-700 border-yellow-200"
                      >
                        {risk}
                      </Badge>
                    ))}
                  </div>
                )}

                {opportunity.blueOcean.nextSteps.length > 0 && (
                  <ol className="list-decimal list-inside space-y-0.5 text-xs text-muted-foreground">
                    {opportunity.blueOcean.nextSteps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                )}

                {opportunity.blueOcean.immediateArchitectHandoff && (
                  <Button asChild className="w-full" size="sm">
                    <Link href={`/architect?id=${opportunity.id}`}>
                      Proceed to Architect Analysis
                    </Link>
                  </Button>
                )}
              </div>
            )}

            {opportunity.blueOcean && <Separator />}

            {/* What Users Love */}
            {sentiment.praisedAspects.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">What Users Love</h3>
                <div className="flex flex-wrap gap-1.5">
                  {sentiment.praisedAspects.map((aspect, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="text-xs font-normal"
                    >
                      {aspect}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* User Reviews */}
            <div>
              <h3 className="text-sm font-semibold mb-3">
                User Reviews ({reviews.length})
              </h3>
              <div className="space-y-2">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-3 rounded-lg bg-muted/50 text-sm space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-xs">
                        {"★".repeat(review.score)}
                        {"☆".repeat(5 - review.score)}{" "}
                        ({review.score}/5)
                      </span>
                      {review.date && (
                        <span className="text-xs text-muted-foreground">
                          {review.date}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {review.text}
                    </p>
                    {review.thumbsUp !== undefined && review.thumbsUp > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        {review.thumbsUp} found helpful
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button asChild>
            <Link href={`/architect?id=${opportunity.id}`}>
              Analyze with Architect
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  severityColors,
  demandColors,
  sentimentColors,
  scoreColor,
} from "@/lib/ui-constants";
import type { Opportunity } from "@/lib/types";

interface OpportunityDetailModalProps {
  opportunity: Opportunity | null;
  allOpportunities?: Opportunity[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NavItem {
  id: string;
  label: string;
}

export function OpportunityDetailModal({
  opportunity,
  allOpportunities = [],
  open,
  onOpenChange,
}: OpportunityDetailModalProps) {
  const [activeSection, setActiveSection] = useState("opp-sentiment");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const competitors = useMemo(() => {
    if (!opportunity) return [];
    return allOpportunities
      .filter((o) => o.id !== opportunity.id)
      .sort((a, b) => b.score.compositeScore - a.score.compositeScore)
      .slice(0, 5);
  }, [opportunity, allOpportunities]);

  const improvements = useMemo(() => {
    if (!opportunity) return [];
    const { sentiment } = opportunity;
    return [
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
  }, [opportunity]);

  const hasBlueOcean = !!opportunity?.blueOcean;

  const navItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [
      { id: "opp-sentiment", label: "Sentiment" },
      { id: "opp-opportunities", label: "Opportunities" },
      { id: "opp-competitors", label: "Competitors" },
      { id: "opp-reviews", label: "Reviews" },
    ];
    if (hasBlueOcean) {
      items.push({ id: "opp-blueocean", label: "Blue Ocean" });
    }
    return items;
  }, [hasBlueOcean]);

  // IntersectionObserver for active section tracking
  useEffect(() => {
    if (!open || !opportunity) return;

    const timer = setTimeout(() => {
      const scrollContainer = scrollAreaRef.current?.querySelector("[data-slot='scroll-area-viewport']");
      if (!scrollContainer) return;

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setActiveSection(entry.target.id);
            }
          }
        },
        {
          root: scrollContainer,
          rootMargin: "-10% 0px -80% 0px",
          threshold: 0,
        }
      );

      for (const item of navItems) {
        const el = scrollContainer.querySelector(`#${item.id}`);
        if (el) observer.observe(el);
      }

      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timer);
  }, [open, opportunity, navItems]);

  const scrollToSection = useCallback((id: string) => {
    const scrollContainer = scrollAreaRef.current?.querySelector("[data-slot='scroll-area-viewport']");
    if (!scrollContainer) return;
    const el = scrollContainer.querySelector(`#${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
    setActiveSection(id);
  }, []);

  if (!opportunity) return null;

  const { scrapedApp, reviews, sentiment, score } = opportunity;

  // Score cards with colored left border
  const scoreItems = [
    { label: "Composite", value: score.compositeScore },
    { label: "Market Size", value: score.marketSize },
    { label: "Feature Gap", value: score.featureGapScore },
    { label: "Feasibility", value: score.feasibility },
  ];

  // Render the sections content (used in both desktop right pane and mobile tabs)
  const sectionsContent = (
    <div className="space-y-6">
      {/* Section: Sentiment */}
      <div id="opp-sentiment" className="space-y-4">
        <h3 className="text-sm font-semibold">Sentiment</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Overall Sentiment:</span>
          <Badge variant="outline" className={sentimentColors[sentiment.overallSentiment] ?? ""}>
            {sentiment.overallSentiment}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{sentiment.summary}</p>

        {sentiment.painPoints.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Flaws & Pain Points</h4>
            <div className="space-y-2">
              {sentiment.painPoints.map((pp, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={`size-2 rounded-full shrink-0 ${severityColors[pp.severity] ?? "bg-gray-400"}`} />
                    <span className="text-sm font-medium">{pp.issue}</span>
                    <Badge variant="outline" className="text-[11px]">{pp.severity}</Badge>
                    <Badge variant="outline" className="text-[11px]">{pp.frequency} freq</Badge>
                  </div>
                  {pp.sampleQuotes.length > 0 && (
                    <div className="pl-4 space-y-1">
                      {pp.sampleQuotes.map((q, qi) => (
                        <p key={qi} className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
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

        {sentiment.praisedAspects.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What Users Love</h4>
            <div className="flex flex-wrap gap-1.5">
              {sentiment.praisedAspects.map((aspect, i) => (
                <Badge key={i} variant="secondary" className="text-xs font-normal">{aspect}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section: Opportunities */}
      <div id="opp-opportunities" className="space-y-4">
        <h3 className="text-sm font-semibold">Opportunities</h3>
        {improvements.length > 0 ? (
          <div className="space-y-2">
            {improvements.map((item, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-surface-0">
                <Badge variant="outline" className={`text-[11px] shrink-0 mt-0.5 ${demandColors[item.demand] ?? ""}`}>
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
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">No improvement opportunities identified.</p>
        )}
      </div>

      {/* Section: Competitors */}
      <div id="opp-competitors" className="space-y-4">
        <h3 className="text-sm font-semibold">Competitors</h3>
        {competitors.length > 0 && (
          <div className="space-y-2">
            {competitors.map((comp) => (
              <div key={comp.id} className="flex items-center gap-3 p-2 rounded-lg bg-surface-0">
                {comp.scrapedApp.icon && (
                  <div className="relative size-8 rounded-lg overflow-hidden shrink-0 border">
                    <Image src={comp.scrapedApp.icon} alt={comp.scrapedApp.title} fill className="object-cover" sizes="32px" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{comp.scrapedApp.title}</p>
                  <p className="text-xs text-muted-foreground">{comp.scrapedApp.developer}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold">{comp.score.compositeScore}</p>
                  <p className="text-[11px] text-muted-foreground">{comp.scrapedApp.score.toFixed(1)} stars</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {opportunity.gapAnalysis && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gap Analysis vs Your Idea</h4>
            <p className="text-sm text-muted-foreground">{opportunity.gapAnalysis.ideaSummary}</p>

            {opportunity.gapAnalysis.competitorComparisons.length > 0 && (
              <div className="space-y-3">
                {opportunity.gapAnalysis.competitorComparisons.map((comp, i) => (
                  <div key={i} className="p-3 rounded-lg bg-surface-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{comp.competitorName}</span>
                      <span className="text-xs text-muted-foreground">Gap Score</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            comp.gapScore >= 70 ? "bg-green-500" : comp.gapScore >= 40 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${comp.gapScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold w-8 text-right">{comp.gapScore}</span>
                    </div>
                    {comp.painPointsExploited.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {comp.painPointsExploited.map((pp, j) => (
                          <Badge key={j} variant="destructive" className="text-[11px] font-normal">{pp}</Badge>
                        ))}
                      </div>
                    )}
                    {comp.featureGaps.length > 0 && (
                      <div>
                        <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Feature Gaps:</span>
                        <ul className="list-disc list-inside text-xs text-muted-foreground mt-0.5">
                          {comp.featureGaps.map((gap, j) => (<li key={j}>{gap}</li>))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {opportunity.gapAnalysis.uniqueAdvantages.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unique Advantages</span>
                <div className="flex flex-wrap gap-1.5">
                  {opportunity.gapAnalysis.uniqueAdvantages.map((adv, i) => (
                    <Badge key={i} variant="outline" className="text-xs font-normal bg-green-500/10 text-green-400 border-green-500/20">{adv}</Badge>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground italic">{opportunity.gapAnalysis.marketPositioning}</p>
          </div>
        )}

        {competitors.length === 0 && !opportunity.gapAnalysis && (
          <p className="text-sm text-muted-foreground py-4 text-center">No competitor data available.</p>
        )}
      </div>

      {/* Section: Reviews */}
      <div id="opp-reviews" className="space-y-3">
        <h3 className="text-sm font-semibold">Reviews{reviews.length > 0 ? ` (${reviews.length})` : ""}</h3>
        {reviews.length > 0 ? (
          <div className="space-y-2">
            {reviews.map((review) => (
              <div key={review.id} className="p-3 rounded-lg bg-surface-0 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-xs">
                    {"★".repeat(review.score)}{"☆".repeat(5 - review.score)} ({review.score}/5)
                  </span>
                  {review.date && <span className="text-xs text-muted-foreground">{review.date}</span>}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{review.text}</p>
                {review.thumbsUp !== undefined && review.thumbsUp > 0 && (
                  <p className="text-[11px] text-muted-foreground">{review.thumbsUp} found helpful</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">No reviews available.</p>
        )}
      </div>

      {/* Section: Blue Ocean (conditional) */}
      {hasBlueOcean && (
        <div id="opp-blueocean" className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            {opportunity.blueOcean!.isBlueOcean ? (
              <><span className="text-blue-400">&#9679;</span> Blue Ocean Opportunity</>
            ) : (
              <><span className="text-orange-400">&#9679;</span> Competitive Market Assessment</>
            )}
          </h3>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Confidence</span>
              <span className="font-bold">{opportunity.blueOcean!.confidence}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  opportunity.blueOcean!.confidence >= 70 ? "bg-green-500"
                  : opportunity.blueOcean!.confidence >= 40 ? "bg-yellow-500" : "bg-red-500"
                }`}
                style={{ width: `${opportunity.blueOcean!.confidence}%` }}
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">{opportunity.blueOcean!.reasoning}</p>

          {opportunity.blueOcean!.adjacentMarkets.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {opportunity.blueOcean!.adjacentMarkets.map((market, i) => (
                <Badge key={i} variant="secondary" className="text-xs font-normal">{market}</Badge>
              ))}
            </div>
          )}

          {opportunity.blueOcean!.risks.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {opportunity.blueOcean!.risks.map((risk, i) => (
                <Badge key={i} variant="outline" className="text-xs font-normal bg-yellow-500/10 text-yellow-400 border-yellow-500/20">{risk}</Badge>
              ))}
            </div>
          )}

          {opportunity.blueOcean!.nextSteps.length > 0 && (
            <ol className="list-decimal list-inside space-y-0.5 text-xs text-muted-foreground">
              {opportunity.blueOcean!.nextSteps.map((step, i) => (<li key={i}>{step}</li>))}
            </ol>
          )}

          {opportunity.blueOcean!.immediateArchitectHandoff && (
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
              Strong opportunity -- recommended for Architect analysis
            </Badge>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh]">
        {/* Sticky Header */}
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
                {scrapedApp.store === "google_play" ? "Google Play" : "App Store"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Score grid with colored left border */}
        <div className="grid grid-cols-4 gap-3">
          {scoreItems.map(({ label, value }) => (
            <div
              key={label}
              className="p-2 rounded-lg bg-surface-0 border-l-3"
              style={{ borderLeftColor: scoreColor(value) }}
            >
              <p className="text-lg font-bold">{value}</p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* App info badges */}
        <div className="flex flex-wrap gap-2">
          {scrapedApp.score > 0 && (
            <Badge variant="outline">Rating: {scrapedApp.score.toFixed(1)}/5</Badge>
          )}
          {scrapedApp.reviewCount != null && scrapedApp.reviewCount > 0 && (
            <Badge variant="outline">{scrapedApp.reviewCount.toLocaleString()} reviews</Badge>
          )}
          {scrapedApp.ratings > 0 && (
            <Badge variant="outline" className="opacity-60" title="Total star ratings (includes silent tap-to-rate)">
              {scrapedApp.ratings.toLocaleString()} ratings
            </Badge>
          )}
          {scrapedApp.installs && scrapedApp.installs !== "N/A" && (
            <Badge variant="outline">
              {scrapedApp.installs} installs{scrapedApp.installs.startsWith("~") ? " (estimated)" : ""}
            </Badge>
          )}
          <Badge variant="secondary">{scrapedApp.genre}</Badge>
        </div>

        {/* Desktop: Two-pane layout */}
        <div className="hidden md:flex gap-4 max-h-[45vh]">
          {/* Left sidebar nav */}
          <div className="w-[200px] shrink-0 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                  activeSection === item.id
                    ? "bg-surface-2 text-foreground border-l-2 border-primary font-medium"
                    : "text-muted-foreground hover:bg-surface-1 hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right pane: scrollable sections */}
          <ScrollArea ref={scrollAreaRef} className="flex-1">
            <div className="pr-4">
              {sectionsContent}
            </div>
          </ScrollArea>
        </div>

        {/* Mobile: Tab layout */}
        <div className="md:hidden">
          <ScrollArea className="max-h-[45vh] pr-4">
            <Tabs defaultValue="sentiment">
              <TabsList className="w-full flex-wrap">
                <TabsTrigger value="sentiment" className="flex-1">Sentiment</TabsTrigger>
                <TabsTrigger value="opportunities" className="flex-1">Opportunities</TabsTrigger>
                <TabsTrigger value="competitors" className="flex-1">Competitors</TabsTrigger>
                <TabsTrigger value="reviews" className="flex-1">
                  Reviews{reviews.length > 0 ? ` (${reviews.length})` : ""}
                </TabsTrigger>
                {hasBlueOcean && (
                  <TabsTrigger value="blueocean" className="flex-1">Blue Ocean</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="sentiment" className="space-y-4 mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Overall Sentiment:</span>
                  <Badge variant="outline" className={sentimentColors[sentiment.overallSentiment] ?? ""}>
                    {sentiment.overallSentiment}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{sentiment.summary}</p>

                {sentiment.painPoints.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Flaws & Pain Points</h3>
                    <div className="space-y-2">
                      {sentiment.painPoints.map((pp, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className={`size-2 rounded-full shrink-0 ${severityColors[pp.severity] ?? "bg-gray-400"}`} />
                            <span className="text-sm font-medium">{pp.issue}</span>
                            <Badge variant="outline" className="text-[11px]">{pp.severity}</Badge>
                            <Badge variant="outline" className="text-[11px]">{pp.frequency} freq</Badge>
                          </div>
                          {pp.sampleQuotes.length > 0 && (
                            <div className="pl-4 space-y-1">
                              {pp.sampleQuotes.map((q, qi) => (
                                <p key={qi} className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
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

                {sentiment.praisedAspects.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">What Users Love</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {sentiment.praisedAspects.map((aspect, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-normal">{aspect}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="opportunities" className="space-y-4 mt-3">
                {improvements.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Opportunities for Improvement</h3>
                    <div className="space-y-2">
                      {improvements.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-surface-0">
                          <Badge variant="outline" className={`text-[11px] shrink-0 mt-0.5 ${demandColors[item.demand] ?? ""}`}>
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
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">No improvement opportunities identified.</p>
                )}
              </TabsContent>

              <TabsContent value="competitors" className="space-y-4 mt-3">
                {competitors.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Main Competitors</h3>
                    <div className="space-y-2">
                      {competitors.map((comp) => (
                        <div key={comp.id} className="flex items-center gap-3 p-2 rounded-lg bg-surface-0">
                          {comp.scrapedApp.icon && (
                            <div className="relative size-8 rounded-lg overflow-hidden shrink-0 border">
                              <Image src={comp.scrapedApp.icon} alt={comp.scrapedApp.title} fill className="object-cover" sizes="32px" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{comp.scrapedApp.title}</p>
                            <p className="text-xs text-muted-foreground">{comp.scrapedApp.developer}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold">{comp.score.compositeScore}</p>
                            <p className="text-[11px] text-muted-foreground">{comp.scrapedApp.score.toFixed(1)} stars</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {opportunity.gapAnalysis && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Gap Analysis vs Your Idea</h3>
                    <p className="text-sm text-muted-foreground">{opportunity.gapAnalysis.ideaSummary}</p>

                    {opportunity.gapAnalysis.competitorComparisons.length > 0 && (
                      <div className="space-y-3">
                        {opportunity.gapAnalysis.competitorComparisons.map((comp, i) => (
                          <div key={i} className="p-3 rounded-lg bg-surface-0 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{comp.competitorName}</span>
                              <span className="text-xs text-muted-foreground">Gap Score</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    comp.gapScore >= 70 ? "bg-green-500" : comp.gapScore >= 40 ? "bg-yellow-500" : "bg-red-500"
                                  }`}
                                  style={{ width: `${comp.gapScore}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold w-8 text-right">{comp.gapScore}</span>
                            </div>
                            {comp.painPointsExploited.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {comp.painPointsExploited.map((pp, j) => (
                                  <Badge key={j} variant="destructive" className="text-[11px] font-normal">{pp}</Badge>
                                ))}
                              </div>
                            )}
                            {comp.featureGaps.length > 0 && (
                              <div>
                                <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Feature Gaps:</span>
                                <ul className="list-disc list-inside text-xs text-muted-foreground mt-0.5">
                                  {comp.featureGaps.map((gap, j) => (<li key={j}>{gap}</li>))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {opportunity.gapAnalysis.uniqueAdvantages.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unique Advantages</span>
                        <div className="flex flex-wrap gap-1.5">
                          {opportunity.gapAnalysis.uniqueAdvantages.map((adv, i) => (
                            <Badge key={i} variant="outline" className="text-xs font-normal bg-green-500/10 text-green-400 border-green-500/20">{adv}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground italic">{opportunity.gapAnalysis.marketPositioning}</p>
                  </div>
                )}

                {competitors.length === 0 && !opportunity.gapAnalysis && (
                  <p className="text-sm text-muted-foreground py-4 text-center">No competitor data available.</p>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="space-y-2 mt-3">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="p-3 rounded-lg bg-surface-0 text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs">
                          {"★".repeat(review.score)}{"☆".repeat(5 - review.score)} ({review.score}/5)
                        </span>
                        {review.date && <span className="text-xs text-muted-foreground">{review.date}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{review.text}</p>
                      {review.thumbsUp !== undefined && review.thumbsUp > 0 && (
                        <p className="text-[11px] text-muted-foreground">{review.thumbsUp} found helpful</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">No reviews available.</p>
                )}
              </TabsContent>

              {hasBlueOcean && (
                <TabsContent value="blueocean" className="space-y-3 mt-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    {opportunity.blueOcean!.isBlueOcean ? (
                      <><span className="text-blue-400">&#9679;</span> Blue Ocean Opportunity</>
                    ) : (
                      <><span className="text-orange-400">&#9679;</span> Competitive Market Assessment</>
                    )}
                  </h3>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="font-bold">{opportunity.blueOcean!.confidence}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          opportunity.blueOcean!.confidence >= 70 ? "bg-green-500"
                          : opportunity.blueOcean!.confidence >= 40 ? "bg-yellow-500" : "bg-red-500"
                        }`}
                        style={{ width: `${opportunity.blueOcean!.confidence}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">{opportunity.blueOcean!.reasoning}</p>

                  {opportunity.blueOcean!.adjacentMarkets.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {opportunity.blueOcean!.adjacentMarkets.map((market, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-normal">{market}</Badge>
                      ))}
                    </div>
                  )}

                  {opportunity.blueOcean!.risks.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {opportunity.blueOcean!.risks.map((risk, i) => (
                        <Badge key={i} variant="outline" className="text-xs font-normal bg-yellow-500/10 text-yellow-400 border-yellow-500/20">{risk}</Badge>
                      ))}
                    </div>
                  )}

                  {opportunity.blueOcean!.nextSteps.length > 0 && (
                    <ol className="list-decimal list-inside space-y-0.5 text-xs text-muted-foreground">
                      {opportunity.blueOcean!.nextSteps.map((step, i) => (<li key={i}>{step}</li>))}
                    </ol>
                  )}

                  {opportunity.blueOcean!.immediateArchitectHandoff && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                      Strong opportunity -- recommended for Architect analysis
                    </Badge>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

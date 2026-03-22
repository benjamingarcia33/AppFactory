import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { scoreColor, sentimentColors } from "@/lib/ui-constants";
import type { Opportunity } from "@/lib/types";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onSelect?: (opportunity: Opportunity) => void;
}

const sentimentLabel: Record<string, string> = {
  positive: "Positive",
  mixed: "Mixed",
  negative: "Negative",
};

const sentimentDotColor: Record<string, string> = {
  positive: "bg-green-500",
  mixed: "bg-yellow-500",
  negative: "bg-red-500",
};

export function OpportunityCard({ opportunity, onSelect }: OpportunityCardProps) {
  const { scrapedApp, sentiment, score } = opportunity;

  return (
    <Card
      className={`flex flex-col cursor-pointer transition-shadow hover:shadow-md rounded-xl border bg-surface-0 border-l-4 ${
        score.compositeScore >= 70 ? "border-l-green-500" : score.compositeScore >= 40 ? "border-l-yellow-500" : "border-l-red-500"
      }`}
      onClick={() => onSelect?.(opportunity)}
    >
      <CardHeader className="pb-0">
        <div className="flex items-start gap-3">
          {scrapedApp.icon && (
            <div className="relative size-12 rounded-xl overflow-hidden shrink-0 border">
              <Image
                src={scrapedApp.icon}
                alt={scrapedApp.title}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm leading-tight line-clamp-2">
              {scrapedApp.title}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {scrapedApp.developer}
            </p>
          </div>
          {/* Prominent composite score */}
          <div
            className="flex items-center justify-center size-10 rounded-full shrink-0 text-white text-2xl font-bold"
            style={{ backgroundColor: scoreColor(score.compositeScore) }}
          >
            <span className="text-sm font-bold">{score.compositeScore}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pt-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[11px]">
            {scrapedApp.store === "google_play" ? "Google Play" : "App Store"}
          </Badge>
          <Badge variant="secondary" className="text-[11px]">
            {scrapedApp.genre}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {scrapedApp.score > 0 && (
            <span>
              Rating: <span className="text-foreground font-medium">{scrapedApp.score.toFixed(1)}</span>
            </span>
          )}
          {scrapedApp.reviewCount != null && scrapedApp.reviewCount > 0 && (
            <span>
              Reviews: <span className="text-foreground font-medium">{scrapedApp.reviewCount.toLocaleString()}</span>
            </span>
          )}
          {scrapedApp.ratings > 0 && (
            <span className="opacity-60" title="Total star ratings (includes silent tap-to-rate)">
              Ratings: <span className="text-foreground font-medium">{scrapedApp.ratings.toLocaleString()}</span>
            </span>
          )}
          {scrapedApp.installs && scrapedApp.installs !== "N/A" && (
            <span className={scrapedApp.isEstimatedInstalls ? "opacity-60" : ""}>
              Installs: <span className="text-foreground font-medium">{scrapedApp.installs}{scrapedApp.isEstimatedInstalls ? " (est.)" : ""}</span>
            </span>
          )}
        </div>

        {/* Compact score row */}
        <p className="text-xs text-muted-foreground">
          M: {score.marketSize} | G: {score.featureGapScore} | F: {score.feasibility}
        </p>

        {/* Sentiment indicator */}
        <div className="flex items-center gap-1.5">
          <div className={`size-2.5 rounded-full shrink-0 ${sentimentDotColor[sentiment.overallSentiment] ?? "bg-gray-400"}`} />
          <span className={`text-xs font-medium ${(sentimentColors[sentiment.overallSentiment] ?? "").split(" ").find(c => c.startsWith("text-")) ?? "text-muted-foreground"}`}>
            {sentimentLabel[sentiment.overallSentiment] ?? sentiment.overallSentiment}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

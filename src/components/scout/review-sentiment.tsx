import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { SentimentAnalysis } from "@/lib/types";

interface ReviewSentimentProps {
  sentiment: SentimentAnalysis;
}

const sentimentColors: Record<string, string> = {
  positive: "bg-green-500/10 text-green-700 border-green-200",
  mixed: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  negative: "bg-red-500/10 text-red-700 border-red-200",
};

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

export function ReviewSentiment({ sentiment }: ReviewSentimentProps) {
  return (
    <div className="space-y-4">
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

      {/* Pain Points */}
      {sentiment.painPoints.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Pain Points</h4>
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

      {/* Feature Requests */}
      {sentiment.featureRequests.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Feature Requests</h4>
          <div className="space-y-2">
            {sentiment.featureRequests.map((fr, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{fr.feature}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${demandColors[fr.demand] ?? ""}`}
                  >
                    {fr.demand} demand
                  </Badge>
                </div>
                {fr.sampleQuotes.length > 0 && (
                  <div className="pl-4 space-y-1">
                    {fr.sampleQuotes.map((q, qi) => (
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

      {/* Praised Aspects */}
      {sentiment.praisedAspects.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Praised Aspects</h4>
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
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { sentimentColors, severityColors, demandColors } from "@/lib/ui-constants";
import type { SentimentAnalysis } from "@/lib/types";

interface ReviewSentimentProps {
  sentiment: SentimentAnalysis;
}

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
                  <Badge variant="outline" className="text-[11px]">
                    {pp.severity}
                  </Badge>
                  <Badge variant="outline" className="text-[11px]">
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
                    className={`text-[11px] ${demandColors[fr.demand] ?? ""}`}
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

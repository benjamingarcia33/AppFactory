import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Opportunity } from "@/lib/types";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onSelect?: (opportunity: Opportunity) => void;
}

function ScoreBar({ value, label }: { value: number; label: string }) {
  const color =
    value >= 70
      ? "bg-green-500"
      : value >= 40
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-8 text-right font-medium">{value}</span>
    </div>
  );
}

export function OpportunityCard({ opportunity, onSelect }: OpportunityCardProps) {
  const { scrapedApp, sentiment, score } = opportunity;
  const topPainPoints = sentiment.painPoints.slice(0, 2);

  return (
    <Card
      className="flex flex-col cursor-pointer transition-shadow hover:shadow-md"
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
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pt-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px]">
            {scrapedApp.store === "google_play" ? "Google Play" : "App Store"}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {scrapedApp.genre}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            Rating: <span className="text-foreground font-medium">{scrapedApp.score.toFixed(1)}</span>
          </span>
          <span>
            Installs: <span className="text-foreground font-medium">{scrapedApp.installs}{scrapedApp.installs.startsWith("~") ? " (est.)" : ""}</span>
          </span>
        </div>

        <div className="space-y-1.5">
          <ScoreBar value={score.composite} label="Composite" />
          <ScoreBar value={score.marketSize} label="Market Size" />
          <ScoreBar value={score.dissatisfaction} label="Dissatisfaction" />
          <ScoreBar value={score.feasibility} label="Feasibility" />
        </div>

        {topPainPoints.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {topPainPoints.map((pp, i) => (
              <Badge
                key={i}
                variant="destructive"
                className="text-[10px] font-normal"
              >
                {pp.issue}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          asChild
          size="sm"
          className="w-full"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <Link href={`/architect?id=${opportunity.id}`}>Analyze</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { VisualPersona } from "@/lib/types";

interface PersonaCardsProps {
  personas: VisualPersona[];
  hideTitle?: boolean;
}

export function PersonaCards({ personas, hideTitle }: PersonaCardsProps) {
  if (!personas || personas.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        Persona data not available.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!hideTitle && <h3 className="text-lg font-semibold">User Personas</h3>}
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {personas.map((persona, i) => (
            <Card key={i} className="min-w-[300px] max-w-[340px] shrink-0 bg-surface-0 border border-border rounded-xl">
              <CardHeader>
                <div className="text-4xl mb-1">{persona?.avatar ?? "?"}</div>
                <CardTitle className="text-base">{persona?.name ?? "Unknown Persona"}</CardTitle>
                <p className="text-sm text-muted-foreground">{persona?.tagline ?? ""}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">{persona?.demographics ?? "No demographics"}</p>
                <div>
                  <p className="text-xs font-medium mb-1.5">Frustrations</p>
                  <div className="flex flex-wrap gap-1">
                    {(persona?.frustrations ?? []).map((f, j) => (
                      <Badge
                        key={j}
                        variant="outline"
                        className="bg-red-500/10 text-red-400 border-red-500/20 text-[11px]"
                      >
                        {f ?? ""}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium mb-1.5">Goals</p>
                  <div className="flex flex-wrap gap-1">
                    {(persona?.goals ?? []).map((g, j) => (
                      <Badge
                        key={j}
                        variant="outline"
                        className="bg-green-500/10 text-green-400 border-green-500/20 text-[11px]"
                      >
                        {g ?? ""}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Willingness to pay:</span>{" "}
                  {persona?.willingnessToPay ?? "Unknown"}
                </p>
              </CardFooter>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

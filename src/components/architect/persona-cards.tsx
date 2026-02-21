"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { VisualPersona } from "@/lib/types";

interface PersonaCardsProps {
  personas: VisualPersona[];
}

export function PersonaCards({ personas }: PersonaCardsProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">User Personas</h3>
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {personas.map((persona, i) => (
            <Card key={i} className="min-w-[300px] max-w-[340px] shrink-0">
              <CardHeader>
                <div className="text-4xl mb-1">{persona.avatar}</div>
                <CardTitle className="text-base">{persona.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{persona.tagline}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">{persona.demographics}</p>
                <div>
                  <p className="text-xs font-medium mb-1.5">Frustrations</p>
                  <div className="flex flex-wrap gap-1">
                    {persona.frustrations.map((f, j) => (
                      <Badge
                        key={j}
                        variant="outline"
                        className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800 text-[10px]"
                      >
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium mb-1.5">Goals</p>
                  <div className="flex flex-wrap gap-1">
                    {persona.goals.map((g, j) => (
                      <Badge
                        key={j}
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800 text-[10px]"
                      >
                        {g}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Willingness to pay:</span>{" "}
                  {persona.willingnessToPay}
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

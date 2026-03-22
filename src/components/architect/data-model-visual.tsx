"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DataModelEntity } from "@/lib/types";

interface DataModelVisualProps {
  entities: DataModelEntity[];
  hideTitle?: boolean;
}

const relationshipColors: Record<string, string> = {
  one_to_one: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  one_to_many: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  many_to_many: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const relationshipLabels: Record<string, string> = {
  one_to_one: "1:1",
  one_to_many: "1:N",
  many_to_many: "N:N",
};

export function DataModelVisual({ entities, hideTitle }: DataModelVisualProps) {
  if (!entities || entities.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        Data model not available.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!hideTitle && <h3 className="text-lg font-semibold">Data Model</h3>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {entities.map((entity, i) => (
          <Card key={i} className="bg-surface-0 border border-border rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{entity?.entity ?? "Unknown Entity"}</CardTitle>
              <p className="text-xs text-muted-foreground">{entity?.description ?? "No description"}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Attributes</p>
                <div className="flex flex-wrap gap-1">
                  {(entity?.keyAttributes ?? []).map((attr, j) => (
                    <Badge key={j} variant="secondary" className="text-[11px]">
                      {attr ?? "unknown"}
                    </Badge>
                  ))}
                </div>
              </div>
              {(entity?.relationships ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Relationships</p>
                  <div className="space-y-1">
                    {(entity?.relationships ?? []).map((rel, j) => (
                      <div key={j} className="flex items-center gap-1.5 text-xs">
                        <Badge
                          variant="outline"
                          className={relationshipColors[rel?.type] ?? ""}
                        >
                          {relationshipLabels[rel?.type] ?? rel?.type ?? "?"}
                        </Badge>
                        <span className="font-medium">{rel?.relatedEntity ?? "Unknown"}</span>
                        <span className="text-muted-foreground">— {rel?.description ?? ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

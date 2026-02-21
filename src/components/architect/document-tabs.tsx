"use client";

import { useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DocumentViewer } from "@/components/architect/document-viewer";
import { VisualStrategy } from "@/components/architect/visual-strategy";
import { StarterPayloadViewer } from "@/components/architect/starter-payload-viewer";
import type { AnalysisDocument, VisualStrategy as VisualStrategyType } from "@/lib/types";

interface DocumentTabsProps {
  documents: AnalysisDocument[];
}

function tryParseVisualStrategy(content: string): VisualStrategyType | null {
  try {
    const parsed = JSON.parse(content);
    // Check if it has the expected shape (at least personas or revenueModel)
    if (
      parsed &&
      typeof parsed === "object" &&
      (Array.isArray(parsed.personas) || parsed.revenueModel)
    ) {
      return parsed as VisualStrategyType;
    }
    return null;
  } catch {
    return null;
  }
}

export function DocumentTabs({ documents }: DocumentTabsProps) {
  const prdDoc = documents.find((d) => d.type === "app_prd");
  const strategyDoc = documents.find((d) => d.type === "strategic_analysis");
  const starterDoc = documents.find((d) => d.type === "starter_payload");

  const visualData = useMemo(() => {
    if (!strategyDoc) return null;
    return tryParseVisualStrategy(strategyDoc.content);
  }, [strategyDoc]);

  if (!prdDoc && !strategyDoc && !starterDoc) {
    return null;
  }

  const defaultTab = prdDoc ? "prd" : strategyDoc ? "strategy" : "starter";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Generated Documents</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ready-to-use documents generated from the analysis steps.
        </p>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          {prdDoc && (
            <TabsTrigger value="prd">PRD</TabsTrigger>
          )}
          {strategyDoc && (
            <TabsTrigger value="strategy">Visual Strategy</TabsTrigger>
          )}
          {starterDoc && (
            <TabsTrigger value="starter">Claude Code Payload</TabsTrigger>
          )}
        </TabsList>

        {prdDoc && (
          <TabsContent value="prd">
            <p className="text-sm text-muted-foreground mb-3">
              Product requirements focused on what to build and why.
            </p>
            <DocumentViewer document={prdDoc} />
          </TabsContent>
        )}

        {strategyDoc && (
          <TabsContent value="strategy">
            <p className="text-sm text-muted-foreground mb-3">
              Visual strategic analysis with charts and data.
            </p>
            {visualData ? (
              <VisualStrategy data={visualData} />
            ) : (
              <DocumentViewer document={strategyDoc} />
            )}
          </TabsContent>
        )}

        {starterDoc && (
          <TabsContent value="starter">
            <p className="text-sm text-muted-foreground mb-3">
              Copy-paste this into Claude Code to start building immediately.
            </p>
            <StarterPayloadViewer content={starterDoc.content} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface IncrementalEPViewerProps {
  epContent: string;
  newDependencies?: string[];
  newEnvVars?: string[];
  setupSteps?: string[];
  documentUpdates?: string[];
}

export function IncrementalEPViewer({
  epContent,
  newDependencies,
  newEnvVars,
  setupSteps,
  documentUpdates,
}: IncrementalEPViewerProps) {
  const [copied, setCopied] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(epContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = epContent;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasMetadata =
    (newDependencies && newDependencies.length > 0) ||
    (newEnvVars && newEnvVars.length > 0) ||
    (setupSteps && setupSteps.length > 0) ||
    (documentUpdates && documentUpdates.length > 0);

  return (
    <div className="rounded-xl border border-border bg-surface-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <h3 className="text-sm font-medium">Incremental Execution Prompt</h3>
        <Button
          variant="default"
          size="xs"
          onClick={handleCopy}
        >
          {copied ? "Copied!" : "Copy for Claude Code"}
        </Button>
      </div>

      {/* Markdown content */}
      <ScrollArea className="h-[600px]">
        <div className="prose prose-sm prose-invert max-w-none p-6">
          <ReactMarkdown>{epContent}</ReactMarkdown>
        </div>
      </ScrollArea>

      {/* Metadata section */}
      {hasMetadata && (
        <div className="border-t border-border">
          <Collapsible open={metaOpen} onOpenChange={setMetaOpen}>
            <CollapsibleTrigger className="w-full px-4 py-2 text-left text-xs text-primary hover:underline">
              {metaOpen ? "Hide setup details" : "Show setup details"}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-4">
                {/* Dependencies */}
                {newDependencies && newDependencies.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-medium">New Dependencies</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {newDependencies.map((dep) => (
                        <span
                          key={dep}
                          className="rounded border border-border bg-surface-1 px-2 py-0.5 font-mono text-xs text-muted-foreground"
                        >
                          {dep}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Env vars */}
                {newEnvVars && newEnvVars.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-medium">New Environment Variables</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {newEnvVars.map((envVar) => (
                        <span
                          key={envVar}
                          className="rounded border border-border bg-surface-1 px-2 py-0.5 font-mono text-xs text-muted-foreground"
                        >
                          {envVar}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Setup steps */}
                {setupSteps && setupSteps.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-medium">Setup Steps</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      {setupSteps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Document updates */}
                {documentUpdates && documentUpdates.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-medium">Document Updates Required</h4>
                    <ul className="space-y-1">
                      {documentUpdates.map((update, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="size-4 mt-0.5 shrink-0 text-muted-foreground"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{update}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  );
}

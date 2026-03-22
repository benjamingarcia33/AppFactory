"use client";

import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ReactMarkdown from "react-markdown";
import type { AnalysisDocument } from "@/lib/types";

interface ExecutionPromptViewerProps {
  prompts: AnalysisDocument[]; // types: execution_prompt_1, execution_prompt_2, execution_prompt_3
}

const promptLabels: Record<string, { label: string; badge: string; badgeClass: string; stepIndicator: string }> = {
  execution_prompt_1: {
    label: "Prompt 1: Foundation",
    badge: "Run FIRST in Claude Code",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    stepIndicator: "Step 1 of 3",
  },
  execution_prompt_2: {
    label: "Prompt 2: Core Features",
    badge: "Run SECOND in Claude Code",
    badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    stepIndicator: "Step 2 of 3",
  },
  execution_prompt_3: {
    label: "Prompt 3: Polish",
    badge: "Run LAST in Claude Code",
    badgeClass: "bg-green-500/10 text-green-400 border-green-500/20",
    stepIndicator: "Step 3 of 3",
  },
};

export function ExecutionPromptViewer({ prompts }: ExecutionPromptViewerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openPrompt, setOpenPrompt] = useState<string | null>(null);

  const handleCopy = useCallback(async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  if (prompts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-0 p-6 text-center">
        <p className="text-muted-foreground">
          No execution prompts available. Run an analysis with the pattern matching engine enabled.
        </p>
      </div>
    );
  }

  // Sort by prompt type
  const sorted = [...prompts].sort((a, b) => a.type.localeCompare(b.type));

  return (
    <div className="rounded-xl border border-border bg-surface-0 p-4 space-y-4">
      <h2 className="text-lg font-semibold">Execution Prompts for Claude Code</h2>

      {/* Info banner */}
      <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary mt-0.5 shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-primary/80">
            <p className="font-medium mb-1">These prompts are designed for AI coding agents (Claude Code, Cursor).</p>
            <p>They <strong>must be run sequentially</strong>: Prompt 1 first, then Prompt 2, then Prompt 3. Each prompt builds on what the previous one created. Copy each prompt and paste it into your AI coding agent in order.</p>
          </div>
        </div>
      </div>

      {/* Step cards with connector */}
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-6 top-8 bottom-8 w-px bg-border" />

        <div className="space-y-4">
          {sorted.map((prompt, index) => {
            const info = promptLabels[prompt.type];
            const isCopied = copiedId === prompt.id;
            const isOpen = openPrompt === prompt.type;
            const previewLines = prompt.content.split("\n").slice(0, 10).join("\n");

            return (
              <div key={prompt.type} className="relative">
                {/* Step number circle + card */}
                <div className="flex items-start gap-3">
                  <div className="relative z-10 flex items-center justify-center size-12 rounded-full border-2 border-border bg-surface-0 text-lg font-bold shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0 rounded-xl border border-border bg-surface-0 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-sm">{info?.label ?? prompt.title}</p>
                        <p className="text-xs text-muted-foreground">{info?.stepIndicator}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={info?.badgeClass ?? ""}>{info?.badge}</Badge>
                        <Button size="sm" variant={isCopied ? "default" : "outline"} onClick={() => handleCopy(prompt.content, prompt.id)}>
                          {isCopied ? "Copied!" : "Copy for Claude Code"}
                        </Button>
                      </div>
                    </div>

                    <Collapsible open={isOpen} onOpenChange={(open) => setOpenPrompt(open ? prompt.type : null)}>
                      <CollapsibleTrigger className="text-xs text-primary hover:underline">
                        {isOpen ? "Hide preview" : "Show preview"}
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <ScrollArea className="h-[400px] mt-2">
                          <div className="prose prose-sm prose-invert max-w-none pr-4">
                            <ReactMarkdown>{prompt.content}</ReactMarkdown>
                          </div>
                        </ScrollArea>
                      </CollapsibleContent>
                    </Collapsible>

                    {!isOpen && (
                      <pre className="text-xs text-muted-foreground bg-surface-1 rounded p-2 overflow-hidden max-h-24 line-clamp-5">
                        {previewLines}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

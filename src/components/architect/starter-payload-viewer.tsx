"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StarterPayloadViewerProps {
  content: string;
}

export function StarterPayloadViewer({ content }: StarterPayloadViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="text-sm font-medium">Claude Code Starter Payload</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Copy this block and paste it into Claude Code to start building.
          </p>
        </div>
        <Button
          variant={copied ? "secondary" : "default"}
          size="sm"
          onClick={handleCopy}
        >
          {copied ? "Copied!" : "Copy for Claude Code"}
        </Button>
      </div>
      <ScrollArea className="h-[500px]">
        <pre className="p-4 text-sm font-mono whitespace-pre-wrap leading-relaxed">
          {content}
        </pre>
      </ScrollArea>
    </div>
  );
}

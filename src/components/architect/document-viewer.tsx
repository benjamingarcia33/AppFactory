"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { AnalysisDocument } from "@/lib/types";

interface DocumentViewerProps {
  document: AnalysisDocument;
}

export function DocumentViewer({ document }: DocumentViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(document.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="relative rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h3 className="text-sm font-medium">{document.title}</h3>
        <Button
          variant="outline"
          size="xs"
          onClick={handleCopy}
        >
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="prose prose-sm dark:prose-invert max-w-none p-6">
          <ReactMarkdown>{document.content}</ReactMarkdown>
        </div>
      </ScrollArea>
    </div>
  );
}

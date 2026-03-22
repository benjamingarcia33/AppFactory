"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";

interface IdeaChatInputProps {
  onSubmit: (text: string) => void;
  isRunning: boolean;
  onCancel: () => void;
}

const MAX_CHARS = 2000;
const WARN_THRESHOLD = 1800;

export function IdeaChatInput({ onSubmit, isRunning, onCancel }: IdeaChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmed = value.trim();
  const charCount = value.length;
  const isOverWarn = charCount > WARN_THRESHOLD;
  const canSubmit = trimmed.length > 0 && !isRunning;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    onSubmit(trimmed);
    setValue("");
  }, [canSubmit, trimmed, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="rounded-xl border border-border bg-surface-0 p-4 space-y-3">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, MAX_CHARS))}
          onKeyDown={handleKeyDown}
          placeholder="Describe a feature to add to your app..."
          rows={3}
          className="w-full resize-y rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring disabled:opacity-50"
          disabled={isRunning}
        />
        <div className="flex items-center justify-end mt-1">
          <span
            className={`text-xs ${
              isOverWarn ? "text-yellow-400" : "text-muted-foreground"
            }`}
          >
            {charCount} / {MAX_CHARS}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        {isRunning && (
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          size="sm"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {isRunning ? (
            <span className="flex items-center gap-2">
              <svg
                className="size-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Analyzing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-4"
              >
                <path d="M3.105 2.288a.75.75 0 00-.826.95l1.414 4.926A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.897 28.897 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
              </svg>
              Send
            </span>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Press <kbd className="rounded border border-border bg-surface-1 px-1 py-0.5 text-[10px] font-mono">Ctrl+Enter</kbd> to send
      </p>
    </div>
  );
}

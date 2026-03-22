"use client";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="rounded-xl border border-border bg-surface-0 p-8 max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="text-muted-foreground">An unexpected error occurred.</p>
        <p className="text-sm text-muted-foreground">
          {error.message || "Please try again or navigate to a different page."}
        </p>
        <button
          onClick={reset}
          className="mt-2 px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition-colors text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

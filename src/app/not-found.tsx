import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="rounded-xl border border-border bg-surface-0 p-8 max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">404</h1>
        <p className="text-muted-foreground">Page not found</p>
        <p className="text-sm text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link
          href="/"
          className="mt-2 inline-block px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm font-medium"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

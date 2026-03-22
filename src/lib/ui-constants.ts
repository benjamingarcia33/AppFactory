// Shared color mappings for consistent styling across components

export const complexityColors: Record<string, string> = {
  low: "bg-green-500/10 text-green-400 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  high: "bg-red-500/10 text-red-400 border-red-500/20",
};

export const setupComplexityColors: Record<string, string> = {
  "drop-in": "bg-green-500/10 text-green-400 border-green-500/20",
  "config-required": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "significant-setup": "bg-red-500/10 text-red-400 border-red-500/20",
};

export const platformLabels: Record<string, string> = {
  web: "Web",
  mobile: "Mobile",
  both: "Web + Mobile",
};

export const severityColors: Record<string, string> = {
  critical: "bg-red-500",
  major: "bg-orange-500",
  minor: "bg-yellow-500",
};

export const severityBadgeColors: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  major: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  minor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

export const demandColors: Record<string, string> = {
  high: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  low: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export const sentimentColors: Record<string, string> = {
  positive: "bg-green-500/10 text-green-400 border-green-500/20",
  mixed: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  negative: "bg-red-500/10 text-red-400 border-red-500/20",
};

export const priorityColors: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export const verdictConfig: Record<string, { label: string; color: string; bgClass: string; fill: string }> = {
  strong_yes: { label: "STRONG YES \u2014 BUILD IT", color: "text-green-400", bgClass: "bg-green-500/10 border-green-500/30", fill: "#22c55e" },
  yes: { label: "YES \u2014 WORTH PURSUING", color: "text-emerald-400", bgClass: "bg-emerald-500/10 border-emerald-500/30", fill: "#4ade80" },
  maybe: { label: "MAYBE \u2014 PROCEED WITH CAUTION", color: "text-yellow-400", bgClass: "bg-yellow-500/10 border-yellow-500/30", fill: "#eab308" },
  no: { label: "NO \u2014 HIGH RISK", color: "text-red-400", bgClass: "bg-red-500/10 border-red-500/30", fill: "#ef4444" },
  strong_no: { label: "STRONG NO \u2014 DON'T BUILD", color: "text-red-400", bgClass: "bg-red-500/10 border-red-500/30", fill: "#dc2626" },
};

export const assessmentConfig: Record<string, { color: string; bg: string; label: string }> = {
  go: { color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", label: "GO" },
  caution: { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", label: "CAUTION" },
  no_go: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", label: "NO-GO" },
};

export function scoreColor(v: number): string {
  if (v >= 70) return "#22c55e";
  if (v >= 40) return "#eab308";
  return "#ef4444";
}

export function scoreBgColor(v: number): string {
  if (v >= 70) return "bg-green-500";
  if (v >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

export const CHART_COLORS = {
  green: "#22c55e",
  yellow: "#eab308",
  red: "#ef4444",
  orange: "#f97316",
  blue: "#3b82f6",
  purple: "#a855f7",
  primary: "hsl(var(--primary))",
  muted: "hsl(var(--muted-foreground))",
};

export const STATUS_COLORS: Record<string, string> = {
  running: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
  cancelled: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  pending: "bg-muted text-muted-foreground",
};

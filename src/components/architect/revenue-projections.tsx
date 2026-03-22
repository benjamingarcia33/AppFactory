"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RevenueProjections as RevenueProjectionsType } from "@/lib/types";

interface RevenueProjectionsProps {
  data: RevenueProjectionsType;
  hideTitle?: boolean;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
}

export function RevenueProjections({ data, hideTitle }: RevenueProjectionsProps) {
  if (!data) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        Revenue projections data not available.
      </div>
    );
  }

  const kpis = [
    { label: "CAC", value: data?.cac ?? "N/A" },
    { label: "LTV", value: data?.ltv ?? "N/A" },
    { label: "LTV:CAC", value: `${data?.ltvCacRatio ?? 0}x` },
    { label: "Monthly Churn", value: data?.monthlyChurnRate ?? "N/A" },
    { label: "Gross Margin", value: data?.grossMargin ?? "N/A" },
    { label: "Break Even", value: `Month ${data?.breakEvenMonth ?? "?"}` },
  ];

  const unitEconomics = data?.unitEconomics ?? [];
  const yearlyProjections = data?.yearlyProjections ?? [];

  return (
    <div className="space-y-4">
      {!hideTitle && <h3 className="text-lg font-semibold">Revenue Projections & Unit Economics</h3>}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {kpis.map((kpi, i) => (
          <Card key={i} className="text-center bg-surface-0 border border-border rounded-xl">
            <CardContent className="py-3 px-2">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="text-lg font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Unit Economics Table */}
      {unitEconomics.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-surface-1">
                <th className="text-left py-2 px-3 font-medium">Metric</th>
                <th className="text-right py-2 px-3 font-medium">Value</th>
                <th className="text-left py-2 px-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-surface-0">
              {unitEconomics.map((item, i) => (
                <tr key={i} className="border-b last:border-b-0">
                  <td className="py-2 px-3 font-medium">{item?.metric ?? "Unknown"}</td>
                  <td className="py-2 px-3 text-right">{item?.value ?? "N/A"}</td>
                  <td className="py-2 px-3 text-muted-foreground text-xs">{item?.notes ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Yearly Projections */}
      {yearlyProjections.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-surface-1">
                <th className="text-left py-2 px-3 font-medium">Year</th>
                <th className="text-right py-2 px-3 font-medium">Users</th>
                <th className="text-right py-2 px-3 font-medium">Revenue</th>
                <th className="text-right py-2 px-3 font-medium">Costs</th>
                <th className="text-right py-2 px-3 font-medium">Profit</th>
              </tr>
            </thead>
            <tbody className="bg-surface-0">
              {yearlyProjections.map((yr, i) => (
                <tr key={i} className="border-b last:border-b-0">
                  <td className="py-2 px-3 font-medium">Year {yr?.year ?? "?"}</td>
                  <td className="py-2 px-3 text-right">{formatNumber(yr?.users ?? 0)}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(yr?.revenue ?? 0)}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(yr?.costs ?? 0)}</td>
                  <td className={cn(
                    "py-2 px-3 text-right font-medium",
                    (yr?.profit ?? 0) >= 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {formatCurrency(yr?.profit ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

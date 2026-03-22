"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MarketDataPoint } from "@/lib/types";

interface MarketChartProps {
  marketData: MarketDataPoint[];
  hideTitle?: boolean;
}

export function MarketChart({ marketData, hideTitle }: MarketChartProps) {
  if (!marketData || marketData.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        Market data not available.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!hideTitle && <h3 className="text-lg font-semibold">Market Segments</h3>}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Market Size by Segment (in millions)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={marketData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="segment"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `$${v}M`}
              />
              <Tooltip
                formatter={(value, name) => {
                  const v = Number(value);
                  if (name === "size") return [`$${v}M`, "Market Size"];
                  if (name === "growth") return [`${v}%`, "Growth Rate"];
                  if (name === "ourShare") return [`${v}%`, "Our Target Share"];
                  return [v, String(name)];
                }}
              />
              <Bar
                dataKey="size"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
                name="size"
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Additional info table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-surface-1">
                  <th className="text-left py-1.5 px-2 font-medium">Segment</th>
                  <th className="text-right py-1.5 px-2 font-medium">Size</th>
                  <th className="text-right py-1.5 px-2 font-medium">Growth</th>
                  <th className="text-right py-1.5 px-2 font-medium">Our Share</th>
                </tr>
              </thead>
              <tbody className="bg-surface-0">
                {marketData.map((point, i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="py-1.5 px-2">{point?.segment ?? "Unknown"}</td>
                    <td className="text-right py-1.5 px-2">${point?.size ?? 0}M</td>
                    <td className="text-right py-1.5 px-2">{point?.growth ?? 0}%</td>
                    <td className="text-right py-1.5 px-2">{point?.ourShare ?? 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

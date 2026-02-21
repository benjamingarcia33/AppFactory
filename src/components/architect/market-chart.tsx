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
}

export function MarketChart({ marketData }: MarketChartProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Market Segments</h3>
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
                <tr className="border-b">
                  <th className="text-left py-1.5 px-2 font-medium">Segment</th>
                  <th className="text-right py-1.5 px-2 font-medium">Size</th>
                  <th className="text-right py-1.5 px-2 font-medium">Growth</th>
                  <th className="text-right py-1.5 px-2 font-medium">Our Share</th>
                </tr>
              </thead>
              <tbody>
                {marketData.map((point, i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="py-1.5 px-2">{point.segment}</td>
                    <td className="text-right py-1.5 px-2">${point.size}M</td>
                    <td className="text-right py-1.5 px-2">{point.growth}%</td>
                    <td className="text-right py-1.5 px-2">{point.ourShare}%</td>
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

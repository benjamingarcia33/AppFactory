"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RevenueModelVisual } from "@/lib/types";

interface RevenueChartProps {
  revenueModel: RevenueModelVisual;
}

export function RevenueChart({ revenueModel }: RevenueChartProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Revenue Model</h3>
      <p className="text-sm text-muted-foreground">
        Strategy: {revenueModel.strategy} | Projected ARPU: {revenueModel.projectedArpu}
      </p>

      {/* Pricing Tiers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {revenueModel.tiers.map((tier, i) => (
          <Card
            key={i}
            className={cn(
              "relative",
              tier.isPopular && "ring-2 ring-primary"
            )}
          >
            {tier.isPopular && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5 rounded-full">
                Popular
              </div>
            )}
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{tier.name}</CardTitle>
              <p className="text-xl font-bold">{tier.price}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {tier.features.map((f, j) => (
                  <li key={j} className="text-xs text-muted-foreground flex gap-1.5">
                    <span className="text-green-500 shrink-0">+</span>
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Projections Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">12-Month Projections</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueModel.monthlyProjections}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="month"
                tickFormatter={(v) => `M${v}`}
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                yAxisId="users"
                orientation="left"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              />
              <YAxis
                yAxisId="revenue"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip
                formatter={(value, name) => {
                  const v = Number(value);
                  if (name === "users") return [v.toLocaleString(), "Users"];
                  return [`$${v.toLocaleString()}`, "Revenue"];
                }}
                labelFormatter={(label) => `Month ${label}`}
              />
              <Area
                yAxisId="users"
                type="monotone"
                dataKey="users"
                stroke="hsl(var(--chart-1))"
                fill="hsl(var(--chart-1))"
                fillOpacity={0.2}
                name="users"
              />
              <Area
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--chart-2))"
                fill="hsl(var(--chart-2))"
                fillOpacity={0.2}
                name="revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

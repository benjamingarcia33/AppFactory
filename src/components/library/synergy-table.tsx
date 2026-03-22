"use client";

import { Badge } from "@/components/ui/badge";
import type { TechSynergy } from "@/lib/types";

interface SynergyTableProps {
  synergies: TechSynergy[];
}

const relationshipColors: Record<string, string> = {
  recommended: "bg-green-500/10 text-green-400 border-green-500/20",
  compatible: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  redundant: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  incompatible: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function SynergyTable({ synergies }: SynergyTableProps) {
  if (synergies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-2">
        <p className="text-muted-foreground">No synergies found.</p>
        <p className="text-sm text-muted-foreground">
          Run the seed script to populate tech synergies.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-surface-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-surface-1">
            <th className="text-left py-2.5 px-4 font-medium">Tech A</th>
            <th className="text-left py-2.5 px-4 font-medium">Tech B</th>
            <th className="text-center py-2.5 px-4 font-medium">Relationship</th>
            <th className="text-left py-2.5 px-4 font-medium">Reason</th>
          </tr>
        </thead>
        <tbody>
          {synergies.map((synergy) => (
            <tr key={synergy.id} className="border-b border-border-subtle last:border-b-0 hover:bg-surface-2 transition-colors">
              <td className="py-2.5 px-4 font-mono text-xs font-medium">{synergy.techSlugA}</td>
              <td className="py-2.5 px-4 font-mono text-xs font-medium">{synergy.techSlugB}</td>
              <td className="py-2.5 px-4 text-center">
                <Badge
                  variant="outline"
                  className={`text-[10px] ${relationshipColors[synergy.relationship] ?? ""}`}
                >
                  {synergy.relationship}
                </Badge>
              </td>
              <td className="py-2.5 px-4 text-xs text-muted-foreground">{synergy.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

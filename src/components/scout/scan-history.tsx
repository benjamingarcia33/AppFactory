"use client";

import { ScanSessionCard } from "./scan-session-card";
import type { Scan, Opportunity } from "@/lib/types";

interface ScanHistoryProps {
  scans: Scan[];
  activeScanId: string | null;
  activeOpportunities: Opportunity[];
}

export function ScanHistory({
  scans,
  activeScanId,
  activeOpportunities,
}: ScanHistoryProps) {
  if (scans.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No scans yet</p>
        <p className="text-sm mt-1">
          Configure a store and category above, then start a scan to discover
          app opportunities.
        </p>
      </div>
    );
  }

  // Active scan always first, rest sorted newest-first (already from DB)
  const activeScan = activeScanId
    ? scans.find((s) => s.id === activeScanId)
    : null;
  const pastScans = scans.filter((s) => s.id !== activeScanId);

  return (
    <div className="space-y-3">
      {activeScan && (
        <ScanSessionCard
          key={activeScan.id}
          scan={activeScan}
          isActive
          activeOpportunities={activeOpportunities}
          defaultExpanded
        />
      )}
      {pastScans.map((scan) => (
        <ScanSessionCard key={scan.id} scan={scan} />
      ))}
    </div>
  );
}

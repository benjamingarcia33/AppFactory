"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { VisualStrategy } from "@/lib/types";

interface StrategySidebarNavProps {
  visualStrategy: VisualStrategy;
}

interface NavItem {
  id: string;
  label: string;
  hasData: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export function StrategySidebarNav({ visualStrategy }: StrategySidebarNavProps) {
  const [activeSection, setActiveSection] = useState<string>("");

  const navGroups: NavGroup[] = [
    {
      label: "Decision",
      items: [
        { id: "vs-go-no-go", label: "Go/No-Go Scorecard", hasData: !!visualStrategy.goNoGoScorecard },
      ],
    },
    {
      label: "Market",
      items: [
        { id: "vs-competitive-matrix", label: "Competitive Matrix", hasData: (visualStrategy.competitiveMatrix ?? []).length > 0 },
        { id: "vs-competitive-details", label: "Competitive Deep Dive", hasData: (visualStrategy.competitiveDetails ?? []).length > 0 },
        { id: "vs-market-gaps", label: "Market Gap Analysis", hasData: (visualStrategy.marketGapAnalysis ?? []).length > 0 },
        { id: "vs-market-segments", label: "Market Segments", hasData: (visualStrategy.marketData ?? []).length > 0 },
      ],
    },
    {
      label: "Business",
      items: [
        { id: "vs-revenue-model", label: "Revenue Model", hasData: !!visualStrategy.revenueModel },
        { id: "vs-revenue-projections", label: "Revenue Projections", hasData: !!visualStrategy.revenueProjections },
        { id: "vs-personas", label: "User Personas", hasData: (visualStrategy.personas ?? []).length > 0 },
      ],
    },
    {
      label: "Technical",
      items: [
        { id: "vs-data-model", label: "Data Model", hasData: (visualStrategy.dataModel ?? []).length > 0 },
        { id: "vs-timeline", label: "Timeline", hasData: (visualStrategy.timeline ?? []).length > 0 },
        { id: "vs-risk-assessment", label: "Risk Assessment", hasData: (visualStrategy.risks ?? []).length > 0 },
      ],
    },
  ];

  // IntersectionObserver to track which section is in view
  useEffect(() => {
    const allIds = navGroups.flatMap((g) => g.items.filter((i) => i.hasData).map((i) => i.id));
    const elements = allIds.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first entry that is intersecting
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [visualStrategy]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Mobile: horizontal scrollable bar */}
      <div className="flex overflow-x-auto gap-1 md:hidden pb-2">
        {navGroups.flatMap((group) =>
          group.items
            .filter((item) => item.hasData)
            .map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={cn(
                  "text-xs px-2.5 py-1.5 rounded-full whitespace-nowrap border transition-colors shrink-0",
                  activeSection === item.id
                    ? "bg-primary/10 text-primary border-primary/30 font-medium"
                    : "text-muted-foreground border-transparent hover:bg-muted"
                )}
              >
                {item.label}
              </button>
            ))
        )}
      </div>

      {/* Desktop: sticky sidebar */}
      <nav className="hidden md:block sticky top-16 space-y-4 max-w-[200px]">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => item.hasData && scrollTo(item.id)}
                  disabled={!item.hasData}
                  className={cn(
                    "text-left text-xs px-2.5 py-1.5 rounded-md transition-colors",
                    !item.hasData && "text-muted-foreground/50 cursor-default",
                    item.hasData && activeSection === item.id && "bg-surface-2 text-foreground font-medium border-l-2 border-primary",
                    item.hasData && activeSection !== item.id && "text-muted-foreground hover:bg-surface-1 hover:text-foreground"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </>
  );
}

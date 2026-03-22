"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CategoryFilter } from "@/components/library/category-filter";
import { TechnologyCard } from "@/components/library/technology-card";
import { ScreenPatternCard } from "@/components/library/screen-pattern-card";
import { SynergyTable } from "@/components/library/synergy-table";
import { getAllTechnologies, getAllScreenPatterns, getAllSynergies } from "@/actions/knowledge-actions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import type { Technology, ScreenPattern, TechSynergy, TechCategory } from "@/lib/types";

export default function LibraryPage() {
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [screenPatterns, setScreenPatterns] = useState<ScreenPattern[]>([]);
  const [synergies, setSynergies] = useState<TechSynergy[]>([]);
  const [activeCategory, setActiveCategory] = useState<TechCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAllTechnologies(),
      getAllScreenPatterns(),
      getAllSynergies(),
    ]).then(([techs, patterns, syns]) => {
      setTechnologies(techs);
      setScreenPatterns(patterns);
      setSynergies(syns);
      setLoading(false);
    });
  }, []);

  const query = searchQuery.toLowerCase().trim();

  const filteredTechnologies = useMemo(() => {
    let result = technologies;
    if (activeCategory) {
      result = result.filter((t) => t.category === activeCategory);
    }
    if (query) {
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.slug.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
      );
    }
    return result;
  }, [technologies, activeCategory, query]);

  const filteredPatterns = useMemo(() => {
    if (!query) return screenPatterns;
    return screenPatterns.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }, [screenPatterns, query]);

  const filteredSynergies = useMemo(() => {
    if (!query) return synergies;
    return synergies.filter(
      (s) =>
        s.techSlugA.toLowerCase().includes(query) ||
        s.techSlugB.toLowerCase().includes(query) ||
        s.relationship.toLowerCase().includes(query) ||
        s.reason.toLowerCase().includes(query)
    );
  }, [synergies, query]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Loading knowledge library...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Knowledge Library"
        description="Technologies, screen patterns, and synergies available for app architecture. The Architect agent selects from these to build execution prompts."
      />

      <div className="max-w-sm">
        <Input
          type="text"
          placeholder="Search across all tabs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-surface-0 border-border"
        />
      </div>

      <Tabs defaultValue="technologies">
        <TabsList>
          <TabsTrigger value="technologies">
            Technologies ({filteredTechnologies.length})
          </TabsTrigger>
          <TabsTrigger value="screen-patterns">
            Screen Patterns ({filteredPatterns.length})
          </TabsTrigger>
          <TabsTrigger value="synergies">
            Synergies ({filteredSynergies.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="technologies" className="space-y-4 mt-4">
          <CategoryFilter
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />

          {filteredTechnologies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-2">
              <p className="text-muted-foreground">No technologies found.</p>
              <p className="text-sm text-muted-foreground">
                {query
                  ? "Try a different search term."
                  : "Run the seed script to populate the technology library."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTechnologies.map((tech) => (
                <TechnologyCard key={tech.id} technology={tech} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="screen-patterns" className="space-y-4 mt-4">
          {filteredPatterns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-2">
              <p className="text-muted-foreground">No screen patterns found.</p>
              <p className="text-sm text-muted-foreground">
                {query
                  ? "Try a different search term."
                  : "Run the seed script to populate screen patterns."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatterns.map((pattern) => (
                <ScreenPatternCard key={pattern.id} pattern={pattern} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="synergies" className="mt-4">
          <SynergyTable synergies={filteredSynergies} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

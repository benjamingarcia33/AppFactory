"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DEFAULT_SCOUT_FILTERS,
  GOOGLE_PLAY_CATEGORIES,
  APP_STORE_CATEGORIES,
} from "@/lib/types";
import type { AppStore, ScoutFilterSettings } from "@/lib/types";
import { ChevronDown, ChevronRight, SlidersHorizontal, Rocket, Lightbulb, Compass } from "lucide-react";

type ScanMode = "idea" | "discovery";

interface ScanControlsProps {
  onStartScan: (store: AppStore, ideaText: string, advancedFilters: ScoutFilterSettings | null) => void;
  onStartDiscovery: (store: AppStore, category: string, categoryLabel: string, focusText: string | null, advancedFilters: ScoutFilterSettings | null) => void;
  onCancel?: () => void;
  isScanning: boolean;
}

export function ScanControls({ onStartScan, onStartDiscovery, onCancel, isScanning }: ScanControlsProps) {
  const [scanMode, setScanMode] = useState<ScanMode>("idea");
  const [store, setStore] = useState<AppStore>("google_play");
  const [ideaText, setIdeaText] = useState("");
  const [discoveryCategory, setDiscoveryCategory] = useState("");
  const [focusText, setFocusText] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [useAdvancedFilters, setUseAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState<ScoutFilterSettings>(DEFAULT_SCOUT_FILTERS);

  const categories = store === "google_play" ? GOOGLE_PLAY_CATEGORIES : APP_STORE_CATEGORIES;

  const handleStartScan = () => {
    if (!ideaText.trim()) return;
    onStartScan(
      store,
      ideaText.trim(),
      useAdvancedFilters ? filters : null,
    );
  };

  const handleStartDiscovery = () => {
    if (!discoveryCategory) return;
    const catObj = categories.find((c) => c.value === discoveryCategory);
    const categoryLabel = catObj ? catObj.label : discoveryCategory;
    onStartDiscovery(
      store,
      discoveryCategory,
      categoryLabel,
      focusText.trim() || null,
      useAdvancedFilters ? filters : null,
    );
  };

  const canStartIdea = ideaText.trim().length > 0;
  const canStartDiscovery = discoveryCategory.length > 0;
  const canStart = scanMode === "idea" ? canStartIdea : canStartDiscovery;
  const handleStart = scanMode === "idea" ? handleStartScan : handleStartDiscovery;

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-1 rounded-full border border-border-subtle bg-surface-0 p-1 w-fit">
        <button
          type="button"
          onClick={() => setScanMode("idea")}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            scanMode === "idea"
              ? "bg-surface-2 text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Lightbulb className="h-3.5 w-3.5" />
          I have an idea
        </button>
        <button
          type="button"
          onClick={() => setScanMode("discovery")}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            scanMode === "discovery"
              ? "bg-surface-2 text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Compass className="h-3.5 w-3.5" />
          Help me find ideas
        </button>
      </div>

      <div className="space-y-3">
        {scanMode === "idea" ? (
          <Textarea
            value={ideaText}
            onChange={(e) => setIdeaText(e.target.value)}
            placeholder="Describe your app idea... e.g., 'A minimalist habit tracker that uses AI to suggest optimal times for habits based on your schedule and energy levels'"
            className="min-h-[100px] resize-y text-base"
            rows={4}
          />
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Category
              </label>
              <Select value={discoveryCategory} onValueChange={setDiscoveryCategory}>
                <SelectTrigger className="w-full max-w-[320px]">
                  <SelectValue placeholder="Select a category to explore" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Focus (optional)
              </label>
              <Input
                value={focusText}
                onChange={(e) => setFocusText(e.target.value)}
                placeholder='e.g., "for seniors", "budget tracking", "offline-first"'
                className="max-w-[480px]"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank and AI will discover an underserved niche automatically.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Store
            </label>
            <Select value={store} onValueChange={(v) => {
              setStore(v as AppStore);
              setDiscoveryCategory(""); // Reset category when store changes
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select store" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google_play">Google Play</SelectItem>
                <SelectItem value="app_store">App Store</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isScanning ? (
            <Button
              onClick={onCancel}
              variant="destructive"
              size="lg"
            >
              Cancel Scan
            </Button>
          ) : (
            <Button
              onClick={handleStart}
              disabled={!canStart}
              size="lg"
              className="gap-2 shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
            >
              {scanMode === "idea" ? (
                <>
                  <Rocket className="h-4 w-4" />
                  Scout Competitors
                </>
              ) : (
                <>
                  <Compass className="h-4 w-4" />
                  Discover Ideas
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            Advanced Filtering
            {advancedOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 space-y-3 rounded-xl border border-border-subtle bg-surface-0 p-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useAdvanced"
                checked={useAdvancedFilters}
                onChange={(e) => setUseAdvancedFilters(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="useAdvanced" className="text-sm text-muted-foreground">
                Override AI-determined filters with manual settings
              </label>
            </div>

            {useAdvancedFilters && (
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-muted-foreground">
                    Min Installs/Downloads
                  </label>
                  <Select
                    value={String(filters.minInstalls)}
                    onValueChange={(v) =>
                      setFilters((f) => ({ ...f, minInstalls: parseInt(v, 10) }))
                    }
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1000">1,000+</SelectItem>
                      <SelectItem value="5000">5,000+</SelectItem>
                      <SelectItem value="10000">10,000+</SelectItem>
                      <SelectItem value="50000">50,000+</SelectItem>
                      <SelectItem value="100000">100,000+</SelectItem>
                      <SelectItem value="500000">500,000+</SelectItem>
                      <SelectItem value="1000000">1,000,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-muted-foreground">
                    Max Rating (stars)
                  </label>
                  <Select
                    value={String(filters.maxRating)}
                    onValueChange={(v) =>
                      setFilters((f) => ({ ...f, maxRating: parseFloat(v) }))
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3.0 or below</SelectItem>
                      <SelectItem value="3.5">3.5 or below</SelectItem>
                      <SelectItem value="4">4.0 or below</SelectItem>
                      <SelectItem value="4.5">4.5 or below</SelectItem>
                      <SelectItem value="5">Any rating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-muted-foreground">
                    Min Ratings Count
                  </label>
                  <Input
                    type="number"
                    className="w-[140px]"
                    value={filters.minRatings}
                    min={0}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        minRatings: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(DEFAULT_SCOUT_FILTERS)}
                >
                  Reset to Defaults
                </Button>
              </div>
            )}

            {!useAdvancedFilters && (
              <p className="text-xs text-muted-foreground">
                AI will autonomously determine optimal filter settings based on {scanMode === "idea" ? "your idea's market segment" : "the category and focus"}.
              </p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

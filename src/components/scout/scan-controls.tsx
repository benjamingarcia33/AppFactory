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
  GOOGLE_PLAY_CATEGORIES,
  APP_STORE_CATEGORIES,
  DEFAULT_SCOUT_FILTERS,
} from "@/lib/types";
import type { AppStore, ScoutFilterSettings, ScoutMode } from "@/lib/types";
import { ChevronDown, ChevronRight, SlidersHorizontal, Search, Lightbulb } from "lucide-react";

interface ScanControlsProps {
  onStartScan: (
    store: AppStore,
    category: string,
    filters: ScoutFilterSettings
  ) => void;
  onStartIdeaScan?: (
    store: AppStore,
    ideaText: string,
    filters: ScoutFilterSettings
  ) => void;
  onCancel?: () => void;
  isScanning: boolean;
}

export function ScanControls({ onStartScan, onStartIdeaScan, onCancel, isScanning }: ScanControlsProps) {
  const [mode, setMode] = useState<ScoutMode>("category");
  const [store, setStore] = useState<AppStore>("google_play");
  const [category, setCategory] = useState<string>("");
  const [ideaText, setIdeaText] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<ScoutFilterSettings>(
    DEFAULT_SCOUT_FILTERS
  );

  const categories =
    store === "google_play" ? GOOGLE_PLAY_CATEGORIES : APP_STORE_CATEGORIES;

  const handleStoreChange = (value: string) => {
    setStore(value as AppStore);
    setCategory("");
  };

  const handleStartScan = () => {
    if (mode === "idea") {
      if (!ideaText.trim()) return;
      onStartIdeaScan?.(store, ideaText.trim(), filters);
    } else {
      if (!category) return;
      onStartScan(store, category, filters);
    }
  };

  const canStart = mode === "idea" ? ideaText.trim().length > 0 : !!category;

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
        <Button
          variant={mode === "category" ? "default" : "ghost"}
          size="sm"
          onClick={() => setMode("category")}
          className="gap-1.5"
        >
          <Search className="h-3.5 w-3.5" />
          Category Scan
        </Button>
        <Button
          variant={mode === "idea" ? "default" : "ghost"}
          size="sm"
          onClick={() => setMode("idea")}
          className="gap-1.5"
        >
          <Lightbulb className="h-3.5 w-3.5" />
          Idea Validation
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted-foreground">
            Store
          </label>
          <Select value={store} onValueChange={handleStoreChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select store" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="google_play">Google Play</SelectItem>
              <SelectItem value="app_store">App Store</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {mode === "category" ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select category" />
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
        ) : (
          <div className="flex flex-col gap-1.5 flex-1 min-w-[300px]">
            <label className="text-sm font-medium text-muted-foreground">
              Your App Idea
            </label>
            <Textarea
              value={ideaText}
              onChange={(e) => setIdeaText(e.target.value)}
              placeholder="Describe your app idea... e.g., 'A minimalist habit tracker that uses AI to suggest optimal times for habits based on your schedule and energy levels'"
              className="min-h-[80px] resize-y"
              rows={3}
            />
          </div>
        )}

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
            onClick={handleStartScan}
            disabled={!canStart}
            size="lg"
          >
            {mode === "idea" ? "Validate Idea" : "Start Scan"}
          </Button>
        )}
      </div>

      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            Filter Settings
            {filtersOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 flex flex-wrap items-end gap-4 rounded-lg border bg-muted/30 p-4">
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
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

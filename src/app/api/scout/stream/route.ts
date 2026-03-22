import { runScoutPipeline, runScoutIdeaPipeline, runScoutSynthesisPipeline, runScoutDiscoveryPipeline } from "@/lib/agents/scout";
import type { AppStore, ScoutSSEEvent, ScoutFilterSettings, ScoutMode } from "@/lib/types";
import { DEFAULT_SCOUT_FILTERS } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const store = searchParams.get("store") as AppStore | null;
  const mode = (searchParams.get("mode") ?? "synthesis") as ScoutMode;
  const category = searchParams.get("category");
  const ideaText = searchParams.get("ideaText");
  const focusText = searchParams.get("focusText");
  const categoryLabel = searchParams.get("categoryLabel");
  const advancedFilters = searchParams.get("advancedFilters") === "true";

  if (!store) {
    return new Response(
      JSON.stringify({ error: "Missing store parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (store !== "google_play" && store !== "app_store") {
    return new Response(
      JSON.stringify({ error: "Invalid store parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Validate based on mode
  if ((mode === "idea" || mode === "synthesis") && !ideaText) {
    return new Response(
      JSON.stringify({ error: "Missing ideaText parameter for idea/synthesis mode" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (mode === "category" && !category) {
    return new Response(
      JSON.stringify({ error: "Missing category parameter for category mode" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (mode === "discovery" && !category) {
    return new Response(
      JSON.stringify({ error: "Missing category parameter for discovery mode" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Parse optional filter settings from query params with validation clamping
  const rawMinInstalls = parseInt(searchParams.get("minInstalls") ?? "", 10);
  const rawMaxRating = parseFloat(searchParams.get("maxRating") ?? "");
  const rawMinRatings = parseInt(searchParams.get("minRatings") ?? "", 10);

  const filters: ScoutFilterSettings = {
    minInstalls: Math.max(0, isNaN(rawMinInstalls) ? DEFAULT_SCOUT_FILTERS.minInstalls : rawMinInstalls),
    maxRating: Math.min(5, Math.max(0, isNaN(rawMaxRating) ? DEFAULT_SCOUT_FILTERS.maxRating : rawMaxRating)),
    minRatings: Math.max(0, isNaN(rawMinRatings) ? DEFAULT_SCOUT_FILTERS.minRatings : rawMinRatings),
  };

  const encoder = new TextEncoder();
  const STREAM_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes max stream duration

  const stream = new ReadableStream({
    async start(controller) {
      const streamStartTime = Date.now();
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let streamClosed = false;

      const closeStream = () => {
        if (!streamClosed) {
          streamClosed = true;
          if (timeoutId) clearTimeout(timeoutId);
          controller.close();
        }
      };

      const sendEvent = (event: ScoutSSEEvent) => {
        if (streamClosed) return;
        // Check timeout at each event send
        if (Date.now() - streamStartTime >= STREAM_TIMEOUT_MS) {
          const timeoutEvent: ScoutSSEEvent = {
            type: "error",
            message: "Stream timed out after 10 minutes. The scan may still be running on the server.",
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(timeoutEvent)}\n\n`));
          closeStream();
          return;
        }
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      // Set a hard timeout that closes the stream after 10 minutes
      timeoutId = setTimeout(() => {
        if (!streamClosed) {
          const timeoutEvent: ScoutSSEEvent = {
            type: "error",
            message: "Stream timed out after 10 minutes. The scan may still be running on the server.",
          };
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(timeoutEvent)}\n\n`));
          } catch {
            // Controller may already be closed
          }
          closeStream();
        }
      }, STREAM_TIMEOUT_MS);

      try {
        if (mode === "discovery" && category) {
          const filterOverrides = advancedFilters ? filters : null;
          await runScoutDiscoveryPipeline(store, category, categoryLabel || category, sendEvent, focusText || null, filterOverrides);
        } else if (mode === "synthesis" && ideaText) {
          // Synthesis mode: AI determines filters unless advanced overrides are provided
          const filterOverrides = advancedFilters ? filters : null;
          await runScoutSynthesisPipeline(store, ideaText, sendEvent, filterOverrides);
        } else if (mode === "idea" && ideaText) {
          await runScoutIdeaPipeline(store, ideaText, sendEvent, filters);
        } else {
          await runScoutPipeline(store, category!, sendEvent, filters);
        }
      } catch (error) {
        if (!streamClosed) {
          const errorEvent: ScoutSSEEvent = {
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "An unknown error occurred",
          };
          const data = `data: ${JSON.stringify(errorEvent)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
      } finally {
        closeStream();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

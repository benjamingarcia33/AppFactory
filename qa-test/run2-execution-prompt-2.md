

# Cognitize — Execution Prompt 2: Core Features

## Context

Prompt 1 has been executed. The project has:
- Expo SDK 51 with expo-router file-based routing
- Supabase Auth (email/password, Apple, Google sign-in)
- PostgreSQL schema with RLS (users, speaking_sessions, session_feedback, scenarios, user_progress, subscriptions)
- Local SQLite cache with expo-sqlite
- Auth flow (signup → onboarding → dashboard)
- Tab navigator (Home, Scenarios, Progress, Profile) + settings modal
- Sentry, PostHog, Expo Updates configured

**You are now building the 4 core feature screens and 5 Supabase Edge Functions that make up the pressure simulation engine — the heart of the app.**

---

## Step 1: Install Required Dependencies

```bash
npx expo install expo-av expo-file-system expo-haptics
npm install react-native-reanimated-carousel react-native-svg
npm install lodash.debounce
npm install @types/lodash.debounce --save-dev
```

Verify these are already installed from EP1 (do NOT reinstall if present): `@supabase/supabase-js`, `expo-router`, `expo-sqlite`, `react-native-reanimated`, `react-native-gesture-handler`, `react-native-safe-area-context`.

---

## Step 2: Seed Scenario Data

Create `src/lib/seed-scenarios.ts` with a function to seed the `scenarios` table if empty. Call this once on app start (in the root layout, guarded by an AsyncStorage flag `scenarios_seeded`).

Seed these exact scenarios:

```typescript
const SCENARIOS = [
  // INTERVIEWS
  { title: "FAANG Behavioral Interview", category: "interviews", difficulty: 3, duration_minutes: 10, description: "A senior engineer behavioral interview with Amazon leadership principles. Expect pointed follow-ups on your STAR responses and challenges to your impact claims.", pressure_tactics: ["pointed follow-ups", "challenge claims", "ask for metrics"], persona_name: "Sarah Chen", persona_description: "Senior Technical Recruiter, direct and metrics-driven", is_free: true },
  { title: "Startup CEO Grilling", category: "interviews", difficulty: 5, duration_minutes: 8, description: "A fast-paced startup founder interview where you're challenged on culture fit, speed of execution, and willingness to wear multiple hats.", pressure_tactics: ["rapid-fire questions", "topic pivots", "hypothetical curveballs"], persona_name: "Marcus Reid", persona_description: "Serial entrepreneur, impatient and sharp", is_free: false },
  { title: "Entry-Level Panel Interview", category: "interviews", difficulty: 2, duration_minutes: 7, description: "Three interviewers taking turns asking competency questions. Practice maintaining composure with multiple questioners.", pressure_tactics: ["rotating questioners", "follow-up probes"], persona_name: "Panel (3 interviewers)", persona_description: "HR lead, team manager, and peer interviewer", is_free: true },

  // PITCHES
  { title: "60-Second Elevator Pitch", category: "pitches", difficulty: 2, duration_minutes: 3, description: "Deliver your startup pitch to a busy investor in an elevator. You'll be interrupted with skeptical questions mid-pitch.", pressure_tactics: ["time pressure", "skeptical interruptions"], persona_name: "David Park", persona_description: "Angel investor, checks phone frequently", is_free: true },
  { title: "VC Partner Meeting", category: "pitches", difficulty: 4, duration_minutes: 12, description: "Full pitch to a VC partner who will challenge your market size, unit economics, and competitive moat.", pressure_tactics: ["challenge assumptions", "demand specifics", "compare to competitors"], persona_name: "Elena Vasquez", persona_description: "Partner at Tier 1 VC, analytically rigorous", is_free: false },
  { title: "Product Demo to Enterprise Client", category: "pitches", difficulty: 3, duration_minutes: 8, description: "Present your product to a skeptical enterprise buyer who keeps asking about security, compliance, and integration.", pressure_tactics: ["technical deep-dives", "objection stacking"], persona_name: "Robert Tanaka", persona_description: "CTO of Fortune 500, security-obsessed", is_free: false },

  // DEBATES
  { title: "Defend an Unpopular Opinion", category: "debates", difficulty: 4, duration_minutes: 7, description: "You'll be given a controversial stance and must defend it against aggressive counterarguments.", pressure_tactics: ["rapid counterarguments", "emotional appeals", "strawman attacks"], persona_name: "Professor Williams", persona_description: "Oxford debate coach, Socratic method", is_free: true },
  { title: "Policy Debate: Quick Fire", category: "debates", difficulty: 3, duration_minutes: 5, description: "Fast-paced point-counterpoint on a current policy issue. Practice maintaining logical structure under rapid fire.", pressure_tactics: ["rapid-fire rebuttals", "topic pivots"], persona_name: "Jordan Blake", persona_description: "Political commentator, fast-talking", is_free: false },

  // PRESENTATIONS
  { title: "All-Hands Company Update", category: "presentations", difficulty: 2, duration_minutes: 10, description: "Deliver a quarterly update to your company. The AI audience will ask tough questions about missed targets and team morale.", pressure_tactics: ["uncomfortable questions", "request specifics"], persona_name: "Your Team (50 employees)", persona_description: "Mixed audience, some skeptical about direction", is_free: true },
  { title: "Board of Directors Presentation", category: "presentations", difficulty: 5, duration_minutes: 15, description: "Present to a demanding board. Expect interruptions on financials, strategy pivots, and governance concerns.", pressure_tactics: ["interrupt mid-sentence", "demand financial detail", "question strategy"], persona_name: "The Board (5 members)", persona_description: "Experienced executives, impatient with fluff", is_free: false },

  // DIFFICULT CONVERSATIONS
  { title: "Performance Review (Giving)", category: "difficult_conversations", difficulty: 3, duration_minutes: 8, description: "Deliver tough feedback to an underperforming team member who becomes defensive and emotional.", pressure_tactics: ["emotional responses", "deflection", "counter-accusations"], persona_name: "Alex Morgan", persona_description: "3-year employee, recently struggling", is_free: true },
  { title: "Salary Negotiation", category: "difficult_conversations", difficulty: 4, duration_minutes: 7, description: "Negotiate a raise with your manager who has budget constraints and will push back on your justifications.", pressure_tactics: ["budget constraints", "deflect to future", "compare to peers"], persona_name: "Patricia Hoffman", persona_description: "VP of Engineering, empathetic but budget-conscious", is_free: false },

  // IMPROMPTU
  { title: "Random Topic: 2-Minute Speech", category: "impromptu", difficulty: 3, duration_minutes: 4, description: "You'll receive a random topic and have 15 seconds to prepare a 2-minute speech. The AI will interrupt with curveball questions.", pressure_tactics: ["surprise topic", "curveball questions", "time pressure"], persona_name: "Toastmaster Judge", persona_description: "Experienced speech evaluator, times strictly", is_free: true },
  { title: "Crisis Press Conference", category: "impromptu", difficulty: 5, duration_minutes: 10, description: "Your company had a data breach. Face hostile reporters with rapid-fire questions and gotcha attempts.", pressure_tactics: ["hostile questions", "gotcha attempts", "emotional provocations", "rapid-fire"], persona_name: "Press Corps (6 reporters)", persona_description: "Aggressive journalists competing for quotes", is_free: false },
];
```

Each scenario should also include `id` (uuid generated), `created_at`, and `updated_at`. Use `supabase.from('scenarios').upsert()` with the title as the conflict key.

---

## Step 3: Create Shared Types

Create `src/types/session.ts`:

```typescript
export interface Scenario {
  id: string;
  title: string;
  category: ScenarioCategory;
  difficulty: number; // 1-5
  duration_minutes: number;
  description: string;
  pressure_tactics: string[];
  persona_name: string;
  persona_description: string;
  is_free: boolean;
  created_at: string;
  updated_at: string;
}

export type ScenarioCategory = 
  | 'interviews' 
  | 'pitches' 
  | 'debates' 
  | 'presentations' 
  | 'difficult_conversations' 
  | 'impromptu';

export const CATEGORY_META: Record<ScenarioCategory, { label: string; icon: string; color: string }> = {
  interviews: { label: 'Interviews', icon: 'briefcase', color: '#4F46E5' },
  pitches: { label: 'Pitches', icon: 'trending-up', color: '#059669' },
  debates: { label: 'Debates', icon: 'message-circle', color: '#DC2626' },
  presentations: { label: 'Presentations', icon: 'monitor', color: '#7C3AED' },
  difficult_conversations: { label: 'Difficult Conversations', icon: 'alert-triangle', color: '#D97706' },
  impromptu: { label: 'Impromptu', icon: 'zap', color: '#0891B2' },
};

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface SessionConfig {
  scenario_id: string;
  difficulty: DifficultyLevel;
  duration_minutes: number;
}

export interface LiveTranscriptEntry {
  text: string;
  speaker: 'user' | 'ai';
  timestamp: number; // seconds into session
  is_final: boolean;
  filler_detected?: boolean;
}

export interface InterruptionEvent {
  type: 'follow_up' | 'topic_pivot' | 'challenge' | 'rapid_fire';
  text: string;
  timestamp: number;
  triggered_by: 'silence' | 'clause_boundary' | 'scheduled';
}

export interface SessionResult {
  session_id: string;
  scenario_id: string;
  duration_seconds: number;
  transcript: LiveTranscriptEntry[];
  interruptions: InterruptionEvent[];
  audio_uri: string | null; // local file URI
}

export interface FeedbackScores {
  overall_score: number; // 0-100
  filler_word_count: number;
  filler_words_per_minute: number;
  filler_word_details: { word: string; count: number; timestamps: number[] }[];
  words_per_minute: number;
  clarity_score: number; // 0-100
  coherence_score: number; // 0-100
  confidence_markers: { positive: string[]; negative: string[] };
  historical_comparison: {
    filler_trend: 'improving' | 'stable' | 'declining';
    wpm_trend: 'improving' | 'stable' | 'declining';
    overall_trend: 'improving' | 'stable' | 'declining';
    sessions_compared: number;
  } | null;
}

export interface QualitativeFeedback {
  summary: string;
  strengths: [string, string];
  improvements: [string, string];
}

export interface SessionFeedback {
  scores: FeedbackScores;
  qualitative: QualitativeFeedback;
  highlighted_transcript: { text: string; type: 'normal' | 'filler' | 'strong_point' | 'weak_point'; note?: string }[];
}
```

---

## Step 4: Create Scoring Utilities

Create `src/lib/scoring.ts` — this implements **deterministic, transparent scoring** (never GPT-4o for scores):

```typescript
import { LiveTranscriptEntry, FeedbackScores } from '@/types/session';

// Filler word detection — regex-based, NOT AI
const FILLER_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\b(um+)\b/gi, label: 'um' },
  { pattern: /\b(uh+)\b/gi, label: 'uh' },
  { pattern: /\b(er+)\b/gi, label: 'er' },
  { pattern: /\b(ah+)\b/gi, label: 'ah' },
  { pattern: /\b(like)\b/gi, label: 'like' }, // contextual — only count when surrounded by pauses or at start of clause
  { pattern: /\b(you know)\b/gi, label: 'you know' },
  { pattern: /\b(I mean)\b/gi, label: 'I mean' },
  { pattern: /\b(sort of)\b/gi, label: 'sort of' },
  { pattern: /\b(kind of)\b/gi, label: 'kind of' },
  { pattern: /\b(basically)\b/gi, label: 'basically' },
  { pattern: /\b(actually)\b/gi, label: 'actually' },
  { pattern: /\b(literally)\b/gi, label: 'literally' },
  { pattern: /\b(right)\b(?=\s*,|\s*\.|\s*\?|\s*$)/gi, label: 'right' },
  { pattern: /\b(so)\b(?=\s*,|\s*um|\s*uh|\s*like)/gi, label: 'so' },
];

export function detectFillerWords(transcript: LiveTranscriptEntry[]): FeedbackScores['filler_word_details'] {
  const userEntries = transcript.filter(e => e.speaker === 'user' && e.is_final);
  const fillerMap = new Map<string, { count: number; timestamps: number[] }>();

  for (const entry of userEntries) {
    for (const { pattern, label } of FILLER_PATTERNS) {
      const matches = entry.text.match(pattern);
      if (matches) {
        const existing = fillerMap.get(label) || { count: 0, timestamps: [] };
        existing.count += matches.length;
        existing.timestamps.push(entry.timestamp);
        fillerMap.set(label, existing);
      }
    }
  }

  return Array.from(fillerMap.entries()).map(([word, data]) => ({
    word,
    count: data.count,
    timestamps: data.timestamps,
  })).sort((a, b) => b.count - a.count);
}

export function calculateWPM(transcript: LiveTranscriptEntry[]): number {
  const userEntries = transcript.filter(e => e.speaker === 'user' && e.is_final);
  if (userEntries.length === 0) return 0;

  const totalWords = userEntries.reduce((sum, e) => sum + e.text.split(/\s+/).filter(Boolean).length, 0);
  const firstTimestamp = userEntries[0].timestamp;
  const lastTimestamp = userEntries[userEntries.length - 1].timestamp;
  const durationMinutes = Math.max((lastTimestamp - firstTimestamp) / 60, 0.5); // min 30 seconds

  return Math.round(totalWords / durationMinutes);
}

export function calculateClarityScore(transcript: LiveTranscriptEntry[], fillerDetails: FeedbackScores['filler_word_details']): number {
  const userEntries = transcript.filter(e => e.speaker === 'user' && e.is_final);
  const totalWords = userEntries.reduce((sum, e) => sum + e.text.split(/\s+/).filter(Boolean).length, 0);
  const totalFillers = fillerDetails.reduce((sum, f) => sum + f.count, 0);

  if (totalWords === 0) return 0;

  // Filler ratio penalty (0-40 points deducted)
  const fillerRatio = totalFillers / totalWords;
  const fillerPenalty = Math.min(fillerRatio * 400, 40);

  // Sentence completion rate (0-30 points)
  const sentences = userEntries.map(e => e.text.trim());
  const completeSentences = sentences.filter(s => /[.!?]$/.test(s)).length;
  const completionRate = sentences.length > 0 ? completeSentences / sentences.length : 0;
  const completionScore = completionRate * 30;

  // Average sentence length score (0-30 points) — penalize very short or very long
  const avgWords = totalWords / Math.max(userEntries.length, 1);
  let lengthScore = 30;
  if (avgWords < 5) lengthScore = avgWords * 6;
  else if (avgWords > 30) lengthScore = Math.max(30 - (avgWords - 30) * 2, 0);

  return Math.round(Math.max(0, Math.min(100, 100 - fillerPenalty + completionScore + lengthScore - 30)));
}

export function calculateCoherenceScore(transcript: LiveTranscriptEntry[]): number {
  const userEntries = transcript.filter(e => e.speaker === 'user' && e.is_final);
  if (userEntries.length < 2) return 50;

  let score = 70; // base score

  // Transition words boost
  const transitionWords = /\b(however|therefore|furthermore|additionally|moreover|consequently|in contrast|for example|specifically|first|second|third|finally|in conclusion)\b/gi;
  const transitionCount = userEntries.reduce((sum, e) => {
    const matches = e.text.match(transitionWords);
    return sum + (matches ? matches.length : 0);
  }, 0);
  score += Math.min(transitionCount * 3, 15);

  // Repetition penalty
  const phrases = userEntries.map(e => e.text.toLowerCase().trim());
  const uniquePhrases = new Set(phrases);
  if (phrases.length > 3) {
    const repetitionRatio = 1 - (uniquePhrases.size / phrases.length);
    score -= repetitionRatio * 20;
  }

  // Response length consistency (not too varied)
  const lengths = userEntries.map(e => e.text.split(/\s+/).length);
  const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLen, 2), 0) / lengths.length;
  if (variance > 100) score -= 10;

  return Math.round(Math.max(0, Math.min(100, score)));
}

export function calculateOverallScore(
  fillerDetails: FeedbackScores['filler_word_details'],
  wpm: number,
  clarityScore: number,
  coherenceScore: number,
  durationMinutes: number
): number {
  const totalFillers = fillerDetails.reduce((sum, f) => sum + f.count, 0);
  const fillersPerMinute = totalFillers / Math.max(durationMinutes, 0.5);

  // Filler score (0-25 points): < 1/min = 25, 1-3/min = 15-25, 3-6/min = 5-15, > 6/min = 0-5
  let fillerScore: number;
  if (fillersPerMinute < 1) fillerScore = 25;
  else if (fillersPerMinute < 3) fillerScore = 25 - (fillersPerMinute - 1) * 5;
  else if (fillersPerMinute < 6) fillerScore = 15 - (fillersPerMinute - 3) * 3.33;
  else fillerScore = Math.max(0, 5 - (fillersPerMinute - 6));

  // Pacing score (0-25 points): Ideal range 130-170 WPM
  let pacingScore: number;
  if (wpm >= 130 && wpm <= 170) pacingScore = 25;
  else if (wpm >= 100 && wpm < 130) pacingScore = 15 + ((wpm - 100) / 30) * 10;
  else if (wpm > 170 && wpm <= 200) pacingScore = 15 + ((200 - wpm) / 30) * 10;
  else pacingScore = Math.max(0, 10 - Math.abs(wpm - 150) / 10);

  // Clarity component (0-25 points)
  const clarityComponent = (clarityScore / 100) * 25;

  // Coherence component (0-25 points)
  const coherenceComponent = (coherenceScore / 100) * 25;

  return Math.round(Math.max(0, Math.min(100, fillerScore + pacingScore + clarityComponent + coherenceComponent)));
}

export function getConfidenceMarkers(transcript: LiveTranscriptEntry[]): { positive: string[]; negative: string[] } {
  const userText = transcript.filter(e => e.speaker === 'user' && e.is_final).map(e => e.text).join(' ');

  const positive: string[] = [];
  const negative: string[] = [];

  // Positive markers
  if (/\b(I believe|I'm confident|clearly|definitely|absolutely)\b/i.test(userText)) positive.push('Used confident language');
  if (/\b(for example|for instance|specifically|such as)\b/i.test(userText)) positive.push('Provided specific examples');
  if (/\b(data shows|research indicates|studies suggest|metrics)\b/i.test(userText)) positive.push('Referenced data/evidence');
  if (/\b(in summary|to summarize|in conclusion|the key point)\b/i.test(userText)) positive.push('Summarized key points');
  if (/\b(great question|that\'s interesting|good point)\b/i.test(userText)) positive.push('Acknowledged interviewer\'s questions');

  // Negative markers
  if (/\b(I think maybe|I guess|I\'m not sure|probably|might)\b/i.test(userText)) negative.push('Used hedging language');
  if (/\b(sorry|apologize|I don\'t know)\b/i.test(userText)) negative.push('Excessive apologizing or uncertainty');
  if (/\b(um|uh)\b/gi.test(userText)) negative.push('Verbal fillers detected');

  return { positive: positive.slice(0, 4), negative: negative.slice(0, 4) };
}

export function getTrend(current: number, history: number[]): 'improving' | 'stable' | 'declining' {
  if (history.length < 2) return 'stable';
  const recentAvg = history.slice(-3).reduce((a, b) => a + b, 0) / Math.min(history.length, 3);
  const diff = current - recentAvg;
  if (diff > 5) return 'improving';
  if (diff < -5) return 'declining';
  return 'stable';
}
```

---

## Step 5: Build Supabase Edge Functions

### 5A: `supabase/functions/start-session/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization")!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { scenario_id, difficulty, duration_minutes } = await req.json();

    // Fetch scenario
    const { data: scenario, error: scenarioError } = await supabase
      .from("scenarios")
      .select("*")
      .eq("id", scenario_id)
      .single();

    if (scenarioError || !scenario) {
      return new Response(JSON.stringify({ error: "Scenario not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check subscription for premium scenarios
    if (!scenario.is_free) {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .single();

      if (!subscription) {
        return new Response(JSON.stringify({ error: "Premium subscription required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Create session record
    const { data: session, error: sessionError } = await supabase
      .from("speaking_sessions")
      .insert({
        user_id: user.id,
        scenario_id,
        difficulty_level: difficulty,
        duration_planned: duration_minutes * 60,
        status: "in_progress",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError) {
      return new Response(JSON.stringify({ error: sessionError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build system prompt for GPT-4o based on scenario + difficulty
    const difficultyConfig = {
      easy: { interruption_frequency: "every 45-60 seconds", aggressiveness: "gentle and encouraging", max_interruptions: 3 },
      medium: { interruption_frequency: "every 25-40 seconds", aggressiveness: "moderately challenging", max_interruptions: 6 },
      hard: { interruption_frequency: "every 15-25 seconds", aggressiveness: "aggressive and relentless", max_interruptions: 12 },
    };

    const config = difficultyConfig[difficulty as keyof typeof difficultyConfig] || difficultyConfig.medium;

    const systemPrompt = `You are ${scenario.persona_name}, ${scenario.persona_description}. You are conducting: "${scenario.title}".

SCENARIO: ${scenario.description}

YOUR BEHAVIOR:
- Interrupt the speaker ${config.interruption_frequency} with ${config.aggressiveness} pressure
- Use these pressure tactics: ${scenario.pressure_tactics.join(", ")}
- Maximum ${config.max_interruptions} interruptions for this session
- Your interruptions should be 1-2 sentences max (under 30 words)
- Stay in character throughout
- React to what the speaker ACTUALLY says — reference their specific words
- Vary interruption types: pointed follow-ups (40%), topic pivots (20%), challenges/pushback (30%), rapid-fire (10%)

INTERRUPTION FORMAT:
When you decide to interrupt, respond with a JSON object:
{
  "should_interrupt": true,
  "interruption_text": "Your interruption here",
  "interruption_type": "follow_up" | "topic_pivot" | "challenge" | "rapid_fire",
  "reasoning": "Brief internal note on why this interruption"
}

If it's not time to interrupt yet, respond with:
{
  "should_interrupt": false
}

IMPORTANT: Only set should_interrupt to true when the speaker has said enough (at least 15 words since last interruption) and you have a meaningful interruption. Quality over frequency.`;

    return new Response(
      JSON.stringify({
        session_id: session.id,
        system_prompt: systemPrompt,
        difficulty_config: config,
        scenario,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

### 5B: `supabase/functions/generate-interruption/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

async function callGPT4o(systemPrompt: string, conversationHistory: Array<{role: string; content: string}>, timeoutMs = 3000): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory.slice(-10), // Rolling context window ~2000 tokens
        ],
        max_tokens: 150,
        temperature: 0.8,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

async function callClaudeFallback(systemPrompt: string, conversationHistory: Array<{role: string; content: string}>): Promise<any> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 150,
      system: systemPrompt + "\n\nIMPORTANT: Respond ONLY with a valid JSON object, no other text.",
      messages: conversationHistory.slice(-10).map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    }),
  });

  const data = await response.json();
  return JSON.parse(data.content[0].text);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { system_prompt, conversation_history, words_since_last_interruption } = await req.json();

    // Don't even try if speaker hasn't said enough
    if (words_since_last_interruption < 15) {
      return new Response(
        JSON.stringify({ should_interrupt: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result;
    try {
      result = await callGPT4o(system_prompt, conversation_history);
    } catch (gptError) {
      console.error("GPT-4o failed, falling back to Claude:", gptError.message);
      try {
        result = await callClaudeFallback(system_prompt, conversation_history);
      } catch (claudeError) {
        console.error("Claude fallback also failed:", claudeError.message);
        return new Response(
          JSON.stringify({ should_interrupt: false, error: "Both AI providers failed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ should_interrupt: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### 5C: `supabase/functions/generate-feedback/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization")!;
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { session_id, transcript, scores, scenario_title, persona_name } = await req.json();

    // Generate qualitative feedback from GPT-4o
    const userTranscript = transcript
      .filter((e: any) => e.speaker === 'user' && e.is_final)
      .map((e: any) => e.text)
      .join(' ');

    const feedbackPrompt = `You are an expert speaking coach analyzing a pressure simulation session.

SESSION: "${scenario_title}" with ${persona_name}
SPEAKER'S TRANSCRIPT: "${userTranscript.slice(0, 3000)}"

QUANTITATIVE SCORES (already calculated — do NOT recalculate):
- Overall: ${scores.overall_score}/100
- Filler words: ${scores.filler_word_count} total (${scores.filler_words_per_minute.toFixed(1)}/min)
- Pacing: ${scores.words_per_minute} WPM
- Clarity: ${scores.clarity_score}/100
- Coherence: ${scores.coherence_score}/100

Provide qualitative analysis in this EXACT JSON format:
{
  "summary": "2-3 sentence overall assessment of the speaker's performance",
  "strengths": ["Specific strength 1 with example from transcript", "Specific strength 2 with example from transcript"],
  "improvements": ["Specific improvement 1 with actionable advice", "Specific improvement 2 with actionable advice"],
  "highlighted_sections": [
    {"text": "exact quote from transcript", "type": "strong_point", "note": "why this was good"},
    {"text": "exact quote from transcript", "type": "weak_point", "note": "what to improve"}
  ]
}

Be specific — reference exact words/phrases from the transcript. Be encouraging but honest.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: feedbackPrompt }],
        max_tokens: 800,
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();
    const qualitative = JSON.parse(data.choices[0].message.content);

    // Store feedback in database
    const { error: feedbackError } = await supabase
      .from("session_feedback")
      .upsert({
        session_id,
        user_id: user.id,
        overall_score: scores.overall_score,
        filler_word_count: scores.filler_word_count,
        filler_words_per_minute: scores.filler_words_per_minute,
        words_per_minute: scores.words_per_minute,
        clarity_score: scores.clarity_score,
        coherence_score: scores.coherence_score,
        confidence_markers: scores.confidence_markers,
        qualitative_summary: qualitative.summary,
        strengths: qualitative.strengths,
        improvements: qualitative.improvements,
        highlighted_transcript: qualitative.highlighted_sections,
        filler_word_details: scores.filler_word_details,
      });

    if (feedbackError) {
      console.error("Failed to store feedback:", feedbackError);
    }

    // Update session status
    await supabase
      .from("speaking_sessions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", session_id);

    // Update user_progress
    const { data: existingProgress } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existingProgress) {
      await supabase
        .from("user_progress")
        .update({
          total_sessions: existingProgress.total_sessions + 1,
          total_practice_minutes: existingProgress.total_practice_minutes + Math.round(scores.duration_seconds / 60),
          average_score: Math.round(
            (existingProgress.average_score * existingProgress.total_sessions + scores.overall_score) /
            (existingProgress.total_sessions + 1)
          ),
          best_score: Math.max(existingProgress.best_score, scores.overall_score),
          current_streak: existingProgress.current_streak + 1, // simplified — should check date
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("user_progress")
        .insert({
          user_id: user.id,
          total_sessions: 1,
          total_practice_minutes: Math.round(scores.duration_seconds / 60),
          average_score: scores.overall_score,
          best_score: scores.overall_score,
          current_streak: 1,
        });
    }

    return new Response(
      JSON.stringify({ qualitative, scores }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### 5D: `supabase/functions/tts-cache/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const VOICE_ID = Deno.env.get("ELEVENLABS_VOICE_ID") || "21m00Tcm4TlvDq8ikWAM"; // Default Rachel voice

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { text, voice_id } = await req.json();
    const selectedVoice = voice_id || VOICE_ID;

    // Check cache first
    const cacheKey = `tts/${selectedVoice}/${btoa(text).slice(0, 100)}.mp3`;
    const { data: existingFile } = await supabase.storage
      .from("tts-cache")
      .createSignedUrl(cacheKey, 3600);

    if (existingFile?.signedUrl) {
      return new Response(
        JSON.stringify({ audio_url: existingFile.signedUrl, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate TTS
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            speed: 1.1, // Slightly fast for interviewer feel
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      throw new Error(`ElevenLabs error: ${ttsResponse.status}`);
    }

    const audioBuffer = await ttsResponse.arrayBuffer();

    // Cache to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("tts-cache")
      .upload(cacheKey, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Cache upload failed:", uploadError);
    }

    // Return audio directly
    return new Response(new Uint8Array(audioBuffer), {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### 5E: `supabase/functions/deepgram-proxy/index.ts`

This is the WebSocket proxy for Deepgram streaming. **Note**: Supabase Edge Functions don't natively support WebSocket upgrades, so implement this as a streaming HTTP endpoint that the mobile app polls or use Server-Sent Events:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEEPGRAM_API_KEY = Deno.env.get("DEEPGRAM_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // This endpoint accepts audio chunks and returns transcription
    // For real-time, the mobile app sends audio in chunks via POST
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("audio") || contentType.includes("octet-stream")) {
      // Forward audio to Deepgram REST API for transcription
      const audioData = await req.arrayBuffer();

      const dgResponse = await fetch(
        "https://api.deepgram.com/v1/listen?" + new URLSearchParams({
          model: "nova-2",
          language: "en",
          smart_format: "true",
          diarize: "false",
          filler_words: "true",
          punctuate: "true",
          utterances: "true",
          utt_split: "0.8",
        }),
        {
          method: "POST",
          headers: {
            "Authorization": `Token ${DEEPGRAM_API_KEY}`,
            "Content-Type": "audio/webm",
          },
          body: audioData,
        }
      );

      if (!dgResponse.ok) {
        const errorText = await dgResponse.text();
        throw new Error(`Deepgram error ${dgResponse.status}: ${errorText}`);
      }

      const result = await dgResponse.json();

      // Extract transcript with word-level timestamps
      const alternatives = result.results?.channels?.[0]?.alternatives?.[0];
      if (!alternatives) {
        return new Response(
          JSON.stringify({ transcript: "", words: [], is_final: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          transcript: alternatives.transcript,
          confidence: alternatives.confidence,
          words: alternatives.words?.map((w: any) => ({
            word: w.word,
            start: w.start,
            end: w.end,
            confidence: w.confidence,
          })),
          is_final: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Send audio data with audio/* content type" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

---

## Step 6: Ensure Database Tables Match Requirements

Run this migration or verify the schema from EP1 includes all needed columns. If the `session_feedback` table doesn't have these columns, **add them via Supabase SQL editor or a migration**:

```sql
-- Ensure session_feedback has all needed columns
ALTER TABLE session_feedback ADD COLUMN IF NOT EXISTS filler_words_per_minute REAL;
ALTER TABLE session_feedback ADD COLUMN IF NOT EXISTS clarity_score INTEGER;
ALTER TABLE session_feedback ADD COLUMN IF NOT EXISTS coherence_score INTEGER;
ALTER TABLE session_feedback ADD COLUMN IF NOT EXISTS confidence_markers JSONB;
ALTER TABLE session_feedback ADD COLUMN IF NOT EXISTS qualitative_summary TEXT;
ALTER TABLE session_feedback ADD COLUMN IF NOT EXISTS strengths JSONB;
ALTER TABLE session_feedback ADD COLUMN IF NOT EXISTS improvements JSONB;
ALTER TABLE session_feedback ADD COLUMN IF NOT EXISTS highlighted_transcript JSONB;
ALTER TABLE session_feedback ADD COLUMN IF NOT EXISTS filler_word_details JSONB;

-- Ensure speaking_sessions has needed columns
ALTER TABLE speaking_sessions ADD COLUMN IF NOT EXISTS difficulty_level TEXT DEFAULT 'medium';
ALTER TABLE speaking_sessions ADD COLUMN IF NOT EXISTS duration_planned INTEGER;
ALTER TABLE speaking_sessions ADD COLUMN IF NOT EXISTS duration_actual INTEGER;
ALTER TABLE speaking_sessions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE speaking_sessions ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE speaking_sessions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE speaking_sessions ADD COLUMN IF NOT EXISTS transcript JSONB;
ALTER TABLE speaking_sessions ADD COLUMN IF NOT EXISTS interruptions JSONB;

-- Ensure scenarios table has all columns
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS pressure_tactics JSONB DEFAULT '[]';
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS persona_name TEXT;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS persona_description TEXT;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 5;

-- Ensure user_progress has needed columns
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS total_practice_minutes INTEGER DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS average_score INTEGER DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS best_score INTEGER DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;

-- Create tts-cache storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('tts-cache', 'tts-cache', true) ON CONFLICT (id) DO NOTHING;
```

Create a file `src/lib/migrations.ts` that checks and runs these via Supabase client if needed, or document them for manual execution.

---

## Step 7: Build Screen — Scenario Library

Create `src/app/(main)/scenarios/index.tsx`:

**Data Fetching:**
- On mount, fetch all scenarios from Supabase: `supabase.from('scenarios').select('*').order('created_at', { ascending: false })`
- Also fetch user's subscription status to determine lock/unlock
- Cache scenarios in SQLite for offline access

**UI Structure:**

1. **Search Bar** (top, sticky):
   - `TextInput` with search icon, placeholder "Search scenarios..."
   - Debounced search (300ms) filtering scenarios client-side by title, description, category
   - When focused, show recent searches from AsyncStorage (max 5, with clock icon and swipe-to-delete via `Swipeable` from react-native-gesture-handler)

2. **Category Filter Pills** (horizontal ScrollView below search):
   - "All" pill (selected by default) + one pill per category from `CATEGORY_META`
   - Each pill shows category icon (Feather icons) + label
   - Single select — tapping filters the list
   - Active pill has filled background with category color

3. **Difficulty Filter** (row of 3 tappable chips: "Beginner 1-2", "Intermediate 3", "Advanced 4-5"):
   - Multiple select allowed
   - Gray outline when inactive, filled when active

4. **Browse State** (when search is empty):
   - **"Free to Try" section**: Horizontal ScrollView of free scenario cards
   - **Category sections**: Each category as a section header with "See All >" link, followed by horizontal scroll of scenario cards in that category

5. **Search/Filter Results State**:
   - Vertical FlatList of scenario cards
   - Result count text: "X scenarios found"
   - Sort dropdown (top right): "Relevance", "Difficulty ↑", "Difficulty ↓", "Duration"

6. **Scenario Card Component** (`src/components/ScenarioCard.tsx`):
   - Card with subtle shadow, rounded corners (12px)
   - Category color accent bar on left edge (4px wide)
   - Title (bold, 16px)
   - Persona name in gray italic
   - Difficulty: row of 5 star icons (filled up to difficulty level)
   - Duration badge: clock icon + "X min"
   - Lock overlay for premium scenarios: semi-transparent dark overlay with lock icon and "Premium" badge
   - Tapping a free scenario → navigates to Scenario Detail
   - Tapping a locked scenario → shows bottom sheet with "Upgrade to Premium" CTA

7. **Empty State**: Illustration + "No scenarios match your filters" + "Clear Filters" button

8. **Loading State**: 6 skeleton cards (ShimmerPlaceholder or custom animated View)

**Navigation**: Tapping a scenario card navigates to `/(main)/scenarios/[id]` passing the scenario ID.

---

## Step 8: Build Screen — Scenario Detail & Setup

Create `src/app/(main)/scenarios/[id].tsx`:

**Data Fetching:**
- Fetch scenario by ID from Supabase (or read from SQLite cache)
- Fetch user's past sessions for this scenario: `supabase.from('speaking_sessions').select('*, session_feedback(*)').eq('scenario_id', id).eq('user_id', userId).order('created_at', { ascending: false }).limit(5)`

**UI Structure:**

1. **Collapsible Header** (Animated.ScrollView with interpolated header):
   - Gradient background using category color (from `CATEGORY_META`)
   - Persona avatar area (use initials in circle or AI-generated icon)
   - Scenario title in large white text
   - On scroll, collapses to compact header with just title

2. **Persona Card**:
   - Name: `scenario.persona_name`
   - Description: `scenario.persona_description`  
   - Subtle border, avatar on left

3. **About This Session** section:
   - Scenario description (full text)
   - "What to Expect" — render each pressure tactic as a chip/badge with warning-amber color
   - Estimated duration: `scenario.duration_minutes` min

4. **Difficulty Selector** (the key interactive element):
   - Three large tappable cards in a row: Easy / Medium / Hard
   - Each card shows:
     - Label and icon (shield for easy, sword for medium, fire for hard)
     - Brief description: 
       - Easy: "Gentle interruptions every 45-60s. Great for building confidence."
       - Medium: "Moderate pressure every 25-40s. Realistic interview pace."
       - Hard: "Relentless pressure every 15-25s. Trial by fire."
   - Default selection = scenario difficulty mapped to closest (1-2 → Easy, 3 → Medium, 4-5 → Hard)
   - Selected card has filled background + checkmark

5. **Past Performance** (if user has done this scenario before):
   - Mini chart showing last 5 session scores as dots connected by line
   - "Best Score: X" and "Last Score: Y"
   - "X sessions completed"

6. **"Begin Session" Button** (sticky bottom, full-width, category-colored):
   - Before tap: check microphone permission via `Audio.requestPermissionsAsync()`
   - If permission denied: show alert explaining why mic is needed with "Open Settings" button
   - If permission granted: show 3-2-1 countdown overlay (full screen, large numbers, with haptic feedback on each count via `expo-haptics`)
   - After countdown: navigate to `/(main)/session/live` with params: `{ scenarioId, difficulty, durationMinutes }`

7. **Pre-load TTS** (on mount):
   - Call `supabase.functions.invoke('tts-cache', { body: { text: "Let's begin. Tell me about yourself." } })` to warm the cache
   - Store common opening phrases locally

---

## Step 9: Build Screen — Live Pressure Session (THE CRITICAL SCREEN)

Create `src/app/(main)/session/live.tsx`:

This is the most complex screen. Build it with a modular architecture:

### 9A: Audio Recording Manager — `src/lib/audio-manager.ts`

```typescript
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export class AudioManager {
  private recording: Audio.Recording | null = null;
  private isRecording = false;
  private audioChunks: string[] = []; // URIs of chunk files
  private chunkInterval: ReturnType<typeof setInterval> | null = null;
  private onChunkReady: ((uri: string) => void) | null = null;

  async startRecording(onChunkReady: (uri: string) => void): Promise<void> {
    this.onChunkReady = onChunkReady;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });

    // Start continuous recording for the full session (saved locally)
    this.recording = new Audio.Recording();
    await this.recording.prepareToRecordAsync({
      android: {
        extension: '.m4a',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 128000,
      },
      ios: {
        extension: '.m4a',
        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 128000,
      },
      web: { mimeType: 'audio/webm', bitsPerSecond: 128000 },
    });

    await this.recording.startAsync();
    this.isRecording = true;

    // Send chunks every 2 seconds for transcription
    this.startChunkCapture();
  }

  private startChunkCapture(): void {
    // For Deepgram processing, we record overlapping 3-second chunks
    // We stop current recording, get URI, start new recording, send chunk
    this.chunkInterval = setInterval(async () => {
      if (!this.isRecording || !this.recording) return;

      try {
        const status = await this.recording.getStatusAsync();
        if (status.isRecording && status.durationMillis > 2000) {
          // Get the recording URI and notify
          // Note: expo-av doesn't support chunked streaming natively
          // So we use getStatusAsync to detect audio levels for silence detection
          // and send full audio periodically
          
          // For MVP: stop, get file, restart, send file to Deepgram
          await this.recording.stopAndUnloadAsync();
          const uri = this.recording.getURI();
          if (uri && this.onChunkReady) {
            this.audioChunks.push(uri);
            this.onChunkReady(uri);
          }

          // Start new recording immediately
          this.recording = new Audio.Recording();
          await this.recording.prepareToRecordAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
          );
          await this.recording.startAsync();
        }
      } catch (error) {
        console.error('Chunk capture error:', error);
      }
    }, 3000);
  }

  async stopRecording(): Promise<string | null> {
    this.isRecording = false;
    if (this.chunkInterval) {
      clearInterval(this.chunkInterval);
      this.chunkInterval = null;
    }

    if (this.recording) {
      try {
        const status = await this.recording.getStatusAsync();
        if (status.isRecording) {
          await this.recording.stopAndUnloadAsync();
        }
        const uri = this.recording.getURI();
        this.recording = null;
        return uri;
      } catch {
        this.recording = null;
        return null;
      }
    }
    return null;
  }

  async getMetering(): Promise<number> {
    if (!this.recording) return -160;
    try {
      const status = await this.recording.getStatusAsync();
      return status.metering ?? -160;
    } catch {
      return -160;
    }
  }

  getChunkURIs(): string[] {
    return [...this.audioChunks];
  }
}
```

### 9B: Transcription Service — `src/lib/transcription-service.ts`

```typescript
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';

export class TranscriptionService {
  private useWhisperFallback = false;
  private failureCount = 0;

  async transcribeChunk(audioUri: string): Promise<{
    transcript: string;
    words: { word: string; start: number; end: number; confidence: number }[];
    method: 'deepgram' | 'whisper';
  } | null> {
    if (this.useWhisperFallback) {
      return this.transcribeWithWhisper(audioUri);
    }

    try {
      // Read audio file as base64
      const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const { data, error } = await supabase.functions.invoke('deepgram-proxy', {
        body: bytes.buffer,
        headers: {
          'Content-Type': 'audio/m4a',
        },
      });

      if (error) throw error;
      if (!data?.transcript) return null;

      this.failureCount = 0; // Reset on success
      return {
        transcript: data.transcript,
        words: data.words || [],
        method: 'deepgram',
      };
    } catch (error) {
      console.error('Deepgram transcription failed:', error);
      this.failureCount++;

      // Switch to Whisper after 2 consecutive failures
      if (this.failureCount >= 2) {
        console.warn('Switching to Whisper fallback');
        this.useWhisperFallback = true;
        return this.transcribeWithWhisper(audioUri);
      }
      return null;
    }
  }

  private async transcribeWithWhisper(audioUri: string): Promise<{
    transcript: string;
    words: { word: string; start: number; end: number; confidence: number }[];
    method: 'whisper';
  } | null> {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'audio.m4a',
      } as any);
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');
      formData.append('timestamp_granularities[]', 'word');
      formData.append('language', 'en');

      // Call Whisper via a Supabase edge function to keep API key server-side
      // For MVP, we'll call OpenAI directly but this should be proxied
      const { data, error } = await supabase.functions.invoke('whisper-proxy', {
        body: formData,
      });

      if (error) throw error;

      return {
        transcript: data?.text || '',
        words: data?.words?.map((w: any) => ({
          word: w.word,
          start: w.start,
          end: w.end,
          confidence: 1.0,
        })) || [],
        method: 'whisper',
      };
    } catch (error) {
      console.error('Whisper transcription also failed:', error);
      return null;
    }
  }

  resetFallback(): void {
    this.useWh


# Execution Prompt 3 of 3 — Polish, Payments, Notifications & Production Readiness

You are continuing development of **Cognitize**, a React Native Expo app for pressure-based public speaking training. Prompts 1 and 2 have been executed. The project has:

- Expo Router file-based navigation with auth stack and main tab navigator (Home, Scenarios, Progress, Profile)
- Supabase Auth (email/password, Apple, Google), PostgreSQL schema with RLS, Edge Functions
- Local SQLite caching with expo-sqlite
- Scenario Library, Scenario Detail, Live Pressure Session (Deepgram streaming, GPT-4o interruptions, ElevenLabs TTS)
- Session Feedback screen with deterministic scoring
- All 5 edge functions deployed (start-session, generate-interruption, generate-feedback, tts-cache, deepgram-proxy)
- Sentry and PostHog initialized
- Profile screen with avatar upload, Settings screen with toggles

Your job is to build all remaining screens, integrate payments, implement notifications, add offline polish, and harden everything for App Store submission.

---

## PHASE 1: Database Migrations for New Features

### 1.1 Add new tables and columns

Create a new migration file at `supabase/migrations/003_polish_features.sql`:

```sql
-- Milestones / Badges table
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL, -- e.g., 'first_session', 'ten_sessions', 'perfect_score', 'week_streak_3'
  badge_label TEXT NOT NULL,
  badge_description TEXT,
  badge_icon TEXT, -- emoji or icon name
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_key)
);

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own milestones" ON public.milestones
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert milestones" ON public.milestones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscriptions table (synced from RevenueCat webhooks)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  revenuecat_customer_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free', -- 'free', 'monthly', 'annual'
  status TEXT NOT NULL DEFAULT 'inactive', -- 'active', 'trial', 'expired', 'paused', 'cancelled'
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  paused_until TIMESTAMPTZ,
  last_webhook_event TEXT,
  last_webhook_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);
-- Only edge functions with service role can write

-- Notifications table (in-app feed)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'practice_reminder', 'streak_alert', 'new_scenario', 'renewal_reminder', 'weekly_summary', 'milestone'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}', -- route info: { screen: 'session', params: { id: '...' } }
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = false;

-- Push tokens table
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  device_id TEXT,
  platform TEXT, -- 'ios', 'android'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, expo_push_token)
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own push tokens" ON public.push_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Weekly summaries materialized data
CREATE TABLE IF NOT EXISTS public.weekly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_sessions INT DEFAULT 0,
  total_minutes NUMERIC(10,2) DEFAULT 0,
  avg_filler_score NUMERIC(5,2),
  avg_pacing_score NUMERIC(5,2),
  avg_clarity_score NUMERIC(5,2),
  avg_coherence_score NUMERIC(5,2),
  avg_confidence_score NUMERIC(5,2),
  avg_overall_score NUMERIC(5,2),
  improvement_pct NUMERIC(5,2), -- vs previous week
  streak_days INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.weekly_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own weekly summaries" ON public.weekly_summaries
  FOR SELECT USING (auth.uid() = user_id);

-- Add is_premium flag to scenarios for gating
ALTER TABLE public.scenarios ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- Function to create subscription row on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'inactive')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_subscription') THEN
    CREATE TRIGGER on_auth_user_created_subscription
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();
  END IF;
END $$;
```

Run this migration against your Supabase project:
```bash
npx supabase db push
```

### 1.2 Update local SQLite schema

In your existing SQLite helper file (likely `src/lib/db/sqlite.ts` or similar), add tables for offline caching of notifications and subscription state:

```typescript
// Add to your existing SQLite initialization function
const OFFLINE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS local_subscription (
    user_id TEXT PRIMARY KEY,
    plan TEXT NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'inactive',
    current_period_end TEXT,
    cancel_at_period_end INTEGER DEFAULT 0,
    paused_until TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS local_notifications (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data TEXT DEFAULT '{}',
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS local_milestones (
    badge_key TEXT PRIMARY KEY,
    badge_label TEXT NOT NULL,
    badge_description TEXT,
    badge_icon TEXT,
    earned_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS offline_session_queue (
    id TEXT PRIMARY KEY,
    session_data TEXT NOT NULL,
    audio_path TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    retry_count INTEGER DEFAULT 0
  );
`;
```

---

## PHASE 2: Progress & History Screen

### 2.1 Install chart dependencies

```bash
npx expo install react-native-chart-kit react-native-svg
```

### 2.2 Create the data hooks

Create `src/hooks/useProgressData.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface SessionHistoryItem {
  id: string;
  scenario_name: string;
  scenario_category: string;
  duration_seconds: number;
  overall_score: number;
  filler_score: number;
  pacing_score: number;
  clarity_score: number;
  coherence_score: number;
  confidence_score: number;
  created_at: string;
}

export interface ScoreTrend {
  date: string;
  filler: number;
  pacing: number;
  clarity: number;
  coherence: number;
  confidence: number;
  overall: number;
}

export interface MilestoneBadge {
  badge_key: string;
  badge_label: string;
  badge_description: string;
  badge_icon: string;
  earned_at: string;
}

export interface WeeklySummary {
  week_start: string;
  week_end: string;
  total_sessions: number;
  total_minutes: number;
  avg_overall_score: number;
  improvement_pct: number;
  streak_days: number;
}

const PAGE_SIZE = 15;

export function useProgressData() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [trends, setTrends] = useState<ScoreTrend[]>([]);
  const [milestones, setMilestones] = useState<MilestoneBadge[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSessions = useCallback(async (cursor?: string) => {
    if (!user) return;
    
    let query = supabase
      .from('speaking_sessions')
      .select(`
        id,
        duration_seconds,
        created_at,
        scenarios!inner(name, category),
        session_feedback(
          overall_score,
          filler_word_score,
          pacing_score,
          clarity_score,
          coherence_score,
          confidence_score
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }

    const mapped: SessionHistoryItem[] = (data || []).map((s: any) => ({
      id: s.id,
      scenario_name: s.scenarios?.name || 'Unknown',
      scenario_category: s.scenarios?.category || '',
      duration_seconds: s.duration_seconds || 0,
      overall_score: s.session_feedback?.[0]?.overall_score || 0,
      filler_score: s.session_feedback?.[0]?.filler_word_score || 0,
      pacing_score: s.session_feedback?.[0]?.pacing_score || 0,
      clarity_score: s.session_feedback?.[0]?.clarity_score || 0,
      coherence_score: s.session_feedback?.[0]?.coherence_score || 0,
      confidence_score: s.session_feedback?.[0]?.confidence_score || 0,
      created_at: s.created_at,
    }));

    return mapped;
  }, [user]);

  const fetchTrends = useCallback(async () => {
    if (!user) return;

    // Fetch last 30 sessions for 7-day rolling average
    const { data, error } = await supabase
      .from('speaking_sessions')
      .select(`
        created_at,
        session_feedback(
          overall_score,
          filler_word_score,
          pacing_score,
          clarity_score,
          coherence_score,
          confidence_score
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(90);

    if (error || !data) return;

    // Group by date and compute 7-day rolling averages
    const dailyScores: Record<string, { scores: number[]; filler: number[]; pacing: number[]; clarity: number[]; coherence: number[]; confidence: number[] }> = {};

    data.forEach((s: any) => {
      const date = new Date(s.created_at).toISOString().split('T')[0];
      if (!dailyScores[date]) {
        dailyScores[date] = { scores: [], filler: [], pacing: [], clarity: [], coherence: [], confidence: [] };
      }
      const fb = s.session_feedback?.[0];
      if (fb) {
        dailyScores[date].scores.push(fb.overall_score || 0);
        dailyScores[date].filler.push(fb.filler_word_score || 0);
        dailyScores[date].pacing.push(fb.pacing_score || 0);
        dailyScores[date].clarity.push(fb.clarity_score || 0);
        dailyScores[date].coherence.push(fb.coherence_score || 0);
        dailyScores[date].confidence.push(fb.confidence_score || 0);
      }
    });

    const dates = Object.keys(dailyScores).sort();
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    // Compute 7-day rolling average
    const trendData: ScoreTrend[] = dates.map((date, i) => {
      const windowDates = dates.slice(Math.max(0, i - 6), i + 1);
      const windowScores = windowDates.flatMap(d => dailyScores[d].scores);
      const windowFiller = windowDates.flatMap(d => dailyScores[d].filler);
      const windowPacing = windowDates.flatMap(d => dailyScores[d].pacing);
      const windowClarity = windowDates.flatMap(d => dailyScores[d].clarity);
      const windowCoherence = windowDates.flatMap(d => dailyScores[d].coherence);
      const windowConfidence = windowDates.flatMap(d => dailyScores[d].confidence);

      return {
        date,
        overall: Math.round(avg(windowScores)),
        filler: Math.round(avg(windowFiller)),
        pacing: Math.round(avg(windowPacing)),
        clarity: Math.round(avg(windowClarity)),
        coherence: Math.round(avg(windowCoherence)),
        confidence: Math.round(avg(windowConfidence)),
      };
    });

    setTrends(trendData);
  }, [user]);

  const fetchMilestones = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('milestones')
      .select('*')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false });
    setMilestones(data || []);
  }, [user]);

  const fetchWeeklySummary = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(1)
      .single();
    setWeeklySummary(data);
  }, [user]);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    const [sessionData] = await Promise.all([
      fetchSessions(),
      fetchTrends(),
      fetchMilestones(),
      fetchWeeklySummary(),
    ]);
    setSessions(sessionData || []);
    setHasMore((sessionData || []).length === PAGE_SIZE);
    setLoading(false);
  }, [fetchSessions, fetchTrends, fetchMilestones, fetchWeeklySummary]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || sessions.length === 0) return;
    setLoadingMore(true);
    const lastSession = sessions[sessions.length - 1];
    const moreData = await fetchSessions(lastSession.created_at);
    if (moreData && moreData.length > 0) {
      setSessions(prev => [...prev, ...moreData]);
      setHasMore(moreData.length === PAGE_SIZE);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  }, [loadingMore, hasMore, sessions, fetchSessions]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const [sessionData] = await Promise.all([
      fetchSessions(),
      fetchTrends(),
      fetchMilestones(),
      fetchWeeklySummary(),
    ]);
    setSessions(sessionData || []);
    setHasMore((sessionData || []).length === PAGE_SIZE);
    setRefreshing(false);
  }, [fetchSessions, fetchTrends, fetchMilestones, fetchWeeklySummary]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  return {
    sessions,
    trends,
    milestones,
    weeklySummary,
    loading,
    loadingMore,
    hasMore,
    refreshing,
    loadMore,
    refresh,
  };
}
```

### 2.3 Create chart components

Create `src/components/progress/ScoreTrendChart.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { ScoreTrend } from '@/hooks/useProgressData';

const SCREEN_WIDTH = Dimensions.get('window').width;

const METRICS = [
  { key: 'overall', label: 'Overall', color: '#6C5CE7' },
  { key: 'filler', label: 'Filler Words', color: '#E17055' },
  { key: 'pacing', label: 'Pacing', color: '#00B894' },
  { key: 'clarity', label: 'Clarity', color: '#0984E3' },
  { key: 'coherence', label: 'Coherence', color: '#FDCB6E' },
  { key: 'confidence', label: 'Confidence', color: '#E84393' },
] as const;

type MetricKey = typeof METRICS[number]['key'];

interface Props {
  trends: ScoreTrend[];
}

export function ScoreTrendChart({ trends }: Props) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('overall');

  if (trends.length < 2) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Complete at least 2 sessions to see trends</Text>
      </View>
    );
  }

  const metric = METRICS.find(m => m.key === selectedMetric)!;
  const dataPoints = trends.map(t => t[selectedMetric]);
  const labels = trends.map(t => {
    const d = new Date(t.date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });

  // Show max 10 labels to avoid crowding
  const step = Math.max(1, Math.floor(labels.length / 10));
  const displayLabels = labels.map((l, i) => i % step === 0 ? l : '');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Score Trends (7-day avg)</Text>
      
      <View style={styles.metricPills}>
        {METRICS.map(m => (
          <TouchableOpacity
            key={m.key}
            style={[
              styles.pill,
              selectedMetric === m.key && { backgroundColor: m.color },
            ]}
            onPress={() => setSelectedMetric(m.key)}
          >
            <Text style={[
              styles.pillText,
              selectedMetric === m.key && styles.pillTextActive,
            ]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <LineChart
        data={{
          labels: displayLabels,
          datasets: [{ data: dataPoints, color: () => metric.color, strokeWidth: 2 }],
        }}
        width={SCREEN_WIDTH - 32}
        height={220}
        chartConfig={{
          backgroundColor: '#1a1a2e',
          backgroundGradientFrom: '#1a1a2e',
          backgroundGradientTo: '#16213e',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: metric.color,
          },
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: 'rgba(255,255,255,0.1)',
          },
        }}
        bezier
        style={styles.chart}
        fromZero
        yAxisSuffix=""
        yAxisInterval={1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  metricPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  pillText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#fff',
  },
  chart: {
    borderRadius: 12,
    marginLeft: -8,
  },
  emptyContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
  },
});
```

Create `src/components/progress/WeeklySummaryCard.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WeeklySummary } from '@/hooks/useProgressData';

interface Props {
  summary: WeeklySummary;
}

export function WeeklySummaryCard({ summary }: Props) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const improvementColor = summary.improvement_pct >= 0 ? '#00B894' : '#E17055';
  const improvementSign = summary.improvement_pct >= 0 ? '+' : '';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Weekly Summary</Text>
        <Text style={styles.dateRange}>
          {formatDate(summary.week_start)} – {formatDate(summary.week_end)}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{summary.total_sessions}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{Math.round(summary.total_minutes)}</Text>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: improvementColor }]}>
            {improvementSign}{summary.improvement_pct?.toFixed(1) || 0}%
          </Text>
          <Text style={styles.statLabel}>vs Last Week</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>🔥 {summary.streak_days}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      {summary.avg_overall_score && (
        <View style={styles.scoreBar}>
          <Text style={styles.scoreLabel}>Avg Score</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${summary.avg_overall_score}%` }]} />
          </View>
          <Text style={styles.scoreValue}>{Math.round(summary.avg_overall_score)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dateRange: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  stat: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 4 },
  scoreBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, width: 60 },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
  },
  barFill: {
    height: 8,
    backgroundColor: '#6C5CE7',
    borderRadius: 4,
  },
  scoreValue: { color: '#fff', fontSize: 14, fontWeight: '700', width: 30, textAlign: 'right' },
});
```

Create `src/components/progress/MilestoneBadges.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MilestoneBadge } from '@/hooks/useProgressData';

// Define all possible badges with their unlock criteria descriptions
const ALL_BADGES = [
  { key: 'first_session', icon: '🎤', label: 'First Step', description: 'Complete your first session' },
  { key: 'five_sessions', icon: '⭐', label: 'Getting Warmed Up', description: 'Complete 5 sessions' },
  { key: 'ten_sessions', icon: '🔥', label: 'On Fire', description: 'Complete 10 sessions' },
  { key: 'twenty_five_sessions', icon: '💎', label: 'Diamond Speaker', description: 'Complete 25 sessions' },
  { key: 'fifty_sessions', icon: '👑', label: 'Royalty', description: 'Complete 50 sessions' },
  { key: 'perfect_score', icon: '💯', label: 'Perfect Score', description: 'Score 100 in any metric' },
  { key: 'no_fillers', icon: '🎯', label: 'Clean Speech', description: 'Complete a session with zero filler words' },
  { key: 'streak_3', icon: '🔥', label: '3-Day Streak', description: 'Practice 3 days in a row' },
  { key: 'streak_7', icon: '⚡', label: '7-Day Streak', description: 'Practice 7 days in a row' },
  { key: 'streak_30', icon: '🏆', label: 'Monthly Master', description: 'Practice 30 days in a row' },
  { key: 'five_minute_session', icon: '⏱️', label: 'Endurance', description: 'Complete a 5+ minute session' },
  { key: 'improvement_10', icon: '📈', label: 'Rising Star', description: 'Improve overall score by 10+ points' },
];

interface Props {
  earned: MilestoneBadge[];
}

export function MilestoneBadges({ earned }: Props) {
  const earnedKeys = new Set(earned.map(m => m.badge_key));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        🏅 Milestones ({earned.length}/{ALL_BADGES.length})
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {ALL_BADGES.map(badge => {
          const isEarned = earnedKeys.has(badge.key);
          return (
            <View key={badge.key} style={[styles.badge, !isEarned && styles.badgeLocked]}>
              <Text style={[styles.badgeIcon, !isEarned && styles.iconLocked]}>
                {isEarned ? badge.icon : '🔒'}
              </Text>
              <Text style={[styles.badgeLabel, !isEarned && styles.labelLocked]} numberOfLines={1}>
                {badge.label}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  scrollContent: { gap: 12, paddingRight: 16 },
  badge: {
    width: 80,
    height: 90,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(108,92,231,0.3)',
  },
  badgeLocked: {
    opacity: 0.4,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  badgeIcon: { fontSize: 28, marginBottom: 6 },
  iconLocked: { opacity: 0.5 },
  badgeLabel: { color: '#fff', fontSize: 10, fontWeight: '600', textAlign: 'center' },
  labelLocked: { color: 'rgba(255,255,255,0.4)' },
});
```

Create `src/components/progress/SessionHistoryItem.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SessionHistoryItem as SessionType } from '@/hooks/useProgressData';

interface Props {
  session: SessionType;
}

export function SessionHistoryCard({ session }: Props) {
  const router = useRouter();

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) return `${Math.round(diffMs / (1000 * 60))}m ago`;
    if (diffHours < 24) return `${Math.round(diffHours)}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return '#00B894';
    if (score >= 60) return '#FDCB6E';
    return '#E17055';
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push(`/session-feedback/${session.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <View style={[styles.scoreBadge, { backgroundColor: scoreColor(session.overall_score) + '20' }]}>
          <Text style={[styles.scoreText, { color: scoreColor(session.overall_score) }]}>
            {session.overall_score}
          </Text>
        </View>
      </View>

      <View style={styles.middleSection}>
        <Text style={styles.scenarioName} numberOfLines={1}>{session.scenario_name}</Text>
        <Text style={styles.meta}>
          {formatDuration(session.duration_seconds)} • {session.scenario_category}
        </Text>
        <View style={styles.miniScores}>
          <Text style={styles.miniScore}>🗣️ {session.filler_score}</Text>
          <Text style={styles.miniScore}>⏱️ {session.pacing_score}</Text>
          <Text style={styles.miniScore}>💡 {session.clarity_score}</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text style={styles.timestamp}>{formatDate(session.created_at)}</Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  leftSection: { marginRight: 12 },
  scoreBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: { fontSize: 18, fontWeight: '800' },
  middleSection: { flex: 1 },
  scenarioName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  meta: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },
  miniScores: { flexDirection: 'row', gap: 12, marginTop: 4 },
  miniScore: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  rightSection: { alignItems: 'flex-end', marginLeft: 8 },
  timestamp: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  chevron: { color: 'rgba(255,255,255,0.3)', fontSize: 24, marginTop: 4 },
});
```

Create `src/components/progress/SkeletonCard.tsx`:

```typescript
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.circle} />
      <View style={styles.lines}>
        <View style={[styles.line, { width: '60%' }]} />
        <View style={[styles.line, { width: '40%' }]} />
        <View style={[styles.line, { width: '30%' }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: 12,
  },
  lines: { flex: 1, gap: 6 },
  line: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
  },
});
```

### 2.4 Build the Progress & History screen

Create `src/app/(tabs)/progress.tsx`:

```typescript
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePostHog } from 'posthog-react-native';
import { useProgressData } from '@/hooks/useProgressData';
import { ScoreTrendChart } from '@/components/progress/ScoreTrendChart';
import { WeeklySummaryCard } from '@/components/progress/WeeklySummaryCard';
import { MilestoneBadges } from '@/components/progress/MilestoneBadges';
import { SessionHistoryCard } from '@/components/progress/SessionHistoryItem';
import { SkeletonCard } from '@/components/progress/SkeletonCard';

export default function ProgressScreen() {
  const posthog = usePostHog();
  const {
    sessions,
    trends,
    milestones,
    weeklySummary,
    loading,
    loadingMore,
    hasMore,
    refreshing,
    loadMore,
    refresh,
  } = useProgressData();

  React.useEffect(() => {
    posthog?.capture('progress_screen_viewed');
  }, []);

  const renderHeader = () => (
    <View>
      {/* Weekly Summary */}
      {weeklySummary && <WeeklySummaryCard summary={weeklySummary} />}

      {/* Score Trends Chart */}
      <ScoreTrendChart trends={trends} />

      {/* Milestone Badges */}
      <MilestoneBadges earned={milestones} />

      {/* Session History Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Session History</Text>
        <Text style={styles.sessionCount}>{sessions.length} sessions</Text>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🎤</Text>
        <Text style={styles.emptyTitle}>No sessions yet</Text>
        <Text style={styles.emptySubtitle}>
          Complete your first pressure simulation to start tracking progress
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator color="#6C5CE7" />
        </View>
      );
    }
    if (!hasMore && sessions.length > 0) {
      return (
        <View style={styles.footer}>
          <Text style={styles.footerText}>✅ You're all caught up</Text>
        </View>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <Text style={styles.screenTitle}>Progress</Text>
        <View style={styles.skeletons}>
          {/* Chart skeleton */}
          <View style={styles.chartSkeleton} />
          {[1, 2, 3, 4, 5].map(i => (
            <SkeletonCard key={i} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.screenTitle}>Progress</Text>
      <FlatList
        data={sessions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <SessionHistoryCard session={item} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#6C5CE7"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.2}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  screenTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  sessionCount: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  skeletons: {
    paddingHorizontal: 16,
  },
  chartSkeleton: {
    height: 280,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    marginBottom: 16,
  },
});
```

### 2.5 Create milestone checking edge function

Create `supabase/functions/check-milestones/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization')!;
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) throw new Error('Unauthorized');

    const userId = user.id;

    // Get existing milestones
    const { data: existing } =
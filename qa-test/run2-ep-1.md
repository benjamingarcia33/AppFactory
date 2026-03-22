

# Cognitize — Execution Prompt 1: Foundation

## Overview
Build the complete foundation for Cognitize, an AI-powered speech coaching app. This prompt covers project setup, database schema, authentication, onboarding, dashboard, profile, and settings screens. Use React Native with Expo SDK 51, expo-router for file-based navigation, Supabase for auth/database/storage, and TypeScript throughout.

---

## Step 1: Project Initialization

```bash
npx create-expo-app cognitize --template blank-typescript
cd cognitize
```

Install all required dependencies:

```bash
# Core navigation and routing
npx expo install expo-router expo-linking expo-constants expo-status-bar react-native-safe-area-context react-native-screens react-native-gesture-handler react-native-reanimated

# Supabase
npm install @supabase/supabase-js react-native-url-polyfill

# Auth
npx expo install expo-auth-session expo-crypto expo-web-browser expo-apple-authentication expo-secure-store expo-local-authentication

# Storage and async
npx expo install @react-native-async-storage/async-storage expo-image-picker expo-file-system expo-image

# Local database
npx expo install expo-sqlite

# Notifications
npx expo install expo-notifications expo-device

# Analytics and monitoring
npm install posthog-react-native @sentry/react-native

# UI utilities
npx expo install expo-linear-gradient expo-haptics expo-blur

# Updates
npx expo install expo-updates

# NativeWind (Tailwind for RN)
npm install nativewind tailwindcss@3.3.2
npx expo install react-native-css-interop

# Additional utilities
npm install zustand react-native-toast-message zod date-fns
```

---

## Step 2: Configure app.json

Replace `app.json` entirely with:

```json
{
  "expo": {
    "name": "Cognitize",
    "slug": "cognitize",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "scheme": "cognitize",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0F172A"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.cognitize.app",
      "infoPlist": {
        "NSMicrophoneUsageDescription": "Cognitize needs microphone access to record your speaking sessions for AI coaching feedback.",
        "NSCameraUsageDescription": "Cognitize uses camera access to let you take a profile photo."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0F172A"
      },
      "package": "com.cognitize.app"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      "expo-apple-authentication",
      "expo-notifications",
      [
        "@sentry/react-native/expo",
        {
          "organization": "cognitize",
          "project": "cognitize-mobile"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Cognitize needs photo access to set your profile picture."
        }
      ],
      [
        "expo-local-authentication",
        {
          "faceIDPermission": "Allow Cognitize to use Face ID for quick login."
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "router": {
        "origin": false
      },
      "eas": {
        "projectId": "your-eas-project-id"
      }
    },
    "updates": {
      "url": "https://u.expo.dev/your-eas-project-id"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

---

## Step 3: Configure Tailwind / NativeWind

Create `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#0F172A',
        },
        card: {
          light: '#F8FAFC',
          dark: '#1E293B',
        },
        muted: {
          light: '#64748B',
          dark: '#94A3B8',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['System'],
        mono: ['SpaceMono'],
      },
    },
  },
  plugins: [],
};
```

Create `global.css` at the project root:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Create `nativewind-env.d.ts` at the project root:

```ts
/// <reference types="nativewind/types" />
```

Create `metro.config.js`:

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

Update `tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts",
    "nativewind-env.d.ts"
  ]
}
```

Create `babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      "react-native-reanimated/plugin",
    ],
  };
};
```

---

## Step 4: Environment Variables

Create `.env.local`:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_POSTHOG_API_KEY=your_posthog_key
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_web_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_google_ios_client_id
```

Create `.env.local.example` with the same keys but placeholder values.

Add `.env.local` to `.gitignore`.

---

## Step 5: Project Structure

Create the following directory structure:

```
cognitize/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── forgot-password.tsx
│   ├── (onboarding)/
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   ├── (main)/
│   │   ├── _layout.tsx
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx          // Home Dashboard
│   │   │   ├── scenarios.tsx      // Scenario Library (placeholder for EP2)
│   │   │   ├── progress.tsx       // Progress & History (placeholder for EP3)
│   │   │   └── profile.tsx        // Profile & Preferences
│   │   └── settings.tsx           // Settings modal
├── src/
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── sqlite.ts
│   │   ├── sentry.ts
│   │   ├── posthog.ts
│   │   └── constants.ts
│   ├── providers/
│   │   ├── AuthProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── ToastProvider.tsx
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── userStore.ts
│   │   └── settingsStore.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useSession.ts
│   │   ├── useTheme.ts
│   │   ├── useSQLite.ts
│   │   ├── useSupabaseQuery.ts
│   │   └── useNotifications.ts
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── ToggleSwitch.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── ProgressRing.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Divider.tsx
│   │   │   ├── BottomSheet.tsx
│   │   │   └── ConfirmDialog.tsx
│   │   ├── auth/
│   │   │   ├── OAuthButtons.tsx
│   │   │   └── PasswordStrengthMeter.tsx
│   │   ├── onboarding/
│   │   │   ├── GoalStep.tsx
│   │   │   ├── LevelStep.tsx
│   │   │   ├── BaselineStep.tsx
│   │   │   └── ResultsStep.tsx
│   │   ├── dashboard/
│   │   │   ├── MetricCard.tsx
│   │   │   ├── SessionCard.tsx
│   │   │   ├── ScenarioPreviewCard.tsx
│   │   │   ├── QuickStartButton.tsx
│   │   │   └── PremiumBanner.tsx
│   │   ├── profile/
│   │   │   ├── ProfileHeader.tsx
│   │   │   ├── StatsRow.tsx
│   │   │   └── AvatarPicker.tsx
│   │   ├── settings/
│   │   │   ├── SettingsSection.tsx
│   │   │   ├── SettingsRow.tsx
│   │   │   └── MicTestWidget.tsx
│   │   └── shared/
│   │       ├── ErrorBoundary.tsx
│   │       ├── LoadingScreen.tsx
│   │       └── EmptyState.tsx
│   ├── types/
│   │   ├── database.ts
│   │   ├── auth.ts
│   │   └── app.ts
│   └── utils/
│       ├── validation.ts
│       ├── formatting.ts
│       └── haptics.ts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── assets/
│   ├── icon.png
│   ├── splash.png
│   ├── adaptive-icon.png
│   └── images/
│       ├── onboarding-goal.png
│       ├── onboarding-level.png
│       ├── onboarding-baseline.png
│       └── empty-sessions.png
├── global.css
├── tailwind.config.js
├── metro.config.js
├── babel.config.js
├── nativewind-env.d.ts
├── .env.local
├── .env.local.example
└── .gitignore
```

Create placeholder image files in `assets/images/` — use empty PNG files for now. The app should handle missing images gracefully.

---

## Step 6: Database Schema (Supabase PostgreSQL)

Create the file `supabase/migrations/001_initial_schema.sql` with the following complete SQL. This must be run in the Supabase SQL editor or via Supabase CLI `supabase db push`.

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_path TEXT, -- Supabase Storage object path, NOT full URL
  speaking_goal TEXT CHECK (speaking_goal IN ('interviews', 'presentations', 'debates', 'general_confidence')),
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  baseline_wpm REAL,
  baseline_filler_count INTEGER,
  baseline_clarity_score REAL,
  daily_reminder_enabled BOOLEAN DEFAULT TRUE,
  daily_reminder_time TIME DEFAULT '09:00:00',
  weekly_summary_enabled BOOLEAN DEFAULT TRUE,
  renewal_reminder_enabled BOOLEAN DEFAULT TRUE,
  new_content_enabled BOOLEAN DEFAULT TRUE,
  ai_voice_speed REAL DEFAULT 1.0 CHECK (ai_voice_speed >= 0.5 AND ai_voice_speed <= 2.0),
  cloud_sync_enabled BOOLEAN DEFAULT TRUE,
  analytics_opt_in BOOLEAN DEFAULT TRUE,
  theme_preference TEXT CHECK (theme_preference IN ('light', 'dark', 'system')) DEFAULT 'system',
  expo_push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- SCENARIOS TABLE
-- ============================================
CREATE TABLE public.scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('interview', 'pitch', 'presentation', 'debate', 'difficult_conversation', 'impromptu')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  is_premium BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  estimated_duration_minutes INTEGER DEFAULT 5,
  system_prompt TEXT NOT NULL, -- The AI persona/context prompt
  opening_line TEXT NOT NULL, -- What the AI says to start the session
  pressure_tactics JSONB DEFAULT '[]'::JSONB, -- Array of tactic types used in this scenario
  tags TEXT[] DEFAULT '{}',
  icon_name TEXT DEFAULT 'mic', -- Expo vector icon name
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scenarios are readable by all authenticated users (catalog)
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active scenarios"
  ON public.scenarios FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- ============================================
-- SPEAKING_SESSIONS TABLE
-- ============================================
CREATE TABLE public.speaking_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'abandoned')) DEFAULT 'in_progress',
  difficulty_setting TEXT CHECK (difficulty_setting IN ('easy', 'medium', 'hard', 'adaptive')),
  duration_seconds INTEGER,
  transcript JSONB, -- Full transcript with timestamps and speaker labels
  audio_path TEXT, -- Supabase Storage path for recording
  interruption_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.speaking_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON public.speaking_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON public.speaking_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.speaking_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON public.speaking_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Index for efficient querying
CREATE INDEX idx_sessions_user_id ON public.speaking_sessions(user_id);
CREATE INDEX idx_sessions_user_completed ON public.speaking_sessions(user_id, completed_at DESC);
CREATE INDEX idx_sessions_status ON public.speaking_sessions(status);

-- ============================================
-- SESSION_FEEDBACK TABLE
-- ============================================
CREATE TABLE public.session_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.speaking_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Deterministic scores (calculated from transcript)
  filler_word_count INTEGER DEFAULT 0,
  filler_words_detail JSONB DEFAULT '{}', -- {"um": 5, "uh": 3, "like": 7}
  words_per_minute REAL,
  pace_variability REAL, -- Standard deviation of WPM across segments
  total_word_count INTEGER DEFAULT 0,
  silence_percentage REAL, -- Percentage of session spent in silence
  longest_pause_seconds REAL,
  
  -- AI-generated scores (from GPT-4o analysis)
  clarity_score REAL CHECK (clarity_score >= 0 AND clarity_score <= 100),
  coherence_score REAL CHECK (coherence_score >= 0 AND coherence_score <= 100),
  confidence_score REAL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  pressure_handling_score REAL CHECK (pressure_handling_score >= 0 AND pressure_handling_score <= 100),
  overall_score REAL CHECK (overall_score >= 0 AND overall_score <= 100),
  
  -- Qualitative feedback
  ai_summary TEXT, -- GPT-4o generated plain-language feedback
  strengths JSONB DEFAULT '[]', -- Array of strength descriptions
  improvements JSONB DEFAULT '[]', -- Array of improvement suggestions
  highlighted_moments JSONB DEFAULT '[]', -- [{timestamp, type, description}]
  
  -- Scoring methodology transparency
  score_explanation JSONB DEFAULT '{}', -- How each score was calculated
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.session_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback"
  ON public.session_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON public.session_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_feedback_session_id ON public.session_feedback(session_id);
CREATE INDEX idx_feedback_user_id ON public.session_feedback(user_id);
CREATE INDEX idx_feedback_user_created ON public.session_feedback(user_id, created_at DESC);

-- ============================================
-- USER_PROGRESS TABLE
-- ============================================
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Streak tracking
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_session_date DATE,
  
  -- Cumulative stats
  total_sessions INTEGER DEFAULT 0,
  total_practice_minutes INTEGER DEFAULT 0,
  total_words_spoken INTEGER DEFAULT 0,
  
  -- Rolling averages (last 10 sessions)
  avg_overall_score REAL,
  avg_wpm REAL,
  avg_filler_rate REAL, -- Fillers per 100 words
  avg_clarity REAL,
  avg_coherence REAL,
  avg_confidence REAL,
  avg_pressure_handling REAL,
  
  -- Improvement tracking
  score_trend REAL, -- Positive = improving, calculated as slope of last 10 scores
  
  -- Unlocked scenarios (beyond default free ones)
  unlocked_scenario_ids UUID[] DEFAULT '{}',
  
  -- Milestones/badges achieved
  badges JSONB DEFAULT '[]', -- [{id, name, earned_at, description}]
  
  -- Weekly aggregates for history
  weekly_stats JSONB DEFAULT '[]', -- [{week_start, sessions, avg_score, minutes}]
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_progress_user_id ON public.user_progress(user_id);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  revenuecat_customer_id TEXT,
  plan_type TEXT CHECK (plan_type IN ('free', 'monthly', 'annual')) DEFAULT 'free',
  status TEXT CHECK (status IN ('active', 'paused', 'cancelled', 'expired', 'trial')) DEFAULT 'free',
  trial_start_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  paused_at TIMESTAMPTZ,
  renewal_reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE UNIQUE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);

-- ============================================
-- FUNCTION: Auto-create user profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  
  INSERT INTO public.user_progress (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.subscriptions (user_id, plan_type, status)
  VALUES (NEW.id, 'free', 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCTION: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_scenarios_updated_at
  BEFORE UPDATE ON public.scenarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- SEED: Default Free Scenarios
-- ============================================
INSERT INTO public.scenarios (title, description, category, difficulty, is_premium, system_prompt, opening_line, pressure_tactics, tags, icon_name, sort_order) VALUES
(
  'Job Interview: Tell Me About Yourself',
  'Practice the most common interview opener with an interviewer who digs deeper and challenges vague answers.',
  'interview',
  'beginner',
  FALSE,
  'You are a thorough but fair job interviewer. Your goal is to understand the candidate deeply. When they give vague or rehearsed-sounding answers, interrupt and ask for specific examples. If they pause too long, move to a harder question. Be professional but direct. Challenge weak points in their narrative. Ask "why" at least twice. If they use buzzwords without substance, call it out politely.',
  'Welcome. Let''s start with a classic — tell me about yourself. And I mean the real you, not the rehearsed version.',
  '["interrupt_on_vagueness", "ask_why_twice", "topic_pivot", "time_pressure"]',
  '{interview, beginner, common}',
  'briefcase',
  1
),
(
  'Impromptu Speech: Random Topic',
  'You''ll be given a random topic and 10 seconds to prepare. Then speak for 2 minutes while being challenged.',
  'impromptu',
  'beginner',
  FALSE,
  'You are a speech coach running an impromptu speaking drill. Give the user a random interesting topic (not controversial). After they start speaking, wait 30 seconds then interrupt with a challenging question about what they said. If they contradict themselves, point it out. If they go off topic, redirect them. Be encouraging but firm. At the 90-second mark, throw a curveball question that forces them to think on their feet.',
  'Here''s your topic: "The most underrated skill in modern life." You have 10 seconds to think... and go.',
  '["timed_pressure", "contradiction_callout", "topic_redirect", "curveball_question"]',
  '{impromptu, beginner, general}',
  'zap',
  2
),
(
  'Difficult Conversation: Asking for a Raise',
  'Practice negotiating a raise with a skeptical manager who pushes back on your reasoning.',
  'difficult_conversation',
  'intermediate',
  FALSE,
  'You are a busy, budget-conscious manager. The employee has asked to discuss compensation. You are not hostile but you are skeptical and need strong justification. Push back on subjective claims ("I work hard" — everyone does). Ask for specific metrics and examples. Mention budget constraints. If they get emotional, stay calm and redirect to facts. Interrupt if they ramble. Test their resolve by initially offering less than they want.',
  'You wanted to talk about your compensation. I have about 10 minutes. What''s on your mind?',
  '["skeptical_pushback", "interrupt_on_rambling", "emotional_pressure", "counter_offer"]',
  '{negotiation, intermediate, workplace}',
  'dollar-sign',
  3
),
(
  'Elevator Pitch: Your Big Idea',
  'Pitch your idea in 60 seconds to a distracted investor who interrupts with tough questions.',
  'pitch',
  'intermediate',
  FALSE,
  'You are a busy venture capitalist hearing pitches all day. You are distracted and impatient. Interrupt after 15 seconds if they haven''t gotten to the point. Ask about market size, competition, and revenue model. Be somewhat dismissive to test their conviction. If they can''t clearly explain the problem they solve in one sentence, challenge them on it. Give them one chance to recover if they fumble.',
  'You have 60 seconds. I have a call in 2 minutes. Go.',
  '["time_pressure", "interrupt_early", "dismissive_challenge", "rapid_fire_questions"]',
  '{pitch, intermediate, startup}',
  'trending-up',
  4
),
(
  'Classroom Presentation Q&A',
  'Present a topic and handle aggressive questions from classmates who want to poke holes in your argument.',
  'presentation',
  'beginner',
  FALSE,
  'You are a smart, slightly competitive classmate asking questions after a presentation. Ask clarifying questions first, then challenge the weakest point in their argument. If their data is vague, ask for sources. If they say "I think" too much, ask them to commit to a position. Be respectful but intellectually aggressive. If they handle questions well, escalate difficulty.',
  'Nice presentation. I have a few questions. First — what''s the strongest piece of evidence supporting your main argument?',
  '["evidence_challenge", "position_commitment", "escalating_difficulty", "source_request"]',
  '{presentation, beginner, academic}',
  'book-open',
  5
),
(
  'Hostile Q&A: Defending Your Decision',
  'Face rapid-fire hostile questions from a board room that disagrees with your strategic decision.',
  'debate',
  'advanced',
  TRUE,
  'You are a hostile board member who fundamentally disagrees with the presenter''s strategic decision. Interrupt frequently. Ask loaded questions. Challenge assumptions aggressively. Use phrases like "With all due respect..." before pointed critiques. Bring up risks they haven''t mentioned. Question their data, their timeline, and their judgment. If they stay calm and provide evidence, gradually become more reasonable. If they crumble, push harder.',
  'Before you start — I want you to know I''ve read your proposal and I have serious concerns. Convince me I''m wrong.',
  '["frequent_interruption", "loaded_questions", "assumption_challenge", "credibility_test", "emotional_provocation"]',
  '{debate, advanced, leadership}',
  'shield',
  6
);

-- ============================================
-- STORAGE BUCKETS (run in Supabase dashboard SQL editor)
-- ============================================
-- Note: Storage bucket creation is typically done via the Supabase dashboard or management API.
-- These INSERT statements work if you have access to the storage schema.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', TRUE, 5242880, '{image/jpeg,image/png,image/webp}'),
  ('session-recordings', 'session-recordings', FALSE, 104857600, '{audio/m4a,audio/wav,audio/mp4}'),
  ('tts-cache', 'tts-cache', TRUE, 10485760, '{audio/mpeg,audio/mp3}')
ON CONFLICT (id) DO NOTHING;

-- Avatar storage policies
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

-- Session recording storage policies
CREATE POLICY "Users can upload own recordings"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'session-recordings' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "Users can view own recordings"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'session-recordings' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "Users can delete own recordings"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'session-recordings' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

-- TTS cache is public read
CREATE POLICY "Anyone can view tts cache"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'tts-cache');
```

---

## Step 7: Core Library Files

### `src/lib/supabase.ts`

```typescript
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### `src/lib/sqlite.ts`

```typescript
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('cognitize.db');
  await initializeDatabase(db);
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS cached_user (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      display_name TEXT,
      avatar_path TEXT,
      speaking_goal TEXT,
      skill_level TEXT DEFAULT 'beginner',
      onboarding_completed INTEGER DEFAULT 0,
      baseline_wpm REAL,
      baseline_filler_count INTEGER,
      baseline_clarity_score REAL,
      theme_preference TEXT DEFAULT 'system',
      daily_reminder_enabled INTEGER DEFAULT 1,
      daily_reminder_time TEXT DEFAULT '09:00',
      weekly_summary_enabled INTEGER DEFAULT 1,
      renewal_reminder_enabled INTEGER DEFAULT 1,
      new_content_enabled INTEGER DEFAULT 1,
      ai_voice_speed REAL DEFAULT 1.0,
      cloud_sync_enabled INTEGER DEFAULT 1,
      analytics_opt_in INTEGER DEFAULT 1,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cached_sessions (
      id TEXT PRIMARY KEY,
      scenario_id TEXT,
      scenario_title TEXT,
      status TEXT DEFAULT 'in_progress',
      difficulty_setting TEXT,
      duration_seconds INTEGER,
      overall_score REAL,
      filler_word_count INTEGER,
      words_per_minute REAL,
      interruption_count INTEGER DEFAULT 0,
      started_at TEXT,
      completed_at TEXT,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cached_progress (
      user_id TEXT PRIMARY KEY,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      total_sessions INTEGER DEFAULT 0,
      total_practice_minutes INTEGER DEFAULT 0,
      avg_overall_score REAL,
      avg_wpm REAL,
      avg_filler_rate REAL,
      score_trend REAL,
      badges TEXT DEFAULT '[]',
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cached_scenarios (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      is_premium INTEGER DEFAULT 0,
      estimated_duration_minutes INTEGER DEFAULT 5,
      icon_name TEXT DEFAULT 'mic',
      tags TEXT DEFAULT '[]',
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS pending_sync (
      id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      operation TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

export async function cacheUser(user: {
  id: string;
  email: string;
  display_name?: string | null;
  avatar_path?: string | null;
  speaking_goal?: string | null;
  skill_level?: string | null;
  onboarding_completed?: boolean;
  theme_preference?: string | null;
  daily_reminder_enabled?: boolean;
  daily_reminder_time?: string | null;
  weekly_summary_enabled?: boolean;
  renewal_reminder_enabled?: boolean;
  new_content_enabled?: boolean;
  ai_voice_speed?: number;
  cloud_sync_enabled?: boolean;
  analytics_opt_in?: boolean;
}): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO cached_user (
      id, email, display_name, avatar_path, speaking_goal, skill_level,
      onboarding_completed, theme_preference, daily_reminder_enabled,
      daily_reminder_time, weekly_summary_enabled, renewal_reminder_enabled,
      new_content_enabled, ai_voice_speed, cloud_sync_enabled, analytics_opt_in, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      user.id,
      user.email,
      user.display_name ?? null,
      user.avatar_path ?? null,
      user.speaking_goal ?? null,
      user.skill_level ?? 'beginner',
      user.onboarding_completed ? 1 : 0,
      user.theme_preference ?? 'system',
      user.daily_reminder_enabled !== false ? 1 : 0,
      user.daily_reminder_time ?? '09:00',
      user.weekly_summary_enabled !== false ? 1 : 0,
      user.renewal_reminder_enabled !== false ? 1 : 0,
      user.new_content_enabled !== false ? 1 : 0,
      user.ai_voice_speed ?? 1.0,
      user.cloud_sync_enabled !== false ? 1 : 0,
      user.analytics_opt_in !== false ? 1 : 0,
    ]
  );
}

export async function getCachedUser(id: string): Promise<any | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync('SELECT * FROM cached_user WHERE id = ?', [id]);
  return result;
}

export async function cacheScenarios(scenarios: any[]): Promise<void> {
  const database = await getDatabase();
  for (const scenario of scenarios) {
    await database.runAsync(
      `INSERT OR REPLACE INTO cached_scenarios (
        id, title, description, category, difficulty, is_premium,
        estimated_duration_minutes, icon_name, tags, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        scenario.id,
        scenario.title,
        scenario.description,
        scenario.category,
        scenario.difficulty,
        scenario.is_premium ? 1 : 0,
        scenario.estimated_duration_minutes ?? 5,
        scenario.icon_name ?? 'mic',
        JSON.stringify(scenario.tags ?? []),
        scenario.sort_order ?? 0,
      ]
    );
  }
}

export async function getCachedScenarios(): Promise<any[]> {
  const database = await getDatabase();
  return await database.getAllAsync('SELECT * FROM cached_scenarios ORDER BY sort_order ASC');
}

export async function cacheSessions(sessions: any[]): Promise<void> {
  const database = await getDatabase();
  for (const session of sessions) {
    await database.runAsync(
      `INSERT OR REPLACE INTO cached_sessions (
        id, scenario_id, scenario_title, status, difficulty_setting,
        duration_seconds, overall_score, filler_word_count, words_per_minute,
        interruption_count, started_at, completed_at, synced
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        session.id,
        session.scenario_id ?? null,
        session.scenario_title ?? null,
        session.status,
        session.difficulty_setting ?? null,
        session.duration_seconds ?? null,
        session.overall_score ?? null,
        session.filler_word_count ?? null,
        session.words_per_minute ?? null,
        session.interruption_count ?? 0,
        session.started_at,
        session.completed_at ?? null,
      ]
    );
  }
}

export async function getCachedSessions(limit: number = 10): Promise<any[]> {
  const database = await getDatabase();
  return await database.getAllAsync(
    'SELECT * FROM cached_sessions ORDER BY started_at DESC LIMIT ?',
    [limit]
  );
}

export async function cacheProgress(progress: any): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO cached_progress (
      user_id, current_streak, longest_streak, total_sessions,
      total_practice_minutes, avg_overall_score, avg_wpm, avg_filler_rate,
      score_trend, badges, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      progress.user_id,
      progress.current_streak ?? 0,
      progress.longest_streak ?? 0,
      progress.total_sessions ?? 0,
      progress.total_practice_minutes ?? 0,
      progress.avg_overall_score ?? null,
      progress.avg_wpm ?? null,
      progress.avg_filler_rate ?? null,
      progress.score_trend ?? null,
      JSON.stringify(progress.badges ?? []),
    ]
  );
}

export async function getCachedProgress(userId: string): Promise<any | null> {
  const database = await getDatabase();
  return await database.getFirstAsync('SELECT * FROM cached_progress WHERE user_id = ?', [userId]);
}
```

### `src/lib/sentry.ts`

```typescript
import * as Sentry from '@sentry/react-native';

export function initSentry() {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    debug: __DEV__,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
  });
}

export { Sentry };
```

### `src/lib/posthog.ts`

```typescript
import PostHog from 'posthog-react-native';

export const posthog = new PostHog(process.env.EXPO_PUBLIC_POSTHOG_API_KEY!, {
  host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
  enableSessionReplay: false,
});
```

### `src/lib/constants.ts`

```typescript
export const FILLER_WORDS = [
  'um', 'uh', 'er', 'ah', 'like', 'you know', 'basically',
  'actually', 'literally', 'right', 'so', 'well', 'I mean',
  'kind of', 'sort of', 'you see',
];

export const SPEAKING_GOALS = [
  { id: 'interviews', label: 'Job Interviews', icon: 'briefcase', description: 'Ace tough interview questions' },
  { id: 'presentations', label: 'Presentations', icon: 'monitor', description: 'Present with confidence and clarity' },
  { id: 'debates', label: 'Debates & Arguments', icon: 'message-circle', description: 'Think and respond under pressure' },
  { id: 'general_confidence', label: 'General Confidence', icon: 'mic', description: 'Speak up in any situation' },
] as const;

export const SKILL_LEVELS = [
  { id: 'beginner', label: 'Beginner', description: 'I get nervous speaking and use lots of filler words' },
  { id: 'intermediate', label: 'Intermediate', description: 'I can speak okay but struggle under pressure' },
  { id: 'advanced', label: 'Advanced', description: 'I want to go from good to great in high-stakes situations' },
] as const;

export const SCENARIO_CATEGORIES = [
  { id: 'interview', label: 'Interviews', icon: 'briefcase' },
  { id: 'pitch', label: 'Pitches', icon: 'trending-up' },
  { id: 'presentation', label: 'Presentations', icon: 'book-open' },
  { id: 'debate', label: 'Debates', icon: 'shield' },
  { id: 'difficult_conversation', label: 'Difficult Conversations', icon: 'users' },
  { id: 'impromptu', label: 'Impromptu', icon: 'zap' },
] as const;

export const BASELINE_PROMPTS = [
  "Tell me about a challenge you overcame and what you learned from it.",
  "Explain why someone should visit your favorite place in the world.",
  "Describe a skill you're proud of and how you developed it.",
  "Talk about a decision you made that changed the direction of your life.",
  "Explain a concept from your field of expertise to a complete beginner.",
];

export const PASSWORD_MIN_LENGTH = 8;
export const AVATAR_MAX_SIZE = 5 * 1024 * 1024; // 5MB
export const SESSION_RECORDING_MAX_SIZE = 100 * 1024 * 1024; // 100MB
```

---

## Step 8: TypeScript Types

### `src/types/database.ts`

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_path: string | null;
          speaking_goal: 'interviews' | 'presentations' | 'debates' | 'general_confidence' | null;
          skill_level: 'beginner' | 'intermediate' | 'advanced';
          onboarding_completed: boolean;
          baseline_wpm: number | null;
          baseline_filler_count: number | null;
          baseline_clarity_score: number | null;
          daily_reminder_enabled: boolean;
          daily_reminder_time: string;
          weekly_summary_enabled: boolean;
          renewal_reminder_enabled: boolean;
          new_content_enabled: boolean;
          ai_voice_speed: number;
          cloud_sync_enabled: boolean;
          analytics_opt_in: boolean;
          theme_preference: 'light' | 'dark' | 'system';
          expo_push_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['users']['Row']> & {
          id: string;
          email: string;
        };
        Update: Partial<Database['public']['Tables']['users']['Row']>;
      };
      scenarios: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: 'interview' | 'pitch' | 'presentation' | 'debate' | 'difficult_conversation' | 'impromptu';
          difficulty: 'beginner' | 'intermediate' | 'advanced';
          is_premium: boolean;
          is_active: boolean;
          estimated_duration_minutes: number;
          system_prompt: string;
          opening_line: string;
          pressure_tactics: Json;
          tags: string[];
          icon_name: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['scenarios']['Row']> & {
          title: string;
          description: string;
          category: string;
          difficulty: string;
          system_prompt: string;
          opening_line: string;
        };
        Update: Partial<Database['public']['Tables']['scenarios']['Row']>;
      };
      speaking_sessions: {
        Row: {
          id: string;
          user_id: string;
          scenario_id: string | null;
          status: 'in_progress' | 'completed' | 'abandoned';
          difficulty_setting: 'easy' | 'medium' | 'hard' | 'adaptive' | null;
          duration_seconds: number | null;
          transcript: Json | null;
          audio_path: string | null;
          interruption_count: number;
          started_at: string;
          completed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['speaking_sessions']['Row']> & {
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['speaking_sessions']['Row']>;
      };
      session_feedback: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          filler_word_count: number;
          filler_words_detail: Json;
          words_per_minute: number | null;
          pace_variability: number | null;
          total_word_count: number;
          silence_percentage: number | null;
          longest_pause_seconds: number | null;
          clarity_score: number | null;
          coherence_score: number | null;
          confidence_score: number | null;
          pressure_handling_score: number | null;
          overall_score: number | null;
          ai_summary: string | null;
          strengths: Json;
          improvements: Json;
          highlighted_moments: Json;
          score_explanation: Json;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['session_feedback']['Row']> & {
          session_id: string;
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['session_feedback']['Row']>;
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_session_date: string | null;
          total_sessions: number;
          total_practice_minutes: number;
          total_words_spoken: number;
          avg_overall_score: number | null;
          avg_wpm: number | null;
          avg_filler_rate: number | null;
          avg_clarity: number | null;
          avg_coherence: number | null;
          avg_confidence: number | null;
          avg_pressure_handling: number | null;
          score_trend: number | null;
          unlocked_scenario_ids: string[];
          badges: Json;
          weekly_stats: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['user_progress']['Row']> & {
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['user_progress']['Row']>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          revenuecat_customer_id: string | null;
          plan_type: 'free' | 'monthly' | 'annual';
          status: 'active' | 'paused' | 'cancelled' | 'expired' | 'trial';
          trial_start_date: string | null;
          trial_end_date: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          paused_at: string | null;
          renewal_reminder_sent: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['subscriptions']['Row']> & {
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['subscriptions']['Row']>;
      };
    };
  };
}
```

### `src/types/auth.ts`

```typescript
import { Session, User } from '@supabase/supabase-js';

export interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginData {
  email: string;
  password: string;
}
```

### `src/types/app.ts`

```typescript
export type SpeakingGoal = 'interviews' | 'presentations' | 'debates' | 'general_confidence';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type ThemePreference = 'light' | 'dark' | 'system';
export type ScenarioCategory = 'interview' | 'pitch' | 'presentation' | 'debate' | 'difficult_conversation' | 'impromptu';
export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'adaptive';

export interface OnboardingData {
  speakingGoal: SpeakingGoal | null;
  skillLevel: SkillLevel | null;
  baselineWpm: number | null;
  baselineFillerCount: number | null;
  baselineClarityScore: number | null;
}

export interface DashboardData {
  streak: number;
  sessionsThisWeek: number;
  totalSessions: number;
  totalMinutes: number;
  avgScore: number | null;
  scoreTrend: number | null;
  recentSessions: RecentSession[];
  recommendedScenario: ScenarioPreview | null;
}

export interface RecentSession {
  id: string;
  scenarioTitle: string;
  overallScore: number | null;
  duration: number;
  completedAt: string;
  fillerCount: number;
  wpm: number | null;
}

export interface ScenarioPreview {
  id: string;
  title: string;
  category: ScenarioCategory;
  difficulty: SkillLevel;
  isPremium: boolean;
  iconName: string;
  description: string;
}

export interface MetricCardData {
  label: string;
  value: string | number;
  trend?: number; // positive = up, negative = down
  color: string;
  icon: string;
}
```

---

## Step 9: Utility Functions

### `src/utils/validation.ts`

```typescript
import { PASSWORD_MIN_LENGTH } from '@/lib/constants';

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < PASSWORD_MIN_LENGTH) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  return null;
}

export function getPasswordStrength(password: string): {
  score: 0 | 1 | 2 | 3;
  label: 'Too short' | 'Weak' | 'Medium' | 'Strong';
  color: string;
} {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { score: 0, label: 'Too short', color: '#94A3B8' };
  }

  let score = 0;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: '#EF4444' };
  if (score <= 2) return { score: 2, label: 'Medium', color: '#F59E0B' };
  return { score: 3, label: 'Strong', color: '#10B981' };
}

export function validateDisplayName(name: string): string | null {
  if (!name.trim()) return 'Display name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  if (name.trim().length > 50) return 'Name must be less than 50 characters';
  return null;
}
```

### `src/utils/formatting.ts`

```typescript
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export function formatScore(score: number | null | undefined): string {
  if (score == null) return '--';
  return Math.round(score).toString();
}

export function formatTrend(trend: number | null | undefined): string {
  if (trend == null) return '';
  const sign = trend > 0 ? '+' : '';
  return `${sign}${trend.toFixed(1)}%`;
}

export function formatGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getAvatarUrl(avatarPath: string | null, supabaseUrl: string): string | null {
  if (!avatarPath) return null;
  return `${supabaseUrl}/storage/v1/object/public/avatars/${avatarPath}`;
}
```

### `src/utils/haptics.ts`

```typescript
import * as Haptics from 'expo-haptics';

export function hapticLight() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function hapticMedium() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function hapticHeavy() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

export function hapticSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function hapticError() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

export function hapticSelection() {
  Haptics.selectionAsync();
}
```

---

## Step 10: State Management (Zustand Stores)

### `src/stores/authStore.ts`

```typescript
import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { cacheUser, getCachedUser } from '@/lib/sqlite';

interface AuthStore {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  setSession: (session: Session | null) => void;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  user: null,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({
        session,
        user: session?.user ?? null,
        isLoading: false,
        isInitialized
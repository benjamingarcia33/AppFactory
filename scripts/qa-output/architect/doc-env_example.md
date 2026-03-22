# Environment Variables
# Copy this file to .env (or .env.local for Next.js) and fill in your values
# Lines marked [EP1] are needed before running Execution Prompt 1
# Lines marked [EP2] are needed before running Execution Prompt 2
# Lines marked [EP3] are needed before running Execution Prompt 3

# === REQUIRED BEFORE PROMPT 1 (Foundation) ===

# Supabase Auth — https://supabase.com/dashboard → Project Settings → API
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Supabase Postgresql — https://supabase.com/dashboard → Project Settings → Database
DATABASE_URL=your_database_url_here

# Upstash Redis — https://console.upstash.com → Redis → Details
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url_here
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token_here

# === REQUIRED BEFORE PROMPT 2 (Core Features) ===

# Claude Api — https://console.anthropic.com → API Keys
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Gpt5 Vision — https://platform.openai.com → API Keys
OPENAI_API_KEY=your_openai_api_key_here

# Algolia — https://algolia.com → Dashboard → API Keys
NEXT_PUBLIC_ALGOLIA_APP_ID=your_algolia_app_id_here
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=your_algolia_search_key_here
ALGOLIA_ADMIN_KEY=your_algolia_admin_key_here

# === REQUIRED BEFORE PROMPT 3 (Polish & Production) ===

# Eas Build — https://expo.dev → Account Settings → Access Tokens
EXPO_ACCESS_TOKEN=your_expo_access_token_here

# Expo Notifications — https://expo.dev → Account Settings → Access Tokens

# Revenucat — https://app.revenuecat.com → Project → API Keys
REVENUECAT_API_KEY=your_revenuecat_api_key_here
REVENUECAT_SECRET_KEY=your_revenuecat_secret_key_here

# Sentry — https://sentry.io → Project → Settings → Client Keys
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here

# Posthog — https://app.posthog.com → Project → Settings
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key_here
NEXT_PUBLIC_POSTHOG_HOST=your_posthog_host_here

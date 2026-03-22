{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase"
      ],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_KEY": "${SUPABASE_SERVICE_KEY}"
      }
    },
    "sentry": {
      "command": "npx",
      "args": [
        "-y",
        "@sentry/mcp-server"
      ],
      "env": {
        "SENTRY_AUTH_TOKEN": "${SENTRY_AUTH_TOKEN}"
      }
    },
    "upstash": {
      "command": "npx",
      "args": [
        "-y",
        "@upstash/mcp-server@latest"
      ],
      "env": {
        "UPSTASH_EMAIL": "${UPSTASH_EMAIL}",
        "UPSTASH_API_KEY": "${UPSTASH_API_KEY}"
      }
    },
    "playwright": {
      "command": "npx",
      "args": [
        "-y",
        "@playwright/mcp"
      ]
    },
    "context7": {
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp@latest"
      ]
    }
  }
}
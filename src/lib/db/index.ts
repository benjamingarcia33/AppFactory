import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add your Supabase connection string to .env.local"
  );
}

// prepare: false is required for Supabase Transaction/Session pooler mode
const client = postgres(connectionString, {
  prepare: false,
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
});
export const db = drizzle(client, { schema });

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const { db } = await import("../src/lib/db/index.js");
  const { scans, analyses } = await import("../src/lib/db/schema.js");
  const { desc } = await import("drizzle-orm");

  const scanRows = await db.select({
    id: scans.id,
    createdAt: scans.createdAt,
    completedAt: scans.completedAt,
    mode: scans.mode,
    status: scans.status,
  }).from(scans).orderBy(desc(scans.createdAt)).limit(5);

  console.log("=== SCOUT RUNS ===");
  for (const s of scanRows) {
    if (s.createdAt && s.completedAt) {
      const dur = (new Date(s.completedAt).getTime() - new Date(s.createdAt).getTime()) / 1000;
      console.log(`${s.id.substring(0, 8)}  ${(s.mode ?? "").padEnd(10)}  ${(s.status ?? "").padEnd(10)}  ${dur.toFixed(0).padStart(5)}s  (${(dur / 60).toFixed(1)} min)`);
    } else {
      console.log(`${s.id.substring(0, 8)}  ${(s.mode ?? "").padEnd(10)}  ${(s.status ?? "").padEnd(10)}  no completedAt`);
    }
  }

  const analysisRows = await db.select({
    id: analyses.id,
    createdAt: analyses.createdAt,
    completedAt: analyses.completedAt,
    status: analyses.status,
  }).from(analyses).orderBy(desc(analyses.createdAt)).limit(5);

  console.log("\n=== ARCHITECT RUNS ===");
  for (const a of analysisRows) {
    if (a.createdAt && a.completedAt) {
      const dur = (new Date(a.completedAt).getTime() - new Date(a.createdAt).getTime()) / 1000;
      console.log(`${a.id.substring(0, 8)}  ${(a.status ?? "").padEnd(10)}  ${dur.toFixed(0).padStart(5)}s  (${(dur / 60).toFixed(1)} min)`);
    } else {
      console.log(`${a.id.substring(0, 8)}  ${(a.status ?? "").padEnd(10)}  no completedAt`);
    }
  }

  process.exit(0);
}

main();

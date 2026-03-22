import { db } from "@/lib/db/index";
import { scans, analyses } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
async function main() {
  const rows = await db.select({ id: scans.id, mode: scans.mode, ideaText: scans.ideaText, focusText: scans.focusText, category: scans.category, status: scans.status, createdAt: scans.createdAt }).from(scans).orderBy(desc(scans.createdAt)).limit(5);
  for (const r of rows) {
    console.log(JSON.stringify(r));
  }
  const aRows = await db.select({ id: analyses.id, oppId: analyses.opportunityId, scanId: analyses.scanId, status: analyses.status, createdAt: analyses.createdAt }).from(analyses).orderBy(desc(analyses.createdAt)).limit(5);
  console.log("--- analyses ---");
  for (const r of aRows) {
    console.log(JSON.stringify(r));
  }
  process.exit(0);
}
main();

import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  console.log("Seeding architectural knowledge base...");

  try {
    const { seedTechnologies } = await import("../src/lib/db/seed-technologies");
    const { seedScreenPatterns } = await import("../src/lib/db/seed-screen-patterns");
    const { seedSynergies } = await import("../src/lib/db/seed-synergies");

    await seedTechnologies();
    await seedScreenPatterns();
    await seedSynergies();

    console.log("Done! Knowledge base seeded (technologies + screen patterns + synergies).");
  } catch (err) {
    console.error("Seed failed:", err instanceof Error ? err.message : err);
    if (err instanceof Error && err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  }

  process.exit(0);
}

main();

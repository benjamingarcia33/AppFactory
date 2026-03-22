CREATE TABLE "analyses" (
	"id" text PRIMARY KEY NOT NULL,
	"opportunity_id" text,
	"scan_id" text,
	"status" text DEFAULT 'running' NOT NULL,
	"steps_json" text DEFAULT '[]' NOT NULL,
	"created_at" text NOT NULL,
	"completed_at" text
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"analysis_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "execution_prompts" (
	"id" text PRIMARY KEY NOT NULL,
	"analysis_id" text NOT NULL,
	"prompt_number" integer NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"tech_slugs_json" text DEFAULT '[]' NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "uq_execution_prompts_analysis_prompt" UNIQUE("analysis_id","prompt_number")
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" text PRIMARY KEY NOT NULL,
	"scan_id" text NOT NULL,
	"app_id" text NOT NULL,
	"title" text NOT NULL,
	"store" text NOT NULL,
	"genre" text NOT NULL,
	"score" real NOT NULL,
	"ratings" integer NOT NULL,
	"installs" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"url" text NOT NULL,
	"developer" text NOT NULL,
	"review_count" integer,
	"price" real,
	"free" boolean,
	"offers_iap" boolean,
	"price_text" text,
	"histogram_json" text,
	"sentiment_json" text NOT NULL,
	"reviews_json" text NOT NULL,
	"market_size" real NOT NULL,
	"dissatisfaction" real NOT NULL,
	"feasibility" real NOT NULL,
	"composite_score" real NOT NULL,
	"created_at" text NOT NULL,
	"gap_analysis_json" text,
	"blue_ocean_json" text
);
--> statement-breakpoint
CREATE TABLE "scans" (
	"id" text PRIMARY KEY NOT NULL,
	"store" text NOT NULL,
	"category" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"total_apps_scraped" integer DEFAULT 0 NOT NULL,
	"total_opportunities" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL,
	"completed_at" text,
	"mode" text DEFAULT 'category' NOT NULL,
	"idea_text" text,
	"focus_text" text,
	"discovery_angle" text,
	"master_idea_json" text,
	"blue_ocean_json" text
);
--> statement-breakpoint
CREATE TABLE "screen_patterns" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"layout_pattern" text NOT NULL,
	"layout_description" text NOT NULL,
	"interactions_json" text DEFAULT '[]' NOT NULL,
	"states_json" text DEFAULT '{}' NOT NULL,
	"required_tech_categories_json" text DEFAULT '[]' NOT NULL,
	"optional_tech_categories_json" text DEFAULT '[]' NOT NULL,
	"state_approach" text NOT NULL,
	"data_flow_description" text NOT NULL,
	"navigates_to_json" text DEFAULT '[]' NOT NULL,
	"navigates_from_json" text DEFAULT '[]' NOT NULL,
	"prompt_fragment" text NOT NULL,
	"platforms" text DEFAULT 'both' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "screen_patterns_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tech_synergies" (
	"id" text PRIMARY KEY NOT NULL,
	"tech_slug_a" text NOT NULL,
	"tech_slug_b" text NOT NULL,
	"relationship" text NOT NULL,
	"reason" text NOT NULL,
	"prompt_note" text
);
--> statement-breakpoint
CREATE TABLE "technologies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"best_for" text NOT NULL,
	"limitations" text NOT NULL,
	"pricing" text NOT NULL,
	"complexity" text NOT NULL,
	"platforms" text NOT NULL,
	"mobile_framework" text,
	"npm_packages_json" text DEFAULT '[]' NOT NULL,
	"setup_complexity" text NOT NULL,
	"prompt_fragment" text NOT NULL,
	"prompt_fragment_mobile" text,
	"requires_json" text DEFAULT '[]' NOT NULL,
	"pairs_well_json" text DEFAULT '[]' NOT NULL,
	"conflicts_json" text DEFAULT '[]' NOT NULL,
	"docs_url" text,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "technologies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_analysis_id_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."analyses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_prompts" ADD CONSTRAINT "execution_prompts_analysis_id_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."analyses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tech_synergies" ADD CONSTRAINT "tech_synergies_tech_slug_a_technologies_slug_fk" FOREIGN KEY ("tech_slug_a") REFERENCES "public"."technologies"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tech_synergies" ADD CONSTRAINT "tech_synergies_tech_slug_b_technologies_slug_fk" FOREIGN KEY ("tech_slug_b") REFERENCES "public"."technologies"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_analyses_opportunity_id" ON "analyses" USING btree ("opportunity_id");--> statement-breakpoint
CREATE INDEX "idx_analyses_scan_id" ON "analyses" USING btree ("scan_id");--> statement-breakpoint
CREATE INDEX "idx_documents_analysis_id" ON "documents" USING btree ("analysis_id");--> statement-breakpoint
CREATE INDEX "idx_execution_prompts_analysis_id" ON "execution_prompts" USING btree ("analysis_id");--> statement-breakpoint
CREATE INDEX "idx_opportunities_scan_id" ON "opportunities" USING btree ("scan_id");
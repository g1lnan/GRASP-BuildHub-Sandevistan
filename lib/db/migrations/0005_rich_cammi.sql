ALTER TABLE "probes" ADD COLUMN "ai_fragility_with_essay_score" numeric;--> statement-breakpoint
ALTER TABLE "probes" ADD COLUMN "follow_up_eligible" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "probes" ADD COLUMN "follow_up_of_probe_id" uuid;--> statement-breakpoint
ALTER TABLE "probes" ADD COLUMN "session_id" uuid;--> statement-breakpoint
ALTER TABLE "probes" ADD CONSTRAINT "probes_follow_up_of_probe_id_probes_id_fk" FOREIGN KEY ("follow_up_of_probe_id") REFERENCES "public"."probes"("id") ON DELETE no action ON UPDATE no action;
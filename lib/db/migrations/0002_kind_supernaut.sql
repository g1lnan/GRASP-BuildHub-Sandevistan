ALTER TABLE "sessions" ADD COLUMN "claim_graph_id" uuid;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "time_cap_seconds" integer;--> statement-breakpoint
UPDATE "sessions"
SET "claim_graph_id" = COALESCE(
	(
		SELECT "probes"."claim_graph_id"
		FROM "turns"
		INNER JOIN "probes" ON "probes"."id" = "turns"."probe_id"
		WHERE "turns"."session_id" = "sessions"."id"
		ORDER BY "turns"."ordinal"
		LIMIT 1
	),
	(
		SELECT "claim_graphs"."id"
		FROM "claim_graphs"
		WHERE "claim_graphs"."submission_id" = "sessions"."submission_id"
			AND "claim_graphs"."created_at" <= "sessions"."started_at"
		ORDER BY "claim_graphs"."version" DESC
		LIMIT 1
	)
);--> statement-breakpoint
UPDATE "sessions"
SET "time_cap_seconds" = "assignments"."time_cap_seconds"
FROM "submissions"
INNER JOIN "assignments" ON "assignments"."id" = "submissions"."assignment_id"
WHERE "submissions"."id" = "sessions"."submission_id";--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "sessions"
		WHERE "claim_graph_id" IS NULL OR "time_cap_seconds" IS NULL
	) THEN
		RAISE EXCEPTION 'Cannot pin existing sessions without a Claim Graph and assignment time cap';
	END IF;
END
$$;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "claim_graph_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "time_cap_seconds" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_claim_graph_id_claim_graphs_id_fk" FOREIGN KEY ("claim_graph_id") REFERENCES "public"."claim_graphs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_sessions_claim_graph_id" ON "sessions" USING btree ("claim_graph_id");--> statement-breakpoint
ALTER TABLE "turns" ADD CONSTRAINT "uq_turns_session_ordinal" UNIQUE("session_id","ordinal");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "ck_sessions_time_cap" CHECK ("sessions"."time_cap_seconds" between 360 and 600);

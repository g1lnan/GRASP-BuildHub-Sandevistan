DROP INDEX "idx_feedback_reports_session_id";--> statement-breakpoint
ALTER TABLE "feedback_reports" ADD COLUMN "model" text NOT NULL DEFAULT 'legacy';--> statement-breakpoint
ALTER TABLE "feedback_reports" ADD COLUMN "prompt_version" text NOT NULL DEFAULT 'feedback-legacy';--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "feedback_reports"
    GROUP BY "session_id"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce one feedback report per session: duplicate legacy rows require manual archival';
  END IF;
END
$$;--> statement-breakpoint
ALTER TABLE "feedback_reports" ALTER COLUMN "model" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "feedback_reports" ALTER COLUMN "prompt_version" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "feedback_reports" ADD CONSTRAINT "uq_feedback_reports_session_id" UNIQUE("session_id");

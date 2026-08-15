CREATE TABLE "claim_graphs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"nodes" jsonb NOT NULL,
	"edges" jsonb NOT NULL,
	"concepts" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_claim_graphs_submission_version" UNIQUE("submission_id","version")
);
--> statement-breakpoint
CREATE TABLE "probes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_graph_id" uuid NOT NULL,
	"claim_node_id" text NOT NULL,
	"ordinal" integer NOT NULL,
	"probe_type" text NOT NULL,
	"bloom_level" text NOT NULL,
	"text_vi" text NOT NULL,
	"expected_signals" jsonb NOT NULL,
	"ai_fragility_score" numeric,
	"selected" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_probes_type" CHECK ("probes"."probe_type" in ('counterfactual', 'road_not_taken', 'novel_transfer', 'self_critique', 'metacognitive', 'trace_own_step')),
	CONSTRAINT "ck_probes_bloom_level" CHECK ("probes"."bloom_level" in ('understand', 'apply', 'analyse', 'evaluate', 'reflect'))
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" text NOT NULL,
	"prompt" text NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"published_at" timestamp with time zone,
	"subject_concepts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"probe_count" integer NOT NULL,
	"time_cap_seconds" integer NOT NULL,
	"defense_weight_pct" integer NOT NULL,
	"rubric_weights" jsonb DEFAULT '{"d1":0.15,"d2":0.3,"d3":0.25,"d4":0.2,"d5":0.1}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_assignments_probe_count" CHECK ("assignments"."probe_count" between 5 and 8),
	CONSTRAINT "ck_assignments_time_cap" CHECK ("assignments"."time_cap_seconds" between 360 and 600),
	CONSTRAINT "ck_assignments_defense_weight" CHECK ("assignments"."defense_weight_pct" between 0 and 30)
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"lecturer_id" uuid NOT NULL,
	"name" text NOT NULL,
	"term" text NOT NULL,
	"join_code" text NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_courses_join_code" CHECK ("courses"."join_code" ~ '^[A-HJ-NP-Z2-9]{8}$')
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_enrollments_course_student" UNIQUE("course_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"country" text,
	"data_region" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"source" text NOT NULL,
	"file_url" text,
	"extracted_text" text NOT NULL,
	"word_count" integer NOT NULL,
	"product_score" numeric,
	"status" text DEFAULT 'pending' NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_submissions_source" CHECK ("submissions"."source" in ('docx', 'pdf', 'text')),
	CONSTRAINT "ck_submissions_word_count" CHECK ("submissions"."word_count" between 0 and 20000),
	CONSTRAINT "ck_submissions_status" CHECK ("submissions"."status" in ('pending', 'analysing', 'ready', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "ck_users_role" CHECK ("users"."role" in ('lecturer', 'student', 'researcher'))
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"run_after" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_by" text,
	"locked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_jobs_status" CHECK ("jobs"."status" in ('pending', 'running', 'completed', 'failed')),
	CONSTRAINT "ck_jobs_attempts" CHECK ("jobs"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "appeals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"resolution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_appeals_status" CHECK ("appeals"."status" in ('open', 'resolved'))
);
--> statement-breakpoint
CREATE TABLE "feedback_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"strengths" jsonb NOT NULL,
	"gaps" jsonb NOT NULL,
	"revise_concepts" jsonb NOT NULL,
	"body_vi" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"score_id" uuid NOT NULL,
	"lecturer_id" uuid NOT NULL,
	"original" jsonb NOT NULL,
	"overridden" jsonb NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"d1_recall" numeric NOT NULL,
	"d2_explanation" numeric NOT NULL,
	"d3_application" numeric NOT NULL,
	"d4_evaluation" numeric NOT NULL,
	"d5_metacognition" numeric NOT NULL,
	"composite" numeric NOT NULL,
	"confidence_low" numeric NOT NULL,
	"confidence_high" numeric NOT NULL,
	"confidence_label" text NOT NULL,
	"rationale" jsonb NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_scores_session_id" UNIQUE("session_id"),
	CONSTRAINT "ck_scores_d1" CHECK ("scores"."d1_recall" between 1 and 5),
	CONSTRAINT "ck_scores_d2" CHECK ("scores"."d2_explanation" between 1 and 5),
	CONSTRAINT "ck_scores_d3" CHECK ("scores"."d3_application" between 1 and 5),
	CONSTRAINT "ck_scores_d4" CHECK ("scores"."d4_evaluation" between 1 and 5),
	CONSTRAINT "ck_scores_d5" CHECK ("scores"."d5_metacognition" between 1 and 5),
	CONSTRAINT "ck_scores_confidence_label" CHECK ("scores"."confidence_label" in ('high', 'medium', 'low'))
);
--> statement-breakpoint
CREATE TABLE "usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid,
	"submission_id" uuid,
	"stage" text NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer,
	"cache_read_tokens" integer,
	"cache_creation_tokens" integer,
	"output_tokens" integer,
	"audio_seconds" numeric,
	"cost_vnd" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"mode" text NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"elapsed_seconds" integer,
	"integrity_signals" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_sessions_mode" CHECK ("sessions"."mode" in ('voice', 'typed', 'mixed')),
	CONSTRAINT "ck_sessions_status" CHECK ("sessions"."status" in ('in_progress', 'completed', 'expired', 'abandoned'))
);
--> statement-breakpoint
CREATE TABLE "turns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"probe_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"follow_up_of" uuid,
	"input_mode" text NOT NULL,
	"audio_url" text,
	"audio_deleted_at" timestamp with time zone,
	"transcript" text NOT NULL,
	"asr_confidence" numeric,
	"latency_ms" integer,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_turns_input_mode" CHECK ("turns"."input_mode" in ('voice', 'typed')),
	CONSTRAINT "ck_turns_asr_confidence" CHECK ("turns"."asr_confidence" is null or "turns"."asr_confidence" between 0 and 1)
);
--> statement-breakpoint
ALTER TABLE "claim_graphs" ADD CONSTRAINT "claim_graphs_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "probes" ADD CONSTRAINT "probes_claim_graph_id_claim_graphs_id_fk" FOREIGN KEY ("claim_graph_id") REFERENCES "public"."claim_graphs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_lecturer_id_users_id_fk" FOREIGN KEY ("lecturer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_reports" ADD CONSTRAINT "feedback_reports_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overrides" ADD CONSTRAINT "overrides_score_id_scores_id_fk" FOREIGN KEY ("score_id") REFERENCES "public"."scores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overrides" ADD CONSTRAINT "overrides_lecturer_id_users_id_fk" FOREIGN KEY ("lecturer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turns" ADD CONSTRAINT "turns_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turns" ADD CONSTRAINT "turns_probe_id_probes_id_fk" FOREIGN KEY ("probe_id") REFERENCES "public"."probes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turns" ADD CONSTRAINT "turns_follow_up_of_turns_id_fk" FOREIGN KEY ("follow_up_of") REFERENCES "public"."turns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_claim_graphs_submission_id" ON "claim_graphs" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "idx_probes_claim_graph_id" ON "probes" USING btree ("claim_graph_id");--> statement-breakpoint
CREATE INDEX "idx_probes_selected" ON "probes" USING btree ("selected");--> statement-breakpoint
CREATE INDEX "idx_assignments_course_id" ON "assignments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_courses_institution_id" ON "courses" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_courses_lecturer_id" ON "courses" USING btree ("lecturer_id");--> statement-breakpoint
CREATE INDEX "idx_courses_join_code" ON "courses" USING btree ("join_code");--> statement-breakpoint
CREATE INDEX "idx_enrollments_course_id" ON "enrollments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_enrollments_student_id" ON "enrollments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_submissions_assignment_id" ON "submissions" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "idx_submissions_student_id" ON "submissions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_submissions_status" ON "submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_users_institution_id" ON "users" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_jobs_status_run_after" ON "jobs" USING btree ("status","run_after");--> statement-breakpoint
CREATE INDEX "idx_appeals_session_id" ON "appeals" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_feedback_reports_session_id" ON "feedback_reports" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_overrides_score_id" ON "overrides" USING btree ("score_id");--> statement-breakpoint
CREATE INDEX "idx_overrides_lecturer_id" ON "overrides" USING btree ("lecturer_id");--> statement-breakpoint
CREATE INDEX "idx_usage_events_session_id" ON "usage_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_usage_events_stage" ON "usage_events" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "idx_sessions_submission_id" ON "sessions" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_student_id" ON "sessions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_status" ON "sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_turns_session_id" ON "turns" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_turns_probe_id" ON "turns" USING btree ("probe_id");
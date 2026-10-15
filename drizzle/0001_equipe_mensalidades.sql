CREATE TABLE "recurring_charges" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"project_id" integer,
	"description" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"day_of_month" integer NOT NULL,
	"start_month" text NOT NULL,
	"end_month" text,
	"area" text DEFAULT 'dev' NOT NULL,
	"category" text DEFAULT 'Mensalidade / manutenção' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"generated_until" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sewing_workers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'reta' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sewing_entries" ADD COLUMN "worker_id" integer;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "recurring_id" integer;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "recurring_month" text;--> statement-breakpoint
ALTER TABLE "recurring_charges" ADD CONSTRAINT "recurring_charges_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_charges" ADD CONSTRAINT "recurring_charges_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sewing_entries" ADD CONSTRAINT "sewing_entries_worker_id_sewing_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."sewing_workers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recurring_id_recurring_charges_id_fk" FOREIGN KEY ("recurring_id") REFERENCES "public"."recurring_charges"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sewing_entries_worker_idx" ON "sewing_entries" USING btree ("worker_id");--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_recurring_month_idx" ON "transactions" USING btree ("recurring_id","recurring_month");
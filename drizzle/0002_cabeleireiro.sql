CREATE TABLE "haircut_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"service_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"commission_pct" numeric(5, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "haircut_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"period_start" date,
	"period_end" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "haircut_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"commission_pct" numeric(5, 2) DEFAULT 50 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "haircut_payment_id" integer;--> statement-breakpoint
ALTER TABLE "haircut_entries" ADD CONSTRAINT "haircut_entries_service_id_haircut_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."haircut_services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "haircut_entries_date_idx" ON "haircut_entries" USING btree ("date");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_haircut_payment_id_haircut_payments_id_fk" FOREIGN KEY ("haircut_payment_id") REFERENCES "public"."haircut_payments"("id") ON DELETE cascade ON UPDATE no action;
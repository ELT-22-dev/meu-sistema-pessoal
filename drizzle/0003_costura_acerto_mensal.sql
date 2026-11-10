ALTER TABLE "sewing_payments" ADD COLUMN "kind" text DEFAULT 'pagamento' NOT NULL;--> statement-breakpoint
ALTER TABLE "sewing_payments" ADD COLUMN "month" text;--> statement-breakpoint
UPDATE "sewing_payments" SET "month" = to_char(coalesce("period_start", "date"), 'YYYY-MM') WHERE "month" IS NULL;--> statement-breakpoint
ALTER TABLE "sewing_payments" ALTER COLUMN "month" SET NOT NULL;

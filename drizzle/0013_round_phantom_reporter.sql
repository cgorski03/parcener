ALTER TABLE "receipt_item" ADD COLUMN "order_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "receipt_item" DROP COLUMN "created_at";
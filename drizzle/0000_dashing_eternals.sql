CREATE TYPE "public"."processing_status" AS ENUM('processing', 'failed', 'success');--> statement-breakpoint
CREATE TABLE "receipt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255),
	"subtotal" numeric(10, 2),
	"tip" numeric(10, 2),
	"tax" numeric(10, 2),
	"grand_total" numeric(10, 2),
	"raw_parsing_response" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "receipt_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"receipt_id" uuid NOT NULL,
	"price" numeric(10, 2),
	"raw_text" varchar(255),
	"interpreted_text" varchar(1027),
	"quantity" numeric(5, 2) DEFAULT '1'
);
--> statement-breakpoint
CREATE TABLE "receipt_processing_information" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"receipt_id" uuid NOT NULL,
	"processing_status" "processing_status" NOT NULL,
	"started_at" timestamp DEFAULT now(),
	"ended_at" timestamp DEFAULT now(),
	"error_message" text,
	"error_details" jsonb,
	"model" varchar(30),
	"processing_tokens" integer
);
--> statement-breakpoint
ALTER TABLE "receipt_item" ADD CONSTRAINT "receipt_item_receipt_id_receipt_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_processing_information" ADD CONSTRAINT "receipt_processing_information_receipt_id_receipt_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipt"("id") ON DELETE cascade ON UPDATE no action;
CREATE TYPE "public"."allocation_type" AS ENUM('even', 'proportional', 'host_only');--> statement-breakpoint
CREATE TYPE "public"."itemized_tax_status" AS ENUM('taxable', 'exempt', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."tax_allocation_mode" AS ENUM('receipt_level', 'itemized');--> statement-breakpoint
CREATE TYPE "public"."tax_classification_source" AS ENUM('model', 'user');--> statement-breakpoint
CREATE TABLE "receipt_fee" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"receipt_id" uuid NOT NULL,
	"tax_code_id" uuid,
	"raw_text" varchar(255),
	"allocation_method" "allocation_type" DEFAULT 'proportional' NOT NULL,
	"label" varchar(127) NOT NULL,
	"taxable" boolean DEFAULT false NOT NULL,
	"amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipt_item_tax_classification" (
	"receipt_item_id" uuid PRIMARY KEY NOT NULL,
	"receipt_id" uuid NOT NULL,
	"tax_code_id" uuid,
	"status" "itemized_tax_status" DEFAULT 'unknown' NOT NULL,
	"source" "tax_classification_source" DEFAULT 'model' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipt_tax_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"receipt_id" uuid NOT NULL,
	"code" varchar(16) NOT NULL,
	"label" varchar(127),
	"rate_bps" integer,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "receipt_tax_code_receipt_id_id_unique" UNIQUE("receipt_id","id"),
	CONSTRAINT "receipt_tax_code_receipt_id_code_unique" UNIQUE("receipt_id","code")
);
--> statement-breakpoint
ALTER TABLE "receipt" ADD COLUMN "tax_allocation_mode" "tax_allocation_mode" DEFAULT 'receipt_level' NOT NULL;--> statement-breakpoint
ALTER TABLE "receipt_item" ADD CONSTRAINT "receipt_item_receipt_id_id_unique" UNIQUE("receipt_id","id");--> statement-breakpoint
ALTER TABLE "receipt_fee" ADD CONSTRAINT "receipt_fee_receipt_id_receipt_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_fee" ADD CONSTRAINT "receipt_fee_tax_code_same_receipt_fk" FOREIGN KEY ("receipt_id","tax_code_id") REFERENCES "public"."receipt_tax_code"("receipt_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_item_tax_classification" ADD CONSTRAINT "receipt_item_tax_classification_receipt_id_receipt_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_item_tax_classification" ADD CONSTRAINT "receipt_item_tax_classification_item_same_receipt_fk" FOREIGN KEY ("receipt_id","receipt_item_id") REFERENCES "public"."receipt_item"("receipt_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_item_tax_classification" ADD CONSTRAINT "receipt_item_tax_classification_tax_code_same_receipt_fk" FOREIGN KEY ("receipt_id","tax_code_id") REFERENCES "public"."receipt_tax_code"("receipt_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_tax_code" ADD CONSTRAINT "receipt_tax_code_receipt_id_receipt_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipt"("id") ON DELETE cascade ON UPDATE no action;

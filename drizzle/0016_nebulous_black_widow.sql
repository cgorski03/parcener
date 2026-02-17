CREATE TYPE "public"."receipt_state" AS ENUM('active', 'locked');--> statement-breakpoint
CREATE TYPE "public"."validity_state" AS ENUM('valid', 'grandtotal_mismatch', 'subtotal_mismatch');--> statement-breakpoint
ALTER TABLE "receipt_processing_information" ADD COLUMN "initial_validity_status" "validity_state";
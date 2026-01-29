CREATE TYPE "public"."room_status" AS ENUM('active', 'locked');--> statement-breakpoint
ALTER TABLE "room" ADD COLUMN "room_status" "room_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "room" ADD COLUMN "locked_at" timestamp;
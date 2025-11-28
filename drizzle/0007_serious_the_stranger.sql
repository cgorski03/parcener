ALTER TABLE "room" RENAME COLUMN "user_id" TO "created_by";--> statement-breakpoint
ALTER TABLE "room" DROP CONSTRAINT "room_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "room" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "room" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "room_member" ALTER COLUMN "display_name" SET DATA TYPE varchar(63);--> statement-breakpoint
ALTER TABLE "room_member" ALTER COLUMN "joined_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "receipt_processing_information" ADD COLUMN "raw_parsing_response" text;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt" DROP COLUMN "raw_parsing_response";
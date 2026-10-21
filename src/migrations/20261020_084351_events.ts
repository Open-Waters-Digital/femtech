import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_events_speakers_role" AS ENUM('keynote', 'panel', 'talk', 'tbc');
  CREATE TYPE "public"."enum_events_kind" AS ENUM('speaking', 'hosted');
  CREATE TYPE "public"."enum_events_status" AS ENUM('draft', 'published', 'cancelled');
  CREATE TYPE "public"."enum_events_startsat_tz" AS ENUM('Europe/London', 'Europe/Dublin', 'Europe/Amsterdam', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Stockholm', 'Asia/Dubai', 'Asia/Riyadh', 'Asia/Kolkata', 'Asia/Singapore', 'Australia/Sydney', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'America/Toronto');
  CREATE TYPE "public"."enum_events_endsat_tz" AS ENUM('Europe/London', 'Europe/Dublin', 'Europe/Amsterdam', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Stockholm', 'Asia/Dubai', 'Asia/Riyadh', 'Asia/Kolkata', 'Asia/Singapore', 'Australia/Sydney', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'America/Toronto');
  CREATE TABLE "events_speakers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_events_speakers_role" DEFAULT 'tbc' NOT NULL
  );
  
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"kind" "enum_events_kind" DEFAULT 'speaking' NOT NULL,
  	"status" "enum_events_status" DEFAULT 'draft' NOT NULL,
  	"slug" varchar,
  	"starts_at" timestamp(3) with time zone NOT NULL,
  	"startsat_tz" "enum_events_startsat_tz" DEFAULT 'Europe/London' NOT NULL,
  	"ends_at" timestamp(3) with time zone,
  	"endsat_tz" "enum_events_endsat_tz" DEFAULT 'Europe/London',
  	"all_day" boolean DEFAULT false,
  	"venue" varchar,
  	"city" varchar,
  	"country" varchar,
  	"online" boolean DEFAULT false,
  	"session_title" varchar,
  	"organiser_url" varchar,
  	"summary" varchar,
  	"description" varchar,
  	"image_id" integer,
  	"capacity" numeric,
  	"rsvp_closes_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "events_id" integer;
  ALTER TABLE "events_speakers" ADD CONSTRAINT "events_speakers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "events_speakers_order_idx" ON "events_speakers" USING btree ("_order");
  CREATE INDEX "events_speakers_parent_id_idx" ON "events_speakers" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");
  CREATE INDEX "events_image_idx" ON "events" USING btree ("image_id");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events_speakers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "events_speakers" CASCADE;
  DROP TABLE "events" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_events_fk";
  
  DROP INDEX "payload_locked_documents_rels_events_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "events_id";
  DROP TYPE "public"."enum_events_speakers_role";
  DROP TYPE "public"."enum_events_kind";
  DROP TYPE "public"."enum_events_status";
  DROP TYPE "public"."enum_events_startsat_tz";
  DROP TYPE "public"."enum_events_endsat_tz";`)
}

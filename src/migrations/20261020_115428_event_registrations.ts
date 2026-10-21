import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_event_registrations_status" AS ENUM('confirmed', 'withdrawn');
  CREATE TYPE "public"."enum_event_registrations_confirmation" AS ENUM('sent', 'failed', 'unconfigured', 'skipped');
  CREATE TABLE "event_registrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_id" integer NOT NULL,
  	"first_name" varchar NOT NULL,
  	"last_name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"status" "enum_event_registrations_status" DEFAULT 'confirmed' NOT NULL,
  	"withdrawn_at" timestamp(3) with time zone,
  	"member_id" integer,
  	"confirmation" "enum_event_registrations_confirmation",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "event_registrations_id" integer;
  ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "event_registrations_event_idx" ON "event_registrations" USING btree ("event_id");
  CREATE INDEX "event_registrations_email_idx" ON "event_registrations" USING btree ("email");
  CREATE INDEX "event_registrations_member_idx" ON "event_registrations" USING btree ("member_id");
  CREATE INDEX "event_registrations_updated_at_idx" ON "event_registrations" USING btree ("updated_at");
  CREATE INDEX "event_registrations_created_at_idx" ON "event_registrations" USING btree ("created_at");
  CREATE UNIQUE INDEX "event_email_idx" ON "event_registrations" USING btree ("event_id","email");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_event_registrations_fk" FOREIGN KEY ("event_registrations_id") REFERENCES "public"."event_registrations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_event_registrations_id_idx" ON "payload_locked_documents_rels" USING btree ("event_registrations_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "event_registrations" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "event_registrations" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_event_registrations_fk";
  
  DROP INDEX "payload_locked_documents_rels_event_registrations_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "event_registrations_id";
  DROP TYPE "public"."enum_event_registrations_status";
  DROP TYPE "public"."enum_event_registrations_confirmation";`)
}

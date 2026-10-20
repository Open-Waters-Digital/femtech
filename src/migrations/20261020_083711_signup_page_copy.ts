import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "site_settings_signup_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL
  );
  
  ALTER TABLE "site_settings" ADD COLUMN "signup_eyebrow" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "signup_benefits_heading" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "signup_benefits_intro" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "signup_coming_soon_heading" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "signup_coming_soon_body" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "signup_form_heading" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "signup_thanks_heading" varchar;
  ALTER TABLE "site_settings_signup_benefits" ADD CONSTRAINT "site_settings_signup_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_signup_benefits_order_idx" ON "site_settings_signup_benefits" USING btree ("_order");
  CREATE INDEX "site_settings_signup_benefits_parent_id_idx" ON "site_settings_signup_benefits" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "site_settings_signup_benefits" CASCADE;
  ALTER TABLE "site_settings" DROP COLUMN "signup_eyebrow";
  ALTER TABLE "site_settings" DROP COLUMN "signup_benefits_heading";
  ALTER TABLE "site_settings" DROP COLUMN "signup_benefits_intro";
  ALTER TABLE "site_settings" DROP COLUMN "signup_coming_soon_heading";
  ALTER TABLE "site_settings" DROP COLUMN "signup_coming_soon_body";
  ALTER TABLE "site_settings" DROP COLUMN "signup_form_heading";
  ALTER TABLE "site_settings" DROP COLUMN "signup_thanks_heading";`)
}

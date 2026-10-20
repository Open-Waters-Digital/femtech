import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_members_industry" AS ENUM('clinical', 'healthtech', 'digital-health', 'femtech', 'life-sciences', 'investment', 'public-sector', 'consulting', 'academia', 'other');
  ALTER TABLE "members" ADD COLUMN "job_title" varchar;
  ALTER TABLE "members" ADD COLUMN "organisation" varchar;
  ALTER TABLE "members" ADD COLUMN "industry" "enum_members_industry";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "members" DROP COLUMN "job_title";
  ALTER TABLE "members" DROP COLUMN "organisation";
  ALTER TABLE "members" DROP COLUMN "industry";
  DROP TYPE "public"."enum_members_industry";`)
}

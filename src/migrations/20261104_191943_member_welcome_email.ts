import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_members_welcome_email" AS ENUM('sent', 'failed', 'unconfigured', 'unverified', 'skipped');
  ALTER TABLE "members" ADD COLUMN "welcome_email" "enum_members_welcome_email";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "members" DROP COLUMN "welcome_email";
  DROP TYPE "public"."enum_members_welcome_email";`)
}

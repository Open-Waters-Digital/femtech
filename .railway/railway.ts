/**
 * Railway configuration for the femtech service, as Infrastructure as Code.
 *
 * Not railway.json: Railway silently ignores Config as Code on new services,
 * so the pre-deploy migration and the health check would never apply while
 * every deploy still reported success.
 *
 * NOT applied on push. After changing this file:
 *   railway config plan --verbose   # read-only; read every line
 *   railway config apply            # changes the live project
 *
 * `partial` limits the file to what it declares, so Postgres and the bucket are
 * never touched. A variable missing from `env` is DELETED on apply: add new
 * variables here in the same change that adds them to env.example.
 *
 * The GitHub repository and the project name are assumptions until the
 * project exists (AGENTS.md, "Open questions"). Check both before the first
 * apply; a wrong `source` disconnects the service from its repo.
 */
import { defineRailway, github, preserve, project, service } from 'railway/iac'

export const partial = 'femtech'

export default defineRailway(() => {
  const site = service('femtech', {
    source: github('Open-Waters-Digital/femtech', { branch: 'main' }),
    build: { builder: 'DOCKERFILE', dockerfilePath: 'Dockerfile' },
    // The Payload binary, not `pnpm run migrate`: the runtime image has no
    // lockfile, so pnpm decides the tree is stale and tries to reinstall as a
    // user that cannot write. Runs once per deploy, before traffic switches.
    preDeploy: 'node_modules/.bin/payload migrate',
    healthcheck: '/health',
    healthcheckTimeout: 60,
    // One replica: the sign-up rate limiter is in memory. Moving it to a shared
    // store is on the pre-launch list, and is what unblocks raising this.
    replicas: 1,
    deploy: { restartPolicyMaxRetries: 5 },
    env: {
      DATABASE_URL: preserve(),
      PAYLOAD_SECRET: preserve(),
      NEXT_PUBLIC_SITE_URL: preserve(),
      SITE_ENV: preserve(),
      RESEND_API_KEY: preserve(),
      SIGNUP_FROM_EMAIL: preserve(),
      SIGNUP_NOTIFY_EMAIL: preserve(),
      S3_ACCESS_KEY_ID: preserve(),
      S3_SECRET_ACCESS_KEY: preserve(),
      S3_BUCKET: preserve(),
      S3_ENDPOINT: preserve(),
      S3_REGION: preserve(),
      // SEED_ADMIN_* are deliberately absent: the seed is run from a machine,
      // never by a deploy.
    },
  })

  return project('femtechhealth.com', { resources: [site] })
})

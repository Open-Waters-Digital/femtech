# femtechhealth.com

The FemTech Healthcare Network website: Next.js 16 and Payload CMS 3 on
Postgres, deployed to Railway. Read [AGENTS.md](AGENTS.md) first.

## Run it locally

Needs Node 24.20.0, pnpm 11 and Docker.

```sh
cp env.example .env          # set PAYLOAD_SECRET and the two SEED_ADMIN_* values
pnpm install
pnpm run db:up               # Postgres on localhost:5435
pnpm run migrate
pnpm run seed                # admin user, images, video and all the copy
pnpm run dev                 # http://localhost:3000, admin at /admin
```

Sign-ups are saved locally but not emailed unless the Resend variables are set.

## Checks

```sh
pnpm run ci:quality          # lint, typecheck, tests, format, build
```

## Deploy

Railway builds the Dockerfile on push to `main` and runs `payload migrate` as
the pre-deploy step. Service settings live in `.railway/railway.ts` and are
applied by hand with `railway config plan` and `railway config apply`. See
AGENTS.md, "Delivery order", for first-time setup.

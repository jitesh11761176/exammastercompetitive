# Vercel Deployment Notes

This project is ready to deploy on Vercel. Follow these steps to get a green build and a working app in Production.

## 1) Choose a branch to deploy

- Fastest: set Production Branch to `build-fixes` (stabilized build) or `lint-cleanup` (includes ESLint polish) in Vercel → Project → Settings → Git.
- Recommended: open PRs and merge into `main`, then deploy `main`.
  - build-fixes PR: https://github.com/jitesh11761176/exammastercompetitive/pull/new/build-fixes
  - lint-cleanup PR: https://github.com/jitesh11761176/exammastercompetitive/pull/new/lint-cleanup

## 2) Environment variables (Production + Preview)

Minimum required to boot:
- DATABASE_URL: Neon Postgres URL (see `.env.example`)
- NEXTAUTH_URL: Your deployment URL (e.g., `https://your-app.vercel.app`)
- NEXTAUTH_SECRET: 32+ chars (generate at https://generate-secret.vercel.app/32)

If using Google sign-in:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- Add Authorized redirect URI in Google Cloud: `https://your-app.vercel.app/api/auth/callback/google`

Feature/integration keys as needed:
- GEMINI_API_KEY (AI)
- OPENAI_API_KEY (AI)
- MEILISEARCH_HOST, MEILISEARCH_API_KEY (Search)
- RESEND_API_KEY, EMAIL_FROM (Emails)
- STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY (Payments)
- Optional: STRIPE_WEBHOOK_SECRET (only if using webhooks)

Other toggles (optional):
- RATE_LIMIT_ENABLED, CSRF_ENABLED, CSP_ENABLED
- ENABLE_AI_FEATURES, ENABLE_SEARCH, ENABLE_NOTIFICATIONS, ENABLE_AUDIT_LOGS

Workers:
- Set `ENABLE_WORKERS` to `false` on Vercel. Run BullMQ workers on a separate process/server if needed.

## 3) Build settings (auto-detected)

- Framework: Next.js
- Install Command: `npm ci`
- Build Command: `next build`
- Output Directory: `.next`

## 4) Known build-time messages

- “Dynamic server usage” logs for API routes are expected (they read headers) and do not block the build.
- If STRIPE_SECRET_KEY is not set, Stripe initializes with a safe dummy key for build-time only.

## 5) Post-deploy checks

- Auth: Sign in with Google and verify the callback URL.
- Database: Dashboard pages should load without Prisma/DATABASE_URL errors.
- Payments (optional): Start a Checkout session if Stripe keys are set.
- Search (optional): Ensure Meilisearch is reachable if enabled.

---

For help rotating or adding env vars later, see Vercel → Project → Settings → Environment Variables. Changes require a redeploy.

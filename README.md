This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Protected areas, for testing Superflow Site Access

Seven areas are locked, one per access mode Superflow supports. Paste the matching values
into a project's **Site access** settings in the portal and run an agent.

| Path | Mode to pick | Credentials | What it proves |
|---|---|---|---|
| `/gated` | Single password | `velt-gate-2026` | The Webflow-shaped gate |
| `/basic` | Username and password (HTTP auth) | `velt` / `velt-basic-2026` | HTTP Basic on every request |
| `/members` | Username and password (login form) | `agent@velt.dev` / `velt-form-2026` | Generic form fill and submit |
| `/bypass-cf` | Bypass token | ID `velt-agent-test.access`, secret `velt-cf-bypass-2026` | Cloudflare Access, **two** headers |
| `/bypass-vercel` | Bypass token | secret `velt-vercel-bypass-2026`, **leave the Client ID blank** | Vercel, **one** header |
| `/sso` | Single sign on | `agent@velt.dev` / `velt-sso-2026` | Identifier-first sign-in on another origin |
| `/sso-mfa` | Single sign on | `agent@velt.dev` / `velt-sso-2026` | That a second factor is reported as MFA, not a bad password |

Credentials are hard-coded on purpose. Nothing real is behind these gates. Each can be
overridden by an env var (`GATE_PASSWORD`, `BASIC_USERNAME`, `BASIC_PASSWORD`,
`MEMBER_USERNAME`, `MEMBER_PASSWORD`, `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET`,
`VERCEL_BYPASS_SECRET`, `SSO_USERNAME`, `SSO_PASSWORD`) if you want to test the
wrong-credential path without editing code.

### Reading the result

Each protected page carries a unique marker sentence:

- `GATED-AREA-MARKER-7781`
- `BASIC-AREA-MARKER-4420`
- `MEMBER-AREA-MARKER-9052`
- `BYPASS-CF-AREA-MARKER-4412`
- `BYPASS-VERCEL-AREA-MARKER-5523`
- `SSO-AREA-MARKER-6634`
- `SSO-MFA-AREA-MARKER-7745` — this one should **never** appear. If it does, the
  second-factor screen failed to block the sign-in.

If agent findings quote a marker, or mention the planted spelling mistakes on those pages,
the unlock worked. If they describe a page asking for a password, it did not.

### Why `/gated` is the important one

`/basic` answers a locked request with `401`, so a crawler that cannot get in fails loudly
and no one is misled. `/gated` answers with **HTTP 200 and a password screen**, exactly like
Webflow, Shopify and Squarespace. A crawler that cannot get in sees a perfectly successful
page load and will describe the password screen as though it were the site. That silent wrong
answer is the failure Site Access exists to remove, so it is the case worth testing first.

`/gated` also links to `/gated/changelog`, so a crawl has a second protected URL to discover
once the gate is open.

### Bypass tokens (`/bypass-cf`, `/bypass-vercel`)

These two are the odd ones out: **no login, no session, no browser**. A header is checked on
every request, which is why this is the only mode that also works on the preview proxy, which
has no browser at all.

They are shaped after the two platforms Superflow supports, and the difference is the point:

- **`/bypass-cf`** wants the Cloudflare Access pair, `CF-Access-Client-Id` **and**
  `CF-Access-Client-Secret`. Sending only one is the most likely way to misconfigure this, so
  a half-configured request is refused exactly like an unconfigured one.
- **`/bypass-vercel`** wants the single `x-vercel-protection-bypass` header. In the portal,
  leaving the Client ID blank is how you say "this is a Vercel token".

`/bypass-cf` also answers with a fake `cf-ray` response header, because that is what
Superflow's probe reads to name the platform and offer the right header fields. Vercel already
sets `x-vercel-id` itself.

Neither area can be opened by a browser. `/bypass-cf` bounces to a sign-in screen with no way
to sign in, which is what Cloudflare Access does; `/bypass-vercel` answers `401`.

**Testing the real thing instead.** Vercel's own Deployment Protection is enforced at the edge,
before this app runs, so it cannot be simulated in code. If you want to exercise that, turn on
Deployment Protection plus *Protection Bypass for Automation* in the Vercel project settings and
use the secret Vercel issues. Be aware it gates the **whole** deployment, so every other test
area on this site becomes unreachable while it is on.

### Single sign on (`/sso`, `/sso-mfa`)

`sso` is the only mode where the password is typed into a page on a **different origin** than
the site being read. Everything expensive about it follows from that: the host has to be vetted
before anything is typed, the sign-in is two screens rather than one, and cookies have to be
captured from both domains.

A same-origin mock would test none of that, so this repo is designed to be deployed **twice**:

1. Deploy this repo as a second Vercel project, e.g. `velt-agent-test-idp`.
2. On the **site** project set `SSO_IDP_ORIGIN=https://velt-agent-test-idp.vercel.app`.
3. On the **provider** project set `SSO_SITE_ORIGIN=https://velt-agent-full-test.vercel.app`.

`*.vercel.app` is on the public suffix list, so two Vercel projects really are two different
registrable domains. That is what makes this a faithful cross-origin test rather than two names
for one site.

If `SSO_IDP_ORIGIN` is unset the provider is served from the site's own origin and every
sign-in screen carries a loud **SAME-ORIGIN FALLBACK** banner. That fallback still exercises the
two-step form, but it does not test the cross-origin redirect, the host pinning, or the
two-domain cookie capture. It is called out on the page rather than degrading quietly, because a
green run that silently skipped the interesting half is worse than a red one.

**In the portal**, pick *Single sign on*, use `agent@velt.dev` / `velt-sso-2026`, and press
**Test access** once. The provider is not a recognised identity provider, so Superflow will stop
and ask whether that host is really your sign-in page — that is the vanity-domain path most
customers with their own SSO address will hit. Confirm it once and the host is pinned; later
agent runs check against that pin and never bootstrap on their own.

**`/sso-mfa` is designed to fail.** The password is accepted and then a second factor is
demanded, which an agent cannot satisfy. A correct run reports *MFA required* and tells you to
exempt the service account; reporting *wrong password* would send someone hunting for a typo
that is not there. There is no valid code, so this area is never reachable.

### Testing against a real Okta tenant

Nothing here needs to change. Point a project at any Okta-protected URL, use a service account
that is exempt from MFA, and press Test access. The mock exists so the code paths can be
exercised without waiting on an Okta tenant to be provisioned — it is not a replacement for one
final check against a real provider before shipping.

## Clean vs buggy builds (Superflow QA loop demo)

The homepage exists in two variants under `variants/`:

- `home.buggy.tsx`: seeded with spelling mistakes, a wrong hero headline ("An Unique"), and a page title with a trailing "Yes". This is what the Superflow QA agents are supposed to catch.
- `home.clean.tsx`: the fixed version that passes spell check and the UAT checklist.

To switch the deployed site, run the "Set site mode" workflow (Actions tab, or `gh workflow run site-mode.yml -f mode=clean|buggy`). It copies the chosen variant over `app/page.tsx`, commits, and pushes; Vercel deploys the push. Edit the variants, never `app/page.tsx` directly.

## QA loop test

`scripts/qa-loop-test.mjs` exercises the whole Superflow QA loop against this site: buggy build must fail the QA pass, clean build must pass it, and (optionally) a Jira ticket must receive the findings comment, labels, and status moves.

```bash
VELT_API_KEY=... VELT_AUTH_TOKEN=... node scripts/qa-loop-test.mjs                # Superflow half only
VELT_API_KEY=... VELT_AUTH_TOKEN=... JIRA_EMAIL=... JIRA_API_TOKEN=... node scripts/qa-loop-test.mjs   # full loop incl. Jira
```

Needs Node 18+ and an authenticated `gh` CLI (for the site-mode workflow). Exits non-zero when any check fails; the site is restored to buggy mode at the end.

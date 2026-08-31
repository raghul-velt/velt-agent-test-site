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
| `/okta` | Single sign on | your Okta service account | The same mode against a **real** Okta tenant |

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
- `OKTA-AREA-MARKER-8856`

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

### `/okta` — a real Okta tenant

`/sso` and `/okta` are the same mode against different providers, and they deliberately test
**different halves of the trust model**:

| | Provider host | What Test access does |
|---|---|---|
| `/sso` | `velt-agent-test-idp.vercel.app` | Not a recognised provider, so it stops and asks you to confirm the host. The vanity-domain path. |
| `/okta` | `dev-XXXXXXXX.okta.com` | `okta.com` is on Superflow's allowlist, so it signs in directly and pins the host. The bootstrap path. |

Only one branch can be exercised at a time, which is why both areas exist. `/okta` also runs
against Okta's real sign-in UI, so if Okta changes its markup the identifier-first driver finds
out here and nowhere else.

#### 1. Create a free Okta org

Sign up at <https://developer.okta.com/signup/>. You get an admin console at
`https://dev-XXXXXXXX-admin.okta.com` and an issuer at `https://dev-XXXXXXXX.okta.com`.

#### 2. Create the OIDC app

**Applications → Applications → Create App Integration**

- Sign-in method: **OIDC — OpenID Connect**
- Application type: **Web Application**
- Grant type: **Authorization Code**
- Sign-in redirect URI: `https://velt-agent-full-test.vercel.app/okta/callback`
- Sign-out redirect URI: `https://velt-agent-full-test.vercel.app/`

Save, then copy the **Client ID** and **Client secret**.

The redirect URI has to match exactly. A mismatch is rejected by Okta with a message that does
not obviously point back at this setting, so check it first when a sign-in fails.

#### 3. Create the service account

**Directory → People → Add person**

- Username: something like `superflow-agent@velt.dev` (Okta wants an email shape)
- Password: **Set by admin**, and **untick "User must change password on first sign-in"**

That tickbox is the single most common reason this fails. Left on, the agent is sent to a
change-password screen it cannot complete, and the run reports a sign-in that did not finish
rather than anything about passwords.

Then **Directory → Groups → Add group** `superflow-agents`, add the person to it, and assign the
group to the app under the app's **Assignments** tab.

#### 4. Exempt the account from MFA

An agent has no phone and no authenticator app, so every factor prompt is a dead end. Three
places can demand one, and all three need a rule for `superflow-agents`:

1. **Security → Authentication Policies** → the policy bound to your app → add a rule above the
   catch-all: group `superflow-agents`, **Password only**.
2. **Security → Global Session Policy** → add a rule above the default: group
   `superflow-agents`, **MFA not required**.
3. **Security → Authenticators → Enrollment** → add a rule so `superflow-agents` is not required
   to enrol an additional authenticator.

Miss the third and the agent lands on "Set up security methods", which is an enrolment screen
rather than a challenge screen. Superflow reports that as a sign-in that did not complete, not
as MFA, because the wording it scans for is not there.

#### 5. Point this site at the tenant

On the Vercel project:

| Variable | Value |
|---|---|
| `OKTA_ISSUER` | `https://dev-XXXXXXXX.okta.com` (or `.../oauth2/default`) |
| `OKTA_CLIENT_ID` | from step 2 |
| `OKTA_CLIENT_SECRET` | from step 2 |
| `OKTA_REDIRECT_URI` | optional; only if the site answers on more than one hostname |

Endpoints are read from the tenant's discovery document, so either issuer form works and there
are no paths to paste. Redeploy, then open `/okta`: it should bounce to your Okta sign-in.

If it shows **"Okta is not configured"**, the env vars did not reach the deployment. If it shows
**"Okta is configured but not reachable"**, the message names the issuer it tried.

#### 6. Test it

In the portal, point a project at `https://velt-agent-full-test.vercel.app/okta`, choose
**Single sign on (Okta, SAML)**, enter the service account and its password, and press
**Test access**.

Expect it to sign in **without** asking you to confirm a host — that is the difference from
`/sso`. If it does ask, your org is on a custom domain, which is the vanity-domain case and is
also fine; confirm it once.

Then run an agent. Findings quoting `OKTA-AREA-MARKER-8856`, or the planted mistakes on that page
("recieve", "seperate key", "A anual"), mean the whole round trip worked.

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

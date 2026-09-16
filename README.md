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
- `OKTA-HELP-INDEX-MARKER-8900`, `OKTA-ARTICLE-101-MARKER-9101`, `-102-MARKER-9102`,
  `-103-MARKER-9103`, `OKTA-ARTICLE-101-FR-MARKER-9111`, `OKTA-ARTICLE-NOID-MARKER-9000`,
  `OKTA-ARTICLE-MISSING-MARKER-9404`, `OKTA-GUIDE-INSTALL-MARKER-9201`,
  `-CONFIGURE-MARKER-9202`, `-FAQ-MARKER-9203`, `OKTA-RELNOTES-P1-MARKER-9301`,
  `-P2-MARKER-9302`, `-P3-MARKER-9303`, `OKTA-RELNOTES-END-MARKER-9399`,
  `OKTA-TOPIC-SECURITY-MARKER-9401`, `-STORAGE-MARKER-9402`, `-BILLING-MARKER-9403`,
  `OKTA-SEARCH-ALERTS-MARKER-9501`, `-KEYS-MARKER-9502`, `-AUDIT-MARKER-9503`,
  `OKTA-SEARCH-EMPTY-MARKER-9599`, `OKTA-SEARCH-PROMPT-MARKER-9500`: the
  query-param pages, see [below](#query-param-pages-under-okta)

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

### Query-param pages under `/okta`

A Salesforce Experience Cloud community serves most of its pages as **one path with a
different query string**: `/s/article?id=…`, `/s/guide?tab=…`. Superflow's crawler folds every
variant into one address, and a finding is pinned to the path alone, so on a project with
**"Consider URL query params as separate pages"** switched on the pins never show. These pages
exist to test both halves of that, behind the real Okta tenant.

Turn that setting on for the staging project this site is wired to, then run an agent with the
**exact** address, query string included. Every page has its own marker and its own planted
mistakes, and no two pages share a mistake, so a finding always names the page it came from.
If a finding about `seperate` shows up on `?id=101`, it came from article 102 and the pin landed
on the wrong page.

**The mistakes-per-page rule.** A content page carries **three** planted misspellings: each
article, each release-notes page, each topic listing. A search result set carries **two**. A
fall-back page (no id, no such id, past the end of the list, no results, nothing searched for)
carries **one**, the marker being the point of those. The older guide tabs predate the rule and
carry two or three, so read the count off the table rather than assuming. No misspelling is
used twice anywhere on this site, none of them sits inside a marker or a URL, and every one is
a real word spelt wrong rather than a typo a spell checker would skip over. That makes the
count itself a signal: three mistakes that all belong to one row is a clean read, and a mix of
rows in one finding means the address the agent read was not the address you gave it.

| Address | What it is | Planted, spelling | Planted, other |
|---|---|---|---|
| `/okta/articles` | Index of everything below, so a crawl that keeps query strings has links to follow | `artical`, `knowlege` | |
| `/okta/article?id=101` | SharePoint upload alerts | `recieve`, `seperately`, `occurence` | `you wants`, `less alerts`, `The alert are`; dead external link; link to `?id=404` |
| `/okta/article?id=102` | Rotate API keys | `enviroment`, `definately`, `accomodate` | `Each keys is`, `should of`; lorem ipsum paragraph; dead external link |
| `/okta/article?id=103` | Reading the audit log | `wich`, `untill`, `adress` | `them logs`, `was went`; dead relative link to a PDF |
| `/okta/article?id=102&lang=en` | Article 102 with an extra param | as 102 | a **different page key** from `?id=102` |
| `/okta/article?lang=en&id=102` | Same params, other order | as 102 | a different page key again: order is part of the key |
| `/okta/article?id=101&utm_source=newsletter` | Article 101 via a tracking link | as 101 | a different page key from `?id=101` |
| `/okta/article?id=999` | An id that does not exist | `requsted` | answers **HTTP 200** with a not-found body, like a retired community record |
| `/okta/article` | No id at all | `avaliable` | the path alone is not a page |
| `/okta/guide?tab=install` | Tabbed guide, Install | `Instalation`, `prerequisits` | `you needs`; dead external link |
| `/okta/guide?tab=configure` | Tabbed guide, Configure | `configuartion`, `seperate`, `ninty` | `The settings is` |
| `/okta/guide?tab=faq` | Tabbed guide, FAQ | `Occassionally`, `recomend` | `There is many` |
| `/okta/guide` | No tab, defaults to Install | as install | |
| `/okta/article?id=101&lang=fr` | Article 101 in French, the one `lang` value that changes the content | `recevior`, `séparement`, `aparition` | different **content**, not just a different page key: a run that drops `lang` reviews the English article |
| `/okta/release-notes?page=1` | Release notes, page 1 of 3 | `improvments`, `perfomance`, `betwen` | Prev and Next links carry `page` |
| `/okta/release-notes?page=2` | Release notes, page 2 | `dashbord`, `retreive`, `paramter` | |
| `/okta/release-notes?page=3` | Release notes, page 3 | `compatability`, `trafic`, `elligible` | Next points past the end, on purpose |
| `/okta/release-notes?page=9` | Past the end of the list | `futher` | answers **HTTP 200** with a "No more notes" body |
| `/okta/release-notes?page=two` | Not a number | as page 1 | falls back to page 1 and says why |
| `/okta/release-notes` | No page at all | as page 1 | falls back to page 1 |
| `/okta/topic?category=security&sort=newest` | Topic listing, security, newest first | `authetication`, `vulnerabilty`, `priviledge` | **two** params, both load bearing |
| `/okta/topic?category=security&sort=oldest` | Same list, reversed | as security | a different page: the order of the articles and the sentence "Oldest first." both change |
| `/okta/topic?sort=oldest&category=security` | Same two params, other order | as security | same content as the row above, a different page key |
| `/okta/topic?category=storage&sort=newest` | Topic listing, storage | `bandwith`, `threshhold`, `compresion` | `&sort=oldest` reverses it |
| `/okta/topic?category=billing&sort=newest` | Topic listing, billing | `invoce`, `subcription`, `curency` | `&sort=oldest` reverses it |
| `/okta/topic?category=hardware` | An unknown category | as security | falls back to security, says so, and defaults the sort to newest |
| `/okta/topic` | Neither param | as security | security and newest, and says both are defaults |
| `/okta/search?q=alerts` | Search results for alerts | `notifcation`, `imediately` | **two** misspellings, results link to the article pages |
| `/okta/search?q=keys` | Search results for keys | `credentails`, `certifcate` | |
| `/okta/search?q=audit` | Search results for audit | `histroy`, `complience` | |
| `/okta/search?q=quotas` | A query with no results | `mispelled` | answers **HTTP 200**, and the echoed query is escaped, so `?q=<script>` stays text |
| `/okta/search` | Nothing searched for | `begining` | the search prompt, not a result set |

The Okta redirect keeps the query string on the way back (`proxy.ts` sends
`next=/okta/article?id=101`, not just the path), so signing in lands on the page that was asked
for. Without that, a sign-in from a query-param address would come back to the no-id page and
every run would review `OKTA-ARTICLE-NOID-MARKER-9000` instead of the article.

Three things these pages let you check, in order:

1. **Reading.** Run on `?id=101` and `?id=102`. Findings should quote different markers and
   different mistakes. Same findings on both means the query string was dropped before the page
   loaded.
2. **Pinning.** Open the reviewed page with the toolbar. Pins that are in the database but not on
   the page mean the pin key was built from the path alone.
3. **Discovery.** Run with "run on every page" from `/okta/articles`. A crawl that keeps query
   strings reaches all three articles and all three tabs; one that drops them reaches one of
   each.
4. **More than one param.** Run on `?category=security&sort=newest` and
   `?category=security&sort=oldest`. Both answer, the article order is reversed and one visible
   sentence differs, so a run that reports a single topic page kept `category` and threw `sort`
   away. `?sort=oldest&category=security` is the same content again at a third page key, which
   is what tells you whether the key is built from the raw query string or from sorted params.
5. **Translation.** Run on `?id=101` and `?id=101&lang=fr`. The findings should be in different
   languages. Identical English findings on both mean `lang` never reached the page.

## Mock Salesforce API

Superflow is building a Salesforce connector: OAuth 2.0 client credentials, then SOQL over the
REST API, to list a help site's pages and their last-modified dates. Nobody on the team has an
org to point staging at, so this site impersonates the endpoints the connector calls. Every
record it serves names a page that already exists here, so a run can go straight from "the API
says this changed" to actually reviewing it.

```
Login URL:        https://velt-agent-full-test.vercel.app/mock-salesforce
Consumer key:     mock-client-id
Consumer secret:  mock-client-secret
Grant type:       client_credentials
```

Overridable with `MOCK_SF_CLIENT_ID` and `MOCK_SF_CLIENT_SECRET`, like every other credential
on this site, so the rejected-credentials path can be tested without editing code.
`MOCK_SF_PAGE_SIZE` (default 2) sets the rows per page.

The paths mirror Salesforce exactly, which is the whole trick: a connector configured with that
login URL appends `/services/oauth2/token` just as it would against `login.salesforce.com` and
needs no mock-specific branch.

| Method and path | What it is |
|---|---|
| `POST /mock-salesforce/services/oauth2/token` | Client-credentials token. Form-encoded or JSON. |
| `GET /mock-salesforce/services/data/vNN.N/query?q=<SOQL>` | First page of a query. |
| `GET /mock-salesforce/services/data/vNN.N/query/<cursor>` | Every page after the first. |
| `GET /mock-salesforce/services/data/vNN.N/limits` | The connection test. |
| `GET /mock-salesforce` | This documentation as a page. Marker `MOCK-SALESFORCE-MARKER-9700`. |

**It is not behind Okta, and must not be.** `/mock-salesforce/*` is deliberately left out of
`proxy.ts`'s matcher: the connector is a server with no browser and no cookie jar, so anything
that bounces it to a sign-in screen turns every API call into an HTML page. The pages the
records point at *are* behind Okta, which is the interesting combination. The API says which
pages to review, Site Access is what gets a run in to read them.

### The token expires every hour, on purpose

The token is derived, not stored, because the functions serving this share no memory and a
token held in a map on one instance would be rejected by the next. It is `mock.` followed by
base64url of the SHA-256 of `clientId:clientSecret:YYYY-MM-DDTHH` in UTC. Reads accept the
current hour and the previous one, so any token is good for between one and two hours.

That is the point rather than a limitation. Salesforce does not return `expires_in` for the
client-credentials flow and neither does this, so the only correct client strategy is to
re-mint on a `401` and retry once. Here that path runs at least once an hour instead of never.

### One record per object is always fresh

Article `102` and question `faq` carry the start of the current UTC hour as their
`LastModifiedDate` (and `LastPublishedDate` for the article). Everything else is pinned to a
fixed date in August 2026. So a query filtered on `WHERE LastModifiedDate > (an hour ago)`
returns exactly one record per object, on any day, with no admin endpoint needed to poke the
data first. That is what makes a "review only the pages that changed" flow demonstrable.

### Objects, and the URL templates they feed

| Object | Records | URL template to configure in Superflow |
|---|---|---|
| `Knowledge__kav` (also `KnowledgeArticleVersion`) | `UrlName` 101, 102, 103, titles matching the articles | `/okta/article?id={UrlName}` |
| `FeedItem` | three `QuestionPost` rows, ids `install`, `configure`, `faq` | `/okta/guide?tab={Id}` |

The `FeedItem` ids are tab names rather than 18-character Salesforce ids. That is deliberate:
the template has to land on a page that really exists on this site.

Only `FROM <object>`, `LIMIT n`, and a `LastModifiedDate > ...` or `LastPublishedDate > ...`
comparison are read out of the query. The SELECT list, ORDER BY and every other WHERE clause
are ignored, so a connector can send its real query and still get a sensible answer. Records
always come back in id order.

### Curl walkthrough

```bash
BASE=https://velt-agent-full-test.vercel.app/mock-salesforce   # or http://localhost:3000/mock-salesforce

# 1. Token. Note there is no expires_in, and instance_url is read from the body, not assumed.
curl -s -X POST "$BASE/services/oauth2/token" \
  -H 'content-type: application/x-www-form-urlencoded' \
  -d 'grant_type=client_credentials&client_id=mock-client-id&client_secret=mock-client-secret'
# {"access_token":"mock.a2Zr3J…","instance_url":"…/mock-salesforce","id":"…/id/00DMOCK0000000001/005MOCK0000000001",
#  "token_type":"Bearer","issued_at":"1789534632371","signature":"mock"}

TOKEN=mock.a2Zr3J…

# 2. Connection test.
curl -s "$BASE/services/data/v59.0/limits" -H "Authorization: Bearer $TOKEN"
# {"DailyApiRequests":{"Max":15000,"Remaining":14990}}

# 3. Query. Two records plus a nextRecordsUrl, because the page size is 2.
curl -s --get "$BASE/services/data/v59.0/query" -H "Authorization: Bearer $TOKEN" \
  --data-urlencode "q=SELECT Id, UrlName, Title, LastModifiedDate FROM Knowledge__kav ORDER BY LastModifiedDate DESC"
# {"totalSize":3,"done":false,"records":[…101…,…102…],
#  "nextRecordsUrl":"/services/data/v59.0/query/eyJvIjoiS25vd2xlZ…"}

# 4. Next page. nextRecordsUrl is a PATH relative to instance_url, exactly like Salesforce,
#    so it is joined on rather than used as an absolute URL.
curl -s "$BASE/services/data/v59.0/query/eyJvIjoiS25vd2xlZ…" -H "Authorization: Bearer $TOKEN"
# {"totalSize":3,"done":true,"records":[…103…]}

# 5. Changed since. Returns exactly one record whatever hour you run it.
curl -s --get "$BASE/services/data/v59.0/query" -H "Authorization: Bearer $TOKEN" \
  --data-urlencode "q=SELECT Id, UrlName FROM FeedItem WHERE LastModifiedDate > 2026-09-16T02:00:00Z"
# {"totalSize":1,"done":true,"records":[{… "Id":"faq" …}]}

# 6. The 401. An ARRAY, not an object. This is the body a client's
#    "is this a session problem or a data problem" branch keys off.
curl -s -i "$BASE/services/data/v59.0/limits" -H 'Authorization: Bearer mock.stale'
# HTTP/1.1 401 Unauthorized
# [{"message":"Session expired or invalid","errorCode":"INVALID_SESSION_ID"}]

# 7. Bad credentials at the token endpoint use the OAuth shape instead, an object.
curl -s -X POST "$BASE/services/oauth2/token" \
  -d 'grant_type=client_credentials&client_id=mock-client-id&client_secret=wrong'
# {"error":"invalid_client","error_description":"invalid client credentials"}
```

Other answers worth knowing: an unknown object is `400`
`[{"message":"sObject type 'Account' is not supported.","errorCode":"INVALID_TYPE"}]`, a query
with no `FROM` or a missing `q` is `400` `MALFORMED_QUERY`, a cursor this deployment did not
mint is `400` `INVALID_QUERY_LOCATOR`, and a malformed API version such as `59.0` instead of
`v59.0` is `404` `NOT_FOUND`.

### Where it deviates from a real org

Worth knowing before you trust a green run here:

- **Cursors are self-describing.** Salesforce cursors are `01gRO0000016PIAYA2-2000`, a query
  locator backed by server state. There is no server state here, so the whole query context
  travels inside the cursor as base64url JSON. A client must treat it as opaque either way; the
  visible difference is length.
- **Ids are not real ids.** `FeedItem` ids are tab names and the article ids are 20 characters
  rather than 15 or 18. A client that validates id shape will reject them.
- **Nothing is really parsed.** A broken SOQL query is answered rather than rejected, so this
  mock will never catch a syntax error for you.
- **`LastPublishedDate` on `FeedItem`** falls back to `LastModifiedDate` instead of erroring.
  A real org answers `INVALID_FIELD`.
- **The token endpoint takes credentials in the body only.** Real Salesforce also accepts HTTP
  Basic client authentication.
- **`limits` is static** and reports only `DailyApiRequests`. Nothing counts calls, so the
  remaining count never moves, and a real org returns a few dozen other limits alongside it.
- **The org is single-tenant and read-only.** There are no `sobjects` endpoints, no describe,
  no writes, and the `id` identity URL in the token response is not served by anything.

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

Three areas are locked, one per access mode Superflow supports. Paste the matching values
into a project's **Site access** settings in the portal, switch on *This project is password
protected*, and run an agent.

| Path | Mode to pick | Credentials | What it proves |
|---|---|---|---|
| `/gated` | Single password | `velt-gate-2026` | The Webflow-shaped gate |
| `/basic` | Username and password (HTTP auth) | `velt` / `velt-basic-2026` | HTTP Basic on every request |
| `/members` | Username and password (login form) | `agent@velt.dev` / `velt-form-2026` | Generic form fill and submit |

Credentials are hard-coded on purpose. Nothing real is behind these gates. Each can be
overridden by an env var (`GATE_PASSWORD`, `BASIC_USERNAME`, `BASIC_PASSWORD`,
`MEMBER_USERNAME`, `MEMBER_PASSWORD`) if you want to test the wrong-password path without
editing code.

### Reading the result

Each protected page carries a unique marker sentence:

- `GATED-AREA-MARKER-7781`
- `BASIC-AREA-MARKER-4420`
- `MEMBER-AREA-MARKER-9052`

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

## Clean vs buggy builds (Superflow QA loop demo)

The homepage exists in two variants under `variants/`:

- `home.buggy.tsx`: seeded with spelling mistakes, a wrong hero headline ("An Unique"), and a page title with a trailing "Yes". This is what the Superflow QA agents are supposed to catch.
- `home.clean.tsx`: the fixed version that passes spell check and the UAT checklist.

To switch the deployed site, run the "Set site mode" workflow (Actions tab, or `gh workflow run site-mode.yml -f mode=clean|buggy`). It copies the chosen variant over `app/page.tsx`, commits, and pushes; Vercel deploys the push. Edit the variants, never `app/page.tsx` directly.

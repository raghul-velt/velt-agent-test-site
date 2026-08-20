#!/usr/bin/env node
/**
 * End-to-end test for the Superflow x Jira QA loop.
 *
 * Always tests the Superflow half: buggy site -> QA pass fails -> clean site
 * -> QA pass succeeds, asserting agent verdicts and webhook-node delivery.
 * When JIRA_EMAIL + JIRA_API_TOKEN are set it also drives and asserts the
 * Jira half: creates a ticket, moves it through QA/Fix, and checks the
 * comments and labels the automation rules write back.
 *
 * Usage:
 *   VELT_API_KEY=... VELT_AUTH_TOKEN=... node scripts/qa-loop-test.mjs
 *
 * Env (defaults in parentheses):
 *   VELT_BASE      (https://staging.velt.dev)
 *   DEFINITION_ID  (jira-uat-qa)
 *   ORG_ID         (rNYzMJd13L27xtfipmSK)
 *   DOC_ID         (3141301152185640)
 *   SITE_URL       (https://velt-agent-full-test.vercel.app)
 *   SITE_REPO      (raghul-velt/velt-agent-test-site)  -- gh CLI must be authed
 *   JIRA_BASE, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT (KAN)  -- optional
 */
import { execSync } from "node:child_process";

const env = (k, d) => process.env[k] ?? d;
const VELT_BASE = env("VELT_BASE", "https://staging.velt.dev");
const API_KEY = env("VELT_API_KEY");
const AUTH_TOKEN = env("VELT_AUTH_TOKEN");
const DEFINITION_ID = env("DEFINITION_ID", "jira-uat-qa");
const ORG_ID = env("ORG_ID", "rNYzMJd13L27xtfipmSK");
const DOC_ID = env("DOC_ID", "3141301152185640");
const SITE_URL = env("SITE_URL", "https://velt-agent-full-test.vercel.app");
const SITE_REPO = env("SITE_REPO", "raghul-velt/velt-agent-test-site");
const JIRA_BASE = env("JIRA_BASE", "https://velt-team-veg2bemm.atlassian.net");
const JIRA_EMAIL = env("JIRA_EMAIL");
const JIRA_TOKEN = env("JIRA_API_TOKEN");
const JIRA_PROJECT = env("JIRA_PROJECT", "KAN");
const jiraEnabled = Boolean(JIRA_EMAIL && JIRA_TOKEN);

if (!API_KEY || !AUTH_TOKEN) {
  console.error("VELT_API_KEY and VELT_AUTH_TOKEN are required");
  process.exit(2);
}

const CHECKLIST =
  "1. The page title must be exactly 'TechNova Solutions — Developer Infrastructure Platform' with no extra trailing words. " +
  "2. The hero headline must read 'A Unique Developer Infrastructure for the Modern Era' (correct article usage).";

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "  PASS" : "  FAIL"}  ${name}${detail ? ` (${detail})` : ""}`);
  return ok;
};
const warn = (msg) => console.log(`  warn  ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function velt(path, data) {
  const res = await fetch(`${VELT_BASE}${path}`, {
    method: "POST",
    headers: {
      "x-velt-api-key": API_KEY,
      "x-velt-auth-token": AUTH_TOKEN,
      "content-type": "application/json",
    },
    body: JSON.stringify({ data }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
  return body.result ?? body;
}

async function jira(method, path, body) {
  const res = await fetch(`${JIRA_BASE}${path}`, {
    method,
    headers: {
      authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString("base64")}`,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Jira ${method} ${path} -> ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

// Superflow's context-gathering cache holds fetched page content for ~120s
// (strategyCacheTtlMs). A QA pass dispatched within that window of a previous
// pass on the same URL evaluates the CACHED page, not the fresh deploy - so
// after switching site content we wait out the TTL before dispatching again.
const CACHE_SETTLE_MS = Number(env("CACHE_SETTLE_MS", 150000));

async function setSiteMode(mode, { settle = true } = {}) {
  console.log(`- site mode -> ${mode}`);
  execSync(`gh workflow run site-mode.yml --repo ${SITE_REPO} -f mode=${mode}`, { stdio: "inherit" });
  const wantYes = mode === "buggy";
  for (let i = 0; i < 24; i++) {
    await sleep(15000);
    const html = await fetch(SITE_URL).then((r) => r.text()).catch(() => "");
    const title = (html.match(/<title>([^<]*)<\/title>/) ?? [])[1] ?? "";
    if (/\bYes\s*$/.test(title.trim()) === wantYes) {
      console.log(`  site is ${mode} (title: ${title.trim()})`);
      if (settle) {
        console.log(`  waiting ${CACHE_SETTLE_MS / 1000}s for the agent strategy cache to expire`);
        await sleep(CACHE_SETTLE_MS);
      }
      return;
    }
  }
  throw new Error(`site did not reach ${mode} mode in time`);
}

async function dispatch(correlationId) {
  const r = await velt("/v2/workflow/executions/dispatch", {
    definitionId: DEFINITION_ID,
    correlationId,
    idempotencyKey: `${correlationId}-${Date.now()}`,
    organizationId: ORG_ID,
    documentId: DOC_ID,
    triggerContext: {
      page: { url: SITE_URL },
      ticket: { key: correlationId, summary: "QA loop test", uatInstructions: CHECKLIST, url: `${JIRA_BASE}/browse/${correlationId}` },
    },
  });
  console.log(`  dispatched ${r.executionId}`);
  return r.executionId;
}

async function latestExecutionFor(correlationId, notBefore) {
  const r = await velt("/v2/workflow/executions/list", { definitionId: DEFINITION_ID });
  const hits = (r.items ?? [])
    .filter((e) => e.correlationId === correlationId && (e.startedAt ?? 0) >= notBefore)
    .sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));
  return hits[0]?.executionId ?? null;
}

async function waitExecution(executionId) {
  for (let i = 0; i < 12; i++) {
    await sleep(30000);
    const r = await velt("/v2/workflow/executions/get", { executionId });
    const status = (r.execution ?? r).status;
    if (["completed", "failed", "cancelled"].includes(status)) return r;
  }
  throw new Error(`execution ${executionId} did not finish in time`);
}

function stepMap(view) {
  const map = {};
  for (const s of view.steps ?? []) map[s.nodeId] = s;
  return map;
}

async function runPass({ label, correlationId, expect, viaJira }) {
  console.log(`- QA pass (${label})`);
  const t0 = Date.now();
  let executionId = null;

  if (viaJira) {
    // Enter QA the way a human/factory does: status + label. Two discrete label
    // edits (clear, then pure add) so Rule 1's conditions see a clean snapshot.
    const transitions = await jira("GET", `/rest/api/2/issue/${correlationId}/transitions`);
    const qa = transitions.transitions.find((t) => t.to.name === "QA");
    if (qa) await jira("POST", `/rest/api/2/issue/${correlationId}/transitions`, { transition: { id: qa.id } });
    await jira("PUT", `/rest/api/2/issue/${correlationId}`, { fields: { labels: [] } });
    await sleep(8000);
    await jira("PUT", `/rest/api/2/issue/${correlationId}`, { fields: { labels: ["qa"] } });
    for (let i = 0; i < 6 && !executionId; i++) {
      await sleep(15000);
      executionId = await latestExecutionFor(correlationId, t0);
    }
    if (!executionId) {
      warn("Jira Rule 1 (QA-dispatch) did not dispatch within 90s; dispatching directly instead");
      executionId = await dispatch(correlationId);
    } else {
      console.log(`  Rule 1 dispatched ${executionId}`);
    }
  } else {
    executionId = await dispatch(correlationId);
  }

  const view = await waitExecution(executionId);
  const steps = stepMap(view);
  const spell = steps["qa-spell"]?.output ?? {};
  const uat = steps["qa-uat"]?.output ?? {};
  const report = steps[expect === "fail" ? "report-findings" : "report-pass"]?.output ?? {};
  const otherReport = steps[expect === "fail" ? "report-pass" : "report-findings"];

  const wantDecision = expect === "fail" ? "reject" : "approve";
  check(`${label}: spell-check decision is ${wantDecision}`, spell.decision === wantDecision, `got ${spell.decision}, findings ${spell.agentResultsSummary?.totalFindings}`);
  check(`${label}: UAT checker decision is ${wantDecision}`, uat.decision === wantDecision, `got ${uat.decision}, findings ${uat.agentResultsSummary?.totalFindings}`);
  check(`${label}: ${expect === "fail" ? "report-findings" : "report-pass"} delivered to Jira`, report.httpStatus === 200, `HTTP ${report.httpStatus}`);
  check(`${label}: other report branch did not run`, !otherReport || otherReport.status === "skipped" || !otherReport.startedAt, otherReport?.status ?? "absent");
  return executionId;
}

async function assertJiraAfter({ label, key, commentNeedle, wantLabel, wantStatus }) {
  for (let i = 0; i < 8; i++) {
    await sleep(10000);
    const issue = await jira("GET", `/rest/api/2/issue/${key}?fields=labels,status,comment`);
    const comments = issue.fields.comment.comments.map((c) => c.body ?? "").join("\n");
    if (comments.includes(commentNeedle)) {
      check(`${label}: Jira comment contains "${commentNeedle}"`, true);
      check(`${label}: label ${wantLabel} present`, issue.fields.labels.includes(wantLabel), issue.fields.labels.join(","));
      const status = issue.fields.status.name;
      if (status === wantStatus) check(`${label}: status is ${wantStatus}`, true);
      else warn(`${label}: status is ${status}, expected ${wantStatus} (transition action not added to the rule yet?)`);
      return;
    }
  }
  check(`${label}: Jira comment contains "${commentNeedle}"`, false, "not found in time");
}

const main = async () => {
  console.log(`QA loop test -> ${VELT_BASE} / ${DEFINITION_ID} / site ${SITE_URL}`);
  console.log(`Jira half: ${jiraEnabled ? `enabled (${JIRA_BASE}, project ${JIRA_PROJECT})` : "disabled (set JIRA_EMAIL + JIRA_API_TOKEN to enable)"}`);

  let ticketKey = `LOOPTEST-${Date.now().toString(36).toUpperCase()}`;
  if (jiraEnabled) {
    const created = await jira("POST", "/rest/api/2/issue", {
      fields: {
        project: { key: JIRA_PROJECT },
        issuetype: { name: "Task" },
        summary: "QA loop test ticket (automated)",
        description: `${CHECKLIST}\n\nDeployed URL: ${SITE_URL}\n(Created by scripts/qa-loop-test.mjs; safe to delete.)`,
      },
    });
    ticketKey = created.key;
    console.log(`- created ticket ${ticketKey}`);
  }

  await setSiteMode("buggy");
  await runPass({ label: "buggy pass", correlationId: ticketKey, expect: "fail", viaJira: jiraEnabled });
  if (jiraEnabled) await assertJiraAfter({ label: "buggy pass", key: ticketKey, commentNeedle: "FAILED", wantLabel: "ai-fix", wantStatus: "Fix" });

  await setSiteMode("clean");
  await runPass({ label: "clean pass", correlationId: ticketKey, expect: "pass", viaJira: jiraEnabled });
  if (jiraEnabled) await assertJiraAfter({ label: "clean pass", key: ticketKey, commentNeedle: "UAT passed", wantLabel: "uat-passed", wantStatus: "Done" });

  await setSiteMode("buggy", { settle: false });

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
};

main().catch((e) => {
  console.error("\nLOOP TEST ERROR:", e.message);
  process.exit(1);
});

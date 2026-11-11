---
type: path
track: Tours
time: ~6.5 h
projects: ["[[Homelab UI]]"]
tags: [path, tour]
updated: 2026-11-11
---

# Path - Tour of Homelab UI

> **Goal:** know homelab-ui end to end — every page and what it calls, how the code is organised, how state and streaming work, how it ships — and the principles it's built on.
> **Time:** ~6.5 h. **Before:** [[Path - Tour of the homelab]] helps. **Then:** [[Path - Tour of the agent runtime]] · [[Path - The frontend]]. **All paths:** [[Paths]]

How each lesson works: **Learn** → **Do** (👀 looks, ✋ changes) → **Check** → **You can now**.

## 1. What it is, and why · ~45 min

### Learn
**Definitions**
- **Single-page application (SPA)** — one HTML page plus JavaScript that swaps views in the browser and fetches data from APIs ([[Single-page application]]).
- **Control center** — the first page: what needs attention, then the server, data, LLM, Kubernetes, busiest containers, errors, apps.
- **Assistant drawer** — the agent beside every page except `/agent`, sharing one conversation with the Agent page.
- **Tasker** — a canvas of blocks (Trigger, HTTP, Code, Transform, Output) run in the browser, saved per account.

**How it works**
homelab-ui is one static app served by nginx in a pod, behind Caddy. Everything it shows comes from the tools' own APIs through the gateway's `/api/<tool>/` routes — the browser only ever talks to one HTTPS origin with one session cookie.

**Example from our projects** — the pages and what they call:
| Page | Route | Calls |
|---|---|---|
| Control center, Status | `/`, `/status` | `/api/prometheus`, `/api/health/<name>` |
| Dashboards, Metrics | `/dashboards/:id`, `/metrics` | `/api/prometheus` |
| Logs, Traces | `/logs`, `/traces` | `/api/loki`, `/api/tempo` |
| Kafka, Pipeline, Models | `/kafka`, `/pipeline`, `/models` | `/api/kafka`, `/api/alloy`, `/api/llm` |
| Tools | `/tools` | `/api/toolbox/mcp` (MCP over HTTP) |
| Account, Kubernetes | `/account`, `/kubernetes` | `/api/account`, `/api/kube` (admins) |
| Agent, assistant | `/agent` | `/api/agent/v1/stream`, `/api/agent/v1/models` |
| Tasker | `/tasker` | `/api/tasker` (PostgREST) |

**Common mistake** — expecting every page to work under `npm start` on your Mac. Only the agent does: the other APIs exist only behind the gateway.

### Do
👀 Visit every page from the menu once; open the assistant drawer on the Logs page and ask about a log line.

### Check
1. Why rebuild each tool as a page instead of embedding it in an iframe?
> [!success]- Answer
> Iframes can't share the theme, the layout or the assistant drawer, and they bring framing and cookie problems. Native pages give one coherent control center with the agent beside every page ([[Homelab UI decisions]]).

**You can now:** say what every page shows and which API it calls.

## 2. Every page, what it's for · ~1.5 h

### Learn
**Definitions**
- **Route** — the path after the domain that picks the page (`/logs`); each route lazy-loads one *feature* folder (`src/app/features/loki/`).
- **Signal of the system** (not Angular's signals) — the three kinds of telemetry: **metrics** (numbers over time → Dashboards, Metrics), **logs** (lines of text → Logs), **traces** (one request's path through services → Traces) ([[Observability]]).
- **Summary page vs query page** — a summary page answers a fixed question with no typing (Control center, Status, Dashboards); a query page answers *your* question in a query language (Metrics: PromQL, Logs: LogQL, Traces: TraceQL).
- **Admin-only** — pages or actions that need the `role:admin` group at the gateway: the Kubernetes page, Kafka changes, unloading models.

**How it works**
The pages fall into groups by the question they answer — learn the question, and you know where to go:
```text
Is it healthy?       Control center · Status
Why did it break?    Kubernetes (events, logs, shell) · Logs · Traces
How is it trending?  Dashboards · Metrics · Pipeline (is it even collected?)
AI                   Agent · Assistant · Models · Tools
Data in motion       Kafka
Do it for me         Tasker
You and the tools    Account · Tool UIs
```
Each page has its own note with an annotated screenshot of the real homelab: [[Homelab UI pages]].

**Example from our projects** — the control center's *All good* is a rule you can read (`features/control-center/application/control-center.store.ts`, excerpt):
```typescript
if ((gauges.disk ?? 0) > 85) list.push(`Disk ${Math.round(gauges.disk!)}% full`);
if ((gauges.memory ?? 0) > 90) list.push(`Memory ${Math.round(gauges.memory!)}% used`);
if ((gauges.temperature ?? 0) > 85) list.push(`CPU at ${Math.round(gauges.temperature!)} °C`);
if ((this.stats().targetsDown ?? 0) > 0)
  list.push(`${this.stats().targetsDown} scrape target(s) down`);
if (kube?.notReady.length) list.push(`${kube.notReady.length} pod(s) not ready`);
```
plus firing alerts and backups older than 26 h. *All good* = Prometheus answered, no alert fires, and none of these is true. It says nothing about restarts, slow answers or a broken agent — which is why the other pages exist.

**Common mistake** — trusting a green badge for more than it checks. *Ready* on Status means a health endpoint answered; the agent can be Ready and still fail every message, as it did on 2026-11-11 ([[Homelab UI page - Agent]]).

### Do
1. 👀 The 30-minute first tour at the end of [[Homelab UI pages]].
2. 👀 **Investigate with the pages:** a new browser's agent answers *The model server rejected the request (404 page not found)*. Using only pages, find out why:
   - [[Homelab UI page - Logs|Logs]]: `{service_name=~"agent-runtime.*"} |= "rejected"` → the error is in the *understand* step, from the model call.
   - [[Homelab UI page - Models|Models]]: *Try a model* with the same model works → the model server is fine.
   - [[Homelab UI page - Agent|Agent]] settings: switch to an `nvidia/…` model → it answers.
   - Conclusion: the agent sends local model names to the wrong server. Where is that set? (Answer in [[Homelab UI page - Agent]].)

### Check
1. A container restarted ten minutes ago, now fine. Which page shows it, and which doesn't?
> [!success]- Answer
> The control center's Kubernetes card (*restarts, last hour*) and the Kubernetes page (restarts, events) show it. The attention banner doesn't: it only checks pods not ready *now*.
2. Why does the Metrics page say 11 targets when the control center says 13?
> [!success]- Answer
> The control center counts `up` series; Alloy scrapes two jobs itself and pushes them by remote write, so they have `up` series but aren't Prometheus targets ([[Homelab UI page - Metrics]]).
3. You ask the assistant on the Logs page *"why this error?"*. What does the agent receive?
> [!success]- Answer
> Only your words, the model name, the conversation id and auto-approve. Not the page. Paste the line or name the service and time ([[Homelab UI page - Assistant]]).

**You can now:** pick the right page for any question about the homelab, and read every part of it.

## 3. Through the gateway · ~45 min

### Learn
**Definitions**
- **Same origin** — same scheme, host and port; the browser sends cookies and allows `fetch` without CORS.
- **CSRF** — a foreign page making your browser send a request with your cookies ([[CSRF]]).
- **`GatewayApi`** — the one client every page's API service uses.

**How it works**
`GatewayApi.send()` adds `X-Homelab-Request: 1` and an `Accept` header, sets a 15 s timeout combined with the caller's abort signal, sends the request, and on `401` sends the browser to sign in. Caddy refuses writes without the header.

**Example from our projects** — `shared/infrastructure/gateway-api.ts` (excerpt):
```ts
const headers: Record<string, string> = {
  'X-Homelab-Request': '1',
  Accept: request.accept ?? 'application/json',
};
const signals = [AbortSignal.timeout(request.timeoutMs ?? DEFAULT_TIMEOUT_MS)];
if (request.signal) signals.push(request.signal);
const response = await fetch(url, { method: request.method ?? 'GET', headers, body, signal: AbortSignal.any(signals) });
if (response.status === 401 && this.session.enabled) {
  this.session.signIn();
  throw new GatewayApiError(401, 'Your session has ended. Signing in again…');
}
```
1. The header is on *every* request, reads included — simpler than remembering it for writes.
2. `AbortSignal.any` — whichever comes first, the timeout or the caller cancelling, stops the request.
3. A 401 means the session ended: sign in again rather than show a broken page.

**Common mistake** — the Kubernetes logs page once sent `Accept: application/json` to an endpoint that returns text, and got `406 Not Acceptable`. `accept` is per request for that reason.

### Do
👀 Browser devtools → Network on Metrics and Kafka: each `/api/…` call, its status, and `X-Homelab-Request` in the request headers.

### Check
1. Why does a cross-site page fail to make writes, even though it can call `fetch` with any header?
> [!success]- Answer
> A custom header makes the request "non-simple": the browser first sends a CORS preflight, and Caddy doesn't approve other origins, so the real request is never sent. `SameSite=Lax` also keeps the cookie off cross-site fetches.

**You can now:** explain how the UI talks to the homelab safely.

## 4. How the code is organised · ~1 h

### Learn
**Definitions**
- **Standalone component** — an Angular component listing its own imports, no NgModule.
- **Lazy route** — `loadComponent: () => import(...)`: the page's code is downloaded on first visit.
- **InjectionToken / multi provider** — a DI key; with `multi: true`, many providers add to one array ([[Dependency injection]]).
- **Feature-first** — one folder per page with its own layers; features never import each other ([[Feature-first architecture]]).

**How it works**
```text
app.config.ts  — lists every feature: provideXxxFeature()
shell/         — layout, menu, right panel, drawer; knows the HomelabFeature contract, never a feature
features/<x>/  — domain · application · infrastructure · components/pages · <x>.feature.ts
shared/        — gateway client, session, query services, charts
```
The menu and control center inject `HOMELAB_FEATURES` and get every registered feature — so adding a page never edits the shell.

**Example from our projects** — how the Metrics page registers itself (`features/prometheus/prometheus.feature.ts`):
```ts
export function providePrometheusFeature(): Provider {
  return provideHomelabFeature(() => {
    const server = inject(HomelabServer);
    return {
      id: 'prometheus',
      label: 'Metrics',
      description: 'Query Prometheus, check scrape targets and alerts.',
      category: 'Observability',
      color: '#f43f5e',
      icon: ['M4 20V10M10 20V4M16 20v-7M22 20H2'],
      entry: { kind: 'page', path: '/metrics' },
      checkHealth: () => server.isReachable(PROMETHEUS),
    };
  });
}
```
and its route in `app.routes.ts`:
```ts
{
  path: 'metrics',
  loadComponent: () =>
    import('./features/prometheus/pages/metrics-page/metrics-page').then((m) => m.MetricsPage),
},
```
`PROMETHEUS` is `infrastructure/prometheus.json`: `{ "key": "prometheus", "port": 9090, "healthPath": "/-/ready", "api": "/api/prometheus" }` — from which `HomelabServer` builds the addresses.

**Common mistake** — a feature importing another feature's store "just once". The rule then erodes; shared code belongs in `shared/`.

### Do
👀 Open `app.config.ts`, `shell/application/homelab-features.ts`, `shell/domain/homelab-feature.ts` (the `HomelabFeature` interface), then `features/prometheus/`.

### Check
1. You add a page. Which files outside its own feature folder change?
> [!success]- Answer
> `app.routes.ts` (its lazy route) and `app.config.ts` (its `provideXxxFeature()`). The shell doesn't change.

**You can now:** find the code behind any page. Deep dive: [[Homelab UI structure]].

## 5. State and streaming · ~1 h

### Learn
**Definitions**
- **Signal** — a value that tracks who reads it; `computed` derives from signals; `effect` runs side effects on change ([[Signals]]).
- **Store** — a root-provided class holding a feature's signals and actions (`AgentStore`).
- **Server-sent events** — a long HTTP response carrying `event:`/`data:` frames ([[Server-sent events]]).
- **Async generator** — `async function*` that `yield`s values over time; consumed with `for await`.

**How it works**
The Agent page and the drawer inject the same `AgentStore`. Sending a message calls `AgentApiService.stream()`, which POSTs, reads the response body chunk by chunk, splits frames on blank lines, and yields events; the store updates its signals per event; the templates re-render only what changed.

**Example from our projects** — `features/agent/infrastructure/api/agent-api.service.ts` (excerpt):
```ts
const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  let boundary = buffer.indexOf('\n\n');
  while (boundary !== -1) {
    const frame = buffer.slice(0, boundary);
    buffer = buffer.slice(boundary + 2);
    const event = parseFrame(frame);
    if (event) yield event;
    boundary = buffer.indexOf('\n\n');
  }
}
```
1. Chunks don't align with frames — the buffer keeps the incomplete tail for the next read.
2. `decode(…, { stream: true })` keeps multi-byte characters split across chunks intact.
3. `parseFrame` reads `event:` and `data:` lines and ignores the rest — including the agent's `: heartbeat` comments.

And in `AgentStore`:
```ts
readonly canSend = computed(() => this.draft().trim().length > 0 && !this.isStreaming() && this.modelName() !== '');
```

**Common mistake** — using `EventSource` for the agent: it only does GET, and the agent's stream is a POST with a JSON body.

### Do
👀 Open the Agent page and the drawer side by side and send a message: the same conversation streams in both.

### Check
1. Follow one agent answer from the server to the screen.
> [!success]- Answer
> `stream()` POSTs to `/api/agent/v1/stream`, reads the body, splits frames, yields `StreamEvent`s; `AgentStore` handles each (`status` → progress, `token` → append, `final` → replace and keep metadata, `complete` → stop); templates reading those signals update.

**You can now:** explain how the agent's answer appears word by word. Deep dives: [[Homelab UI state and streaming]] · [[Homelab UI Tasker]].

## 6. How it ships, and the principles inside · ~1 h

### Learn
**How it works**
`ng build` makes static files; the Dockerfile builds them once on the builder's own CPU, then copies them into an unprivileged nginx image for amd64 and arm64; CI publishes image and chart on a tag; the homelab deploys the version in `versions.yaml` ([[Homelab UI delivery]]).

| Principle | Concept | Where it lives here | Go deep |
|---|---|---|---|
| Single-page app behind a gateway | [[Single-page application]] | nginx image, `/api/*` on the same origin | [[Path - The frontend]] |
| Components, DI, lazy routes | [[Angular]], [[Dependency injection]] | `app.config.ts`, `app.routes.ts`, `HOMELAB_FEATURES` | [[Path - The frontend]] |
| Reactive state | [[Signals]] | `AgentStore` | [[Path - The frontend]] |
| Feature-first layering | [[Feature-first architecture]] | `features/<page>/{domain,application,infrastructure,pages}` | [[Path - Design that lasts]] |
| Ports and adapters on the frontend | [[Hexagonal architecture]] | Tasker's `CanvasEngine` | [[Path - Design that lasts]] |
| Streaming over HTTP | [[Server-sent events]] | `agent-api.service.ts` | [[Path - Serving HTTP well]] |
| CSRF defence, sessions | [[CSRF]], [[Cookies and sessions]] | `GatewayApi`, `GatewaySession` | [[Path - The front door]] |
| Data security in the database | [[Row-level security]] | Tasker via PostgREST | [[Path - Data]] |
| Multi-platform images | [[Container image]] | `devops/docker/Dockerfile` | [[Path - Shipping changes]] |

### Do
👀 Skim [[Homelab UI guides]]; in the repository, `make check`.

**Milestone:** you can explain any page — what it calls, how its state flows, where its code is, how it reaches the server.

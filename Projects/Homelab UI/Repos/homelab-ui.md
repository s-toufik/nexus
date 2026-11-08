---
type: repository
project: "[[Homelab UI]]"
repo: https://github.com/s-toufik/homelab-ui
language: TypeScript (Angular 21)
status: active
tags: [repository, homelab, homelab-ui]
updated: 2026-11-08
---

# homelab-ui

> The dashboard UI for the homelab: a left sidebar for navigating between pages, a right sidebar for whatever the current page's settings are, an assistant drawer on every page but the Agent's, and one page per homelab component, each calling its tool's API through the gateway.

Built with Angular 21 (standalone components, signals, zoneless) using a feature-first, layered structure: each page under `features/` owns its `domain` (types), `application` (state/orchestration), `infrastructure` (API clients), and `components`/`pages` (UI), and never reaches into another feature. Cross-cutting app chrome — the two sidebars, routing between pages — lives in `shell/`; what several features use lives in `shared/`.

How to work on it: [[Homelab UI guides]]. How it fits together: [[Homelab UI structure]].

## Layout

```
src/app/
├── app.ts / app.routes.ts       -- bootstraps <app-layout>, declares the routes
├── app.config.ts                -- the only place that lists the features (provideXxxFeature())
│
├── shell/                       -- app chrome; knows the feature contract, never a feature
│   ├── layout/                  -- left nav + <router-outlet> + right panel + assistant drawer
│   ├── nav-sidebar/             -- left sidebar: every page by category (admin-only ones for admins), signed-in account
│   ├── page-panel/              -- generic right sidebar host
│   ├── assistant-drawer/        -- the assistant beside any page; its content comes from ASSISTANT_PANEL
│   ├── feature-icon/            -- draws the icon a feature hands over
│   ├── application/
│   │   ├── homelab-features.ts  -- HOMELAB_FEATURES + provideHomelabFeature()
│   │   ├── assistant-panel.ts   -- ASSISTANT_PANEL + provideAssistantPanel(): what the drawer loads, where it hides
│   │   ├── feature-status.store.ts  -- runs each feature's health check
│   │   ├── homelab-resources.ts -- HOMELAB_RESOURCES + provideHomelabResource()
│   │   ├── resource-status.store.ts -- runs each resource's status check
│   │   ├── layout.store.ts      -- open/closed state of both sidebars and the assistant
│   │   └── page-chrome.store.ts -- whatever the current page registered for the right panel
│   ├── directives/              -- [appPagePanelContent], how a page fills the right panel
│   └── domain/
│       ├── homelab-feature.ts   -- HomelabFeature (a page the shell lists; adminOnly), FEATURE_CATEGORIES
│       └── homelab-resource.ts  -- HomelabResource: has a status, nothing to open
│
├── features/                    -- one folder per backend
│   ├── control-center/          -- / : alerts, server, data, LLM, Kubernetes, busiest containers, errors, apps
│   ├── status/                  -- /status: every homelab-infra container, its state, links, connection
│   ├── agent/                   -- /agent chat (reference example for a page) + components/assistant (the drawer)
│   ├── tasker/                  -- block canvas, split panes, groups; workflows and favorites via PostgREST
│   ├── grafana/                 -- /dashboards/:id: Grafana's dashboards as panel lists (domain/dashboards.ts)
│   ├── prometheus/              -- /metrics: PromQL, targets, rules
│   ├── loki/                    -- /logs: LogQL, labels, live
│   ├── tempo/                   -- /traces: search and waterfall
│   ├── kafka-ui/                -- /kafka: Kafka UI's REST API (topics, messages, groups)
│   ├── alloy/                   -- /pipeline: Alloy's components
│   ├── llm/                     -- /models: llama-swap (models, load/unload, logs, prompt)
│   ├── mcp-inspector/           -- /tools: agent-toolbox over MCP (infrastructure/api/mcp-client.service.ts)
│   ├── account/                 -- /account: Keycloak's account API
│   ├── kubernetes/              -- /kubernetes (admins): resources, actions, YAML, logs, exec shell (xterm)
│   ├── tool-links/              -- /tool-uis: links to each tool's own web interface, with a reachability dot
│   └── infrastructure/          -- the menu's Infrastructure section (PostgreSQL, MongoDB, Kafka), from Prometheus
│
└── shared/
    ├── domain/log-line.ts       -- a log line and its level, from Loki
    ├── infrastructure/
    │   ├── homelab-server.json  -- the server for `npm start` ("http://<your-server>")
    │   ├── homelab-server.ts    -- builds every backend address; API_ROUTING, isReachable()
    │   ├── gateway-session.ts   -- the signed-in account, isAdmin() (realm role admin), sign-out, session watch
    │   ├── gateway-api.ts       -- fetch for /api/<tool>: X-Homelab-Request, timeouts, 401 → sign in, error text
    │   ├── prometheus-query.service.ts  -- value(), vector(), range(); seriesName()
    │   ├── loki-query.service.ts        -- labels, values, query_range (lines or series)
    │   └── connection-settings* -- a host saved in Settings → Connectors
    ├── ui/
    │   ├── charts/              -- time-series chart, sparkline, gauge; chart-format.ts (units, ticks, colours)
    │   ├── time-range/          -- 15 min … 7 d picker and timeWindow()
    │   └── page-header/         -- eyebrow, title, summary, actions
    ├── pipes/ utils/
```

Global classes for tool pages live in `src/styles.scss` under `.hl-*`: `hl-page`, `hl-card`, `hl-grid`, `hl-row`, `hl-btn` (`--primary`, `--danger`, `--small`), `hl-input`, `hl-field`, `hl-tabs`/`hl-tab`, `hl-table`, `hl-badge` (`--ok`, `--warn`, `--bad`, `--muted`), `hl-pre`, `hl-error`, `hl-empty`, `hl-stat`. Chart colours are `--chart-1` … `--chart-8` (`--chart-1` is the palette's accent).

## How it reaches the backends

Every address is built from `shared/infrastructure/homelab-server.json` and the feature's own JSON:

| Feature JSON                             | Address                          |
| ---------------------------------------- | -------------------------------- |
| `{ "port": <port>, "subpath": null }`    | `http://<your-server>:<port>`    |
| `{ "port": <port>, "subpath": "ui" }`    | `http://<your-server>:<port>/ui` |
| `{ "port": null, "subpath": "grafana" }` | `http://<your-server>/grafana`   |

`healthPath` (optional) is what the status dot calls. The files are compiled in: rebuild after changing them.

**Behind the gateway.** In production the UI is served by homelab-infra's gateway (Caddy + Keycloak + oauth2-proxy), so the browser only ever talks to one HTTPS origin:

| JSON field                | Production build (`API_ROUTING = 'gateway'`)                                   | `npm start` (`'direct'`)        |
| ------------------------- | ------------------------------------------------------------------------------ | ------------------------------- |
| `api` (e.g. `/api/agent`) | API calls go to `/api/agent/…` on the same origin, signed-in cookie included   | `http://<your-server>:<port>/…` |
| `healthPath`              | Status dots call `/api/health/<key>` and trust its status code                 | `no-cors` probe of the port     |
| `port` / `subpath`        | Links to a tool's own address (Keycloak's password page, the agent's API docs) | `http://<your-server>:<port>`   |

In production the server address is the page's own host (`HOMELAB_SERVER_URL` follows `location`), unless a host is saved in Settings → Connectors; `homelab-server.json` is only used by `npm start`.

`GatewaySession` reads the signed-in account from `/oauth2/userinfo` at start-up, shows it in the left sidebar with a Sign out link, checks again every minute and when the tab comes back, and sends the browser to the sign-in page when the session has ended. Tasker keeps unsaved canvases per account (`homelab-ui.tasker.workspace.<account>`).

Tasker's HTTP blocks run in the browser: from the HTTPS page they can only call `https://` addresses.

## The assistant drawer

The agent feature registers the drawer's content with `provideAssistantPanel({ load, hiddenOn: ['/agent'] })` in `agent.feature.ts`; the shell loads it lazily the first time the drawer opens. The drawer shows `features/agent/components/assistant`, which uses the same root `AgentStore` as the Agent page, so both show one conversation. To hide the drawer on another page, add its path to `hiddenOn`.

## Charts

`app-time-series-chart` takes `series` (`{ name, points: [ms, value][] }[]`), a `unit` (`number`, `percent`, `ratio`, `bytes`, `bytesPerSecond`, `seconds`, `perSecond`, `celsius`), `height`, `area`, `min` and `max`; it draws the axes, a tooltip, a legend that hides a series on click, and breaks lines where data is missing. `app-sparkline` and `app-gauge` cover the small ones. A Prometheus range is `PrometheusQueryService.range(expr, start, end, step)` with `timeWindow(rangeId)` from `ui/time-range`.

## Answer details

The agent's `final` event carries a `metadata` object. The store keeps it on the answer as it is (`domain/answer-metadata.ts` only turns every value into text and drops empty ones), and the message component shows it in two ways:
```text
 final event ─► metadata ─► answerMetadata() ─► ChatMessage.metadata
                                                  │
                    ┌─────────────────────────────┴───────────────────────┐
                    ▼                                                     ▼
   usageSummary(): "(21s · ↑ 9.9k · ↓ 642 tokens)"      metadataEntries(): every key, in the
   from elapsed_time, input_tokens, output_tokens       agent's order, labelled from its name
   (missing ones are left out)                          (shown under the arrow)
```

## Path aliases

`@shell/*`, `@features/*`, `@shared/*` (see `tsconfig.json`) resolve to `src/app/shell`, `src/app/features`, `src/app/shared`. Use them for cross-boundary imports (a feature importing shell code, for instance); use relative imports for anything within the same feature.

## Knowledge it uses
[[Reverse proxy]] · [[Forward authentication]] · [[CSRF]] · [[Cookies and sessions]] · [[Prometheus and PromQL]] · [[Loki and LogQL]] · [[Model Context Protocol]] · [[OpenAI-compatible API]]

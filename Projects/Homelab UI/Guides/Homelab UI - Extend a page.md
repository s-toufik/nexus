---
type: guide
project: "[[Homelab UI]]"
tags: [guide, homelab-ui]
updated: 2026-11-08
---

# Homelab UI - Extend a page

> Call a new API through the gateway, show a new answer detail under the agent's replies, or hide the assistant drawer on a page.

**Where:** on your Mac, in `homelab-ui` (and homelab-infra for a gateway route) · **All guides:** [[Homelab UI guides]]

## Call a new API

What the UI calls must exist on the gateway (homelab-infra's `gateway/caddy/Caddyfile`):

- a new API: an `api` path in its JSON **and** a route under `/api/`, limited to the paths the page calls;
- a page that changes things: send them with `GatewayApi` (it adds `X-Homelab-Request: 1`) and give the route `import no_cross_site_writes`; admin-only changes also `import admin_only <matcher>`;
- a new health check: `import health_route <key> <service>:<port> <path>` under `/api/*`.

Then the route: [[Homelab - Deploy a change]] (`make apply R=caddy`).

## Show a new answer detail

To show a new detail, add it to the agent's metadata: it appears under the arrow with a label made from its key (`cache_hit_ratio` → "Cache hit ratio"), with no change here. Only a field that should join the one-line summary needs code, in `usageSummary()`.

## Hide the assistant drawer on a page

- Add the page's path to `hiddenOn` in `provideAssistantPanel({ load, hiddenOn: ['/agent'] })`, `features/agent/agent.feature.ts`.

## Why it works
- [[Homelab UI state and streaming]] — `GatewayApi`, the agent stream and its metadata.
- [[Homelab gateway and sign-in]] · [[CSRF]]

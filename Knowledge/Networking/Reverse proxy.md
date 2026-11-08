---
type: concept
domain: Networking
level: beginner
tags: [concept, networking]
updated: 2026-11-08
---

# Reverse proxy

> A server that receives clients' requests and forwards them to the right backend, then sends the answer back. Clients see one address; behind it, many services.

## Why it matters
A single entry point is where you put everything every service needs but shouldn't implement itself: TLS, authentication, routing, header hygiene, rate limits, logs. It's the "front door" pattern of almost every production system (Nginx, Envoy, Traefik, Caddy, cloud load balancers).

## How it works
- **Routing** by host, port and path: `/api/tasker/*` → PostgREST, `/` → homelab-ui.
- **Header handling**: adds `X-Forwarded-For/Proto/Host` so backends know the original request; can remove or set headers (`header_up`).
- **Path rewriting**: `handle_path /api/loki/*` strips the prefix before forwarding.
- **Streaming**: `flush_interval -1` sends bytes as they come (server-sent events, LLM tokens).
- **Forward proxy** (the opposite): sits in front of *clients* going out.

## In our projects
**Caddy** is the gateway ([[Homelab gateway and sign-in]]):
- TLS with the Tailscale certificate ([[TLS and certificates]]);
- `forward_auth` to oauth2-proxy on every request ([[Forward authentication]]);
- strips identity headers clients could forge;
- per-tool API routes with path allow-lists, `read_only` and CSRF guards ([[CSRF]]);
- streams for the agent, LLM and logs.
Its config is `gateway/caddy/Caddyfile`, checked by `caddy validate` in `make validate`.

## Pitfalls we met
- Backends that check the `Host` header (MCP servers, agent-toolbox) reject the proxy's public name → `header_up Host agent-toolbox:8001`.
- The `Origin` header from the browser made the toolbox's MCP SDK refuse requests → `header_up -Origin` on that route.

## Check yourself
1. Why put authentication in the proxy rather than in each app? What's the risk?
2. What does `handle_path` do that `handle` doesn't?

## Go further
- [Cloudflare: what is a reverse proxy?](https://www.cloudflare.com/learning/cdn/glossary/reverse-proxy/)
- [Caddy docs](https://caddyserver.com/docs/), [reverse_proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy), [Caddyfile concepts](https://caddyserver.com/docs/caddyfile/concepts).

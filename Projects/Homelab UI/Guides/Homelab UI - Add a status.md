---
type: guide
project: "[[Homelab UI]]"
tags: [guide, homelab-ui]
updated: 2026-11-08
---

# Homelab UI - Add a status

> Show a new homelab container on the Status page, or a new service in the menu's Infrastructure section.

**Where:** on your Mac, in `homelab-ui` (and homelab-infra for its health route or exporter) · **All guides:** [[Homelab UI guides]]

## A container on the Status page

Every container homelab-infra runs has an entry in `STACK_SERVICES` (`features/status/domain/stack-services.ts`):

- `group` and `folder` — where it lives in homelab-infra (`observability/logs/loki`);
- `check` — `{ kind: 'health', key }` for a container with an HTTP health endpoint (the gateway's `/api/health/<key>` route), or `{ kind: 'metric', query }` for one with only a Prometheus metric (`pg_up`, `kafka_brokers`, …);
- `links` — `{ label, route }` for one of this UI's pages, or `{ label, port, path }` for a tool's own address;
- `connection` (optional) — the address apps use, `{host}` replaced by the server's name.

A new group is one more entry in `SERVICE_GROUPS` (`features/status/domain/stack-service.ts`).

## An infrastructure status in the menu

For the menu's Infrastructure section (a service with nothing to open):

1. Make sure Prometheus has a metric that is `1` or more while the service is up — usually from an exporter added in homelab-infra.
2. Add an entry to `INFRASTRUCTURE_RESOURCES` (`features/infrastructure/domain/infrastructure-resources.ts`): `id`, `label`, `color`, and `upWhen`, the PromQL expression.

A status from another source than Prometheus is a new feature registering its own `HomelabResource`.

## Why it works
- [[Homelab UI structure]] — resources versus features.
- [[Prometheus and PromQL]] · [[Homelab observability]]

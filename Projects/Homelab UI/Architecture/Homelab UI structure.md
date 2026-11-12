---
type: architecture
project: "[[Homelab UI]]"
order: 1
tags: [homelab-ui, architecture, frontend]
updated: 2026-11-08
---

# Homelab UI structure

> Three zones with one rule: **features** (one per page/backend) never import each other; the **shell** (sidebars, layout, drawer) knows only the *contract* every feature fulfils, never a feature; **shared** holds what several features use. `app.config.ts` is the only file that lists the features.

Back: [[Homelab UI]] · Next: [[Homelab UI state and streaming]]

**Do it:** [[Homelab UI - Add a page]] · [[Homelab UI - Add a status]]

## The three zones
```text
src/app/
├── app.config.ts      the composition root: provideXxxFeature() for every feature
├── shell/             layout, nav sidebar, right panel, assistant drawer — knows HomelabFeature, never a feature
├── features/          control-center, status, agent, tasker, grafana, prometheus, loki, tempo, kafka-ui,
│                      alloy, llm, mcp-inspector, account, kubernetes, tool-links, infrastructure
└── shared/            gateway client and session, Prometheus/Loki query services, charts, time range, header
```

Inside a feature, the same layers every time ([[Feature-first architecture]]):
| Folder | Holds | Example |
|---|---|---|
| `domain/` | Types and pure functions | `stream-event.ts`, Tasker's `graph-execution.ts` |
| `application/` | State and orchestration (stores) | `AgentStore` |
| `infrastructure/` | API clients, storage, the feature's JSON | `AgentApiService`, `agent.json` |
| `components/`, `pages/` | UI | `agent-page`, `assistant` |

## How a feature plugs into the shell
The shell must list every page in the menu and the control center without importing them. The trick is [[Dependency injection]] with a **multi provider**:
```ts
export const HOMELAB_FEATURES = new InjectionToken<readonly HomelabFeature[]>('HOMELAB_FEATURES');
export function provideHomelabFeature(describe: () => HomelabFeature): Provider {
  return { provide: HOMELAB_FEATURES, multi: true, useFactory: describe };
}
```
Each feature calls `provideHomelabFeature(...)` with its id, label, category, icon, route, health check and `adminOnly`. The shell injects `HOMELAB_FEATURES` and gets the array. Adding a page = one line in `app.config.ts`; the shell doesn't change. The same pattern gives:
- `HOMELAB_RESOURCES` — things with a status but no page (PostgreSQL, MongoDB, Kafka in the menu's Infrastructure section);
- `ASSISTANT_PANEL` — what the drawer lazy-loads and on which paths it hides (`/agent`).

This is the dependency inversion principle in a frontend: the shell owns the abstraction, features implement it.

## Routes are lazy
`app.routes.ts` uses `loadComponent: () => import(...)` for every page: each page is its own JavaScript chunk, downloaded on first visit. A new page never grows the first download ([[Single-page application]]).

## Backend addresses
Each feature's JSON (`{ "port", "subpath", "api", "healthPath" }`) plus `shared/infrastructure/homelab-server.json` decide where calls go, through `HomelabServer`:
| Build | `API_ROUTING` | API calls | Status dots |
|---|---|---|---|
| Production (behind Caddy) | `gateway` | `/api/<tool>/…`, same origin, cookie included | `/api/health/<key>` |
| `npm start` | `direct` | `http://<your-server>:<port>/…` | a `no-cors` probe of the port |

That's why, on your Mac, the agent works (agent-runtime is reachable on `:8000`) but most tool pages don't: their APIs exist only behind the gateway.

## The rules are tested
Path aliases `@shell/*`, `@features/*`, `@shared/*` make cross-zone imports visible. The rule "shell never imports a feature, a feature never imports another" is the kind of thing an [[Architecture tests|architecture test]] enforces in the Python projects.

## Check yourself
1. Why does the shell inject an array of features instead of importing them?
> [!success]- Answer
> So the shell depends on the contract (`HOMELAB_FEATURES`), never on a feature: a feature can be added or removed without touching the shell, and the shell can't reach into a feature's code. That's dependency inversion.
2. You add a Grafana-like page for a new tool. Which files change outside its feature folder?
> [!success]- Answer
> `app.routes.ts` (its lazy route) and `app.config.ts` (`provideXxxFeature()`). If its backend sits behind the gateway, homelab-infra's Caddyfile also needs its `/api/<tool>/` route and health check.
3. Why do most tool pages fail under `npm start`?
> [!success]- Answer
> In `npm start` mode calls go directly to `http://<your-server>:<port>/`, but most tools' APIs are only reachable through the gateway (Caddy's `/api/<tool>/` routes, behind the sign-in). Only the ports open on the tailnet, like agent-runtime's `:8000`, answer.

## Go further
- [Angular: dependency injection](https://angular.dev/guide/di), [multi providers / InjectionToken](https://angular.dev/api/core/InjectionToken).
- [Angular: lazy-loading routes](https://angular.dev/guide/routing/define-routes#lazily-loaded-components).

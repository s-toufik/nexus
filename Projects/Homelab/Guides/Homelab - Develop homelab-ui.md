---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab, homelab-ui]
updated: 2026-11-08
---

# Homelab - Develop homelab-ui

> Work on homelab-ui: run it, test it, release it, add a page, a gateway route, a Status entry.

**Where:** on your Mac, in `homelab-ui`; releases end on the server · **All guides:** [[Homelab guides]]

## Run, test, build

| To…                                                                                                                               | make                              | Raw command                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Install dependencies                                                                                                              | `make install`                    | `npm install`                                                                                                                |
| Dev server at `http://localhost:4200` (direct to the ports in `homelab-server.json`, no sign-in; the Status page shows _Unknown_) | `make run`                        | `npx ng serve`                                                                                                               |
| Tests (vitest)                                                                                                                    | `make test`                       | `npx ng test --watch=false`                                                                                                  |
| Format check / fix                                                                                                                | `make lint` / `make fix`          | `npx prettier --check .` / `npx prettier --write .`                                                                          |
| Type check                                                                                                                        | `make typecheck`                  | `npx tsc -p tsconfig.app.json --noEmit`                                                                                      |
| All checks                                                                                                                        | `make check`                      | lint + typecheck + test                                                                                                      |
| Production build to `dist/homelab-ui`                                                                                             | `make build`                      | `rm -rf dist && npx ng build`                                                                                                |
| Local image                                                                                                                       | `make docker_build`               | `docker build -f devops/docker/Dockerfile -t homelab-ui:local .`                                                             |
| Publish a test image (releases: git tag, see below)                                                                               | `make docker_publish [TAG=1.4.0]` | `docker buildx build --platform linux/amd64,linux/arm64 -f devops/docker/Dockerfile -t toufik142/homelab-ui:latest --push .` |

`npm start` calls the backends directly on their ports, without the gateway, from a machine on the tailnet: the Agent page and the assistant work against the server's agent-runtime (`http://<your-server>:8000`). The tool pages, PostgREST and the `/api/health` routes exist only behind the gateway, so they need the deployed UI (`https://<server>.<tailnet>.ts.net/`) or a dev image deployed with `helmfile -l name=homelab-ui apply --set image.tag=dev-<sha>` in homelab-infra ([[Homelab - Release an app#Try a dev image]]).

## Try the UI against a backend on your Mac

To try the UI against a backend running on your own machine, set `homelab-server.json` to `http://localhost` and the feature's `port` to the one your backend listens on. Every other feature then points to `localhost` too, so their status shows offline unless they run locally. Don't commit these edits.

## Release

The server runs homelab-ui as a Helm release: the chart `oci://ghcr.io/s-toufik/charts/homelab-ui` (kube-charts' `app` chart with [`devops/helm/values.yml`](https://github.com/s-toufik/homelab-ui/blob/develop/devops/helm/values.yml) built in) and the image `toufik142/homelab-ui`, both at the version of a git tag.

1. `make check`, merge to `main`.
2. Tag the release:
   ```bash
   git tag v1.4.0
   git push origin v1.4.0
   ```
3. GitHub Actions: PUBLISH (image `1.4.0`) and CHART (chart `1.4.0`) are green.
4. In homelab-infra: `apps.homelabUi: 1.4.0` in `environments/versions.yaml`; on the server `make apply R=homelab-ui` ([[Homelab - Release an app]]).
5. Open `https://<server>/status` and reload.

Ports, probes, resources and env variables are in `devops/helm/values.yml`; the next release carries a change there to the server.

`make docker_publish` still pushes `latest` (or `TAG=…`) from a Mac for both `linux/amd64` and `linux/arm64`: built with plain `docker build` on a Mac, an image would be arm64 only and fail on an x86-64 server with `exec format error`. The Dockerfile builds the static files once on the builder's own platform (`--platform=$BUILDPLATFORM`), then copies them into an nginx image for each target.

## Set up the pre-commit hooks (once)

`.pre-commit-config.yaml` runs typecheck, format-check, and tests before each commit and push. `pre-commit` itself is a standalone tool, not an npm package, so install it once, globally:

```bash
pipx install pre-commit   # or: brew install pre-commit / pip install pre-commit
```

Then wire it into this repo (or just run `make hooks`):

```bash
pre-commit install --hook-type pre-commit --hook-type pre-push
```

Run it manually against everything at any time:

```bash
pre-commit run --all-files
```

## Add a page

Worked example: adding a `Metrics` page. Substitute your own name throughout (route path, feature id, folder name).

### 1. Scaffold the feature folder

```
src/app/features/metrics/
├── domain/
├── application/
├── infrastructure/     (only if the page talks to a backend)
├── components/         (only once you have more than one presentational piece)
└── pages/metrics-page/
```

Skip any of `domain`/`application`/`infrastructure` the page doesn't need yet — `alloy` has no `application`. Add a layer only when it actually has something to hold; an empty folder documents nothing.

### 2. Build the page component

```ts
// features/metrics/pages/metrics-page/metrics-page.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-metrics-page',
  imports: [],
  templateUrl: './metrics-page.html',
  styleUrl: './metrics-page.scss',
})
export class MetricsPage {}
```

Give the page's `:host` this shape so it fills the space the shell gives it (see `agent-page.scss`); a tool page wraps its content in `<div class="hl-page">` and starts with `<app-page-header>`:

```scss
:host {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  width: 100%;
}
```

### 3. Register the route

```ts
// app.routes.ts
{
  path: 'metrics',
  loadComponent: () =>
    import('./features/metrics/pages/metrics-page/metrics-page').then((m) => m.MetricsPage),
},
```

Lazy (`loadComponent`) keeps each page its own bundle chunk — a new page never grows the main bundle.

### 4. Register the feature

The left nav and the control center list registered features. Add a registration next to the page:

```ts
// features/metrics/metrics.feature.ts
export function provideMetricsFeature(): Provider {
  return provideHomelabFeature(() => ({
    id: 'metrics',
    label: 'Metrics',
    description: 'Host and container metrics.',
    category: 'Observability',
    icon: ['M4 20V10M10 20V4M16 20v-7M22 20H2'],
    entry: { kind: 'page', path: '/metrics' },
  }));
}
```

and list it in `app.config.ts` (`provideMetricsFeature()`). If the page talks to a backend, give it `infrastructure/metrics.json` (with `api`), an API service on `GatewayApi`, and a `checkHealth` (see `features/kafka-ui`). `adminOnly: true` hides it from accounts without the `admin` role.

### 5. Give it a right-sidebar panel (optional)

Only do this if the page has settings/controls that belong in the right sidebar. Wrap that content in `<ng-template appPagePanelContent>` inside the page's own template:

```html
<!-- metrics-page.html -->
<ng-template appPagePanelContent>
  <app-metrics-settings />
</ng-template>

<div class="metrics-page">... the page's main content ...</div>
```

```ts
import { PagePanelContentDirective } from '@shell/directives/page-panel-content.directive';

@Component({
  imports: [PagePanelContentDirective /* , ... */],
  // ...
})
export class MetricsPage {}
```

That's the entire contract: register the template, and the shell shows/hides the right sidebar and its mobile toggle automatically. Skip this step and the page simply has no right sidebar — that's how `status` and the tool pages work.

### 6. Verify

`make run`, open `http://localhost:4200`: the new page appears in the left nav and in the control center's apps, `/metrics` routes to it, the assistant button shows at the top right, and (if step 5 was done) its settings show in the right sidebar.

## Call a new API from a page

What the UI calls must exist on the gateway (homelab-infra's `gateway/caddy/Caddyfile`):

- a new API: an `api` path in its JSON **and** a route under `/api/`, limited to the paths the page calls;
- a page that changes things: send them with `GatewayApi` (it adds `X-Homelab-Request: 1`) and give the route `import no_cross_site_writes`; admin-only changes also `import admin_only <matcher>`;
- a new health check: `import health_route <key> <service>:<port> <path>` under `/api/*`.

## Add a container to the Status page

Every container homelab-infra runs has an entry in `STACK_SERVICES` (`features/status/domain/stack-services.ts`):

- `group` and `folder` — where it lives in homelab-infra (`observability/logs/loki`);
- `check` — `{ kind: 'health', key }` for a container with an HTTP health endpoint (the gateway's `/api/health/<key>` route), or `{ kind: 'metric', query }` for one with only a Prometheus metric (`pg_up`, `kafka_brokers`, …);
- `links` — `{ label, route }` for one of this UI's pages, or `{ label, port, path }` for a tool's own address;
- `connection` (optional) — the address apps use, `{host}` replaced by the server's name.

A new group is one more entry in `SERVICE_GROUPS` (`features/status/domain/stack-service.ts`).

## Add an infrastructure status

For the menu's Infrastructure section (a service with nothing to open):

1. Make sure Prometheus has a metric that is `1` or more while the service is up — usually from an exporter added in homelab-infra.
2. Add an entry to `INFRASTRUCTURE_RESOURCES` (`features/infrastructure/domain/infrastructure-resources.ts`): `id`, `label`, `color`, and `upWhen`, the PromQL expression.

A status from another source than Prometheus is a new feature registering its own `HomelabResource`.

## Show a new answer detail

To show a new detail, add it to the agent's metadata: it appears under the arrow with a label made from its key (`cache_hit_ratio` → "Cache hit ratio"), with no change here. Only a field that should join the one-line summary needs code, in `usageSummary()`.

## Hide the assistant drawer on a page

- Add the page's path to `hiddenOn` in `provideAssistantPanel({ load, hiddenOn: ['/agent'] })`, `features/agent/agent.feature.ts`.

## Why it works
- [[homelab-ui]] — how the code is organised, how it reaches the backends.
- [[Homelab gateway and sign-in]] · [[CSRF]] · [[Homelab - Release an app]]

---
type: architecture
project: "[[Homelab]]"
order: 9
tags: [homelab, architecture, operations]
updated: 2026-11-08
---

# Homelab change cookbook

> To change something, know which file owns it and which command applies it. Every change goes the same way: edit on your Mac → commit → push → on the server `git pull` → `make diff` → `make apply` → `make verify`.

Previous: [[Homelab failure modes]] · Back to [[Homelab]]

## The loop
1. **Edit** in homelab-infra (or the app's repository).
2. **Preview**: `make diff R=<release>` shows the exact manifest changes. Read it — it's your code review against the live cluster.
3. **Apply**: `make apply R=<release>`.
4. **Prove**: `make verify`, and look at the thing you changed.
5. **Undo if needed**: `make rollback R=<release>`, or `git revert` and apply again.

## Which file owns what
| To change | Edit | Then |
|---|---|---|
| A service's version | `environments/versions.yaml` → `images:` | `make diff`, `make apply` |
| An app's version (after its tag) | `versions.yaml` → `apps:` | `make apply R=<app>` |
| How a service runs (env, resources, ports) | `<group>/<release>/values.yaml.gotmpl` | `make apply R=<release>` |
| How an app runs everywhere | its repo's `devops/helm/values.yml` → new tag | bump `apps:`, `make apply R=<app>` |
| A web route or port | `gateway/caddy/Caddyfile` (+ `ports:` in its values) | `make apply R=caddy` |
| Realm, password policy, sign-in clients | `gateway/keycloak/sync.sh` | `make apply R=keycloak` |
| What Prometheus scrapes | `observability/prometheus/prometheus.yml`, or `metrics:` in a release | `make apply R=prometheus` |
| A dashboard | `observability/grafana/dashboards/*.json` (export from Grafana, commit) | `make apply R=grafana` |
| The local models | `llm/llm/config.yml` | `make apply R=llm` |
| Tasker's schema | `make migration-new NAME=…`, write it | `make migrate` |
| Retention, backup schedule, LLM provider, MCP write switches | `environments/default.yaml` | `make apply` |
| A new Secret | `SPECS` in `scripts/secrets.sh` | `make secrets` |
| What every pod gets | kube-charts `charts/app` → new chart version | `charts.app` in `versions.yaml`, `make apply` |

## Recipes
### Add a new API of your own
1. Start from `templates/myapi-a/` (a Python API with its Dockerfile and `devops/helm/values.yml`).
2. Its repository gets the CI that calls kube-charts' `app-chart.yml` on tags.
3. In homelab-infra: a release in `helmfile.yaml.gotmpl` (group `apps`, chart `homelab/<app>`), `apps/<app>/values.yaml.gotmpl` for server-only settings, its version in `versions.yaml`.
4. A database? A role in `repository/postgres/values.yaml.gotmpl`, a Secret in `SPECS`.
5. A web page? A route or port in the Caddyfile.
6. Telemetry: `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT`.
Full steps: DevOps guide, *Add an app*.

### Turn on write for an agent tool server
1. `mcp.postgres.write: true` in `environments/default.yaml`.
2. `make apply R=postgres` (the role's rights), then `make apply R=postgres-mcp` (the server's mode). `R=` takes one release; `G=llm` would take every MCP server at once.
3. `make restart R=agent-toolbox`.

### Rotate a password
`make secret-rotate SECRET=<secret> KEY=<key>` → Reloader restarts the pods reading it; PostgreSQL roles pick it up via the operator.

### Give someone an account
`make user-add ACCOUNT=<name>` (asks email, name, password), `make user-admin ACCOUNT=<name>` for admin.

## Habits of a senior operator
- **Small changes, one at a time.** If something breaks you know what did it.
- **Always `make diff` first.** Surprises in a diff are cheap; in production they're not.
- **Commit before applying.** The server runs what git says; a change applied but not committed is lost at the next `git pull` + apply.
- **Write down what you learned** in the [[Log]] — and the fix in the guide if you'd need it again.

## Check yourself
1. You want Loki to keep logs 60 days instead of 30. Find the file, and say which command applies it.
2. Your new API needs a PostgreSQL account. List every file you touch.

## Go further
- [Google SRE book: managing change](https://sre.google/sre-book/release-engineering/) — release engineering.

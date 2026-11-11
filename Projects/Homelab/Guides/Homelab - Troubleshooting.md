---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab]
updated: 2026-11-08
---

# Homelab - Troubleshooting

> Something is wrong: find the symptom below, follow its steps.

**Where:** on the server, in `homelab-infra`, unless a step says otherwise · **All guides:** [[Homelab guides]]

## `make apply` stops at `secrets.sh check`
1. The line above names the Secret and key.
2. `make secrets`, or `make secret-set SECRET=<secret> KEY=<key>` for a typed one.

## Warning `DNSConfigForming` … `Nameserver limits were exceeded` (CoreDNS, every minute)
1. `grep nameserver /run/systemd/resolve/resolv.conf` → 4 lines or more (the router once per network).
2. `echo "nameserver $(ip -4 route show default | awk '{print $3; exit}')" | sudo tee /etc/rancher/k3s/resolv.conf` → `nameserver <router-ip>`.
3. `grep -q resolv-conf /etc/rancher/k3s/config.yaml || echo 'resolv-conf: /etc/rancher/k3s/resolv.conf' | sudo tee -a /etc/rancher/k3s/config.yaml`
4. `sudo systemctl restart k3s`; after a minute `kubectl get nodes` → `Ready` (pods keep running).
5. `kubectl -n kube-system rollout restart deploy/coredns` → `deployment.apps/coredns restarted`.
6. After 5 minutes, `kubectl -n kube-system get events --field-selector reason=DNSConfigForming` lists no new event; `make verify` is all ✓.
7. New router, or its address changed: redo 2, 4, 5.

## `make apply` fails with `not ready` … `context deadline exceeded`
1. The releases after the failed one didn't run.
2. `kubectl -n homelab get pods -l app.kubernetes.io/instance=<release> -o wide` → `Pending`, `CrashLoopBackOff` or `0/1 Running`.
3. `kubectl -n homelab describe pod -l app.kubernetes.io/instance=<release> | tail -n 25` → the events: a port or volume it can't get, a failing probe.
4. `kubectl -n homelab logs deploy/<release> --tail=40` (`statefulset/<release>` for a database) → its own error.
5. Fix, commit, push; on the server `git pull`, `make sync R=<release>`, then `make apply`.

## A pod is `CreateContainerConfigError`
1. `kubectl -n homelab describe pod <pod> | tail -n 20` → names the missing Secret or key.
2. `make secrets`.

## Pulling a chart fails with `docker-credential-desktop` (or another `docker-credential-…`) `not found`
1. Helm reads Docker's login settings, and they name a credential helper that isn't installed.
2. Remove that setting, keeping a copy:
   ```bash
   cp ~/.docker/config.json ~/.docker/config.json.bak
   jq 'del(.credsStore)' ~/.docker/config.json.bak > ~/.docker/config.json
   ```
3. `make validate` → `Helm can read the registry logins`.

## A pod is `ImagePullBackOff`, or `make apply` says a chart is not found
1. `kubectl -n homelab describe pod <pod> | tail -n 20`, or `helm show chart oci://ghcr.io/s-toufik/charts/<chart> --version <version>`.
2. The version doesn't exist (check the app's Actions run and `environments/versions.yaml`), or the package isn't public ([[Homelab - Set up GitHub|Set up GitHub]], step 4).

## A pod stays `Pending` (`didn't have free ports`)
1. `make validate` → `no two pods want the same server port`; otherwise it names the port and the releases: change one of them.
2. Outside Kubernetes: `sudo ss -tlnp | grep -E ':(443|8443|3000|9090)\b'`, stop what holds it (e.g. an old Docker stack: [[Homelab - Install Kubernetes#1. Remove Docker (only if installed)|Install Kubernetes, step 1]]).
3. An old pod of another release may hold the port: `make sync R=<that release>` replaces it.

## `https://<HOMELAB_DOMAIN>/` doesn't answer
1. `make status` → caddy `Running`?
2. `make logs R=caddy` → certificate errors: MagicDNS and HTTPS certificates on in the Tailscale admin console; `make validate` (Tailscale's socket).

## HTTPS fails with `tlsv1 alert internal error`; Caddy's logs say `dial unix /var/run/tailscale/tailscaled.sock: connect: connection refused`
1. `systemctl show tailscaled -p ActiveEnterTimestamp` → later than Caddy's start: `kubectl -n homelab get pod -l app.kubernetes.io/instance=caddy -o custom-columns=NAME:.metadata.name,START:.status.startTime`
2. `journalctl -t tailscale-watchdog --since "-3 days" --no-pager` → `Restarting tailscaled` if the watchdog did it.
3. `make restart R=caddy`
   ```bash
   kubectl -n homelab rollout restart deploy/caddy && kubectl -n homelab rollout status deploy/caddy
   ```
4. `make validate` → `tailscaled keeps /run/tailscale when it restarts`; otherwise add `RuntimeDirectoryPreserve=restart` to the drop-in ([[Homelab - Prepare the server]]), then `sudo systemctl daemon-reload`.

## Signing in fails (error page or endless redirect)
1. `make logs R=oauth2-proxy`
2. Inside the cluster the Tailscale name must reach Caddy: `kubectl -n homelab exec deploy/caddy -- wget -qO- https://<HOMELAB_DOMAIN>:8443/realms/homelab/.well-known/openid-configuration` → JSON. If not: `kubectl -n kube-system get configmap coredns-custom -o yaml` and `make apply R=caddy`.
3. `kubectl -n homelab logs job/keycloak-sync` → `keycloak sync done`; otherwise `make sync R=keycloak`.

## PostgreSQL isn't Ready
1. `kubectl -n homelab get clusters.postgresql.cnpg.io postgres` → STATUS.
2. `make logs R=postgres`
3. Roles: `kubectl -n homelab get clusters.postgresql.cnpg.io postgres -o jsonpath='{.status.managedRolesStatus}'; echo`

## agent-toolbox or the MCP Inspector answers `403` / `Invalid Host header`
- The address isn't one it accepts: use `http://<HOMELAB_DOMAIN>:8001/mcp` or `http://<tailscale-ip>:8001/mcp`, or add the name to `TOOLBOX_EXTRA_ALLOWED_HOSTS` (agent-toolbox's `devops/helm/values.yml`, then a release).

## A connection to or from agent-toolbox or the MCP Inspector times out
1. Their NetworkPolicy allows only what they need: `kubectl -n homelab get networkpolicy <release> -o yaml`.
2. Expected: agent-toolbox ← agent-runtime, MCP Inspector, Caddy, tailnet devices; agent-toolbox → DNS, OTel Collector, internet. MCP Inspector ← Caddy; → DNS, agent-toolbox, internet.
3. A new caller or target: add it in `apps/agent-toolbox/values.yaml.gotmpl` or `llm/mcp-inspector/values.yaml.gotmpl`, then `make apply R=<release>`.

## A Prometheus target is down (`make verify`, `make targets`)
1. `make logs R=<release>` and `make status`.
2. The pod's `prometheus.io/port` must be the port its metrics are on: its values' `metrics:`.

## A backup fails, or none has run
1. `kubectl -n homelab get cronjob,job | grep backups`
2. `kubectl -n homelab logs job/<the failed backups job>`
3. `make validate` → `/var/backups/homelab exists`.

## The `db-migrate` job fails
1. `kubectl -n homelab logs job/db-migrate-migrate`
2. Fix the migration file, then `make migrate`.

## A release's pods are gone, and `make apply` doesn't bring them back
1. `make apply` only upgrades releases whose files changed; something deleted by hand stays deleted.
2. `git pull` (the server may be behind), then `make sync R=<release>` — raw: `helmfile -l name=<release> sync` (re-deploys it even without a change).

## `another operation (install/upgrade/rollback) is in progress`
1. `helm -n homelab history <release>`
2. `make rollback R=<release>`

## Why it works
- [[Homelab failure modes]] — why each of these happens, and how to debug anything here.
- [[Kubernetes]] · [[Probes]] · [[CoreDNS]] · [[NetworkPolicy]]

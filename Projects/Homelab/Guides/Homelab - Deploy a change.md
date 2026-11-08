---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab]
updated: 2026-11-08
---

# Homelab - Deploy a change

> Change how a release runs — its values, a config file next to them — and deploy only what changed.

**Where:** on the server, in `homelab-infra`, unless a step says otherwise · **All guides:** [[Homelab guides]]

## See what would change
- `make diff` (or `R=<release>`, or `G=<group>`)
- raw: `helmfile diff` (`helmfile -l name=<release> diff`, `helmfile -l group=<group> diff`)

## Apply it
- everything (the release train): `make apply` — raw: `helmfile apply`
- one release: `make apply R=<release>` — raw: `helmfile -l name=<release> apply`
- one group (`platform`, `repository`, `message-broker`, `observability`, `gateway`, `llm`, `apps`): `make apply G=<group>` — raw: `helmfile -l group=<group> apply`

## Re-run a release's deploy jobs without a change (e.g. Keycloak's realm sync)
- `make sync R=<release>`
- raw: `helmfile -l name=<release> sync`

## After editing a config file (`gateway/caddy/Caddyfile`, `gateway/keycloak/sync.sh`, any `values.yaml.gotmpl`)
1. `make validate`
2. `make diff R=<release>`
3. `make apply R=<release>` (the pod restarts with the new file)

## Change a pod's settings

A pod's settings are its release's values. Change the file, never the pod: a change made with `kubectl edit` is lost at the next deploy.

1. On your Mac, edit the release's values file, `<group>/<release>/values.yaml.gotmpl`. For example `apps/agent-runtime/values.yaml.gotmpl`:
   ```yaml
   env:
     LOG_LEVEL: DEBUG
   resources:
     limits: { memory: 1Gi }
   ```
2. Commit, push.
3. On the server: `git pull`.
4. `make diff R=<release>` — raw: `helmfile -l name=<release> diff` → shows exactly what changes.
5. `make apply R=<release>` — raw: `helmfile -l name=<release> apply` → the pod restarts with the new settings.
6. Check: `make status`, `make logs R=<release>`.

- What you can set: kube-charts' app chart, `charts/app/values.yaml` (env, secretEnv, resources, probes, ports, persistence, configFiles, replicas…).
- Maps (`env`, `resources`) merge with what the chart already has; lists (`args`, `ports`) replace the whole list.
- A config file next to the values (`Caddyfile`, `prometheus.yml`, `llm/llm/config.yml`…) works the same way: edit it, then steps 2–6.
- For your own apps, a setting that belongs to the app itself goes in its repository's `devops/helm/values.yml` and ships with its next tag; `apps/<app>/values.yaml.gotmpl` is for this server's choices.

## If it goes wrong
- A release fails or times out: [[Homelab - Troubleshooting]].
- Undo: [[Homelab - Roll back]].

## Why it works
- [[Homelab deployment]] — settings layers, `diff`, `apply`, `sync`.
- [[Homelab change cookbook]] — which file owns what.
- [[helmfile]] · [[Helm]] · [[ConfigMap and Secret]]

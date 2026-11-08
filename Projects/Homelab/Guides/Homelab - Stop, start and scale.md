---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab]
updated: 2026-11-08
---

# Homelab - Stop, start and scale

> Stop and start the cluster or only the homelab, restart pods, redeploy, reinstall or scale a release.

**Where:** on the server, in `homelab-infra`, unless a step says otherwise · **All guides:** [[Homelab guides]]

## Stop

### The whole cluster (every pod, until you start it again; data is kept)
```bash
sudo systemctl stop k3s
sudo /usr/local/bin/k3s-killall.sh
```
- `systemctl stop k3s` alone leaves the pods running; `k3s-killall.sh` stops them.
- k3s starts again at the next boot. To keep it off: `sudo systemctl disable k3s`.
- Check: `sudo crictl ps` → nothing, or `crictl` can't connect.

### Only the homelab (Kubernetes keeps running)
```bash
kubectl -n homelab annotate clusters.postgresql.cnpg.io postgres cnpg.io/hibernation=on --overwrite
kubectl -n homelab scale deploy,statefulset --all --replicas=0
```
- PostgreSQL is run by its operator, so it is stopped by hibernation, not by scale.
- The 03:00 backups fail while it is stopped.
- Check: `make status` → `No resources found` (wait a minute for PostgreSQL).

**Only the LLM** (frees 26 GiB): `make llm-down` — raw: `kubectl -n homelab scale deploy/llm --replicas=0`.

## Start again

### After stopping the whole cluster
```bash
sudo systemctl enable --now k3s
```
Every pod comes back by itself in a few minutes; `make status`, then `make verify`.

### After stopping only the homelab
```bash
kubectl -n homelab annotate clusters.postgresql.cnpg.io postgres cnpg.io/hibernation=off --overwrite
kubectl -n homelab scale deploy,statefulset --all --replicas=1
```
Pods that need PostgreSQL restart until it is ready; after a few minutes `make status` shows them all `Running`, then `make verify`. The LLM: `make llm-up`.

### Restart every running pod (new pods, same settings)
```bash
kubectl -n homelab rollout restart deploy,statefulset
kubectl -n homelab delete pod -l cnpg.io/cluster=postgres      # PostgreSQL: its operator starts a new one
```

**Restart the server:** `sudo reboot`. Everything comes back on its own; `make verify` after.

- `sudo systemctl restart k3s` restarts Kubernetes but not the pods.

## Redeploy, reinstall or scale

| To | Command | What happens |
|---|---|---|
| Deploy what changed | `make apply R=<release>` — raw: `helmfile -l name=<release> apply` | Only if its files or version changed |
| Redeploy even without a change | `make sync R=<release>` — raw: `helmfile -l name=<release> sync` | Re-applies it and re-runs its jobs; brings back what was deleted by hand; pods restart only if something changed |
| Restart its pods | `make restart R=<release>` — raw: `kubectl -n homelab rollout restart deploy/<release>` (`statefulset/<release>` for a database), then `kubectl -n homelab rollout status …` | New pods, same settings; waits until they're ready |
| Reinstall it | `helm -n homelab uninstall <release>`, then `make apply R=<release>` | Everything is recreated; its volumes are kept and taken back, its data with them |
| Go back to the previous revision | `make rollback R=<release>` — raw: `helm -n homelab rollback <release>` | Then set the old version in `environments/versions.yaml`, or the next `make apply` upgrades again |
| See its revisions | `helm -n homelab history <release>` | |

### Scale it (change the number of pods)
- Your apps (homelab-ui, agent-runtime, agent-toolbox): `replicas:` in the app repository's `devops/helm/values.yml`, shipped with its next tag (`vX.Y.Z`, then `apps.<app>` in `environments/versions.yaml`, `make apply R=<app>`). To change it before the next tag, set `replicas:` in `apps/<app>/values.yaml.gotmpl`: it wins over the app's own file.
- The other releases, for good: in their values file (`<group>/<release>/values.yaml.gotmpl`), add `replicas: 2`, commit, push; on the server `git pull`, `make apply R=<release>`.
- For a moment: `kubectl -n homelab scale deploy/<release> --replicas=2`; back with `--replicas=1`. git doesn't know about it, so set it back yourself.
- `replicas: 0` stops a release without uninstalling it.
- More than one pod works only for releases without a volume or a published port: homelab-ui, postgrest, oauth2-proxy, kafka-ui. The others (databases, Kafka, Caddy, the agent, the LLM…) run one pod.

## Why it works
- [[Deployment and StatefulSet]] — rollouts, replicas, Recreate.
- [[Operator]] — why PostgreSQL hibernates instead of scaling.
- [[k3s]] · [[hostPort and hostNetwork]]

---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab]
updated: 2026-11-08
---

# Homelab - Reset the homelab

> Delete every release, Secret and volume of the homelab and start over. All data goes; the operators and the backups stay.

**Where:** on the server, in `homelab-infra`, unless a step says otherwise · **All guides:** [[Homelab guides]]

Deletes all data: databases, accounts, Secrets, volumes. The operators (`cnpg`, `reloader`) and the backups in `/var/backups/homelab` stay.

1. `make backup` (if anything is worth keeping)
2. `kubectl delete namespace homelab` (waits until everything in it is gone)
3. `kubectl -n kube-system delete configmap coredns-custom`
4. `kubectl get pv` → nothing left from `homelab`.
5. Follow [[Homelab - First deploy|First deploy]] from step 3.

## Why it works
- [[Homelab deployment]] · [[Volumes]] · [[Secrets management]]

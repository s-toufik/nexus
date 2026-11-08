---
type: concept
domain: Kubernetes
level: beginner
tags: [concept, kubernetes]
updated: 2026-11-08
---

# Probes

> Health checks Kubernetes runs against a container: **startup** (has it finished starting?), **readiness** (can it take traffic now?), **liveness** (is it stuck and should be restarted?).

## Why it matters
"The process is running" isn't "the service works". Probes let Kubernetes route traffic only to pods that are ready, restart the ones that hang, and know when a deploy really succeeded — helmfile's `wait` depends on readiness.

## How it works
| Probe | When it fails | Typical check |
|---|---|---|
| startup | Container restarted after `failureThreshold × periodSeconds` | Slow starters (Keycloak, databases); other probes wait for it |
| readiness | Pod removed from its [[Service]]'s endpoints; *not* restarted | "Can I reach my database?" |
| liveness | Container restarted | "Am I deadlocked?" — keep it cheap and local |

Check kinds: `httpGet` (2xx/3xx = OK), `tcpSocket` (port open), `exec` (exit 0), `grpc`.

## In our projects
- Keycloak: startup on `/health/started` with up to 60 × 5 s, readiness `/health/ready`, liveness `/health/live`, on its management port 9000.
- MongoDB: `exec mongosh --eval "db.adminCommand('ping').ok"`.
- Caddy: `tcpSocket` on 443.
- `make apply` waits for readiness; homelab-ui's Status page asks `/api/health/<service>`, mostly the same endpoints.

## Pitfalls we met
- **Liveness that depends on another service** (the database) restarts healthy pods when the database blips — cascading restarts. Put dependencies in readiness, not liveness.
- A liveness probe without a startup probe can kill a slow starter in a loop.
- `Running 0/1` = readiness failing; read the Events in `kubectl describe pod`.

## Check yourself
1. Your API's database is down for 30 s. Which probe should notice, and what should happen to the pod?
2. Why does Keycloak have a startup probe?

## Go further
- [Liveness, readiness and startup probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/).
- [Configure probes (task)](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/).

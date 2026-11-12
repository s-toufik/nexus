---
type: architecture
project: "[[Homelab]]"
order: 8
tags: [homelab, architecture, troubleshooting]
updated: 2026-11-12
---

# Homelab failure modes

> What goes wrong, why it goes wrong, and how to read the signs. Every case here really happened or was designed against. The step-by-step fixes are in [[Homelab - Troubleshooting]]; this note is the *why*.

Previous: [[Homelab security model]] · Next: [[Homelab change cookbook]]

**Do it:** [[Homelab - Troubleshooting]] · [[Homelab - Check the homelab]]

## How to debug anything here
Go from the outside in, and let Kubernetes tell you:
1. **What state?** `make status` — `Pending`, `CrashLoopBackOff`, `ImagePullBackOff`, `CreateContainerConfigError`, `0/1 Running`.
2. **Why, says Kubernetes?** `kubectl -n homelab describe pod <pod> | tail -25` — the *Events* at the bottom.
3. **Why, says the app?** `make logs R=<release>` (add `--previous` with raw kubectl for the crash before the restart).
4. **Is it the network?** `kubectl -n homelab exec deploy/caddy -- wget -qO- http://<service>:<port>/…` from a pod that's allowed.
5. **Does the whole thing hold?** `make verify`.

## Pod states, decoded
| State | Means | Usual cause here |
|---|---|---|
| `Pending` | No node can take it | A hostPort already used (`didn't have free ports`); a volume that can't bind |
| `ContainerCreating` for long | Pulling the image or mounting | Big image, slow network; a hostPath that doesn't exist |
| `ImagePullBackOff` | Image or tag not found, or no access | Version not published yet; GHCR package not public; Docker Hub rate limit |
| `CreateContainerConfigError` | A referenced Secret/key is missing | `make secrets` not run after a new Secret was added |
| `CrashLoopBackOff` | Starts, exits, restarts with growing delays | Wrong config, can't reach its database, out of memory (`OOMKilled` in describe) |
| `Running 0/1` | Up but not Ready | Readiness probe failing — the app isn't ready, or the probe is wrong ([[Probes]]) |

## The edge cases, by layer
### The server
- **Ethernet and Wi-Fi both up → `DNSConfigForming` every minute.** The host's resolv.conf lists the router once per network; Linux takes only 3 nameservers, so kubelet warns. k3s gets its own one-line `resolv.conf` ([[CoreDNS]]). New router → redo it.
- **Enabling the `nftables` service wipes the cluster's networking**: its default config flushes every table, including k3s' and Tailscale's.
- **Node IP changes break k3s**: avoided by the dummy interface ([[Homelab server]]).

### Deploying
- **`make apply` says nothing changed, but the pod is gone**: it compares git with the *Helm release*, not with the cluster. `make sync R=…`.
- **Same tag rebuilt, old code runs**: chart cached by helmfile, image cached by k3s (`IfNotPresent`). Tags must be immutable; bump the version.
- **`dev` tag never updates**: same reason; deploy the pre-release's own tag, `X.Y.Z-rc.N`.
- **`another operation is in progress`**: a Helm operation was interrupted (Ctrl-C, timeout) and left the release `pending-*`. `make rollback R=…`.
- **`docker-credential-desktop not found`**: Helm reads `~/.docker/config.json`, which names a credential helper from Docker Desktop that isn't installed on the server.
- **A release with hostPorts can't roll**: the new pod needs the port the old one holds. The chart uses `Recreate` (stop old, start new) — a few seconds of downtime is the price of one node.
- **Kafka read Kubernetes' variables as settings**: Kubernetes injects `KAFKA_PORT=tcp://…` style variables for every Service; Kafka's image treats every `KAFKA_*` as a config key. The chart turns `enableServiceLinks` off.

### Sign-in
- **Redirect loop after sign-in**: oauth2-proxy can't reach Keycloak at `https://<domain>:8443` *from inside the cluster* → the CoreDNS rewrite (in the Caddy release) is missing.
- **401 from `/api/*` in the UI after a while**: the session expired (8 h); `--cookie-refresh=4m` keeps the access token fresh while you're active.
- **Account locked**: 5 wrong passwords; `make user-unlock ACCOUNT=…`.

### Data
- **MongoDB 8 won't start** on the server's kernel (7.0.0): pinned to 7.0.x. Read release notes for platform requirements before bumping.
- **Reinstalled PostgreSQL, password wrong**: the volume survived with the old passwords.
- **PostgREST doesn't see a new column**: its schema cache; `make migrate` reloads it.

### Observability
- **A model never unloads**: Prometheus scraping it counts as activity → llm-sd lists it only during its first `ttl`.
- **Prometheus target down**: `metrics.port` doesn't match the real metrics port.
- **Logs twice**: an app sending OTLP logs *and* printing to stdout; annotate it `homelab.io/logs: otlp`.

### Agent and tools
- **`403 host not allowed` / `Invalid Host header`**: DNS-rebinding protection in MCP servers. Use an accepted host or add it to the allow-list.
- **Tools missing after adding an MCP server**: tools are discovered at start → `make restart R=agent-toolbox`, then agent-runtime.
- **A connection from agent-toolbox times out**: the fence. That's NetworkPolicy *working*; add the destination only if it should be allowed.

### Kubernetes page in homelab-ui
- **Pod logs answer `406`**: the logs endpoint returns `text/plain`; a client sending `Accept: application/json` only is refused. Ask with `Accept: */*`.

## Check yourself
1. A pod is `Running 0/1` for 10 minutes. What are the two possible culprits, and which command tells them apart?
> [!success]- Answer
> The app really isn't ready (still starting, or a dependency it needs is down), or the probe itself is wrong (wrong port or path). `kubectl -n homelab describe pod <pod>` tells them apart: its Events show what the readiness probe got. `connection refused` or a 404 points at the probe; a 503 is the app saying it isn't ready, and `make logs R=<release>` says why.
2. Why does a one-node cluster force `Recreate` for pods with hostPorts?
> [!success]- Answer
> A rolling update starts the new pod before stopping the old one. On one node, the old pod holds `hostIP:port`, so the new one can never be scheduled and stays `Pending`. `Recreate` stops the old pod first, at the price of a few seconds of downtime.
3. Explain the `DNSConfigForming` warning to a colleague in three sentences.
> [!success]- Answer
> With Ethernet and Wi-Fi both up, the server's resolv.conf lists the router once per network, plus any other server. Linux uses at most three nameservers, so when kubelet builds each pod's DNS config it drops the extras and warns every minute. Giving k3s its own one-line resolv.conf with the router once removes the warning.

## Go further
- [Kubernetes: debug pods](https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/).
- [Kubernetes: debug services](https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/).
- [A visual guide to troubleshooting Kubernetes deployments](https://learnkube.com/troubleshooting-deployments).

---
type: concept
domain: Kubernetes
level: intermediate
tags: [concept, kubernetes, security]
updated: 2026-11-08
---

# Pod security context

> Settings that limit what a container's processes may do on the node: which user they run as, which Linux capabilities and system calls they get, whether they can write their own files or gain privileges.

## Why it matters
Containers share the node's kernel. A container running as root with every capability is one kernel bug away from the node. Hardening limits the damage of a compromised app — it's cheap and it's what security reviews look for first.

## How it works
| Setting | Means |
|---|---|
| `runAsNonRoot`, `runAsUser`, `runAsGroup` | Not UID 0; a fixed unprivileged user |
| `readOnlyRootFilesystem` | The image's files can't be modified (malware can't drop binaries); writable paths via `emptyDir` |
| `allowPrivilegeEscalation: false` | No setuid tricks to become root |
| `capabilities.drop: [ALL]` | Root's powers are split into ~40 capabilities; drop them all, add back only what's needed |
| `seccompProfile: RuntimeDefault` | Blocks dangerous system calls |
| `privileged` | Everything off — avoid |

Kubernetes' **Pod Security Standards** (`privileged`, `baseline`, `restricted`) bundle these levels.

## In our projects
- The `app` chart sets `RuntimeDefault` seccomp, no privilege escalation and `drop: [ALL]` on every container; releases add their user and `readOnlyRootFilesystem` ([[kube-charts]]).
- **Caddy** adds back exactly one capability, `NET_BIND_SERVICE`, to listen on 443 (ports under 1024 need it).
- **Backups** run as root (to write the root-only `/var/backups/homelab`) — a deliberate exception.
- User IDs come from each image (Keycloak 1000, PostgREST 1000, oauth2-proxy 65532, MongoDB 999, Headlamp 100).

## Pitfalls we met
- `readOnlyRootFilesystem` breaks apps that write to `/tmp` or `$HOME` → mount an `emptyDir`, or `HOME: /tmp` (postgres-mcp).
- The wrong `runAsUser` gives "permission denied" on a volume created by another UID.

## Check yourself
1. Why does Caddy need `NET_BIND_SERVICE`, and why is adding one capability better than running privileged?
> [!success]- Answer
> Listening on a port below 1024, like 443, is a privileged operation, and the chart drops all capabilities. Adding back only `NET_BIND_SERVICE` gives Caddy exactly that power; `privileged` would give it every capability and the node's devices, so a bug in Caddy would be one step from the node.
2. What does `readOnlyRootFilesystem` protect against?
> [!success]- Answer
> Changes to the image's files: an attacker or a bug can't replace binaries, drop tools or alter config inside the container. Only the paths you mount as writable can change.

## Go further
- [Configure a security context](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/).
- [Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/).
- [Linux capabilities (man 7)](https://man7.org/linux/man-pages/man7/capabilities.7.html).

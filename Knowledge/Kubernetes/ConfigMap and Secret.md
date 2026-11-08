---
type: concept
domain: Kubernetes
level: beginner
tags: [concept, kubernetes]
updated: 2026-11-08
---

# ConfigMap and Secret

> Configuration kept outside the image: a **ConfigMap** holds plain settings and files, a **Secret** holds passwords and keys. Pods read them as environment variables or mounted files.

## Why it matters
The same image should run anywhere; only its configuration changes ([12-factor config](https://12factor.net/config)). Keeping config in Kubernetes objects means you can change it without rebuilding, and keep secrets out of images and git.

## How it works
- Both are key → value maps. Mounted as a volume, each key becomes a file; as env, `valueFrom.configMapKeyRef` / `secretKeyRef`.
- **Secrets are base64-encoded, not encrypted** by default — base64 is just a text encoding. Protection comes from: encryption at rest (k3s `secrets-encryption`), [[RBAC]] limiting who can read them, and not mounting them where they're not needed.
- **Changes don't restart pods.** Mounted files update after a delay; env variables never do until the pod restarts. Hence tools like Reloader, or a checksum annotation on the pod template.
- Secret types: `Opaque` (anything), `kubernetes.io/basic-auth` (`username`, `password`), `kubernetes.io/tls`, …

## In our projects
- **ConfigMaps** come from the chart's `configFiles:` — the Caddyfile, `prometheus.yml`, dashboards, migrations — read from git with `readFile`. Their checksum is a pod annotation: edit the file, the pod restarts ([[kube-charts]]).
- **Secrets** are created on the server by `scripts/secrets.sh` (never in git) and referenced with `secretEnv: { VAR: { secret: name, key: key } }`. Reloader restarts the pods that use one when it changes. See [[Secrets management]].
- A missing Secret or key → pod `CreateContainerConfigError`.

## Pitfalls we met
- `kubectl get secret x -o yaml` shows values base64-encoded: anyone who can read Secrets can read the passwords. `make show-secrets` decodes them on purpose — keep that output out of chats and git.

## Check yourself
1. Is a Kubernetes Secret encrypted? Where, and against whom?
2. You change a ConfigMap read as env variables. When does the app see the new value?

## Go further
- [ConfigMaps](https://kubernetes.io/docs/concepts/configuration/configmap/), [Secrets](https://kubernetes.io/docs/concepts/configuration/secret/).
- [Good practices for Secrets](https://kubernetes.io/docs/concepts/security/secrets-good-practices/).

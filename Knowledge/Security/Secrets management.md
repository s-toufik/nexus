---
type: concept
domain: Security
level: intermediate
tags: [concept, security, kubernetes]
updated: 2026-11-08
---

# Secrets management

> Where passwords, keys and tokens are created, stored, given to programs, rotated and revoked — without ever landing in git, logs, chat or a command line.

## Why it matters
Leaked secrets are one of the most common causes of breaches, usually by accident: committed to a repository, printed in a CI log, pasted in a ticket. A deliberate path for secrets makes the safe way the easy way.

## How it works
- **Lifecycle**: generate (random, long) → store (encrypted at rest, access-controlled) → deliver (env var or file, to the one program that needs it) → rotate → revoke.
- **Options**, from simple to heavy:
  - Kubernetes Secrets created out-of-band (a script);
  - **encrypted in git**: SOPS, Sealed Secrets — reviewable, rebuildable;
  - **external stores**: Vault, cloud secret managers, with External Secrets Operator syncing them in.
- **Rotation without downtime**: the consumer must reload — restart on change (Reloader), or re-read.
- **Scanning**: tools like gitleaks catch secrets before they're pushed.

## In our projects
- `scripts/secrets.sh` holds `SPECS`: each Secret, its type and keys; `password:24` = generate 24 chars, `token?` = you type it at a hidden prompt ([[homelab-infra]]).
- `make secrets` creates what's missing; `make secret-rotate` / `secret-set` change one; `make show-secrets` reveals them (keep the output private).
- k3s encrypts Secrets at rest; [[RBAC]] limits who reads them; every release's presync hook checks its Secrets exist.
- **Reloader** restarts pods whose Secret changed; CloudNativePG re-applies role passwords (`cnpg.io/reload`).

## Pitfalls we met
- A rebuilt server gets *new* secrets; restored data keeps old passwords → re-set them.
- Base64 isn't encryption ([[ConfigMap and Secret]]).

## Check yourself
1. Trace a password from `make secrets` to the PostgREST process. Where is it encrypted, where is it plain?
2. When would you move to SOPS or External Secrets?

## Go further
- [OWASP secrets management cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html).
- [Kubernetes: good practices for Secrets](https://kubernetes.io/docs/concepts/security/secrets-good-practices/).
- [SOPS](https://github.com/getsops/sops), [External Secrets Operator](https://external-secrets.io/).

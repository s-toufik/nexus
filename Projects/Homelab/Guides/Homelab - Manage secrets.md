---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab]
updated: 2026-11-08
---

# Homelab - Manage secrets

> Every password and key the services use: create, list, show, read, type, rotate — and where each is stored and named.

**Where:** on the server, in `homelab-infra`, unless a step says otherwise · **All guides:** [[Homelab guides]]

Kubernetes Secrets in namespace `homelab`, encrypted on disk by k3s. Never in git, never on a command line.

## Create what is missing (safe to re-run)

- `make secrets` — raw: `./scripts/secrets.sh`

## List them (names and keys, no values)

- `make secrets-list` — raw: `./scripts/secrets.sh list`

## Show every value

`make show-secrets` — raw: `./scripts/secrets.sh show`

It prints one line per value, `<secret>/<key>: <value>`: every Secret `make secrets` creates (MongoDB, Keycloak and Grafana admins, PostgreSQL roles, sign-in and gateway keys, the LLM key) and PostgreSQL's `postgres-superuser` and `postgres-app` (with their connection strings).

- The sign-in accounts' passwords aren't there: Keycloak keeps only their hashes. Replace one with `make user-password ACCOUNT=<name>` — raw: `./scripts/users.sh password <name>`.
- The values are in your terminal: clear it after (`clear`), and never paste them into git or a chat.
- One Secret only: [[#Read one]].

## Read one

**Read one value:**
```bash
kubectl -n homelab get secret grafana-admin -o jsonpath='{.data.password}' | base64 -d; echo
```
Replace `grafana-admin` and `password` with the Secret and key.

**Read every key of a Secret:**
```bash
kubectl -n homelab get secret mongodb -o json | jq -r '.data | map_values(@base64d)'
```

- The value is printed in your terminal: copy it where it's needed, never into git or a chat.
- Change one: `make secret-rotate SECRET=<secret> KEY=<key>` (generated) or `make secret-set SECRET=<secret> KEY=<key>` (typed) — raw: `./scripts/secrets.sh rotate|set <secret> <key>`. The pods using it restart by themselves.

## Type a value yourself (e.g. the LLM provider's API key)

1. `make secret-set SECRET=<secret> KEY=<key>` — raw: `./scripts/secrets.sh set <secret> <key>`
2. Paste the value twice (hidden). The pods using it restart.

## Rotate a generated value

1. `make secret-rotate SECRET=<secret> KEY=<key>` — raw: `./scripts/secrets.sh rotate <secret> <key>`
2. The pods using it restart; PostgreSQL applies a new role password by itself.
3. For `oauth2-proxy/client-secret` or `grafana-oidc/client-secret`: `make sync R=keycloak`.
- Rotatable: `pg-role-postgrest/password`, `pg-role-keycloak/password`, `oauth2-proxy/client-secret`, `oauth2-proxy/cookie-secret` (signs everyone out), `grafana-oidc/client-secret`, `tasker-gateway/secret`, `llm-gateway/api-key`.
- Not rotatable (read once, when their data is created): `keycloak-admin`, `grafana-admin`, `mongodb`.

## Where the passwords are

| Password | Stored | Can I read it? |
|---|---|---|
| Sign-in accounts (yours, other people's) | Keycloak, in PostgreSQL's `keycloak` database, as Argon2id hashes | No, only replace it: `make user-password ACCOUNT=<name>` — raw: `./scripts/users.sh password <name>` |
| Services' passwords and keys (database roles, Keycloak and Grafana admins, MongoDB root, gateway keys, the agent's LLM key) | Kubernetes Secrets in namespace `homelab` ([[Homelab - Manage secrets#Where the Secrets are stored|where the Secrets are stored]]) | Yes, with kubectl |
| PostgreSQL's `postgres` superuser and the `homelab` database owner | Secrets `postgres-superuser` and `postgres-app`, created by the PostgreSQL operator | Yes, with kubectl |

Nothing is in git: not the passwords, not `environments/local.yaml` (only the server's name and address).

## Where the Secrets are stored

**Where.** Kubernetes Secrets in namespace `homelab`. k3s keeps them in its database, `/var/lib/rancher/k3s/server/db/state.db`, encrypted; the key is `/var/lib/rancher/k3s/server/cred/encryption-config.json` (root only). Anyone in the group `k3s-admin` can read them through kubectl.

**Which ones.** `make secrets-list` — raw: `./scripts/secrets.sh list` (every Secret and its keys, no values). With their values: `make show-secrets` — raw: `./scripts/secrets.sh show`. The list the homelab creates is `SPECS` in [`scripts/secrets.sh`](https://github.com/s-toufik/homelab-infra/blob/develop/scripts/secrets.sh):

| Secret | Keys | Used by |
|---|---|---|
| `keycloak-admin` | `username`, `password` | Keycloak's admin (the `make user-*` commands use it) |
| `grafana-admin` | `username`, `password` | Grafana's local admin |
| `mongodb` | `username`, `password` | MongoDB's root |
| `pg-role-postgrest`, `pg-role-keycloak` | `username`, `password` | PostgreSQL roles |
| `oauth2-proxy` | `client-secret`, `cookie-secret` | the sign-in |
| `grafana-oidc` | `client-secret` | Grafana's sign-in with Keycloak |
| `tasker-gateway` | `secret` | Caddy → PostgREST |
| `llm-gateway` | `api-key` | the LLM API on `:8090` |
| `agent-runtime` | `llm-api-key` | the agent's LLM provider (typed by you) |
| `mongodb-mcp` | `username`, `password` | MongoDB's MCP server (user `mcp`) |
| `pg-role-mcp` | `username`, `password` | PostgreSQL's MCP server (role `mcp`) |
| `grafana-mcp` | `token` | Grafana's MCP server: a Grafana service-account token (typed by you) |

## Where the usernames are set

| User | Set in | Created | Password in |
|---|---|---|---|
| MongoDB `root`, Keycloak `admin`, Grafana `admin` | `SPECS` in [`scripts/secrets.sh`](https://github.com/s-toufik/homelab-infra/blob/develop/scripts/secrets.sh) (`username=<name>`) | by the service, at its first start on an empty volume | Secrets `mongodb`, `keycloak-admin`, `grafana-admin` |
| PostgreSQL roles `postgrest`, `keycloak`, `mcp` | `SPECS` in `scripts/secrets.sh` and `roles:` in [`repository/postgres/values.yaml.gotmpl`](https://github.com/s-toufik/homelab-infra/blob/develop/repository/postgres/values.yaml.gotmpl) (the two names must match) | by the PostgreSQL operator, kept as declared | Secrets `pg-role-postgrest`, `pg-role-keycloak`, `pg-role-mcp` |
| MongoDB user `mcp` (MongoDB's MCP server) | `SPECS` in `scripts/secrets.sh` (`mongodb-mcp`) | by the `mongodb` release's job, at every deploy (its role follows `mcp.mongodb.write`) | Secret `mongodb-mcp` |
| PostgreSQL `postgres` (superuser) | PostgreSQL itself | at the cluster's first start | Secret `postgres-superuser`, written by the operator |
| PostgreSQL `homelab` (owner of the `homelab` database) | `owner: homelab` in the pg-cluster chart (`kube-charts/charts/pg-cluster/values.yaml`); `repository/postgres/values.yaml.gotmpl` doesn't override it | at the cluster's first start only | Secret `postgres-app`, written by the operator |
| Sign-in accounts | you: `make user-add ACCOUNT=<name>` — raw: `./scripts/users.sh add <name>` | in Keycloak, by that command | Keycloak (hashes only) |

- Editing a username afterwards changes nothing: `make secrets` keeps a Secret's stored values, and the services and the operator read them at their first start only.
- Who owns what in PostgreSQL: `homelab` owns the database `homelab` but none of its tables; the schema `tasker` and its tables belong to `postgres` (the migrations run as `postgres`); `keycloak` owns the database `keycloak` and its tables. Nothing logs in as `homelab`.

## If it goes wrong
- A pod is `CreateContainerConfigError`, or `make apply` stops at `secrets.sh check`: [[Homelab - Troubleshooting]].

## Why it works
- [[Secrets management]] — the lifecycle, and why never in git or on a command line.
- [[ConfigMap and Secret]] · [[PostgreSQL roles and privileges]] · [[Operator]]

---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab]
updated: 2026-11-08
---

# Homelab - Every make command

> Every `make` command and the raw command it runs. `make help` prints the list on the server.

**Where:** on the server, in `homelab-infra`, unless a step says otherwise · **All guides:** [[Homelab guides]]

| make | Raw command |
|---|---|
| `make local` | `./scripts/local.sh` |
| `make secrets` | `./scripts/secrets.sh` |
| `make secrets-list` | `./scripts/secrets.sh list` |
| `make show-secrets` | `./scripts/secrets.sh show` |
| `make secret-set SECRET=… KEY=…` | `./scripts/secrets.sh set <secret> <key>` |
| `make secret-rotate SECRET=… KEY=…` | `./scripts/secrets.sh rotate <secret> <key>` |
| `make validate` | `./scripts/validate.sh` |
| `make diff [R=…\|G=…]` | `helmfile [-l name=<release>\|-l group=<group>] diff` |
| `make apply [R=…\|G=…]` | `helmfile [-l name=<release>\|-l group=<group>] apply` |
| `make sync [R=…\|G=…]` | `helmfile [-l name=<release>\|-l group=<group>] sync` |
| `make template [R=…\|G=…]` | `helmfile [-l name=<release>\|-l group=<group>] template` |
| `make releases` | `helm list -A` |
| `make rollback R=…` | `helm -n homelab rollback <release>` |
| `make restart R=…` | `kubectl -n homelab rollout restart deploy/<release>` (or `statefulset/…`), then `kubectl -n homelab rollout status …` |
| `make status` · `make ps` | `kubectl -n homelab get pods -o wide` |
| `make logs R=… [TAIL=…]` | `kubectl -n homelab logs -f --tail=200 -l app.kubernetes.io/instance=<release> --all-containers --prefix` |
| `make events` | `kubectl -n homelab get events --sort-by=.lastTimestamp \| tail -n 40` |
| `make top` | `kubectl -n homelab top pods` |
| `make verify` | `./scripts/verify.sh` |
| `make users` | `./scripts/users.sh list` |
| `make user-add ACCOUNT=…` | `./scripts/users.sh add <name>` |
| `make user-password ACCOUNT=…` | `./scripts/users.sh password <name>` |
| `make user-admin ACCOUNT=…` | `./scripts/users.sh admin <name>` |
| `make user-unadmin ACCOUNT=…` | `./scripts/users.sh unadmin <name>` |
| `make user-disable ACCOUNT=…` | `./scripts/users.sh disable <name>` |
| `make user-enable ACCOUNT=…` | `./scripts/users.sh enable <name>` |
| `make user-unlock ACCOUNT=…` | `./scripts/users.sh unlock <name>` |
| `make user-remove ACCOUNT=…` | `./scripts/users.sh remove <name>` |
| `make sessions-revoke` | `./scripts/secrets.sh rotate oauth2-proxy cookie-secret && ./scripts/users.sh logout-all` |
| `make sh R=…` | `kubectl -n homelab exec -it <release's running pod> -- sh` |
| `make psql` | `kubectl -n homelab exec -it <postgres primary pod> -c postgres -- psql -d homelab` |
| `make mongosh` | `kubectl -n homelab exec -it mongodb-0 -- sh -c 'mongosh -u … -p … --authenticationDatabase admin'` |
| `make migration-new NAME=…` | create `repository/db-migrate/migrations/<NNN>_<name>.sql` |
| `make migrate` | `helmfile -l name=db-migrate sync`, then `NOTIFY pgrst, 'reload schema'` in psql |
| `make migrate-status` | `./scripts/dbmate.sh status` |
| `make migrate-rollback` | `./scripts/dbmate.sh rollback` |
| `make topics` · `topic-create` · `topic-describe` · `consume` · `groups` | see [[Homelab - Use Kafka|Use Kafka]] |
| `make targets` | `kubectl -n homelab exec deploy/caddy -c caddy -- wget -q -O - http://prometheus:9090/api/v1/targets` |
| `make llm-status` · `llm-running` · `llm-ask` · `llm-models` · `llm-download` · `llm-down` · `llm-up` | see [[Homelab - Run the LLM and agent|Run the LLM and agent]] |
| `make backup` | `./scripts/backups.sh now` |
| `make backups` | `./scripts/backups.sh list` |
| `make restore-postgres FILE=…` | `./scripts/backups.sh restore-postgres <file>` |
| `make restore-mongo FILE=…` | `./scripts/backups.sh restore-mongo <file>` |
| `make destroy` | `helmfile destroy` |

## Why it works
- [[homelab-infra]] — the scripts behind them.

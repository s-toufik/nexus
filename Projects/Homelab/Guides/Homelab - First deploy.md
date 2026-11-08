---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab]
updated: 2026-11-08
---

# Homelab - First deploy

> Deploy the whole homelab on a fresh server and sign in. Once, after [[Homelab - Install Kubernetes]] and [[Homelab - Set up GitHub]].

**Where:** on the server, in `homelab-infra`, unless a step says otherwise · **All guides:** [[Homelab guides]]

1. Get the repository:
   ```bash
   git clone git@github.com:s-toufik/homelab-infra.git && cd homelab-infra
   git switch develop
   ```
2. Write this server's name and address:
   - `make local`
   - raw: `./scripts/local.sh`
3. Create the passwords and keys:
   - `make secrets`
   - raw: `./scripts/secrets.sh`
4. Type the LLM provider's API key (NVIDIA's `nvapi-…`; any text if `llmBaseUrl` in `environments/default.yaml` is the local `http://llm:8080/v1`):
   - `make secret-set SECRET=agent-runtime KEY=llm-api-key`
   - raw: `./scripts/secrets.sh set agent-runtime llm-api-key`
5. Create the backups folder (root only):
   ```bash
   sudo install -d -m 0700 /var/backups/homelab
   ```
6. Check:
   - `make validate`
   - raw: `./scripts/validate.sh`
7. Deploy everything (the first time ~10 minutes: images download, PostgreSQL starts):
   - `make apply`
   - raw: `helmfile apply`
8. Create your account (email, names, password twice):
   - `make user-add ACCOUNT=<name>`
   - raw: `./scripts/users.sh add <name>`
9. Make it admin:
   - `make user-admin ACCOUNT=<name>`
   - raw: `./scripts/users.sh admin <name>`
10. Verify, every line ✓:
   - `make verify`
   - raw: `./scripts/verify.sh`
11. Open `https://<HOMELAB_DOMAIN>/` on a Tailscale device and sign in.

Then: [[Homelab - Keep the server running]] and [[Homelab - Measure the internet speed]] if not done yet.

## If it goes wrong
- `make validate` or `make apply` stops: [[Homelab - Troubleshooting]].

## Why it works
- [[Homelab deployment]] — what `make apply` does, release by release.
- [[Secrets management]] · [[Homelab gateway and sign-in]] · [[Tailscale]]

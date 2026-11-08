---
type: index
project: "[[Homelab]]"
tags: [index, guide, homelab]
updated: 2026-11-08
---

# Homelab guides

> How to run the homelab: one guide per job, steps only. Each `make` command is followed by the raw command it runs. Why things work that way is in the notes each guide links under *Why it works*.

## In every guide
- Commands run on the server, in the `homelab-infra` folder, unless the guide's **Where** says otherwise.
- `<HOMELAB_DOMAIN>` = `<machine>.<tailnet>.ts.net`. `<tailscale-ip>` = `tailscale ip -4`. `<lan-ip>` = the `src` of `ip -4 route get 1.1.1.1`.
- `<release>` = a release name in `helmfile.yaml.gotmpl` (`caddy`, `keycloak`, `homelab-ui`…). `<group>` = `platform`, `repository`, `message-broker`, `observability`, `gateway`, `llm`, `apps`. `<name>` = an account name.

## Set up the server (once, in this order)
1. [[Homelab - Prepare the server]] — Ubuntu laptop → always-on server on the tailnet.
2. [[Homelab - Install Kubernetes]] — k3s, Helm, helm-diff, helmfile; upgrades.
3. [[Homelab - Keep the server running]] — freezes, watchdogs, updates, battery, offline alerts.
4. [[Homelab - Measure the internet speed]] — after the first deploy.
5. [[Homelab - Test or undo the server setup]]

## Set up the homelab (once)
1. [[Homelab - Set up GitHub]] — public charts and images.
2. [[Homelab - First deploy]]

## Change it
- [[Homelab - Deploy a change]] — values, config files, a pod's settings.
- [[Homelab - Release an app]] — a new version, a dev image, a rebuilt tag.
- [[Homelab - Roll back]]
- [[Homelab - Change a chart]]
- [[Homelab - Add an app]]
- [[Homelab UI guides]] — working on the UI itself.

## Run it
- [[Homelab - Check the homelab]] — status, `make verify`, logs.
- [[Homelab - Stop, start and scale]]
- [[Homelab - Manage accounts]]
- [[Homelab - Manage secrets]]
- [[Homelab - Connect to the databases]] — psql, mongosh, pgAdmin, Compass, an app's own user.
- [[Homelab - Migrate the database]]
- [[Homelab - Back up and restore]]
- [[Homelab - Use observability]]
- [[Homelab - Run the LLM and agent]]
- [[Homelab - Use Kafka]]

## When it breaks
- [[Homelab - Troubleshooting]] — by symptom.
- [[Homelab - Reset the homelab]] — start over.

## Reference
- [[Homelab - Every make command]]

## Quick answers
| Question | Answer |
|---|---|
| Where are the passwords stored? | [[Homelab - Manage secrets#Where the passwords are]] |
| How do I read a password? | [[Homelab - Manage secrets#Read one]] |
| How do I see every password on the server? | [[Homelab - Manage secrets#Show every value]] |
| Where are the usernames set? | [[Homelab - Manage secrets#Where the usernames are set]] |
| How do I connect pgAdmin 4? | [[Homelab - Connect to the databases#pgAdmin 4]] |
| Which PostgreSQL user should my app use? | [[Homelab - Connect to the databases#Give an app its own PostgreSQL user]] |
| How do I connect to MongoDB? | [[Homelab - Connect to the databases#MongoDB]] |
| How do I see the logs? | [[Homelab - Check the homelab#Read the logs]] |
| How do I stop or restart everything? | [[Homelab - Stop, start and scale]] |
| How do I redeploy, reinstall or scale an app? | [[Homelab - Stop, start and scale#Redeploy, reinstall or scale]] |
| How do I change a pod's settings? | [[Homelab - Deploy a change#Change a pod's settings]] |
| How do I deploy a dev image? | [[Homelab - Release an app#Try a dev image]] |
| I rebuilt a release under the same tag | [[Homelab - Release an app#A version rebuilt under the same tag]] |

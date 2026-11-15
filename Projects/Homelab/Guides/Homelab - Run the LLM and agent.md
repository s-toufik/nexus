---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab]
updated: 2026-11-15
---

# Homelab - Run the LLM and agent

> Chat with the agent, call its API, connect MCP clients, change the LLM provider, run the local models, and give the toolbox Grafana, MongoDB and PostgreSQL.

**Where:** on the server, in `homelab-infra`, unless a step says otherwise · **All guides:** [[Homelab guides]]

## Chat
- homelab-ui → **Agent**; pick the agent in the settings panel (the supervisor by default).

## Call the agent API (from a tailnet device)
- In a browser, signed in: `https://<HOMELAB_DOMAIN>:8100/docs` (the supervisor)
- From Postman or a script: `http://<HOMELAB_DOMAIN>:8000` (the supervisor, plain HTTP, no sign-in)
- One agent, signed in: `https://<HOMELAB_DOMAIN>/api/agents/<name>/v1/api2a`, `/api/agents/<name>/v1/models`
- Which agents answer: `https://<HOMELAB_DOMAIN>/api/agent/v1/agents`

## Connect an MCP client to agent-toolbox (from a tailnet device)
- `http://<HOMELAB_DOMAIN>:8001/mcp` (every tool), or `/mcp/<scope>` (one scope's tools)
- With the short MagicDNS name, add it to `TOOLBOX_EXTRA_ALLOWED_HOSTS` in agent-toolbox's `devops/helm/values.yml` and release it.

## List and try the tools in the browser
- `https://<HOMELAB_DOMAIN>:6274` (MCP Inspector, signed in) → **Connect** → **Tools → List Tools**.

## The agent's model providers
1. NVIDIA's key: `make secret-set SECRET=agent-runtime KEY=llm-api-key` — raw: `./scripts/secrets.sh set agent-runtime llm-api-key`
2. Leave out the homelab's models: remove `HOMELAB_LLM_BASE_URL` from the agents' `apps/agent-<name>/values.yaml.gotmpl`.
3. `make apply G=apps` — raw: `helmfile -l group=apps apply`
4. Check: `make logs R=agent-supervisor` → no `Model provider '…' has no URL` line for a provider you want.

## Move from agent-runtime to the agents (first time)
1. agent-toolbox with scopes and agent-runtime with agents are published, and `apps.agentToolbox` and `apps.agentRuntime` in `environments/versions.yaml` name them.
2. `git pull`.
3. `make apply R=agent-toolbox` — raw: `helmfile -l name=agent-toolbox apply` → it serves `/mcp/<scope>` next to `/mcp`.
4. `make apply G=apps` — raw: `helmfile -l group=apps apply` → the release `agent-runtime` goes, `agent-supervisor`, `agent-observation`, … start, one pod each.
5. `make verify` — raw: `./scripts/verify.sh` → every `agent-<name> is ready and its card names it <name>` and `the supervisor knows every agent` are ✓.
6. Once you no longer need its SQLite file: `kubectl -n homelab delete pvc agent-runtime-sqlite`. Its MongoDB conversations stay in the database `agent_runtime`, which the agents don't use.

## Move from the orchestrator and chat to the supervisor
1. agent-runtime with `agents/supervisor/` is published, and `apps.agentRuntime` in `environments/versions.yaml` names it.
2. `git pull`.
3. `helm -n homelab uninstall agent-orchestration agent-chat` → `release "agent-orchestration" uninstalled`, `release "agent-chat" uninstalled`.
4. `make apply G=apps` — raw: `helmfile -l group=apps apply` → `agent-supervisor` starts on `:8000`.
5. `make apply R=caddy` — raw: `helmfile -l name=caddy apply` → `/api/agent` and `:8100` go to the supervisor.
6. `make verify` — raw: `./scripts/verify.sh` → `the supervisor answers on http://<HOMELAB_DOMAIN>:8000` and `the supervisor knows every agent (7 of 7)` are ✓.
7. Optional: `make mongosh`, then `db.getSiblingDB("agent_orchestration").dropDatabase()` and `db.getSiblingDB("agent_chat").dropDatabase()`.

## Add an agent
1. In agent-runtime: [[Agent runtime - Add an agent]]; release it.
2. On your Mac, in homelab-infra: `<name>` in `agents:` of `environments/default.yaml`; `apps/agent-<name>/values.yaml.gotmpl` (copy `apps/agent-observation/`, change the names); `AGENT_<NAME>_URL: http://agent-<name>:8000` in `apps/agent-supervisor/values.yaml.gotmpl`; `<name>` in the `/api/agents/` pattern of `gateway/caddy/Caddyfile`. Commit, push, then `git pull` here.
3. `make apply G=apps` — raw: `helmfile -l group=apps apply`; then `make apply R=caddy` — raw: `helmfile -l name=caddy apply`.
4. `make verify` — raw: `./scripts/verify.sh` → `agent-<name> is ready and its card names it <name>` is ✓.

## Add or change a tool scope
1. In agent-toolbox: [[Agent toolbox - Add or change a scope]]; in agent-runtime, the agent's `tool_scope`; release both.
2. `make apply R=agent-toolbox` — raw: `helmfile -l name=agent-toolbox apply`; then `make apply G=apps` — raw: `helmfile -l group=apps apply`.
3. `make verify` — raw: `./scripts/verify.sh`.

## The local LLM
- Up, and its models: `make llm-status` — raw: `kubectl -n homelab exec deploy/caddy -c caddy -- wget -q -O - http://llm:8080/v1/models`
- Loaded right now: `make llm-running` — raw: `LLM_GATEWAY_API_KEY=… python3 llm/llm/test.py running https://<HOMELAB_DOMAIN>:8090`
- Ask: `make llm-ask [M=<model>] [Q="…"]` — raw: `LLM_GATEWAY_API_KEY=… python3 llm/llm/test.py ask https://<HOMELAB_DOMAIN>:8090 <model> "<question>"`
- Model names: `make llm-models` — raw: `./scripts/download_models.sh --list`
- Download before first use: `make llm-download MODELS="<model> …"` (or `MODELS=--all`) — raw: `./scripts/download_models.sh <model> …`
- Stop it (frees its memory): `make llm-down` — raw: `kubectl -n homelab scale deploy/llm --replicas=0`; start it: `make llm-up` — raw: `kubectl -n homelab scale deploy/llm --replicas=1`
- Change a model: `llm/llm/config.yml`, then `make apply R=llm`.
- The API key for scripts: `kubectl -n homelab get secret llm-gateway -o jsonpath='{.data.api-key}' | base64 -d; echo`

## Give the agents their PostgreSQL database (A2A tasks, first time)
1. kube-charts' `pg-cluster` 0.1.1 is published (**Actions → Charts**: PUBLISH is green).
2. On the server: `git pull`.
3. `make secrets` — raw: `./scripts/secrets.sh`. Creates `pg-role-agent-runtime`.
4. `make apply R=postgres` — raw: `helmfile -l name=postgres apply`. Creates the role and the database `agent_runtime`.
5. `make apply G=apps` — raw: `helmfile -l group=apps apply` (a version that stores A2A tasks in PostgreSQL, `apps.agentRuntime` in `environments/versions.yaml`).
6. `make logs R=agent-supervisor` → `Storing A2A tasks in PostgreSQL`.
7. `make verify` — raw: `./scripts/verify.sh`. Every `agent-<name> keeps its A2A tasks in PostgreSQL (table tasks_<name>)` is ✓.

## Give the toolbox Grafana, MongoDB and PostgreSQL (their MCP servers, first time)
1. In Grafana (`https://<HOMELAB_DOMAIN>:3000`, as admin): **Administration → Users and access → Service accounts → Add service account**, name `mcp`, role **Viewer** (**Editor** to let it write) → **Add service account token** → copy it.
2. `make secret-set SECRET=grafana-mcp KEY=token` — raw: `./scripts/secrets.sh set grafana-mcp token`. Paste the token twice.
3. `make secrets` — raw: `./scripts/secrets.sh`. Creates `mongodb-mcp` and `pg-role-mcp`.
4. `make apply R=postgres` — raw: `helmfile -l name=postgres apply`. Creates the role `mcp`.
5. `make apply R=mongodb` — raw: `helmfile -l name=mongodb apply`. Its job prints `user mcp created: readAnyDatabase`.
6. `make apply G=llm` — raw: `helmfile -l group=llm apply`. Starts grafana-mcp, mongodb-mcp, postgres-mcp.
7. `make apply R=agent-toolbox` — raw: `helmfile -l name=agent-toolbox apply` (a version with external MCP tools, `apps.agentToolbox` in `environments/versions.yaml`).
8. `make verify` — raw: `./scripts/verify.sh`. `agent-toolbox offers grafana_search_dashboards`, `mongodb_find`, `postgres_execute_sql` are ✓.

## Let an MCP server write, or take it back
1. `mcp.<grafana|mongodb|postgres>.write: true` (or `false`) in `environments/default.yaml`; commit, push, `git pull` on the server.
2. PostgreSQL: `make apply R=postgres`, then `make apply R=postgres-mcp`. MongoDB: `make apply R=mongodb`, then `make apply R=mongodb-mcp`. Grafana: give the `mcp` service account the role Editor (or Viewer) in Grafana, then `make apply R=grafana-mcp`.
3. Nothing to restart: within a minute the toolbox re-reads the server's tools, and the agent the toolbox's, so the write tools appear (or go). To see it at once: `make restart R=agent-toolbox` — raw: `kubectl -n homelab rollout restart deploy/agent-toolbox`.

## Choose Grafana's MCP tools
1. `mcp.grafana.categories` in `environments/default.yaml` (comma-separated: `search`, `datasource`, `dashboard`, `prometheus`, `loki`, `alerting`, `navigation`, …).
2. `make apply R=grafana-mcp` — raw: `helmfile -l name=grafana-mcp apply`. Within a minute the toolbox and the agent follow.

## Rotate the MCP passwords
- `make secret-rotate SECRET=pg-role-mcp KEY=password` (PostgreSQL applies it itself).
- `make secret-rotate SECRET=pg-role-agent-runtime KEY=password` (PostgreSQL applies it, and every agent restarts with it).
- `make secret-rotate SECRET=mongodb-mcp KEY=password`, then `make sync R=mongodb` (raw: `helmfile -l name=mongodb sync`): its job sets the new password.

## Update the MCP Inspector
1. `images.mcpInspector` in `environments/versions.yaml` ([its releases](https://github.com/modelcontextprotocol/inspector/releases)).
2. `make apply R=mcp-inspector`

## If it goes wrong
- agent-toolbox answers `403` / `Invalid Host header`, or a connection to or from it times out: [[Homelab - Troubleshooting]].

## Why it works
- [[Homelab LLM and agent]] — models, the agent, its tools and its fence.
- [[llama-swap]] · [[OpenAI-compatible API]] · [[Model Context Protocol]] · [[AI agents and sandboxing]]

---
type: architecture
project: "[[Homelab]]"
order: 6
tags: [homelab, architecture, ai]
updated: 2026-11-08
---

# Homelab LLM and agent

> Local models served by llama-swap behind an OpenAI-compatible API; an agent (agent-runtime) that thinks with a remote or local model and acts through tools (agent-toolbox) over MCP; and a network fence so that the code the agent writes can't reach anything it shouldn't.

Previous: [[Homelab observability]] · Next: [[Homelab security model]]

## Local models: the `llm` release
- **llama.cpp's `llama-server`** runs one model; **[[llama-swap]]** sits in front, starts the right `llama-server` for the model a request names, and stops it when idle. See [[Running LLMs locally]].
- `llm/llm/config.yml` lists the models: each is a command line (`-hf <repo>:<quantization>`, context size, threads) and a `ttl`.
- Two **groups**: `always-on` (`qwen3-8b`, `ttl: 0`, never unloaded) and `on-demand` (the others: loaded on first request, unloaded after 300 s idle, only one at a time — `swap: true`).
- The API is OpenAI's: `POST /v1/chat/completions` with `"model": "qwen3-8b"` — so any OpenAI client works ([[OpenAI-compatible API]]). Inside: `http://llm:8080/v1`; from devices: `https://<domain>:8090/v1` (signed in, or the `llm-gateway` API key).
- **Memory is the constraint**: 26 GiB limit on a 32 GiB machine. The always-on 8B plus one on-demand model fit; two big on-demand ones wouldn't, hence one at a time.
- `make llm-download MODELS=…` pre-downloads models (first use would otherwise wait for a multi-GB download); the release's timeout is 60 min for the same reason.

## The agent
```text
homelab-ui (Agent page, assistant panel) ─► /api/agent ─► agent-runtime ─┬─ OpenAI API ─► NVIDIA's API (default) or llm
tailnet device ─► <tailscale-ip>:8000 ─────────────────►                 ├─ MCP ─► agent-toolbox ─► files, Python sandbox,
                                                                          │                         grafana_*, mongodb_*, postgres_*
                                                                          └─ conversations ─► MongoDB
```
- **agent-runtime** runs the loop: read the conversation, ask the model, run the tools it asks for, repeat ([[AI agents and sandboxing]]). Its LLM provider is `llmBaseUrl` in `environments/default.yaml` (NVIDIA's hosted API by default; key in Secret `agent-runtime`).
- **agent-toolbox** is an [[Model Context Protocol|MCP]] server: file tools on its own volume, a Python executor, and the tools it **republishes** from three other MCP servers.

## The MCP servers behind the toolbox
| Release | Tools appear as | Talks to | Read-only means |
|---|---|---|---|
| `grafana-mcp` | `grafana_*` | Grafana, with a service-account token | `--disable-write` |
| `mongodb-mcp` | `mongodb_*` | MongoDB as user `mcp` | user role `readAnyDatabase` |
| `postgres-mcp` | `postgres_*` | PostgreSQL as role `mcp` | `--access-mode=restricted`, role `pg_read_all_data` |

One switch per server in `environments/default.yaml` (`mcp.<server>.write`) sets **both** the server's flag and its account's rights — two locks, so a bug in one isn't enough to write.

The toolbox prefixes each remote tool (`list-databases` → `mongodb_list_databases`) so names are valid Python and never collide, and the Python executor can call them as functions.

## The fence
agent-toolbox runs code the model wrote. Assume that code can be wrong or manipulated (a prompt injection in a web page it read). Its [[NetworkPolicy]]:
- **in**: only agent-runtime, MCP Inspector, Caddy, tailnet devices, on port 8001;
- **out**: DNS, the OTel Collector, the three MCP servers, and the internet **except** private ranges (`10/8`, `172.16/12`, `192.168/16`, `100.64/10`, `169.254/16`).

So it can't reach PostgreSQL, MongoDB, Kafka, the LLM, your home network, the cloud metadata address, or the server itself. Its only way to data is through the MCP servers — and their read-only accounts. `make verify` checks the fence from inside the pod.

## Edge cases
- **MCP servers reject unknown `Host` headers** (DNS-rebinding protection). grafana-mcp needs `--allowed-hosts=grafana-mcp:8000`; mongodb-mcp refuses to listen on `0.0.0.0` without `MDB_MCP_DANGEROUS_HOST_BINDING`. A `403 host not allowed` is this, not auth.
- **Tools are discovered at start**: add or restart an MCP server, then `make restart R=agent-toolbox` (and agent-runtime, which caches the tool list).
- **A server down at start** is skipped with a warning; its tools are missing until the next restart.
- **Too many tools** degrade a model's choices and fill its context: hence the allowlist (`categories` for Grafana).
- **Scraping keeps models loaded** — see llm-sd in [[Homelab observability]].

## Check yourself
1. A request names `qwen3-14b` while `ministral` is loaded. What does llama-swap do, and how long does the user wait?
2. Why is the agent-toolbox denied `192.168.0.0/16` and `169.254.0.0/16` specifically?
3. With `mcp.postgres.write: true`, can the agent `DROP TABLE`? Read another account's Tasker workflows?
4. What is the *lethal trifecta*, and which leg does the fence cut?

## Go further
- [Model Context Protocol](https://modelcontextprotocol.io/) — the spec and concepts.
- [llama-swap](https://github.com/mostlygeek/llama-swap).
- [Anthropic: building effective agents](https://www.anthropic.com/research/building-effective-agents).
- [Simon Willison: the lethal trifecta](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/).

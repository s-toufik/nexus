---
type: concept
domain: AI
level: intermediate
tags: [concept, ai, mcp]
updated: 2026-11-08
---

# Model Context Protocol

> MCP is an open protocol for giving AI applications tools and data: an **MCP server** publishes **tools** (functions with a JSON-schema of arguments), **resources** and **prompts**; an **MCP client** inside the AI app lists and calls them. One server works with any MCP-capable agent.

## Why it matters
Without a standard, every agent integrates every tool its own way. MCP is to agent tools what USB is to devices — and it's quickly becoming the standard way to plug systems (databases, Grafana, GitHub) into models.

## How it works
- **JSON-RPC 2.0** messages: `initialize`, `tools/list`, `tools/call`, `resources/read`…
- **Transports**: stdio (a local process), **streamable HTTP** (one endpoint, `POST` + optional streaming), legacy **SSE**.
- A tool = name, description (the model reads it to decide), input schema, result (text, JSON, images).
- **Security**: servers should validate `Host`/`Origin` (DNS-rebinding protection), authenticate clients, and expose the least they can; tools can be read-only or destructive.

## In our projects
- **agent-toolbox** is an MCP server (streamable HTTP, `:8001/mcp`): file tools, Python executor, and the tools of **grafana-mcp**, **mongodb-mcp** (streamable HTTP) and **postgres-mcp** (SSE), republished as `grafana_*`, `mongodb_*`, `postgres_*` ([[Homelab LLM and agent]]).
- **agent-runtime** is the client; the **MCP Inspector** (`:6274`) lets you list and call tools in a browser.
- homelab-ui's Tools page calls `/api/toolbox/mcp`.

## Pitfalls we met
- `403 host not allowed`: DNS-rebinding protection — grafana-mcp needed `--allowed-hosts=grafana-mcp:8000`; Caddy rewrites `Host` and drops `Origin` for the toolbox.
- Tool names like `list-databases` aren't valid Python identifiers → prefixed and sanitised by the toolbox.

## Check yourself
1. What does `tools/list` return, and how does the model use the descriptions?
> [!success]- Answer
> The server's tools, each with its name, a description and the JSON schema of its arguments. The client passes them to the model as tool definitions; the model chooses which tool to call, and with which arguments, from the descriptions alone. So a vague description means a wrong or missed tool.
2. Why does an MCP server care about the `Host` header?
> [!success]- Answer
> Without it, a web page you visit could use DNS rebinding: its domain resolves to the server's address, so your browser sends requests to a server it can reach and the attacker can't. Checking that `Host` is a name the server expects refuses those requests.

## Go further
- [modelcontextprotocol.io](https://modelcontextprotocol.io/) — introduction, [specification](https://modelcontextprotocol.io/specification).
- Servers we run: [mcp-grafana](https://github.com/grafana/mcp-grafana), [mongodb-mcp-server](https://github.com/mongodb-js/mongodb-mcp-server), [postgres-mcp](https://github.com/crystaldba/postgres-mcp).

---
type: guide
project: "[[Agent toolbox]]"
tags: [guide, agent-toolbox]
updated: 2026-11-08
---

# Agent toolbox - Connect a client

> Point an MCP client — the agent, the MCP Inspector, Postman — at the toolbox, and get past the allowed-hosts check.

**Where:** on the client's machine · **All guides:** [[Agent toolbox guides]]

Point the client's MCP connector at `http://<host>:<port>/mcp` with the `streamable_http` transport. The homelab agent's connector:

```yaml
toolbox:
  name: toolbox
  type: mcp
  base_url: ${oc.env:TOOLBOX_URL}
  timeout: 30
  transport: streamable_http
```

To try the tools by hand, the MCP Inspector works against the same URL:

```bash
npx @modelcontextprotocol/inspector
```

**Allowed hosts.** Only requests whose `Host` matches `TOOLBOX_URL` are accepted (protection against DNS rebinding); any other host gets `421 Invalid Host header`. When clients reach the toolbox under another name — a LAN hostname, a Tailscale name, a tool like Postman — list it in `TOOLBOX_EXTRA_ALLOWED_HOSTS` rather than changing `TOOLBOX_URL`.

## If it goes wrong
- `421 Invalid Host header` / `403`: add the host to `TOOLBOX_EXTRA_ALLOWED_HOSTS`; on the homelab see [[Homelab - Troubleshooting]].

## Why it works
- [[Model Context Protocol]] — transports and DNS-rebinding protection.
- [[Agent toolbox layers]]

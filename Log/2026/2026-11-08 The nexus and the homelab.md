---
type: log
date: 2026-11-08
projects: ["[[Homelab]]"]
tags: [log]
---

# 2026-11-08 The nexus and the homelab

## What we did
- Set up the nexus: six folders (Projects, Knowledge, Paths, Sources, Log, System), [[Conventions]], templates, Obsidian Git sync.
- Filled it with the homelab, from homelab-infra and kube-charts: the [[Homelab]] project note and canvas, nine architecture notes, [[Decisions]], the repository notes, 53 knowledge notes, six sources, the path [[Homelab from zero to senior]].
- In the homelab itself: grafana-mcp, mongodb-mcp and postgres-mcp for the agent's toolbox (read-only by default), `make restart R=…`, k3s' own `resolv.conf` against `DNSConfigForming`.

## What I learned
- A one-node cluster forces `Recreate` for pods with hostPorts — [[Deployment and StatefulSet]].
- MCP servers protect themselves against DNS rebinding by checking `Host` — [[Model Context Protocol]].
- Linux takes at most 3 nameservers — [[CoreDNS]].

## Decisions
- MCP write access is a deployment switch, two locks per server ([[Decisions]]).

## Next
- [ ] Start [[Homelab from zero to senior]], stage 1.
- [ ] Roll out the MCP servers on the server and run `make verify`.
- [ ] Off-site copy of the backups ([[Backups and restores]]).
- [ ] Add the other SandBox projects to the nexus.

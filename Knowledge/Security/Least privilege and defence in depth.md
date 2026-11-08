---
type: concept
domain: Security
level: beginner
tags: [concept, security]
updated: 2026-11-08
---

# Least privilege and defence in depth

> **Least privilege**: give each user and program only the access it needs, nothing more. **Defence in depth**: several independent layers, so one failing doesn't expose everything.

## Why it matters
Every system has bugs. The question isn't "can it be broken?" but "what can an attacker do once one piece is?". These two principles keep that answer small — they're the backbone of every security review.

## How it works
- **Least privilege** shows up everywhere: database roles, Kubernetes RBAC, Linux capabilities, network policies, API path allow-lists, read-only modes.
- **Defence in depth**: network → identity → authorisation → application → data → monitoring, each assuming the previous one can fail.
- **Assume breach**: design as if one component is already compromised.
- **Blast radius**: what one failure can reach; shrink it.
- **Fail closed**: when unsure, deny.

## In our projects
Look at one example from every layer in [[Homelab security model]]. Two highlights:
- Tasker's data: Caddy's sign-in, *plus* a gateway secret checked in PostgreSQL, *plus* row-level security ([[Row-level security]]).
- The agent's code: NetworkPolicy fence, *plus* read-only database accounts, *plus* read-only MCP server modes ([[Homelab LLM and agent]]).

## Check yourself
1. Find a place in the homelab where removing one layer would still leave the data protected.
2. What's the blast radius of a compromised homelab-ui container?

## Go further
- [OWASP: principle of least privilege](https://community.owasp.org/Access_Control).
- [NSA/CISA Kubernetes hardening guide](https://media.defense.gov/2022/Aug/29/2003066362/-1/-1/0/CTR_KUBERNETES_HARDENING_GUIDANCE_1.2_20220829.PDF).

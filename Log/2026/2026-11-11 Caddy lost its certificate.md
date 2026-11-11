---
type: log
date: 2026-11-11
projects: ["[[Homelab]]"]
tags: [log, incident]
---

# 2026-11-11 Caddy lost its certificate

## What happened
- Homelab UI wouldn't open: "can't connect to the server". SSH worked, port 443 was open, but the TLS handshake ended with `tlsv1 alert internal error`.
- Caddy's logs: `dial unix /var/run/tailscale/tailscaled.sock: connect: connection refused`, on `localapi/v0/status` and `localapi/v0/cert/<HOMELAB_DOMAIN>`.
- Cause: the pod mounted the socket *file*. tailscaled restarted and made a new socket; the pod kept the old one, with nobody listening. The probes only check that port 443 opens, so Kubernetes saw nothing.

## What we changed
- homelab-infra `gateway/caddy/values.yaml.gotmpl`: mount the folder `/run/tailscale` (`type: Directory`) at `/var/run/tailscale`.
- tailscaled's drop-in: `RuntimeDirectoryPreserve=restart`, so systemd keeps that folder across restarts ([[Homelab - Prepare the server]]).
- `make validate` checks the setting; a new entry in [[Homelab - Troubleshooting]]; lesson 4 of [[Path - Networks you can reason about]] now teaches it.

## What I learned
- A `hostPath` mount follows the inode, not the name: a file that's deleted and recreated isn't seen by the pod.
- On a Unix socket, `connection refused` means the file is there but nobody listens; `no such file or directory` means there's no file.

## Next
- [ ] On sirius: add `RuntimeDirectoryPreserve=restart` to the drop-in, `sudo systemctl daemon-reload`, `make apply R=caddy`, `make validate`.

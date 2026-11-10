---
type: path
track: Platform
time: ~5 h
projects: ["[[Homelab]]"]
tags: [path]
updated: 2026-11-10
---

# Path - Linux, Git and the server

> **Goal:** be at ease on the server: know who runs what, who may read what, how services start and recover, and how a change travels through git.
> **Time:** ~5 h over 2–3 sessions.
> **Before:** nothing — start here. **Then:** [[Path - Networks you can reason about]] · [[Path - Python for services]]. **All paths:** [[Paths]]

👀 = only looks. ✋ = changes something (the undo is given).

## 1. Processes, users and permissions · ~1 h
**Read:** [[Linux processes and permissions]]

**Do** (on the server, over SSH):
1. 👀 `id` → your user, and `k3s-admin` among the groups.
2. 👀 `ls -l /etc/rancher/k3s/k3s.yaml` → `-rw-r----- root k3s-admin`: root writes, your group reads, others nothing.
3. 👀 `sudo ls -ld /var/backups/homelab` → `drwx------ root root`: only root.
4. 👀 `ps -eo user,pid,rss,comm --sort=-rss | head` → the biggest processes by memory; find `llama-server` and `k3s`.

**Check:**
1. Why can you run `kubectl` without `sudo`, but not read the backups?
> [!success]- Answer
> `kubectl` only needs to read the kubeconfig, which is group-readable by `k3s-admin`, a group you're in. The backups folder is `0700 root`: only root can enter it, so you need `sudo`.

2. Why do `make user-add` and `make secret-set` read passwords from a prompt instead of an argument?
> [!success]- Answer
> A command's arguments are visible to every user in `ps` and stay in your shell history. A hidden prompt sends the value on stdin, which neither shows.

**You can now:** read any permission line and say who can do what.

## 2. Services that start and heal themselves · ~1.5 h
**Read:** [[systemd]] · [[Homelab server]]

**Do:**
1. 👀 `systemctl status k3s tailscaled k3s-lan-guard` → all `active`.
2. 👀 `systemctl list-timers` → `tailscale-watchdog`, `heartbeat`, `internet-speedtest` with their next run.
3. 👀 `journalctl -u k3s --since "1 hour ago" | tail -20` → k3s' recent log.
4. 👀 `journalctl --list-boots | tail -3` → the last boots (persistent journal). Was there a reboot you didn't do?
5. 👀 `cat /etc/systemd/system/tailscale-watchdog.timer` → `OnUnitActiveSec=2min`.

**Check:**
1. Tailscale stops at 3 a.m. What happens, minute by minute?
> [!success]- Answer
> The watchdog timer runs every 2 minutes. After 2 failures (~4 min) it restarts `tailscaled`. If it's still down after 8 failures (~16 min), it reboots — but only if the server has been up 30 minutes and the internet works (otherwise the problem is the router, and a reboot wouldn't help).

2. What's the difference between `systemctl disable` and `mask`, and which one keeps the laptop from sleeping?
> [!success]- Answer
> `disable` only stops a unit from starting at boot; something can still start it. `mask` links it to `/dev/null` so nothing can start it. The sleep targets are **masked**.

**You can now:** find why a service isn't running, and what ran last night.

## 3. Git as the source of truth · ~1.5 h
**Read:** [[Git]] · [[Git flow]]

**Do** (on your Mac):
1. 👀 In `homelab-infra`: `git log --oneline -10` and `git log --oneline -- environments/versions.yaml | head` → when versions changed.
2. 👀 In `agent-runtime`: `git tag --sort=-creatordate | head -3` → the releases; `git log --oneline main..develop | head` → what's on `develop` but not released.
3. 👀 On the server, in `homelab-infra`: `git status` → clean, and `git log -1` matches your Mac's `origin/develop` — the server runs exactly what git says.
4. ✋ In a scratch folder: `git init`, two commits, `git revert HEAD`, `git log --oneline` → three commits, the last undoing the second. (Undo: delete the folder.)

**Check:**
1. Why does the server never `git commit`?
> [!success]- Answer
> The server only *pulls* and applies. Changes are made on your Mac, reviewed, committed and pushed, so git history is the record of every change. An edit made on the server would be lost or conflict at the next `git pull`.

2. Which branch or tag makes a new agent-runtime image reach the homelab?
> [!success]- Answer
> Only a tag `vX.Y.Z`, and only once homelab-infra's `environments/versions.yaml` names that version. `develop` and `main` publish `dev`/`latest` images that are never deployed.

**You can now:** say for any change where it lives in history and how it reaches the server.

## 4. The server's design, as a whole · ~1 h
**Read:** [[Homelab server]] again, then skim [[Homelab - Prepare the server]] and [[Homelab - Keep the server running]] (don't run them — they're done).

**Do:**
1. 👀 `ip -4 addr show k3s0` → `inet 10.250.0.1/32`.
2. 👀 `sudo nft list table inet homelab_lan_guard` → the four rules.
3. On paper: draw the laptop with its two networks, the dummy interface, Tailscale, and k3s on top.

**Check:**
1. Why does k3s use a dummy interface address instead of the laptop's real IP?
> [!success]- Answer
> The real IP changes when the laptop moves between Ethernet and Wi-Fi. Kubernetes stores the node IP in certificates and its database, so a change would break it. The dummy interface `k3s0` has `10.250.0.1/32` forever, whatever network is up.

**Milestone:** you can explain how the server boots, heals itself and stays private — to someone who has never seen it.

---
type: path
track: Platform
time: ~6 h
projects: ["[[Homelab]]"]
tags: [path]
updated: 2026-11-10
---

# Path - Linux, Git and the server

> **Goal:** be at ease on the server: know who runs what, who may read what, how services start and recover, and how a change travels through git.
> **Time:** ~6 h over 2–3 sessions.
> **Before:** [[Path - Tour of the homelab]]. **Then:** [[Path - Networks you can reason about]] · [[Path - Python for services]]. **All paths:** [[Paths]]

## Principles → projects
| Principle | Where it lives in our projects |
|---|---|
| Users, groups, file permissions | `k3s.yaml` readable by `k3s-admin`; `/var/backups/homelab` root-only; pods' `runAsUser` |
| Secrets on stdin, never in arguments | `make user-add`, `make secret-set` |
| Services and timers that heal | k3s, tailscaled, the LAN guard, the Tailscale watchdog, heartbeat, speed test |
| Git as the source of truth | the server only `git pull`s homelab-infra; releases are tags |

How each lesson works: **Learn** (definitions, how it works, an example from our code, a common mistake) → **Do** (👀 only looks, ✋ changes something, with its undo) → **Check** (answer before opening) → **You can now**.

## 1. Processes, users and permissions · ~1.5 h

### Learn
**Definitions**
- **Process** — a running program, with a PID, an owner (user and groups), an environment, open files and limits.
- **User / group** — identities; a file belongs to one user and one group. `root` (UID 0) can do anything.
- **Permission bits** — `r` read, `w` write, `x` execute (for a folder: enter it), for **owner**, **group**, **others**. Written `rwxr-x---` or in octal `750` (r=4, w=2, x=1).
- **stdin / stdout / stderr** — the three standard streams; `|` connects one program's stdout to another's stdin.
- **Exit code** — a program's result: `0` success, anything else failure.

**How it works**
When a process opens a file, the kernel compares the process's user and groups with the file's owner, group and bits. A new group membership applies only to processes started after you log in again — the shell you're in still has the old list.

**Example from our projects**
```text
-rw-r-----  root k3s-admin  …  /etc/rancher/k3s/k3s.yaml
drwx------  root root       …  /var/backups/homelab
```
1. `k3s.yaml` (the admin kubeconfig): owner `root` reads and writes (`rw-`), group `k3s-admin` reads (`r--`), others nothing (`---`) → `0640`, exactly `write-kubeconfig-mode: "0640"` in k3s' config.
2. The backups folder: only root may list or enter it (`rwx------` → `0700`), set by `sudo install -d -m 0700 /var/backups/homelab`.

**Common mistake** — a password as a command argument: `kcadm.sh … --password hunter2` is visible to every user in `ps` and saved in shell history. Our scripts read it at a hidden prompt and pass it on stdin.

### Do
1. 👀 `id` → your user, and `k3s-admin` among the groups.
2. 👀 `ls -l /etc/rancher/k3s/k3s.yaml` and `sudo ls -ld /var/backups/homelab` → the two lines above.
3. 👀 `ps -eo user,pid,rss,comm --sort=-rss | head` → the biggest processes by memory (RSS in KiB); find `llama-server` and `k3s`.

### Check
1. Why can you run `kubectl` without `sudo`, but not read the backups?
> [!success]- Answer
> `kubectl` only needs to read the kubeconfig, which is group-readable by `k3s-admin`, a group you're in. The backups folder is `0700 root`: only root can enter it, so you need `sudo`.

2. You were just added to `k3s-admin` but `kubectl` still says permission denied. Why?
> [!success]- Answer
> Group membership is read when a session starts. Your current shell still has the old group list: log out and in (or `newgrp k3s-admin`).

**You can now:** read any permission line and say who can do what. Deep dive: [[Linux processes and permissions]].

## 2. Services that start and heal themselves · ~1.5 h

### Learn
**Definitions**
- **systemd** — Linux's service manager: starts the system and every service, restarts them, schedules timers, keeps the journal ([[systemd]]).
- **Unit** — something systemd manages: `.service` (a process), `.timer` (a schedule), `.target` (a state like `multi-user.target`).
- **enable / mask** — `enable` starts a unit at boot; `mask` makes it impossible to start at all.
- **Journal** — systemd's log store; `journalctl -u <unit>`; persistent across reboots when `/var/log/journal` exists.

**How it works**
At boot systemd reaches the default target (`multi-user.target`: no desktop), starting every enabled unit in dependency order (`Before=`, `After=`). A `Restart=always` service is restarted when it dies; a timer starts its service on a schedule.

**Example from our projects** — the Tailscale watchdog timer (`/etc/systemd/system/tailscale-watchdog.timer`):
```ini
[Unit]
Description=Run the Tailscale watchdog every 2 minutes

[Timer]
OnBootSec=5min
OnUnitActiveSec=2min

[Install]
WantedBy=timers.target
```
1. `OnBootSec=5min` — first run 5 minutes after boot (let the network come up).
2. `OnUnitActiveSec=2min` — then every 2 minutes after the last run.
3. `WantedBy=timers.target` — `enable` hooks it into boot.
The script it runs counts failures: restart `tailscaled` after 2 (~4 min), reboot after 8 (~16 min) — only with 30 min of uptime and working internet.

**Common mistake** — `systemctl disable` to stop a laptop sleeping: something else (the lid, idle) can still start the sleep target. It's **masked**.

### Do
1. 👀 `systemctl status k3s tailscaled k3s-lan-guard` → all `active`.
2. 👀 `systemctl list-timers` → `tailscale-watchdog`, `heartbeat`, `internet-speedtest` and their next run.
3. 👀 `journalctl -u k3s --since "1 hour ago" | tail -20`; `journalctl --list-boots | tail -3` → any reboot you didn't do?

### Check
1. Tailscale stops at 3 a.m. What happens, minute by minute?
> [!success]- Answer
> The watchdog runs every 2 minutes. After 2 failures (~4 min) it restarts `tailscaled`. If it's still down after 8 failures (~16 min), it reboots — only if the server has been up 30 minutes and the internet works (otherwise the problem is the router and a reboot wouldn't help).

**You can now:** find why a service isn't running, and what ran last night.

## 3. Git as the source of truth · ~1.5 h

### Learn
**Definitions**
- **Commit** — a snapshot of the files with a message and a parent; identified by a hash.
- **Branch** — a movable name pointing at a commit; **tag** — a fixed name for one commit (a release).
- **Remote** — another copy of the repository (GitHub); `push` sends, `pull` fetches and integrates.
- **revert vs reset** — `revert` adds a new commit undoing one (safe on shared branches); `reset` moves the branch (rewrites history).

**How it works**
```text
feature/… ──PR──► develop ──PR──► main ──tag vX.Y.Z──► release (image + chart)
homelab-infra: edit on the Mac → commit → push → on the server git pull → make apply
```
The server never commits: git history is the complete record of what changed, when and why.

**Example from our projects** — agent-runtime's CI (`.github/workflows/cicd.yml`) reacts differently per branch and tag:
| Event | Publishes | Deployed? |
|---|---|---|
| PR to develop/main | nothing (checks only) | no |
| push to develop | image `:dev`, `:dev-<sha>` | no |
| push to main | image `:latest` | no |
| tag `vX.Y.Z` | image `:X.Y.Z` + chart `X.Y.Z` | when `versions.yaml` says so |

**Common mistake** — moving a tag after publishing (`git tag -f`): the server cached the old image and chart under that version and keeps running them.

### Do
1. 👀 In `homelab-infra` on your Mac: `git log --oneline -- environments/versions.yaml | head` → when versions changed.
2. 👀 In `agent-runtime`: `git tag --sort=-creatordate | head -3`; `git log --oneline main..develop | head` → what's not released yet.
3. 👀 On the server: `git status` (clean) and `git log -1` (= your Mac's `origin/develop`).
4. ✋ In a scratch folder: `git init`, two commits, `git revert HEAD`, `git log --oneline` → three commits. Undo: delete the folder.

### Check
1. Which branch or tag makes a new agent-runtime image reach the homelab?
> [!success]- Answer
> Only a tag `vX.Y.Z`, and only once homelab-infra's `environments/versions.yaml` names that version.

**You can now:** say for any change where it lives in history and how it reaches the server. Deep dives: [[Git]] · [[Git flow]].

## 4. The server's design, as a whole · ~1 h

### Learn
**Definitions**
- **Node IP** — the address Kubernetes knows the machine by; ours `10.250.0.1` on the dummy interface `k3s0`.
- **nftables table** — a named set of firewall rules; ours `homelab_lan_guard` ([[Firewall and nftables]]).

**How it works**
The real IP changes when the laptop moves between Ethernet and Wi-Fi; Kubernetes stores the node IP in certificates and its database. The dummy interface gives an address that exists whatever network is up. The LAN guard then accepts traffic from the trusted interfaces and drops Kubernetes' ports from everywhere else.

**Example from our projects** — `/etc/homelab/k3s-lan-guard.nft`:
```text
table inet homelab_lan_guard {
  chain input {
    type filter hook input priority filter - 10; policy accept;
    iifname { "lo", "tailscale0", "k3s0", "cni0", "flannel.1" } accept
    tcp dport { 6443, 10250 } drop
    udp dport 8472 drop
    ip daddr 10.250.0.1 drop
  }
}
```
1. `priority filter - 10` — runs just before the usual filter chains.
2. Trusted interfaces first: loopback, Tailscale, the node interface, the pod network.
3. Then drop the Kubernetes API (6443), the kubelet (10250), Flannel's VXLAN (8472/udp) and the node address — i.e. from the LAN.

**Common mistake** — `systemctl enable nftables`: Ubuntu's default config flushes every table, including k3s' and Tailscale's.

### Do
1. 👀 `ip -4 addr show k3s0` → `inet 10.250.0.1/32`.
2. 👀 `sudo nft list table inet homelab_lan_guard` → the rules above.
3. On paper: the laptop, its two networks, the dummy interface, Tailscale, k3s on top.

### Check
1. Why does k3s use a dummy interface address instead of the laptop's real IP?
> [!success]- Answer
> The real IP changes between Ethernet and Wi-Fi; Kubernetes stores the node IP in certificates and its database, so a change would break it. `k3s0` keeps `10.250.0.1/32` whatever network is up.

**Milestone:** you can explain how the server boots, heals itself and stays private — to someone who has never seen it. Deep dive: [[Homelab server]].

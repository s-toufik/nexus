---
type: concept
domain: Linux
level: beginner
tags: [concept, linux]
updated: 2026-11-08
---

# systemd

> Linux's service manager: it starts the system, runs services as **units**, restarts them when they fail, schedules **timers**, and collects their logs in the **journal**.

## Why it matters
Everything on the host that isn't a pod — k3s itself, Tailscale, the LAN guard, watchdogs, the heartbeat — is a systemd unit. Knowing units, targets and timers is knowing how the server boots and heals.

## How it works
- **Units** in `/etc/systemd/system/`: `.service` (a process), `.timer` (a schedule that starts a service), `.target` (a group/state, like `multi-user.target`).
- `systemctl status|start|stop|restart|enable|disable|mask <unit>`; `mask` makes a unit impossible to start (used for sleep).
- `systemctl daemon-reload` after editing unit files.
- **Drop-ins**: `/etc/systemd/<thing>.conf.d/*.conf` override parts of a config without editing the original (logind, the watchdog).
- **Timers**: `OnCalendar=`, `OnBootSec=`, `OnUnitActiveSec=` — cron with logs and dependencies.
- **Journal**: `journalctl -u k3s -f`, `journalctl -b -1` (the previous boot — needs persistent journal).
- **Watchdog**: `RuntimeWatchdogSec=30s` — systemd pings the hardware watchdog; if systemd freezes, the hardware reboots the machine.

## In our projects
- `multi-user.target` as default (no desktop); sleep targets masked; logind drop-in ignores the lid ([[Homelab server]]).
- Services/timers: `k3s`, `tailscaled`, `k3s-lan-guard` (oneshot, before k3s), `tailscale-watchdog.timer` (every 2 min), `heartbeat.timer` (every 5 min), the speed test (every 2 h).
- Persistent journal, to read what happened before a watchdog reboot.

## Pitfalls we met
- `systemctl enable nftables` would flush k3s' and Tailscale's firewall rules at boot.

## Check yourself
1. What's the difference between `disable` and `mask`?
> [!success]- Answer
> `disable` only removes the unit from boot: it can still be started by hand or by another unit. `mask` links it to `/dev/null`, so nothing can start it at all; that's why the sleep targets are masked.
2. How would you see why the server rebooted last night?
> [!success]- Answer
> `journalctl -b -1` shows the previous boot's journal (kept, since it's persistent): read its last lines (`-e`) for the cause, such as a watchdog, an out-of-memory or a power loss. `last -x reboot` lists reboot times.

## Go further
- [systemd.service](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html), [systemd.timer](https://www.freedesktop.org/software/systemd/man/latest/systemd.timer.html), [journalctl](https://www.freedesktop.org/software/systemd/man/latest/journalctl.html).
- [Arch wiki: systemd](https://wiki.archlinux.org/title/Systemd) — the best practical reference.

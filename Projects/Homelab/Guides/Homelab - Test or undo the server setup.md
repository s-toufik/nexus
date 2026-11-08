---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab]
updated: 2026-11-08
---

# Homelab - Test or undo the server setup

> Prove the server survives reboots, network changes, Tailscale failures, crashes and power cuts — or remove everything the server guides set up.

**Where:** on the server, over SSH, and from a phone on mobile data · **All guides:** [[Homelab guides]]

## Test the server

- [ ] `sudo reboot`, don't log in, close the lid. After 5 minutes, from a phone on mobile data with Tailscale: `ssh <user>@<tailscale-ip>` works.
- [ ] `systemctl is-active tailscaled k3s k3s-lan-guard` → `active` three times; `kubectl get nodes` → `Ready`.
- [ ] Grafana's **Server Health** dashboard shows temperatures.
- [ ] Unplug the Ethernet cable for 1 minute: still reachable, `kubectl get nodes` → `Ready`. Plug it back: `ip route show default` uses Ethernet.
- [ ] `sudo systemctl stop tailscaled`, wait 5 minutes: `journalctl -t tailscale-watchdog` shows "Restarting tailscaled", `tailscale status` works.
- [ ] `echo c | sudo tee /proc/sysrq-trigger`: the laptop reboots by itself within a minute, Tailscale is back, `kubectl get nodes` → `Ready`.
- [ ] Unplug the charger for 2 minutes: the laptop keeps running.

## Undo the server setup

```bash
# Sleep and lid
sudo systemctl unmask sleep.target suspend.target hibernate.target hybrid-sleep.target
sudo rm -f /etc/systemd/logind.conf.d/server.conf

# Desktop
sudo systemctl set-default graphical.target

# Kubernetes (deletes every pod and volume)
/usr/local/bin/k3s-uninstall.sh
sudo systemctl disable --now k3s-lan-guard
sudo rm -f /etc/systemd/system/k3s-lan-guard.service /etc/sysctl.d/90-kubernetes.conf
sudo rm -rf /etc/homelab /etc/rancher
sudo nmcli connection delete k3s0
sudo rm -f /usr/local/bin/helm /usr/local/bin/helmfile
rm -rf ~/.config/helm ~/.local/share/helm ~/.cache/helm
sudo groupdel k3s-admin

# Freeze protection
sudo systemctl disable --now tailscale-watchdog.timer
sudo rm -f /etc/systemd/system/tailscale-watchdog.* /usr/local/bin/tailscale-watchdog.sh
sudo rm -f /etc/systemd/system.conf.d/watchdog.conf /etc/modules-load.d/watchdog.conf
sudo rm -f /etc/sysctl.d/99-server-autoreboot.conf
sudo rm -rf /etc/systemd/system/tailscaled.service.d

# Internet speed test
sudo systemctl disable --now internet-speedtest.timer
sudo rm -f /etc/systemd/system/internet-speedtest.* /usr/local/bin/internet-speedtest

# Battery, heartbeat, updates
sudo systemctl disable --now battery-limit.service heartbeat.timer
sudo rm -f /etc/systemd/system/battery-limit.service /etc/systemd/system/heartbeat.*
sudo rm -f /etc/apt/apt.conf.d/52server-reboot

# Wi-Fi power saving
sudo rm -f /etc/NetworkManager/conf.d/wifi-powersave-off.conf

sudo systemctl daemon-reload
sudo reboot
```

---

## Why it works
- [[Homelab server]] · [[systemd]] · [[k3s]]

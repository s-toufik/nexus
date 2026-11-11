---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab]
updated: 2026-11-08
---

# Homelab - Prepare the server

> Turn an Ubuntu laptop into an always-on server on the tailnet. Once, before installing Kubernetes.

**Where:** on the laptop itself (keyboard and screen), plugged into power · **All guides:** [[Homelab guides]]

## 1. Update and install the tools

```bash
sudo apt update && sudo apt full-upgrade -y
sudo apt install -y curl jq lm-sensors openssh-server nftables
```

## 2. Install and connect Tailscale

1. Install and log in (open the link it prints):
   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   sudo tailscale up
   ```
2. In the [Tailscale admin console](https://login.tailscale.com/admin/machines): **Machines** → this laptop → **⋯ → Disable key expiry**.
3. In **DNS**: turn on **MagicDNS** and **HTTPS Certificates**.
4. Check:
   ```bash
   tailscale status                                # first line: this laptop
   tailscale ip -4                                 # note it: <tailscale-ip>
   tailscale status --json | jq -r .Self.DNSName   # note it without the final dot: <HOMELAB_DOMAIN>
   ```

## 3. Never sleep

1. ```bash
   sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
   ```
2. Check: `systemctl status sleep.target` → `Loaded: masked`.

## 4. Keep running with the lid closed

1. ```bash
   sudo mkdir -p /etc/systemd/logind.conf.d
   sudo tee /etc/systemd/logind.conf.d/server.conf >/dev/null <<'EOF'
   [Login]
   HandleLidSwitch=ignore
   HandleLidSwitchExternalPower=ignore
   HandleLidSwitchDocked=ignore
   HandleSuspendKey=ignore
   HandleHibernateKey=ignore
   IdleAction=ignore
   EOF
   ```
2. Put the laptop on a hard surface with the vents clear.

## 5. Boot without the desktop

1. ```bash
   sudo systemctl set-default multi-user.target
   sudo reboot
   ```
2. Log in at the text prompt.
3. Check: `systemctl get-default` → `multi-user.target`.
4. Close the lid for one minute, open it: `uptime` shows no sleep.

## 6. Ethernet as the main network

1. Plug the cable into the router, then note the `ethernet` row's **CONNECTION** name:
   ```bash
   nmcli device status
   ```
2. Make it reconnect forever and win over Wi-Fi (replace `Wired connection 1`):
   ```bash
   sudo nmcli connection modify "Wired connection 1" \
     connection.autoconnect yes \
     connection.autoconnect-priority 100 \
     connection.autoconnect-retries 0 \
     ipv4.route-metric 100
   ```
3. On the router's admin page: add a **DHCP reservation** for the laptop's current IP.
4. Only with a USB Ethernet adapter:
   ```bash
   sudo sed -i 's/^GRUB_CMDLINE_LINUX_DEFAULT="/&usbcore.autosuspend=-1 /' /etc/default/grub
   sudo update-grub
   sudo reboot
   ```
5. Check:
   ```bash
   nmcli device status          # ethernet: connected
   ip route show default        # first line: the Ethernet device
   ping -c 3 1.1.1.1
   ```

## 7. Wi-Fi as the fallback network

1. Connect:
   ```bash
   nmcli device wifi list
   sudo nmcli device wifi connect "YOUR_WIFI_NAME" password "YOUR_WIFI_PASSWORD"
   ```
2. Make it the backup and turn off its power saving:
   ```bash
   sudo nmcli connection modify "YOUR_WIFI_NAME" \
     connection.autoconnect yes \
     connection.autoconnect-priority 10 \
     connection.autoconnect-retries 0 \
     ipv4.route-metric 600 \
     802-11-wireless.powersave 2
   sudo tee /etc/NetworkManager/conf.d/wifi-powersave-off.conf >/dev/null <<'EOF'
   [connection]
   wifi.powersave = 2
   EOF
   sudo systemctl restart NetworkManager
   ```
3. Check: unplug the Ethernet cable, wait 30 s, run `tailscale status` from another device → the laptop is online.

## 8. Start Tailscale and SSH at boot

1. Tailscale starts at boot and always restarts:
   ```bash
   sudo systemctl enable tailscaled
   sudo mkdir -p /etc/systemd/system/tailscaled.service.d
   sudo tee /etc/systemd/system/tailscaled.service.d/restart.conf >/dev/null <<'EOF'
   [Unit]
   StartLimitIntervalSec=0

   [Service]
   Restart=always
   RestartSec=5
   RuntimeDirectoryPreserve=restart
   EOF
   sudo systemctl daemon-reload
   ```
2. SSH on:
   ```bash
   sudo systemctl enable ssh
   ```
3. Turn off what a server doesn't need (if listed by `systemctl list-unit-files --type=service --state=enabled`):
   ```bash
   sudo systemctl disable --now cups.service cups-browsed.service bluetooth.service ModemManager.service
   ```
4. Reboot, then check: `systemctl is-active tailscaled` → `active`, and `systemctl show tailscaled -p RuntimeDirectoryPreserve` → `RuntimeDirectoryPreserve=restart`.
5. From another tailnet device: `ssh <user>@<tailscale-ip>`.

## If it goes wrong
Then: [[Homelab - Install Kubernetes]].

## Why it works
- [[Homelab server]] — what each step changes, and why a laptop needs it.
- [[Tailscale]] · [[systemd]] · [[DNS]]

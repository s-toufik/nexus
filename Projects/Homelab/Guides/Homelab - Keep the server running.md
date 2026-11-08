---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab]
updated: 2026-11-08
---

# Homelab - Keep the server running

> Make the server recover by itself: reboot on a crash or freeze, repair Tailscale, keep logs across reboots, patch itself, protect the battery, and tell you when it's offline. Once, after [[Homelab - Install Kubernetes]].

**Where:** on the server, over SSH (step 7 in the BIOS) · **All guides:** [[Homelab guides]]

## 1. Reboot on a kernel crash or freeze

```bash
sudo tee /etc/sysctl.d/99-server-autoreboot.conf >/dev/null <<'EOF'
kernel.panic = 10
kernel.panic_on_oops = 1
kernel.softlockup_panic = 1
kernel.nmi_watchdog = 1
kernel.hardlockup_panic = 1
kernel.hung_task_timeout_secs = 600
kernel.hung_task_panic = 1
EOF
sudo sysctl --system
sysctl kernel.panic kernel.softlockup_panic kernel.hung_task_panic    # check
```

## 2. Watchdog: reboot when everything is frozen

1. Load the hardware watchdog (Intel: `iTCO_wdt`, AMD: `sp5100_tco`):
   ```bash
   sudo modprobe iTCO_wdt
   sudo wdctl
   ```
2. If `wdctl` shows a device, keep that driver:
   ```bash
   echo iTCO_wdt | sudo tee /etc/modules-load.d/watchdog.conf
   ```
   If it says `No such file or directory`, use the software one:
   ```bash
   echo softdog | sudo tee /etc/modules-load.d/watchdog.conf
   sudo modprobe softdog
   sudo wdctl        # shows "softdog"
   ```
3. Let systemd feed it:
   ```bash
   sudo mkdir -p /etc/systemd/system.conf.d
   sudo tee /etc/systemd/system.conf.d/watchdog.conf >/dev/null <<'EOF'
   [Manager]
   RuntimeWatchdogSec=30s
   RebootWatchdogSec=10min
   EOF
   sudo systemctl daemon-reexec
   ```
4. Check:
   ```bash
   sudo wdctl | grep -i timeout
   systemctl show -p RuntimeWatchdogUSec
   ```

## 3. Tailscale watchdog: restart Tailscale, reboot as a last resort

Every 2 minutes: restarts Tailscale after ~4 minutes down; reboots after ~16 minutes, only if the internet works and the laptop has been up 30 minutes.

1. Create the script:
   ```bash
   sudo tee /usr/local/bin/tailscale-watchdog.sh >/dev/null <<'EOF'
   #!/usr/bin/env bash
   # Checks Tailscale health. Run every 2 minutes by tailscale-watchdog.timer.
   set -u

   FAIL_FILE=/run/tailscale-watchdog.failures   # reset at every boot
   RESTART_AFTER=2                              # failures before restarting tailscaled (~4 min)
   REBOOT_AFTER=8                               # failures before rebooting (~16 min)
   MIN_UPTIME=1800                              # never reboot in the first 30 minutes

   log() { logger -t tailscale-watchdog "$*"; }

   state=$(tailscale status --json 2>/dev/null \
     | python3 -c 'import sys,json; print(json.load(sys.stdin).get("BackendState",""))' 2>/dev/null)

   if [ "$state" = "Running" ]; then
     rm -f "$FAIL_FILE"
     exit 0
   fi

   fails=$(( $(cat "$FAIL_FILE" 2>/dev/null || echo 0) + 1 ))
   echo "$fails" > "$FAIL_FILE"
   log "Tailscale not running (state='${state:-unknown}'), failure $fails"

   if [ "$state" = "NeedsLogin" ]; then
     log "Tailscale needs a manual login: run 'sudo tailscale up'. Not restarting."
     exit 0
   fi

   if [ "$fails" -eq "$RESTART_AFTER" ]; then
     log "Restarting tailscaled"
     systemctl restart tailscaled
   fi

   if [ "$fails" -ge "$REBOOT_AFTER" ]; then
     uptime_s=$(cut -d. -f1 /proc/uptime)
     if [ "$uptime_s" -lt "$MIN_UPTIME" ]; then
       log "Not rebooting: uptime ${uptime_s}s is below ${MIN_UPTIME}s"
     elif ! ping -c 3 -W 3 1.1.1.1 >/dev/null 2>&1 && ! ping -c 3 -W 3 8.8.8.8 >/dev/null 2>&1; then
       log "Not rebooting: internet is down (router or ISP problem)"
     else
       log "Internet works but Tailscale is still down: rebooting"
       systemctl reboot
     fi
   fi
   EOF
   sudo chmod +x /usr/local/bin/tailscale-watchdog.sh
   ```
2. Run it every 2 minutes:
   ```bash
   sudo tee /etc/systemd/system/tailscale-watchdog.service >/dev/null <<'EOF'
   [Unit]
   Description=Check Tailscale health and repair it
   After=network-online.target tailscaled.service

   [Service]
   Type=oneshot
   ExecStart=/usr/local/bin/tailscale-watchdog.sh
   EOF

   sudo tee /etc/systemd/system/tailscale-watchdog.timer >/dev/null <<'EOF'
   [Unit]
   Description=Run the Tailscale watchdog every 2 minutes

   [Timer]
   OnBootSec=5min
   OnUnitActiveSec=2min

   [Install]
   WantedBy=timers.target
   EOF

   sudo systemctl daemon-reload
   sudo systemctl enable --now tailscale-watchdog.timer
   ```
3. Check:
   ```bash
   systemctl list-timers tailscale-watchdog.timer
   sudo /usr/local/bin/tailscale-watchdog.sh && echo "script OK"
   ```

## 4. Keep logs across reboots

```bash
sudo mkdir -p /var/log/journal
sudo systemd-tmpfiles --create --prefix /var/log/journal
sudo systemctl restart systemd-journald
```

## 5. Automatic security updates, rebooting at 04:00

```bash
sudo apt install -y unattended-upgrades
sudo tee /etc/apt/apt.conf.d/52server-reboot >/dev/null <<'EOF'
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "04:00";
EOF
```

## 6. Limit the charge to 80%

1. Check support: `ls /sys/class/power_supply/BAT*/charge_control_end_threshold`
2. If the file exists:
   ```bash
   sudo tee /etc/systemd/system/battery-limit.service >/dev/null <<'EOF'
   [Unit]
   Description=Limit battery charge to 80%

   [Service]
   Type=oneshot
   ExecStart=/bin/sh -c 'for b in /sys/class/power_supply/BAT*; do echo 80 > "$b/charge_control_end_threshold"; done'

   [Install]
   WantedBy=multi-user.target
   EOF
   sudo systemctl enable --now battery-limit.service
   cat /sys/class/power_supply/BAT*/charge_control_end_threshold    # 80
   ```
3. If it doesn't: set the limit in the BIOS (step 7).

## 7. BIOS settings

1. Reboot into the BIOS (**F2**, **F10**, **F12** or **Del** at startup).
2. Set, where they exist:
   - **Power on AC** / **AC Power Recovery** → Enabled
   - **Battery charge limit** → 80%
   - **Wake on LAN** → Enabled (optional)
3. Back in Ubuntu: `sensors` → CPU below ~85 °C under load.

## 8. Get notified when the server is offline

1. On [healthchecks.io](https://healthchecks.io): **Add Check**, Period 5 minutes, Grace 10 minutes. Copy the ping URL.
2. In **Integrations**: add email or the mobile app.
3. On the server (replace `YOUR_PING_URL`):
   ```bash
   sudo tee /etc/systemd/system/heartbeat.service >/dev/null <<'EOF'
   [Unit]
   Description=Send a heartbeat to healthchecks.io
   After=network-online.target
   Wants=network-online.target

   [Service]
   Type=oneshot
   ExecStart=/usr/bin/curl -fsS -m 10 --retry 3 -o /dev/null YOUR_PING_URL
   EOF

   sudo tee /etc/systemd/system/heartbeat.timer >/dev/null <<'EOF'
   [Unit]
   Description=Heartbeat every 5 minutes

   [Timer]
   OnBootSec=2min
   OnUnitActiveSec=5min

   [Install]
   WantedBy=timers.target
   EOF

   sudo systemctl daemon-reload
   sudo systemctl enable --now heartbeat.timer
   ```
4. Check: the check turns green on healthchecks.io within a minute.
5. Never commit the ping URL.

## Why it works
- [[Homelab server]] — the freeze protections and why each exists.
- [[systemd]] — services, timers, the watchdog, the journal.

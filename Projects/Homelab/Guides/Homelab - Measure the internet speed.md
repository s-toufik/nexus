---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab]
updated: 2026-11-08
---

# Homelab - Measure the internet speed

> An internet speed test every 2 hours, into Grafana's **Server Health** dashboard (Download & Upload, Ping & Jitter) and `/var/log/internet-speedtest.csv`. Needs the homelab deployed (the OTel Collector).

**Where:** on the server, over SSH · **All guides:** [[Homelab guides]]

1. Install the client:
   ```bash
   sudo snap install speedtest
   ```
2. Create the script (replace `<tailscale-ip>` with the output of `tailscale ip -4`):
   ```bash
   sudo tee /usr/local/bin/internet-speedtest >/dev/null <<'EOF'
   #!/usr/bin/env bash
   # internet-speedtest — measure internet speed, log it to a CSV and send it to the OTel Collector
   set -euo pipefail

   OTLP_URL="http://<tailscale-ip>:4318/v1/metrics"   # the OTel Collector
   CSV=/var/log/internet-speedtest.csv
   SPEEDTEST=${SPEEDTEST:-/snap/bin/speedtest}

   result=$("$SPEEDTEST" --accept-license --accept-gdpr --format=json)

   # Python prints 2 lines: the CSV row, then the OTLP JSON payload
   output=$(python3 - "$result" <<'PY'
   import json, sys, time
   r = json.loads(sys.argv[1])
   down = r["download"]["bandwidth"] * 8 / 1e6
   up   = r["upload"]["bandwidth"] * 8 / 1e6
   ping = r["ping"]["latency"]
   jitter = r["ping"]["jitter"]
   loss = r.get("packetLoss")

   now = str(time.time_ns())
   def gauge(name, value):
       return {"name": name, "gauge": {"dataPoints": [{"asDouble": float(value), "timeUnixNano": now}]}}
   metrics = [gauge("internet_download_mbps", down), gauge("internet_upload_mbps", up),
              gauge("internet_ping_ms", ping), gauge("internet_jitter_ms", jitter)]
   if loss is not None:
       metrics.append(gauge("internet_packet_loss_percent", loss))

   stamp = time.strftime("%Y-%m-%d %H:%M:%S")
   print(f"{stamp},{down:.1f},{up:.1f},{ping:.1f},{jitter:.1f},{'' if loss is None else loss}")
   print(json.dumps({"resourceMetrics": [{
       "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": "speedtest"}}]},
       "scopeMetrics": [{"scope": {"name": "speedtest"}, "metrics": metrics}]}]}))
   PY
   )
   row=$(head -n1 <<<"$output")
   payload=$(tail -n1 <<<"$output")

   [ -f "$CSV" ] || echo "time,download_mbps,upload_mbps,ping_ms,jitter_ms,packet_loss_percent" > "$CSV"
   echo "$row" >> "$CSV"

   if curl -fsS -m 10 -o /dev/null -H 'Content-Type: application/json' -d "$payload" "$OTLP_URL"; then
     echo "Sent to Grafana: $row"
   else
     echo "Stack not reachable, saved to $CSV only: $row"
   fi
   EOF
   sudo chmod +x /usr/local/bin/internet-speedtest
   ```
3. Test it once (~30 s):
   ```bash
   sudo internet-speedtest      # Sent to Grafana: <time>,<down>,<up>,<ping>,<jitter>,<loss>
   ```
4. Run it every 2 hours:
   ```bash
   sudo tee /etc/systemd/system/internet-speedtest.service >/dev/null <<'EOF'
   [Unit]
   Description=Internet speed test
   After=network-online.target
   Wants=network-online.target

   [Service]
   Type=oneshot
   ExecStart=/usr/local/bin/internet-speedtest
   EOF

   sudo tee /etc/systemd/system/internet-speedtest.timer >/dev/null <<'EOF'
   [Unit]
   Description=Internet speed test every 2 hours

   [Timer]
   OnBootSec=10min
   OnUnitActiveSec=2h
   RandomizedDelaySec=5min

   [Install]
   WantedBy=timers.target
   EOF

   sudo systemctl daemon-reload
   sudo systemctl enable --now internet-speedtest.timer
   ```
5. Check:
   ```bash
   systemctl list-timers internet-speedtest.timer
   journalctl -u internet-speedtest -n 5
   ```
6. Read the history: `column -s, -t /var/log/internet-speedtest.csv | tail -n 20`
7. Change the frequency: edit `OnUnitActiveSec=` in `/etc/systemd/system/internet-speedtest.timer` (not below `1h`), then
   ```bash
   sudo systemctl daemon-reload && sudo systemctl restart internet-speedtest.timer
   ```
8. Remove it:
   ```bash
   sudo systemctl disable --now internet-speedtest.timer
   sudo rm -f /etc/systemd/system/internet-speedtest.* /usr/local/bin/internet-speedtest
   sudo systemctl daemon-reload
   sudo rm -f /var/log/internet-speedtest.csv     # optional: the history
   sudo snap remove speedtest                     # optional: the client
   ```

## Why it works
- [[OpenTelemetry]] — the script sends OTLP metrics to the collector.
- [[systemd]] — the timer · [[Grafana]] — the dashboard.

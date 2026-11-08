---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab]
updated: 2026-11-08
---

# Homelab - Install Kubernetes

> Single-node k3s, Helm, the helm-diff plugin and helmfile, with a fixed node address and the Kubernetes ports kept off the LAN. Once, after [[Homelab - Prepare the server]]; the last two sections upgrade them later.

**Where:** on the server, over SSH · **All guides:** [[Homelab guides]]

**Versions used**

| Tool | Version |
|---|---|
| k3s | `v1.36.5+k3s1` |
| Helm | `v4.3.1` |
| helm-diff | `v3.15.15` |
| helmfile | `v1.8.2` |

## 1. Remove Docker (only if installed)

1. ```bash
   sudo systemctl disable --now docker.socket docker.service containerd.service
   sudo apt purge -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin docker-ce-rootless-extras
   sudo apt autoremove -y
   sudo rm -f /etc/apt/sources.list.d/docker.list /etc/apt/sources.list.d/docker.sources /etc/apt/keyrings/docker.asc /etc/apt/keyrings/docker.gpg
   sudo gpasswd -d "$USER" docker
   sudo reboot
   ```
2. Check: `command -v docker || echo gone` → `gone`.
3. If `~/.docker/config.json` exists, drop its credential helper (Helm reads this file to pull charts):
   ```bash
   jq 'del(.credsStore)' ~/.docker/config.json > ~/.docker/config.json.new && mv ~/.docker/config.json.new ~/.docker/config.json
   ```
4. Optional, deletes the old containers and volumes for good:
   ```bash
   sudo du -sh /var/lib/docker /var/lib/containerd
   sudo rm -rf /var/lib/docker /var/lib/containerd
   ```

## 2. Kernel limits

```bash
sudo tee /etc/sysctl.d/90-kubernetes.conf >/dev/null <<'EOF'
fs.inotify.max_user_instances = 1024
fs.inotify.max_user_watches = 524288
EOF
sudo sysctl --system
sysctl fs.inotify.max_user_instances fs.inotify.max_user_watches    # 1024, 524288
```

## 3. Fixed node address

1. ```bash
   sudo nmcli connection add type dummy ifname k3s0 con-name k3s0 \
     ipv4.method manual ipv4.addresses 10.250.0.1/32 ipv6.method disabled connection.autoconnect yes
   sudo nmcli connection up k3s0
   ```
2. Check: `ip -4 addr show k3s0` → `inet 10.250.0.1/32`.

## 4. Keep the Kubernetes ports off the LAN

1. ```bash
   sudo mkdir -p /etc/homelab
   sudo tee /etc/homelab/k3s-lan-guard.nft >/dev/null <<'EOF'
   table inet homelab_lan_guard
   delete table inet homelab_lan_guard
   table inet homelab_lan_guard {
     chain input {
       type filter hook input priority filter - 10; policy accept;
       iifname { "lo", "tailscale0", "k3s0", "cni0", "flannel.1" } accept
       tcp dport { 6443, 10250 } drop
       udp dport 8472 drop
       ip daddr 10.250.0.1 drop
     }
   }
   EOF
   sudo tee /etc/systemd/system/k3s-lan-guard.service >/dev/null <<'EOF'
   [Unit]
   Description=Keep the Kubernetes ports off the LAN
   Before=k3s.service

   [Service]
   Type=oneshot
   RemainAfterExit=yes
   ExecStart=/usr/sbin/nft -f /etc/homelab/k3s-lan-guard.nft

   [Install]
   WantedBy=multi-user.target
   EOF
   sudo systemctl daemon-reload
   sudo systemctl enable --now k3s-lan-guard
   ```
2. Check: `sudo nft list table inet homelab_lan_guard` prints the rules.
3. Never `systemctl enable nftables`: its config flushes the k3s and Tailscale rules.
4. On a server set up before the `ip daddr 10.250.0.1 drop` line existed: add it under `udp dport 8472 drop` in `/etc/homelab/k3s-lan-guard.nft` (`sudo nano`), then
   ```bash
   sudo systemctl restart k3s-lan-guard
   sudo nft list table inet homelab_lan_guard    # shows ip daddr 10.250.0.1 drop
   ```

## 5. Let your account run kubectl and helm

1. ```bash
   sudo groupadd --system k3s-admin
   sudo usermod -aG k3s-admin "$USER"
   echo 'export KUBECONFIG=/etc/rancher/k3s/k3s.yaml' >> ~/.bashrc    # zsh: ~/.zshrc
   ```
2. Log out and back in.
3. Check: `id -nG` lists `k3s-admin`; `echo $KUBECONFIG` → `/etc/rancher/k3s/k3s.yaml`.

## 6. Install k3s

1. Write the config:
   ```bash
   DOMAIN="$(tailscale status --json | jq -r '.Self.DNSName | rtrimstr(".")')"
   TSIP="$(tailscale ip -4)"
   ROUTER="$(ip -4 route show default | awk '{print $3; exit}')"
   sudo mkdir -p /etc/rancher/k3s
   echo "nameserver ${ROUTER}" | sudo tee /etc/rancher/k3s/resolv.conf
   sudo tee /etc/rancher/k3s/config.yaml >/dev/null <<EOF
   node-ip: 10.250.0.1
   flannel-iface: k3s0
   write-kubeconfig-mode: "0640"
   write-kubeconfig-group: k3s-admin
   secrets-encryption: true
   resolv-conf: /etc/rancher/k3s/resolv.conf
   disable:
     - traefik
     - servicelb
   tls-san:
     - ${DOMAIN}
     - ${TSIP}
   EOF
   sudo cat /etc/rancher/k3s/config.yaml
   ```
   → `nameserver <router-ip>`, then the config.
2. Install:
   ```bash
   cd "$(mktemp -d)"
   curl -fsSL https://get.k3s.io -o k3s-install.sh
   sudo INSTALL_K3S_VERSION='v1.36.5+k3s1' sh k3s-install.sh
   ```
3. Check, after a minute:
   ```bash
   kubectl get nodes -o wide          # Ready, INTERNAL-IP 10.250.0.1, v1.36.5+k3s1
   kubectl get pods -A                # coredns, local-path-provisioner, metrics-server Running; no traefik, no svclb
   sudo k3s secrets-encrypt status    # Encryption Status: Enabled
   kubectl top node                   # CPU and memory figures
   ```

## 7. Docker Hub login for image pulls

1. On hub.docker.com: **Account settings → Personal access tokens → Generate**, access **Read-only**. Copy it.
2. `sudo nano /etc/rancher/k3s/registries.yaml`, paste, replace `<token>`:
   ```yaml
   mirrors:
     docker.io:
       endpoint:
         - "https://index.docker.io/v2"
   configs:
     "https://index.docker.io/v2":
       auth:
         username: toufik142
         password: <token>
   ```
3. ```bash
   sudo chmod 600 /etc/rancher/k3s/registries.yaml
   sudo systemctl restart k3s
   ```
4. Check: `sudo k3s crictl pull docker.io/library/busybox:1.36` → `Image is up to date` (a wrong token fails with `401 Unauthorized`).

## 8. Install Helm

1. ```bash
   ARCH="$(dpkg --print-architecture)"; cd "$(mktemp -d)"
   curl -fsSLO "https://get.helm.sh/helm-v4.3.1-linux-${ARCH}.tar.gz"
   curl -fsSLO "https://get.helm.sh/helm-v4.3.1-linux-${ARCH}.tar.gz.sha256sum"
   sha256sum -c "helm-v4.3.1-linux-${ARCH}.tar.gz.sha256sum"       # OK
   tar -xzf "helm-v4.3.1-linux-${ARCH}.tar.gz"
   sudo install -m 0755 "linux-${ARCH}/helm" /usr/local/bin/helm
   ```
2. Check: `helm version` → `v4.3.1`; `helm list -A` → column headers, no error.

## 9. Install the helm-diff plugin

1. Get the signing key:
   ```bash
   mkdir -p ~/.config/helm/keyrings
   curl -fsSL https://github.com/databus23.gpg | gpg --dearmor > ~/.config/helm/keyrings/databus23.gpg
   gpg --show-keys --with-fingerprint ~/.config/helm/keyrings/databus23.gpg
   ```
2. The fingerprint must be `C564 5EF4 7482 257A 1F80  6D2B EA17 A2A2 06AF F8CD`. Stop if it isn't.
3. ```bash
   ARCH="$(dpkg --print-architecture)"
   helm plugin install "https://github.com/databus23/helm-diff/releases/download/v3.15.15/helm-diff-linux-${ARCH}.tgz" \
     --keyring ~/.config/helm/keyrings/databus23.gpg
   ```
4. Check: output has `Plugin Hash Verified`; `helm plugin list` → `diff 3.15.15`.

## 10. Install helmfile

1. ```bash
   ARCH="$(dpkg --print-architecture)"; cd "$(mktemp -d)"
   curl -fsSLO "https://github.com/helmfile/helmfile/releases/download/v1.8.2/helmfile_1.8.2_linux_${ARCH}.tar.gz"
   curl -fsSLO "https://github.com/helmfile/helmfile/releases/download/v1.8.2/helmfile_1.8.2_checksums.txt"
   sha256sum -c --ignore-missing helmfile_1.8.2_checksums.txt    # OK
   tar -xzf "helmfile_1.8.2_linux_${ARCH}.tar.gz" helmfile
   sudo install -m 0755 helmfile /usr/local/bin/helmfile
   ```
2. Check: `helmfile version` → `1.8.2`.

## 11. Check the cluster

1. Pods reach the API and the internet:
   ```bash
   kubectl run nettest --rm -i --restart=Never --image=curlimages/curl:8.11.1 -- sh -c \
     'curl -sk -o /dev/null -w "api %{http_code}\n" https://kubernetes.default.svc/version;
      curl -s  -o /dev/null -w "internet %{http_code}\n" https://integrate.api.nvidia.com/v1/models'
   ```
   → `api 401` and `internet 200`.
2. From another device on the home network:
   - `nc -vz -w 3 <lan-ip> 6443` → times out
   - `nc -vz -w 3 <tailscale-ip> 6443` → succeeded
3. `sudo reboot`; after two minutes: `systemctl is-active k3s k3s-lan-guard` → `active` twice, `kubectl get nodes` → `Ready`.
4. Unplug the Ethernet cable, `sudo systemctl restart k3s`, wait a minute:
   - `kubectl get nodes -o wide` → `Ready`, `10.250.0.1`
   - the nettest of step 1 → `internet 200`
   - plug the cable back.

## Upgrade k3s

1. Pick the next version from [update.k3s.io/v1-release/channels](https://update.k3s.io/v1-release/channels) (`stable`); go up one minor version at a time.
2. ```bash
   cd "$(mktemp -d)"
   curl -fsSL https://get.k3s.io -o k3s-install.sh
   sudo INSTALL_K3S_VERSION='<version>' sh k3s-install.sh
   ```
3. Check: `kubectl get nodes` → `Ready`, new version.
4. Update the version table above.

## Upgrade Helm, helm-diff or helmfile

1. Helm or helmfile: repeat its install step with the new version in every URL.
2. helm-diff:
   ```bash
   helm plugin uninstall diff
   ```
   then step 3 of [[Homelab - Install Kubernetes#9. Install the helm-diff plugin|Install the helm-diff plugin]] with the new version.
3. Update the version table above.

## If it goes wrong
- A `DNSConfigForming` warning every minute, or `docker-credential-… not found` when pulling a chart: [[Homelab - Troubleshooting]].

## Why it works
- [[Homelab server]] — the fixed node address and the LAN guard.
- [[k3s]] · [[Firewall and nftables]] · [[IP addresses and CIDR]] · [[Container image]] · [[Helm]] · [[helmfile]]

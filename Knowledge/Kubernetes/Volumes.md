---
type: concept
domain: Kubernetes
level: intermediate
tags: [concept, kubernetes, storage]
updated: 2026-11-08
---

# Volumes

> Storage that outlives a container. A pod asks for storage with a **PersistentVolumeClaim**; a **StorageClass** provisions a **PersistentVolume** to satisfy it. Other volume kinds mount config, scratch space or host folders.

## Why it matters
A container's own file system is thrown away when it restarts. Databases, Prometheus, model files need data that survives restarts, upgrades and even uninstalls — and you need to know where it physically is to back it up or recover it.

## How it works
| Kind | Lives | Use |
|---|---|---|
| `emptyDir` | As long as the pod | Scratch space, `/tmp` when the root FS is read-only |
| `configMap`, `secret` | Read-only projection | Config files ([[ConfigMap and Secret]]) |
| `persistentVolumeClaim` | Independent of the pod | Databases, durable data |
| `hostPath` | A folder on the node | Node access (sockets, `/proc`), host backups — powerful, use sparingly |

- **Claim → volume binding**: the PVC says "10 Gi, ReadWriteOnce"; the StorageClass' provisioner creates the volume.
- **Access modes**: `ReadWriteOnce` (one node), `ReadWriteMany` (many nodes, needs network storage).
- **Reclaim policy**: what happens to the data when the claim is deleted (`Delete` or `Retain`).

## In our projects
- [[k3s]]' **local-path** provisioner: each volume is a folder in `/var/lib/rancher/k3s/storage/`. Simple, fast, single-node only.
- The chart's `persistence:` creates claims that survive uninstalls (they're kept by Helm), so `make destroy` doesn't lose data ([[kube-charts]]).
- `hostPath` is used deliberately: Caddy mounts the Tailscale socket; Alloy mounts `/proc`, `/sys`, `/`; backups write to `/var/backups/homelab`.
- `emptyDir` gives `/tmp` to pods with a read-only root file system.

## Pitfalls we met
- Reinstalling a database finds its old volume — with old passwords inside.
- Local-path volumes have no size enforcement: "20 Gi" is a label; the disk is the real limit.
- `hostPath` with `type: Directory` fails if the folder doesn't exist — hence the backups presync check.

## Check yourself
1. Where on the server is MongoDB's data, and what happens to it on `make destroy`?
> [!success]- Answer
> In a folder under `/var/lib/rancher/k3s/storage/`, created by local-path for its claim. `make destroy` uninstalls the release but Helm keeps the claim, so the folder and the data stay, and a reinstall finds them (old passwords included).
2. Why is `hostPath` considered dangerous in shared clusters?
> [!success]- Answer
> A pod with `hostPath` reads and writes the node's own files: `/etc`, the container runtime's socket, other pods' data. In a shared cluster any team allowed to use it could take over the node.

## Go further
- [Volumes](https://kubernetes.io/docs/concepts/storage/volumes/), [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/).
- [local-path-provisioner](https://github.com/rancher/local-path-provisioner).

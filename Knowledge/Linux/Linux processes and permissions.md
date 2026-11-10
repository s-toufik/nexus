---
type: concept
domain: Linux
level: beginner
tags: [concept, linux]
updated: 2026-11-10
---

# Linux processes and permissions

> Everything running on Linux is a **process** with an id (PID), an owner (a user and groups), an environment, open files and limits. Every file has an **owner, a group and permissions** (read, write, execute for owner/group/others). Who can do what is decided by these two facts.

## Why it matters
Containers, Kubernetes security contexts, the `k3s-admin` group, root-only backups, a sandbox's memory limit — all are Linux processes and permissions in disguise.

## How it works
- `ps aux`, `top`/`htop`: processes; `kill <pid>` sends a signal (TERM asks to stop, KILL forces).
- **Users and groups:** `id` shows yours; `sudo` runs as root; `usermod -aG k3s-admin $USER` adds a group (log out and in to apply).
- **Permissions:** `ls -l` → `-rw-r-----  root k3s-admin  k3s.yaml`: owner reads/writes, group reads, others nothing. `chmod 600 file` (owner only), `chown`.
- **Environment variables:** inherited by child processes — how config reaches apps; visible to the same user via `/proc/<pid>/environ`.
- **Standard streams:** stdin, stdout, stderr; `|` pipes one into another. Secrets go on stdin, not the command line (visible in `ps`).
- **Limits:** `ulimit`, `setrlimit` (memory, CPU time) — what the Python sandbox uses.
- **Exit codes:** 0 = success; anything else = failure; scripts use `set -e` to stop on failure.

## In our projects
- The kubeconfig is readable by group `k3s-admin` ([[Homelab - Install Kubernetes]]).
- `/var/backups/homelab` is root-only `0700`.
- Pods run as non-root UIDs ([[Pod security context]]).
- `make user-add` sends passwords on stdin ([[Homelab security model]]).
- The sandbox sets `RLIMIT_AS` and `RLIMIT_CPU` ([[pycraftcore runtime sandbox]]).

## Check yourself
1. Read `drwx------ root root backups`: who can list it?
2. Why is a password in a command's arguments a leak?
3. What does exit code 1 from `make validate` tell a script?

## Go further
- [The Linux command line (William Shotts, free book)](https://linuxcommand.org/tlcl.php).
- [Julia Evans: Linux comics](https://wizardzines.com/comics/).

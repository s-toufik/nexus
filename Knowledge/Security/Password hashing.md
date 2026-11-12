---
type: concept
domain: Security
level: intermediate
tags: [concept, security]
updated: 2026-11-08
---

# Password hashing

> Never store passwords; store a slow, salted **hash**. At sign-in, hash what was typed the same way and compare. A stolen database then gives attackers hashes that are very expensive to reverse.

## Why it matters
Databases leak. With plain or fast-hashed passwords (MD5, SHA-256), attackers recover most of them in hours and try them on other sites. Proper hashing turns a breach into a nuisance.

## How it works
- **Salt**: a random value per password, stored next to the hash — the same password gives different hashes, so precomputed tables are useless.
- **Slow on purpose**: algorithms built to cost time *and memory*: **Argon2id** (current recommendation), scrypt, bcrypt, PBKDF2. Memory-hard means GPUs can't parallelise cheaply.
- **Policy**: length beats complexity; check against breached lists; rate-limit and lock out guessing.
- Current guidance (NIST SP 800-63B): minimum length, no forced periodic changes, no composition rules, block known-breached passwords.

## In our projects
Keycloak hashes with Argon2id; the realm's policy (`sync.sh`): at least 12 characters, not one of the last 5, change after 90 days; brute-force protection locks after 5 failures with growing waits ([[Homelab security model]]).

## Pitfalls we met
- The 90-day expiry contradicts NIST's advice (forced changes push people to `Password1!` → `Password2!`). A conscious trade-off to revisit.
- Passwords on command lines leak into `ps` and history: `make user-*` sends them on stdin.

## Check yourself
1. What does a salt defend against, and what does it *not*?
> [!success]- Answer
> Precomputed tables (rainbow tables) and cracking many hashes at once: the same password gives different hashes, so each must be attacked on its own. It doesn't make one weak password harder to guess: a dictionary attack on a single hash still works, only slowness slows it.
2. Why is SHA-256 a bad password hash even though it's a good hash?
> [!success]- Answer
> It's designed to be fast: a GPU computes billions a second, so guessing is cheap. A password hash must be slow and memory-hard (Argon2id), so each guess costs real time and memory.

## Go further
- [OWASP password storage cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
- [NIST SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html).

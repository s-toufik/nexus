---
type: architecture
project: "[[Homelab UI]]"
tags: [homelab-ui, ui-page]
updated: 2026-11-11
---

# Homelab UI page - Kafka

> **Route** `/kafka` · **for** everyone (changes: admins) · **reads** Kafka UI's API (`/api/kafka/…`) · **code** `src/app/features/kafka-ui/`
> The message broker: topics and their messages, consumer groups and their lag, the broker; create or delete a topic and send a message.

![[Homelab UI - Kafka topics.webp]]

## Topics
| # | What | What it tells you, what it does |
|:-:|---|---|
| 1 | Summary | Online · brokers · topics · consumer groups · total lag. |
| 2 | Tabs | **Topics**, **Consumer groups**, **Brokers**. |
| 3 | Filter | Narrow topics by name. |
| 4 | Internal topics | Also show Kafka's own (`__consumer_offsets`…). |
| 5 | Table | Each topic: partitions, messages, size. Click one to read its newest or oldest messages, open one as formatted JSON, send a message (key, value, partition), or delete the topic (admins). |
| 6 | New topic | Name, partitions, replication (admins). |
| 7 | Refresh | Read again. |

![[Homelab UI - Kafka brokers.webp]]

## Brokers
| # | What | What it tells you, what it does |
|:-:|---|---|
| 1 | Brokers | The tab. |
| 2 | Broker | Its id: one broker, running in KRaft mode (no ZooKeeper) ([[Kafka]]). |
| 3 | Address | `kafka:9092`, the listener inside the cluster. Clients outside use `<HOMELAB_DOMAIN>:9094` ([[Homelab UI page - Status]]). |
| 4 | Data | Bytes stored on disk. |
| 5 | Version line | `Kafka 1.0-UNKNOWN · 0 partitions online`: Kafka UI couldn't read the broker's version — cosmetic. |

## Use it to
- See whether a producer writes (messages grow) and a consumer keeps up (**lag** = messages written but not yet read by a group).
- Read one message to check its format.
- Send a test message by hand.

## How it works
The page uses [Kafka UI](https://github.com/kafbat/kafka-ui)'s REST API through the gateway (`/api/kafka/api/clusters/…`); Kafka UI talks to the broker. Writes (create, delete, send) require `role:admin` at Caddy and the `X-Homelab-Request` header ([[CSRF]]).

## What the real homelab showed (2026-11-11)
**No topics, not even internal ones.** No app produces to Kafka yet, and `__consumer_offsets` only appears when the first consumer group commits. This is what a used broker looks like (sample data):

![[Homelab UI - kafka sample.webp]]

## Try it
1. ✋ (admin) **New topic** `demo`, 1 partition → open it → send `{"hello": "kafka"}` → Newest shows it at offset 0. (Undo: Delete the topic.)

> [!question]- Check: lag is 2 000 and growing. Producer problem or consumer problem?
> Consumer: lag is what the group hasn't read yet. The producer is fine (it's writing); the consumer is slow, stuck or down — check its pod and logs.

Back to [[Homelab UI pages]].

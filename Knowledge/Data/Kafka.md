---
type: concept
domain: Data
level: intermediate
tags: [concept, data, messaging]
updated: 2026-11-08
---

# Kafka

> A distributed, durable log of events. Producers append messages to **topics**; topics are split into **partitions**; consumers read at their own pace, tracking their **offset**, in **consumer groups** that share the work.

## Why it matters
Kafka decouples systems: the producer doesn't know who reads, readers can replay history, a slow consumer doesn't slow the producer. It's the backbone of event-driven architectures and data pipelines in many companies.

## How it works
- A **topic** is a set of append-only partitions; order is guaranteed *within* a partition (choose the **key** so related events share one).
- Messages stay for the **retention** time/size, read or not.
- **Consumer group**: each partition is read by one consumer of the group → parallelism up to the partition count. **Lag** = how far behind a group is.
- **Brokers** store partitions; **replication** copies them for fault tolerance.
- **KRaft**: Kafka's own consensus for metadata (replaced ZooKeeper).
- **Listeners**: the addresses a broker *listens* on vs **advertised** ones it tells clients to use — the classic source of connection bugs.

## In our projects
- One broker in KRaft mode (broker + controller), 3 partitions by default, 7 days or 10 GiB per partition, replication factor 1 ([[Homelab data]]).
- Listeners: `PLAINTEXT` `kafka:9092` inside, `EXTERNAL` advertised as `<domain>:9094` for tailnet devices, `CONTROLLER` 9093.
- `make topics`, `topic-create`, `consume`, `groups` (lag); Kafka UI on `:8080`; kafka-exporter for metrics.
- No authentication: tailnet-only.

## Pitfalls we met
- Kubernetes' Service env variables (`KAFKA_PORT=…`) were read as Kafka settings → `enableServiceLinks: false`.
- A client outside the cluster that gets `kafka:9092` as advertised address can't connect — that's what the `EXTERNAL` listener is for.

## Check yourself
1. Why can't a consumer group with 5 consumers go faster than one with 3 on a 3-partition topic?
2. Explain listeners vs advertised listeners with our two addresses.

## Go further
- [Kafka introduction](https://kafka.apache.org/intro), [documentation](https://kafka.apache.org/documentation/).
- [Kafka listeners explained](https://www.confluent.io/blog/kafka-listeners-explained/) (Robin Moffatt).

---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab]
updated: 2026-11-08
---

# Homelab - Use Kafka

> List, create, describe and read topics; see consumer groups and their lag.

**Where:** on the server, in `homelab-infra`, unless a step says otherwise · **All guides:** [[Homelab guides]]

- Topics: `make topics` — raw: `kubectl -n homelab exec -it kafka-0 -- /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list`
- Create one: `make topic-create TOPIC=<name> [PARTITIONS=3]` — raw: `kubectl -n homelab exec -it kafka-0 -- /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --if-not-exists --topic <name> --partitions 3 --replication-factor 1`
- Describe it: `make topic-describe TOPIC=<name>` — raw: `kubectl -n homelab exec -it kafka-0 -- /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic <name>`
- Read it from the start: `make consume TOPIC=<name>` — raw: `kubectl -n homelab exec -it kafka-0 -- /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic <name> --from-beginning`
- Consumer groups and lag: `make groups` — raw: `kubectl -n homelab exec -it kafka-0 -- /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --all-groups`
- In the browser: `https://<HOMELAB_DOMAIN>:8080` (Kafka UI, signed in).
- From a tailnet device: bootstrap server `<HOMELAB_DOMAIN>:9094`.

## Why it works
- [[Kafka]] — topics, partitions, consumer groups, listeners.
- [[Homelab data]]

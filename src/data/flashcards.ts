export interface Flashcard {
  deck: string;
  q: string;
  a: string;
}

export const flashcards: Flashcard[] = [
  // Data
  { deck: 'Data', q: 'SQL vs NoSQL: when do you pick a relational database?', a: 'When you need multi-row ACID transactions, relationships with JOINs, flexible ad-hoc queries and strong constraints (orders, payments, users, inventory). It is the default unless an access pattern clearly needs something else.' },
  { deck: 'Data', q: 'When is a wide-column store (Cassandra) a good fit?', a: 'Huge write volume, data read by a known key in sorted order (e.g. messages by chat_id ordered by time), need to scale out linearly and stay available. You give up JOINs and ad-hoc queries.' },
  { deck: 'Data', q: 'Normalize or denormalize?', a: 'Normalize for correctness and simple writes (each fact once). Denormalize the hot read path for speed (precomputed feeds, counters, read models), accepting extra write work and possible staleness.' },
  { deck: 'Data', q: 'Index trade-off?', a: 'Indexes make reads on the indexed columns dramatically faster (O(log N)), but slow down every write and use extra storage. Index what you filter, join and sort by.' },
  { deck: 'Data', q: 'Read replicas vs sharding?', a: 'Replicas copy all data: they scale READS and add availability, but all writes still hit the primary. Sharding splits data: it scales WRITES and storage, at the cost of cross-shard queries/transactions.' },
  { deck: 'Data', q: 'Range vs hash sharding?', a: 'Range: great for range scans, but uneven and prone to hot spots (e.g. time-based keys). Hash: even distribution but range queries hit all shards. Consistent hashing eases adding shards.' },
  { deck: 'Data', q: 'Where do images and videos go?', a: 'Object storage (S3) for the bytes, metadata in the database, served via a CDN. Clients upload directly with pre-signed URLs.' },
  // Caching & performance
  { deck: 'Performance', q: 'Cache-aside vs write-through?', a: 'Cache-aside: app reads cache, on miss reads DB and fills cache; on write update DB then delete key. Simple, only caches what is used. Write-through: write cache and DB together; cache always fresh, but every write is slower and may cache unread data.' },
  { deck: 'Performance', q: 'Write-back (write-behind) caching risk?', a: 'Writes are acknowledged once in cache and flushed to the DB later. Very fast, absorbs bursts, but data can be lost if the cache node dies before flushing.' },
  { deck: 'Performance', q: 'Why add a CDN?', a: 'Serve static/media content from edge locations near users: lower latency, huge offload from origin, DDoS absorption. Needs good Cache-Control headers and fingerprinted URLs.' },
  { deck: 'Performance', q: 'Latency vs throughput trade-off example?', a: 'Batching increases throughput (fewer round trips) but adds latency for individual items waiting for the batch. Queues raise throughput and resilience but delay results.' },
  { deck: 'Performance', q: 'How do you handle a hot key?', a: 'Local in-process caches, replicate the key across cache nodes, split counters into shards, CDN caching for public data, and single-flight/stale-while-revalidate to avoid stampedes.' },
  // Distributed
  { deck: 'Distributed', q: 'CP or AP?', a: 'During a network partition: CP refuses requests rather than return possibly-wrong data (money, inventory, locks). AP keeps answering with possibly-stale data (feeds, likes, catalogs). Choose per feature.' },
  { deck: 'Distributed', q: 'Strong vs eventual consistency?', a: 'Strong: every read sees the latest write; simpler to reason about, but slower and less available. Eventual: replicas converge over time; fast and available, but users may see stale data.' },
  { deck: 'Distributed', q: 'Sync vs async replication?', a: 'Sync: leader waits for followers → no data loss on failover, slower writes. Async: fast writes, but replication lag (stale reads) and possible loss of recent writes on failover.' },
  { deck: 'Distributed', q: '2PC vs Saga?', a: '2PC: atomic across participants but blocking, slow and fragile when the coordinator fails. Saga: sequence of local transactions with compensating actions; eventually consistent, fits microservices.' },
  { deck: 'Distributed', q: 'Pessimistic vs optimistic locking?', a: 'Pessimistic: lock first (SELECT FOR UPDATE); good under heavy contention but others wait. Optimistic: version check at write time, retry on conflict; great when conflicts are rare.' },
  { deck: 'Distributed', q: 'Why idempotency keys?', a: 'Networks fail with unknown outcomes; clients retry. An idempotency key lets the server detect a repeated request and return the original result instead of charging/creating twice.' },
  { deck: 'Distributed', q: 'At-least-once vs exactly-once delivery?', a: 'At-least-once (common) may deliver duplicates, so consumers must be idempotent. Exactly-once is expensive and limited; usually achieved as at-least-once + idempotent processing.' },
  { deck: 'Distributed', q: 'UUID vs Snowflake ID?', a: 'UUID v4: 128-bit, no coordination, random order (index unfriendly). Snowflake: 64-bit, time-sortable, generated locally with machine ID + sequence; depends on clocks.' },
  // Communication
  { deck: 'Communication', q: 'REST vs GraphQL?', a: 'REST: simple, cacheable via HTTP/CDN, universal; risk of over/under-fetching. GraphQL: client asks for exact fields in one round trip; harder caching, N+1 and query-cost concerns.' },
  { deck: 'Communication', q: 'When gRPC?', a: 'Service-to-service calls needing low latency, strong typed contracts, binary payloads and streaming. Not directly from browsers (needs gRPC-Web).' },
  { deck: 'Communication', q: 'Polling vs SSE vs WebSocket?', a: 'Polling: simplest, wasteful, delayed. SSE: server→client stream over HTTP with auto-reconnect; great for notifications/feeds. WebSocket: full-duplex for chat, games, collaboration.' },
  { deck: 'Communication', q: 'Sync calls vs async events between services?', a: 'Sync (REST/gRPC) when the caller needs an answer now; creates runtime coupling. Async events for “something happened, react to it”; decoupled and resilient but eventually consistent.' },
  { deck: 'Communication', q: 'Queue (RabbitMQ/SQS) vs log (Kafka)?', a: 'Queue: messages deleted after ack, great for distributing tasks. Log: messages retained, replayable, ordered per partition, many independent consumer groups; great for event streaming.' },
  { deck: 'Communication', q: 'Offset vs cursor pagination?', a: 'Offset: simple, jump to page N, but slow for deep pages and duplicates/gaps with inserts. Cursor: stable and fast at any depth; no random page jumps. Use cursors for feeds.' },
  // Architecture
  { deck: 'Architecture', q: 'Monolith vs microservices?', a: 'Monolith: simple dev/deploy/debug, transactions easy; struggles with many teams and uneven scaling. Microservices: independent deploys/scaling, but network failures, distributed data and heavy ops. Start modular monolith.' },
  { deck: 'Architecture', q: 'Vertical vs horizontal scaling?', a: 'Vertical: bigger machine, no code changes, but a ceiling and SPOF. Horizontal: more machines, near-unlimited and resilient, but needs stateless services and load balancing.' },
  { deck: 'Architecture', q: 'Fan-out on write vs fan-out on read (feeds)?', a: 'On write: push post IDs into followers’ precomputed timelines; fast reads, expensive for celebrities. On read: pull from followees at read time; cheap writes, slow reads. Hybrid: push for normal users, pull for celebrities.' },
  { deck: 'Architecture', q: 'Batch vs stream processing?', a: 'Batch: bounded data, high throughput, results later (billing, reports). Stream: continuous events, results in seconds (fraud, live counters), harder (late events, state).' },
  { deck: 'Architecture', q: 'Sessions vs JWT?', a: 'Sessions: server-side state, easy revocation, needs shared store. JWT: self-contained, verified without lookups, good across services; hard to revoke, so keep short-lived with refresh tokens.' },
  { deck: 'Architecture', q: 'L4 vs L7 load balancer?', a: 'L4 routes by IP/port: very fast, protocol-agnostic. L7 understands HTTP: routing by path/header, TLS termination, smarter features, a bit more overhead.' },
];

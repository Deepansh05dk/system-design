# System Design Course

An interactive system design course, from zero to interview-ready, built with **Astro + React + MDX**.
It's written for frontend developers in simple English and assumes no prior knowledge of networking or databases.

## What's inside

| Module | Topics |
|---|---|
| 0 · Foundations | URL journey, IP/ports/DNS, network layers, TCP vs UDP, HTTP/HTTPS/TLS, latency, estimation |
| 1 · Databases | SQL, indexes, ACID & isolation, NoSQL types, SQL vs NoSQL, normalization, search, OLAP, pooling |
| 2 · Building blocks | Scaling, load balancers, caching, CDN, replication, sharding, consistent hashing, queues, gateways, object storage |
| 3 · Distributed systems | CAP/PACELC, consistency & quorums, rate limiting, idempotency, fault tolerance, Raft, 2PC/sagas, locks, IDs, Bloom filters, geo, hot keys |
| 4 · APIs & communication | REST/GraphQL/gRPC, real-time, microservices, auth/OAuth/JWT, API design, event-driven/CQRS, batch vs stream |
| 5 · Reliability | Observability, availability & SLOs, disaster recovery, security |
| 6 · Interview framework | Framework, requirements, driving the interview, trade-off checklist |
| 7 · Interview problems | 18 walkthroughs: URL shortener, Pastebin, rate limiter, KV store, Twitter, Instagram, WhatsApp, notifications, typeahead, crawler, YouTube, Dropbox, Uber, Yelp, ticket booking, payments, leaderboard, job scheduler |
| 8 · Frontend system design | RADIO framework, rendering strategies, feed UI, autocomplete, collaborative editor, performance |

Plus a **design canvas**, **trade-off flashcards**, a **final exam** and a **glossary**. Progress is saved in the browser.

## Run it

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static site in dist/
```

`npm run build` first generates MDX wrappers for the React islands (`scripts/gen-wrappers.mjs`) and validates
lesson content (`scripts/validate-content.mjs`: diagram references, quiz answers, frontmatter).

## Project layout

```
src/content/lessons/m*/   lessons (MDX), one folder per module
src/components/islands/   interactive React components (simulators, quizzes, diagrams)
src/components/*.astro    static MDX helpers (Callout, Versus, Takeaways, Term)
src/data/                 modules, glossary, flashcards, practice scenarios
```

Lessons use components without imports, e.g. `<Callout type="why">`, `<ArchFlow …/>`, `<Quiz …/>`.

## Deploy

Any static host works (Vercel, Netlify, Cloudflare Pages: build command `npm run build`, output `dist`).
For GitHub Pages, the included workflow builds with `BASE_PATH=/<repo-name>`; enable Pages → "GitHub Actions" in the repo settings.

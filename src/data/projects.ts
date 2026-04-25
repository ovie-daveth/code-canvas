export type ProjectCategory = "frontend" | "backend" | "devops" | "cloud" | "fullstack";

export type Project = {
  id: string;
  name: string;
  tagline: string;
  description?: string;
  stack: string[];
  challenges: string[];
  architecture: string;
  demo: string;
  repo: string;
  metric: { value: string; label: string };
  categories: ProjectCategory[];
  primaryCategory: ProjectCategory;
  hasApi?: boolean;
  apiEndpoint?: string;
  featured?: boolean;
  year: number;
  status: "production" | "beta" | "archived" | "wip";
};

export const projects: Project[] = [
  {
    id: "edge-cache",
    name: "EdgeCache",
    tagline: "Distributed cache layer with sub-ms p99 reads across 14 regions.",
    description:
      "A globally distributed caching system designed for read-heavy workloads with strong eventual consistency guarantees.",
    stack: ["Go", "Redis", "Cloudflare Workers", "Terraform"],
    challenges: [
      "Cache coherency under 200ms cross-region writes",
      "Graceful degradation when origin cluster is partitioned",
      "Zero-downtime schema migrations on hot keys",
    ],
    architecture:
      "Built on a CRDT-based replication layer with consistent hashing for shard placement. Writes propagate via Kafka; reads hit the closest edge POP. Designed eviction with W-TinyLFU to retain hot working sets under memory pressure.",
    demo: "#",
    repo: "#",
    metric: { value: "0.8ms", label: "p99 read latency" },
    categories: ["backend", "devops", "cloud"],
    primaryCategory: "backend",
    hasApi: true,
    apiEndpoint: "/api/v1/cache",
    featured: true,
    year: 2024,
    status: "production",
  },
  {
    id: "stream-engine",
    name: "Streamline",
    tagline: "Real-time analytics engine processing 2M events/sec.",
    description:
      "High-throughput stream processing platform powering real-time dashboards for mid-market SaaS companies.",
    stack: ["Rust", "Kafka", "ClickHouse", "Kubernetes"],
    challenges: [
      "Backpressure handling without dropping events",
      "Exactly-once semantics across consumer rebalances",
      "Hot-partition mitigation for skewed customer load",
    ],
    architecture:
      "Stateful stream processors written in Rust consume partitioned topics, maintain in-memory windows, and flush to ClickHouse via async batches. Checkpointing uses a two-phase commit pattern coordinated through etcd.",
    demo: "#",
    repo: "#",
    metric: { value: "2M/s", label: "events ingested" },
    categories: ["backend", "devops"],
    primaryCategory: "backend",
    hasApi: true,
    apiEndpoint: "/api/v1/events",
    featured: true,
    year: 2024,
    status: "production",
  },
  {
    id: "devboard",
    name: "DevBoard",
    tagline: "Self-hosted observability platform for indie engineering teams.",
    description:
      "Open-source telemetry stack that ships as a single binary — traces, metrics, and logs without the SaaS bill.",
    stack: ["TypeScript", "Next.js", "PostgreSQL", "OpenTelemetry"],
    challenges: [
      "Storing high-cardinality traces affordably",
      "Sub-second query response over weeks of data",
      "Single-binary deploy with zero external deps",
    ],
    architecture:
      "OTLP receiver writes to a columnar Postgres extension. Traces are sampled adaptively based on error rate and latency outliers. Query layer pre-aggregates rollups in materialized views refreshed via logical replication.",
    demo: "#",
    repo: "#",
    metric: { value: "40+", label: "GitHub stars/wk" },
    categories: ["fullstack", "frontend", "backend"],
    primaryCategory: "fullstack",
    hasApi: true,
    apiEndpoint: "/api/v1/traces",
    featured: true,
    year: 2024,
    status: "beta",
  },
  {
    id: "ml-router",
    name: "RouteML",
    tagline: "Cost-aware LLM routing gateway with semantic caching.",
    description:
      "An intelligent proxy that routes LLM calls to the cheapest model meeting a quality threshold.",
    stack: ["Python", "FastAPI", "pgvector", "Docker"],
    challenges: [
      "Routing decisions in <30ms across 12 model providers",
      "Semantic cache invalidation without false positives",
      "Streaming response normalization across SSE dialects",
    ],
    architecture:
      "Embedding-based intent classifier scores prompts and routes to the cheapest model meeting quality thresholds. Cache uses HNSW index over pgvector with cosine similarity. Streaming proxy normalizes deltas before forwarding.",
    demo: "#",
    repo: "#",
    metric: { value: "−68%", label: "inference cost" },
    categories: ["backend", "cloud"],
    primaryCategory: "backend",
    hasApi: true,
    apiEndpoint: "/api/v1/route",
    featured: true,
    year: 2024,
    status: "production",
  },
  {
    id: "design-system",
    name: "Helix UI",
    tagline: "Headless component library powering 6 internal products.",
    description:
      "Accessible, themeable React primitives with a strict token-driven design system. Used by 40+ engineers.",
    stack: ["React", "TypeScript", "Radix UI", "Tailwind", "Storybook"],
    challenges: [
      "WCAG 2.2 AA compliance across 60+ components",
      "Token-driven theming without CSS-in-JS overhead",
      "Tree-shakeable bundle under 18kb gzipped",
    ],
    architecture:
      "Compound component pattern with controlled/uncontrolled variants. Theming via CSS custom properties resolved at build time. Visual regression suite runs on every PR via Chromatic.",
    demo: "#",
    repo: "#",
    metric: { value: "18kb", label: "gzipped bundle" },
    categories: ["frontend"],
    primaryCategory: "frontend",
    year: 2023,
    status: "production",
  },
  {
    id: "canvas-editor",
    name: "Lattice",
    tagline: "Collaborative canvas editor with CRDT-based multiplayer.",
    description:
      "Figma-style collaborative editor built on Yjs with offline-first sync and 60fps interactions on 10k+ nodes.",
    stack: ["React", "TypeScript", "Yjs", "WebGL", "WebRTC"],
    challenges: [
      "60fps rendering with 10k+ vector nodes",
      "Conflict-free multiplayer cursors at 30Hz",
      "Offline-first persistence with IndexedDB",
    ],
    architecture:
      "Canvas rendered via WebGL with virtualized scene graph. CRDT state synced through Yjs over WebRTC mesh, falling back to a y-websocket relay. Operations are batched per animation frame.",
    demo: "#",
    repo: "#",
    metric: { value: "60fps", label: "@ 10k nodes" },
    categories: ["frontend"],
    primaryCategory: "frontend",
    year: 2023,
    status: "beta",
  },
  {
    id: "k8s-operator",
    name: "ShardOp",
    tagline: "Kubernetes operator for stateful database sharding.",
    description:
      "Custom controller that automates Vitess shard splits, rebalancing, and backups across multi-region clusters.",
    stack: ["Go", "Kubernetes", "Vitess", "Helm", "Prometheus"],
    challenges: [
      "Zero-downtime shard splits under live traffic",
      "Cross-AZ failover within RTO of 30s",
      "Reconciliation loops idempotent under partial failure",
    ],
    architecture:
      "Operator implemented with controller-runtime. CRDs model shard topology and migration plans. State machine drives split→backfill→cutover with checkpoints in etcd.",
    demo: "#",
    repo: "#",
    metric: { value: "30s", label: "failover RTO" },
    categories: ["devops", "backend", "cloud"],
    primaryCategory: "devops",
    year: 2023,
    status: "production",
  },
  {
    id: "ci-pipeline",
    name: "Forge CI",
    tagline: "Distributed build cache cutting CI times by 71%.",
    description:
      "Remote build execution and content-addressable cache layer integrated with Bazel and Turborepo.",
    stack: ["Rust", "S3", "gRPC", "Terraform", "GitHub Actions"],
    challenges: [
      "Cache hit ratio above 85% across feature branches",
      "Sub-100ms artifact lookups at petabyte scale",
      "Secure multi-tenant isolation with mTLS",
    ],
    architecture:
      "REAPI-compliant gRPC server backed by S3 with a Redis index for hot metadata. Workers scale horizontally via KEDA based on queue depth.",
    demo: "#",
    repo: "#",
    metric: { value: "−71%", label: "CI duration" },
    categories: ["devops", "cloud"],
    primaryCategory: "devops",
    year: 2023,
    status: "production",
  },
  {
    id: "iac-platform",
    name: "Terraplane",
    tagline: "Internal platform abstracting AWS, GCP, and Fly.io.",
    description:
      "Self-service infrastructure portal where product teams provision compliant environments via PR.",
    stack: ["Terraform", "AWS", "GCP", "Pulumi", "Backstage"],
    challenges: [
      "Drift detection across 200+ accounts",
      "Policy-as-code gates with OPA",
      "Sub-10min provisioning for net-new environments",
    ],
    architecture:
      "Backstage frontend renders templated workflows. Atlantis orchestrates plan/apply with OPA policies enforced server-side. Drift detection runs nightly with auto-remediation PRs.",
    demo: "#",
    repo: "#",
    metric: { value: "200+", label: "AWS accounts" },
    categories: ["cloud", "devops"],
    primaryCategory: "cloud",
    year: 2022,
    status: "production",
  },
  {
    id: "auth-gateway",
    name: "GateKeep",
    tagline: "Zero-trust auth gateway with sub-5ms token validation.",
    description:
      "Edge-deployed identity proxy enforcing OAuth, mTLS, and policy decisions per request.",
    stack: ["Go", "Envoy", "OPA", "Cloudflare", "Vault"],
    challenges: [
      "Token validation under 5ms at p99",
      "Policy evaluation without round-trips to Vault",
      "Graceful key rotation across 30+ services",
    ],
    architecture:
      "Envoy ext_authz filter calls a Go sidecar that caches JWKS and OPA bundles in memory. Policies compiled to WASM and shipped via OCI registries.",
    demo: "#",
    repo: "#",
    metric: { value: "4ms", label: "p99 authz" },
    categories: ["backend", "cloud", "devops"],
    primaryCategory: "backend",
    hasApi: true,
    apiEndpoint: "/api/v1/auth",
    year: 2022,
    status: "production",
  },
  {
    id: "marketing-site",
    name: "Aperture",
    tagline: "Editorial marketing site with 99 Lighthouse across the board.",
    description:
      "Headless CMS-driven marketing platform with on-demand ISR and per-page A/B testing.",
    stack: ["Next.js", "Sanity", "Vercel", "Framer Motion"],
    challenges: [
      "100ms TTFB on edge with personalized content",
      "Visual editor for non-technical marketers",
      "A/B tests without layout shift",
    ],
    architecture:
      "Next.js App Router with on-demand ISR triggered by Sanity webhooks. Edge middleware splits traffic for experiments. CLS guarded by reserved skeletons.",
    demo: "#",
    repo: "#",
    metric: { value: "99/100", label: "Lighthouse" },
    categories: ["frontend", "fullstack"],
    primaryCategory: "frontend",
    year: 2022,
    status: "production",
  },
  {
    id: "data-warehouse",
    name: "Quanta",
    tagline: "Reverse-ETL pipeline syncing warehouse → 14 SaaS tools.",
    description:
      "CDC-driven sync engine that keeps Snowflake the source of truth for marketing and ops tooling.",
    stack: ["Python", "Airflow", "dbt", "Snowflake", "Kafka Connect"],
    challenges: [
      "Idempotent upserts across heterogeneous APIs",
      "Backfills without rate-limit blowouts",
      "Schema evolution without breaking destinations",
    ],
    architecture:
      "dbt models materialize sync-ready views. A Kafka Connect cluster captures changes and routes them to per-destination workers with token-bucket rate limiting and dead-letter queues.",
    demo: "#",
    repo: "#",
    metric: { value: "14", label: "destinations" },
    categories: ["backend", "cloud"],
    primaryCategory: "backend",
    hasApi: true,
    apiEndpoint: "/api/v1/sync",
    year: 2022,
    status: "production",
  },
];

export const featuredProjects = projects.filter((p) => p.featured);

export const categoryLabels: Record<ProjectCategory | "all", string> = {
  all: "All",
  fullstack: "Fullstack",
  frontend: "Frontend Heavy",
  backend: "Backend Heavy",
  devops: "DevOps Heavy",
  cloud: "Cloud Heavy",
};

export const categoryColors: Record<ProjectCategory, string> = {
  frontend: "text-pink border-pink/30 bg-pink/5",
  backend: "text-teal border-teal/30 bg-teal/5",
  devops: "text-amber border-amber/30 bg-amber/5",
  cloud: "text-blue border-blue/30 bg-blue/5",
  fullstack: "text-green border-green/30 bg-green/5",
};

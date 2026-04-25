import { useState } from "react";
import { ExternalLink, Github, ChevronDown } from "lucide-react";

type Project = {
  id: string;
  name: string;
  tagline: string;
  stack: string[];
  challenges: string[];
  architecture: string;
  demo: string;
  repo: string;
  metric: { value: string; label: string };
};

const projects: Project[] = [
  {
    id: "edge-cache",
    name: "EdgeCache",
    tagline: "Distributed cache layer with sub-ms p99 reads across 14 regions.",
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
  },
  {
    id: "stream-engine",
    name: "Streamline",
    tagline: "Real-time analytics engine processing 2M events/sec.",
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
  },
  {
    id: "devboard",
    name: "DevBoard",
    tagline: "Self-hosted observability platform for indie engineering teams.",
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
  },
  {
    id: "ml-router",
    name: "RouteML",
    tagline: "Cost-aware LLM routing gateway with semantic caching.",
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
  },
];

const ProjectCard = ({ project, idx }: { project: Project; idx: number }) => {
  const [open, setOpen] = useState(false);

  return (
    <article
      className="surface-card overflow-hidden group animate-fade-up"
      style={{ animationDelay: `${idx * 80}ms` }}
    >
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="font-mono text-xs text-muted-foreground">
              project_{String(idx + 1).padStart(2, "0")}
            </div>
            <h3 className="text-2xl font-bold text-foreground group-hover:text-teal transition-colors">
              {project.name}
            </h3>
          </div>
          <div className="text-right">
            <div className="font-mono text-xl text-teal font-semibold">{project.metric.value}</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {project.metric.label}
            </div>
          </div>
        </div>

        <p className="text-muted-foreground leading-relaxed">{project.tagline}</p>

        <div className="space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            // engineering challenges
          </div>
          <ul className="space-y-1.5">
            {project.challenges.map((c) => (
              <li key={c} className="text-sm text-foreground/80 flex gap-2">
                <span className="text-teal mt-1.5 w-1 h-1 rounded-full bg-teal flex-shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {project.stack.map((s) => (
            <span
              key={s}
              className="px-2 py-0.5 text-[11px] font-mono text-muted-foreground bg-surface-elevated border border-border rounded"
            >
              {s}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <a
            href={project.demo}
            className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-teal transition-colors"
          >
            <ExternalLink size={14} /> Live
          </a>
          <span className="text-border">·</span>
          <a
            href={project.repo}
            className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-teal transition-colors"
          >
            <Github size={14} /> Repo
          </a>
          <button
            onClick={() => setOpen(!open)}
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-mono text-teal hover:text-teal-glow transition-colors"
          >
            {open ? "collapse" : "deep dive"}
            <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-surface-elevated p-6 space-y-3 animate-fade-in">
          <div className="font-mono text-[10px] uppercase tracking-wider text-teal">
            // architecture.md
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{project.architecture}</p>
        </div>
      )}
    </article>
  );
};

const Projects = () => {
  return (
    <section id="projects" className="relative py-32 border-t border-border/50">
      <div className="container">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
          <div className="space-y-4 max-w-2xl">
            <div className="section-label"><span>03 / projects</span></div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gradient">
              Selected work.
            </h2>
            <p className="text-muted-foreground">
              A subset of recent systems. Expand any card for the architecture deep-dive.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} idx={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;

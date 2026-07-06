import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Github,
  Search,
  Code2,
  Server,
  Cloud,
  Layers,
  Activity,
  Calendar,
} from "lucide-react";
import Nav from "@/components/portfolio/Nav";
import ApiPlaygroundModal from "@/components/portfolio/ApiPlaygroundModal";
import {
  projects,
  categoryLabels,
  categoryColors,
  type Project,
  type ProjectCategory,
} from "@/data/projects";

type Filter = ProjectCategory | "all";

const filterOrder: Filter[] = ["all", "fullstack", "frontend", "backend", "devops", "cloud"];

const filterIcons: Record<Filter, typeof Code2> = {
  all: Layers,
  fullstack: Layers,
  frontend: Code2,
  backend: Server,
  devops: Activity,
  cloud: Cloud,
};

const statusStyles: Record<Project["status"], string> = {
  production: "text-green border-green/30 bg-green/5",
  beta: "text-amber border-amber/30 bg-amber/5",
  wip: "text-blue border-blue/30 bg-blue/5",
  archived: "text-muted-foreground border-border bg-surface-elevated",
};

const isExternalUrl = (url: string) => /^https?:\/\//i.test(url);

const ProjectRow = ({ project, idx }: { project: Project; idx: number }) => {
  return (
    <article
      id={`project-${project.id}`}
      className="surface-card p-6 group animate-fade-up flex flex-col"
      style={{ animationDelay: `${Math.min(idx, 8) * 50}ms` }}
    >
      {/* Header */}
      <header className="flex items-start justify-between gap-4 mb-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>proj_{String(idx + 1).padStart(2, "0")}</span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1">
              <Calendar size={10} /> {project.year}
            </span>
            <span className="text-border">·</span>
            <span
              className={`px-1.5 py-0.5 border rounded font-mono text-[9px] ${statusStyles[project.status]}`}
            >
              {project.status}
            </span>
          </div>
          <h3 className="text-xl font-bold text-foreground group-hover:text-teal transition-colors truncate">
            {project.name}
          </h3>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-mono text-lg text-teal font-semibold leading-none">
            {project.metric.value}
          </div>
          <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mt-1">
            {project.metric.label}
          </div>
        </div>
      </header>

      {/* Categories */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {project.categories.map((c) => (
          <span
            key={c}
            className={`px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider border rounded ${categoryColors[c]}`}
          >
            {c}
          </span>
        ))}
      </div>

      {/* Tagline */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{project.tagline}</p>

      {/* Stack */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {project.stack.map((s) => (
          <span
            key={s}
            className="px-2 py-0.5 text-[10px] font-mono text-muted-foreground bg-surface-elevated border border-border rounded"
          >
            {s}
          </span>
        ))}
      </div>

      {/* Architecture preview */}
      <div className="mb-5 p-3 border border-border bg-background/50 rounded text-xs text-muted-foreground leading-relaxed font-mono">
        <span className="text-teal">// architecture: </span>
        {project.architecture.slice(0, 140)}…
      </div>

      {/* Actions */}
      <footer className="mt-auto pt-4 border-t border-border flex flex-wrap items-center gap-2">
        {isExternalUrl(project.demo) ? (
          <a
            href={project.demo}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-foreground hover:text-teal transition-colors"
          >
            <ExternalLink size={13} /> Live
          </a>
        ) : (
          <Link
            to={project.demo}
            className="inline-flex items-center gap-1.5 text-xs text-foreground hover:text-teal transition-colors"
          >
            <ExternalLink size={13} /> Live
          </Link>
        )}
        <span className="text-border">·</span>
        {project.privateRepo ? (
          <span
            title="Private GitHub repository"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Github size={13} /> Private repo
          </span>
        ) : (
          <a
            href={project.repo}
            target="_blank"
            title="View codebase (GitHub integration coming soon)"
            className="inline-flex items-center gap-1.5 text-xs text-foreground hover:text-teal transition-colors"
          >
            <Github size={13} /> Codebase
          </a>
        )}
        {project.hasApi && (
          <ApiPlaygroundModal
            project={project}
            triggerClassName="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-teal border border-teal/40 rounded hover:bg-teal/10 transition-colors"
          />
        )}
      </footer>
    </article>
  );
};

const ProjectsPage = () => {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: projects.length,
      fullstack: 0,
      frontend: 0,
      backend: 0,
      devops: 0,
      cloud: 0,
    };
    projects.forEach((p) => p.categories.forEach((cat) => (c[cat] += 1)));
    return c;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      const matchFilter = filter === "all" || p.categories.includes(filter);
      if (!matchFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.stack.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [filter, query]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Nav />

      {/* Header */}
      <section className="pt-32 pb-12 border-b border-border/50">
        <div className="container">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-teal transition-colors mb-8"
          >
            <ArrowLeft size={14} /> back to /home
          </Link>

          <div className="flex items-end justify-between flex-wrap gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="section-label">
                <span>~/projects · index</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gradient">
                Engineering archive.
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                {projects.length} systems shipped across frontend, backend, devops, and cloud.
                Filter by stack focus, search by tech, or jump into the API playground for
                anything backend-heavy.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono text-xs">
              <div className="surface-card px-3 py-2">
                <div className="text-teal text-lg font-semibold leading-none">
                  {projects.length}
                </div>
                <div className="text-muted-foreground mt-1">total</div>
              </div>
              <div className="surface-card px-3 py-2">
                <div className="text-teal text-lg font-semibold leading-none">
                  {projects.filter((p) => p.status === "production").length}
                </div>
                <div className="text-muted-foreground mt-1">in prod</div>
              </div>
              <div className="surface-card px-3 py-2">
                <div className="text-teal text-lg font-semibold leading-none">
                  {projects.filter((p) => p.hasApi).length}
                </div>
                <div className="text-muted-foreground mt-1">with API</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="sticky top-16 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container py-4 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="grep projects... (e.g. rust, kafka)"
              className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-md font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-teal/50 transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-1.5">
            {filterOrder.map((f) => {
              const Icon = filterIcons[f];
              const active = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded border transition-all ${
                    active
                      ? "border-teal text-teal bg-teal/10"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                  }`}
                >
                  <Icon size={12} />
                  {categoryLabels[f]}
                  <span
                    className={`text-[10px] ${active ? "text-teal/70" : "text-muted-foreground/70"}`}
                  >
                    {counts[f]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-12">
        <div className="container">
          {filtered.length === 0 ? (
            <div className="surface-card p-12 text-center">
              <div className="font-mono text-sm text-muted-foreground">
                <span className="text-teal">$</span> no projects matched.
              </div>
              <button
                onClick={() => {
                  setFilter("all");
                  setQuery("");
                }}
                className="mt-4 text-xs font-mono text-teal hover:underline"
              >
                reset filters
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 font-mono text-xs text-muted-foreground">
                <span className="text-teal">$</span> showing {filtered.length} of {projects.length}
                {filter !== "all" && (
                  <>
                    {" "}
                    · filter=<span className="text-foreground">{filter}</span>
                  </>
                )}
                {query && (
                  <>
                    {" "}
                    · q=<span className="text-foreground">"{query}"</span>
                  </>
                )}
              </div>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((p, i) => (
                  <ProjectRow key={p.id} project={p} idx={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 border-t border-border/50">
        <div className="container text-center space-y-6">
          <h2 className="text-3xl font-bold text-gradient">Want to see the source?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            GitHub integration is on the roadmap — soon you'll be able to browse the codebase
            for each project right from this page.
          </p>
          <Link
            to="/#contact"
            className="inline-flex items-center gap-2 px-6 py-3 font-mono text-sm border border-teal/40 text-teal rounded-md hover:bg-teal/10 transition-all"
          >
            Get in touch
          </Link>
        </div>
      </section>
    </main>
  );
};

export default ProjectsPage;

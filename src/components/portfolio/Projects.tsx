import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Github, ChevronDown, ArrowRight } from "lucide-react";
import { featuredProjects, type Project } from "@/data/projects";
import ApiPlaygroundModal from "@/components/portfolio/ApiPlaygroundModal";

const ProjectCard = ({ project, idx }: { project: Project; idx: number }) => {
  const [open, setOpen] = useState(false);

  return (
    <article
      id={`project-${project.id}`}
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
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-teal transition-colors"
          >
            <ExternalLink size={14} /> Live
          </a>
          <span className="text-border">·</span>
          {project.privateRepo ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Github size={14} /> Private repo
            </span>
          ) : (
            <a
              href={project.repo}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-teal transition-colors"
            >
              <Github size={14} /> Repo
            </a>
          )}
          {project.hasApi && (
            <ApiPlaygroundModal
              project={project}
              triggerClassName="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-teal border border-teal/40 rounded hover:bg-teal/10 transition-colors"
            />
          )}
          <button
            onClick={() => setOpen(!open)}
            className={`${project.hasApi ? "" : "ml-auto"} inline-flex items-center gap-1.5 text-xs font-mono text-teal hover:text-teal-glow transition-colors`}
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
    <section id="projects" className="relative py-10 border-t border-border/50">
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
          {featuredProjects.map((p, i) => (
            <ProjectCard key={p.id} project={p} idx={i} />
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            to="/projects"
            className="group inline-flex items-center gap-2 px-6 py-3 font-mono text-sm border border-teal/40 text-teal rounded-md hover:bg-teal/10 transition-all"
          >
            View more projects
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Projects;

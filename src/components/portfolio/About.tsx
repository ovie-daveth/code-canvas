import { Cpu, GitBranch, Zap, Network } from "lucide-react";

const principles = [
  {
    icon: Cpu,
    title: "Systems Thinking",
    desc: "I design for failure modes first. Every component is observable, recoverable, and traceable across service boundaries.",
  },
  {
    icon: Zap,
    title: "Performance-Obsessed",
    desc: "Latency budgets, profiling, and benchmarking are part of every PR. p99 matters more than averages.",
  },
  {
    icon: GitBranch,
    title: "Architectural Design",
    desc: "Designing robust, maintainable systems that evolve with business requirements over time.",
  },
  {
    icon: Network,
    title: "Cross-Stack Fluency",
    desc: "From DB indices to React reconciliation to Kubernetes IRSA — full ownership across the stack.",
  },
];

const About = () => {
  return (
    <section id="about" className="relative py-32">
      <div className="container">
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-6">
            <div className="section-label">
              <span>01 / about</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gradient">
              Engineering mindset, product perspective.
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              I'm a fullstack engineer with <span className="text-foreground">8+ years of experience</span>{" "}
              building and scaling web applications. My focus is on creating systems that are not just
              functional, but <span className="text-foreground">resilient</span>,{" "}
              <span className="text-foreground">observable</span>, and{" "}
              <span className="text-foreground">maintainable</span>.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              I believe great software comes from understanding the problem deeply before writing code.
              I approach each project with curiosity, breaking down complex challenges into elegant solutions.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Currently interested in distributed systems, edge computing, and developer tooling. When
              I'm not coding, I contribute to open source and write about software architecture.
            </p>
            <div className="pt-4 font-mono text-xs text-muted-foreground space-y-1">
              <div><span className="text-teal">{">"}</span> based in Warri, Nigeria · open to remote</div>
              <div><span className="text-teal">{">"}</span> currently @ PremiumTrust Bank</div>
            </div>
          </div>

          <div className="lg:col-span-5 grid sm:grid-cols-1 gap-4">
            {principles.map((p, i) => (
              <div
                key={p.title}
                className="surface-card p-6 group animate-fade-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-md bg-teal/10 border border-teal/20 flex items-center justify-center text-teal group-hover:bg-teal/20 transition-colors">
                    <p.icon size={18} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-foreground">{p.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;

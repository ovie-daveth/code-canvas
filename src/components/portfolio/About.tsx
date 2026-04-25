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
    title: "Pragmatic Architecture",
    desc: "I optimize for change. Boring tech, clear boundaries, and contracts that survive team turnover.",
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
          <div className="lg:col-span-4 space-y-6">
            <div className="section-label">
              <span>01 / about</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gradient">
              Engineering with intent.
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              I'm a fullstack engineer with seven years building systems that need to{" "}
              <span className="text-foreground">stay up</span>,{" "}
              <span className="text-foreground">scale predictably</span>, and{" "}
              <span className="text-foreground">ship continuously</span>.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              My background spans high-throughput backends, real-time data pipelines, and the polished
              interfaces that sit on top. I've led migrations off monoliths, designed multi-region failover,
              and shipped products from zero to seven figures of ARR.
            </p>
            <div className="pt-4 font-mono text-xs text-muted-foreground space-y-1">
              <div><span className="text-teal">{">"}</span> based in San Francisco · open to remote</div>
              <div><span className="text-teal">{">"}</span> currently @ stealth fintech</div>
            </div>
          </div>

          <div className="lg:col-span-8 grid sm:grid-cols-2 gap-4">
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

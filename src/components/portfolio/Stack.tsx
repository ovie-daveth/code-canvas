const groups = [
  {
    label: "Frontend",
    color: "teal",
    items: ["TypeScript", "React", "Next.js", "Tailwind", "Vite", "WebSockets", "React Native"],
  },
  {
    label: "Backend",
    color: "blue",
    items: ["Node.js", "Go", "Python", "GraphQL", "gRPC", "PostgreSQL", "Redis", "Kafka"],
  },
  {
    label: "DevOps",
    color: "amber",
    items: ["Docker", "Kubernetes", "Terraform", "GitHub Actions", "ArgoCD", "Prometheus", "Grafana"],
  },
  {
    label: "Cloud",
    color: "pink",
    items: [
       "AWS (Lambda, S3, RDS)", "GCP (Firestore, cloud functions", "Firebase", "Cloudflare", "Vercel", "Supabase"
    ],
  },
//   {
//   label: "AI / ML",
//   color: "purple",
//   items: [
//     "Python (ML workflows)",
//     "OpenAI API",
//     "Embeddings",
//     "Vector DBs",
//     "Model inference pipelines"
//   ]
// }
];

const colorMap: Record<string, string> = {
  teal: "text-teal border-teal/30 bg-teal/5",
  blue: "text-blue border-blue/30 bg-blue/5",
  amber: "text-amber border-amber/30 bg-amber/5",
  pink: "text-pink border-pink/30 bg-pink/5",
};

const Stack = () => {
  return (
    <section id="stack" className="relative py-10 border-t border-border/50">
      <div className="container">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
          <div className="space-y-4 max-w-2xl">
            <div className="section-label"><span>02 / stack</span></div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gradient">
              Tools I reach for.
            </h2>
            <p className="text-muted-foreground">
              {/* Categorized by where they live in the stack. Tool-agnostic on principle, opinionated in practice. */}
              I choose tools based on the problem—not trends—but I have strong preferences shaped by real-world systems.
            </p>
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            <span className="text-teal">$</span> stack --list --grouped
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {groups.map((g, gi) => (
            <div
              key={g.label}
              className="surface-card p-6 space-y-4 animate-fade-up"
              style={{ animationDelay: `${gi * 80}ms` }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm uppercase tracking-wider text-foreground">{g.label}</h3>
                <span className="font-mono text-xs text-muted-foreground">{g.items.length}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex flex-wrap gap-2">
                {g.items.map((item) => (
                  <span
                    key={item}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono border ${colorMap[g.color]} hover:scale-105 transition-transform cursor-default`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stack;

const roles = [
  {
    company: "Stealth Fintech",
    role: "Staff Engineer",
    period: "2023 — Present",
    location: "Remote",
    bullets: [
      "Architected ledger system processing $40M/mo with strong consistency guarantees and full audit trails.",
      "Cut deployment lead time from 4 hours to 9 minutes by rebuilding CI/CD on ephemeral preview envs.",
      "Hired and mentored 4 engineers; established an internal RFC process now used company-wide.",
    ],
  },
  {
    company: "Acuity Labs",
    role: "Senior Fullstack Engineer",
    period: "2020 — 2023",
    location: "San Francisco",
    bullets: [
      "Led migration from Rails monolith to event-driven Go services — reduced p99 by 71%.",
      "Designed multi-tenant data isolation that passed SOC 2 Type II audit with zero findings.",
      "Owned a customer-facing realtime collaboration product from MVP to 80k MAU.",
    ],
  },
  {
    company: "Northwave",
    role: "Software Engineer",
    period: "2018 — 2020",
    location: "New York",
    bullets: [
      "Built data ingestion pipelines processing 500GB/day with at-least-once delivery semantics.",
      "Championed adoption of TypeScript across the frontend org; authored the migration playbook.",
    ],
  },
];

const Experience = () => {
  return (
    <section id="experience" className="relative py-32 border-t border-border/50">
      <div className="container">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
          <div className="space-y-4 max-w-2xl">
            <div className="section-label"><span>05 / experience</span></div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gradient">
              Where I've shipped.
            </h2>
            <p className="text-muted-foreground">
              Roles ordered by recency. Outcomes over titles.
            </p>
          </div>
        </div>

        <div className="relative">
          {/* timeline line */}
          <div className="absolute left-2 top-2 bottom-2 w-px bg-border md:left-1/2 md:-translate-x-1/2" />

          <div className="space-y-10">
            {roles.map((r, i) => (
              <div
                key={r.company}
                className="relative grid md:grid-cols-2 gap-6 animate-fade-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* node */}
                <div className="absolute left-2 top-3 w-2.5 h-2.5 -translate-x-1/2 rounded-full bg-teal ring-4 ring-background md:left-1/2" />

                {/* meta side */}
                <div className={`pl-8 md:pl-0 ${i % 2 === 0 ? "md:text-right md:pr-12" : "md:order-2 md:pl-12"}`}>
                  <div className="font-mono text-xs text-teal">{r.period}</div>
                  <div className="font-mono text-xs text-muted-foreground mt-1">{r.location}</div>
                </div>

                {/* card side */}
                <div className={`pl-8 md:pl-0 ${i % 2 === 0 ? "md:pl-12" : "md:order-1 md:pr-12"}`}>
                  <div className="surface-card p-6 space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{r.role}</h3>
                      <div className="font-mono text-sm text-teal">{r.company}</div>
                    </div>
                    <ul className="space-y-2">
                      {r.bullets.map((b) => (
                        <li key={b} className="text-sm text-muted-foreground flex gap-2 leading-relaxed">
                          <span className="text-teal mt-1.5 w-1 h-1 rounded-full bg-teal flex-shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
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

export default Experience;

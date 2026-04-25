const roles = [
  {
  company: "Independent",
  role: "Software Engineer (AI Systems)",
  period: "2024 - Present",
  location: "Remote",
  bullets: [
    "Designed and built AI-powered applications integrating LLM APIs into production-ready systems.",
    "Implemented backend services to handle prompt orchestration, response streaming, and usage optimization.",
    "Developed retrieval-augmented workflows using embeddings and vector search for context-aware responses.",
    "Focused on performance, cost efficiency, and reliability when deploying AI features at scale.",
  ],
},
  {
    company: "PremiumTrust Bank",
    role: "Software Engineer",
    period: "2023 - Present",
    location: "Onsite",
    bullets: [
      "Built and maintained high-performance C# APIs using .NET, supporting core banking workflows and transaction processing.",
      "Translated Figma designs into production-ready web applications using Angular, React, and Next.js, ensuring consistency across platforms.",
      "Designed and documented internal engineering workflows and system behaviors to improve maintainability and onboarding efficiency.",
      "Collaborated with cross-functional teams to design automation workflows that improved delivery speed and reduced manual overhead.",
      "Contributed to end-to-end delivery of banking products, from requirements to deployment, within strict timelines.",
    ],
  },
  {
    company: "JustDeal Int. Ltd",
    role: "Frontend Engineer",
    period: "2022 - 2023",
    location: "Remote",
    bullets: [
      "Developed a full e-commerce frontend from Figma to production within one month, delivering a responsive and performant user experience.",
      "Integrated backend services using TanStack Query, optimizing data fetching, caching, and state synchronization.",
      "Worked closely with stakeholders to iterate on product design, ensuring alignment between business goals and UI implementation.",
      "Maintained and debugged production issues, improving stability and overall user experience.",
    ],
  },
  {
    company: "SwiftMall Inc",
    role: "Junior Frontend Developer",
    period: "2021 - 2022",
    location: "Remote",
    bullets: [
      "Implemented core frontend features for an e-commerce platform, focusing on usability and responsive design.",
      "Resolved UI bugs and improved code quality within an evolving codebase.",
      "Collaborated with backend engineers to integrate APIs and ensure reliable data flow across the application.",
    ],
  },
];

const Experience = () => {
  return (
    <section id="experience" className="relative py-10 border-t border-border/50">
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
          <div className="absolute left-2 top-2 bottom-2 w-px bg-border md:left-1/2 md:-translate-x-1/2" />

          <div className="space-y-10">
            {roles.map((r, i) => (
              <div
                key={r.company}
                className="relative grid md:grid-cols-2 gap-6 animate-fade-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="absolute left-2 top-3 w-2.5 h-2.5 -translate-x-1/2 rounded-full bg-teal ring-4 ring-background md:left-1/2" />

                <div className={`pl-8 md:pl-0 ${i % 2 === 0 ? "md:text-right md:pr-12" : "md:order-2 md:pl-12"}`}>
                  <div className="font-mono text-xs text-teal">{r.period}</div>
                  <div className="font-mono text-xs text-muted-foreground mt-1">{r.location}</div>
                </div>

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

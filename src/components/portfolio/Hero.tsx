import { ArrowRight, Mail, Github } from "lucide-react";

const Hero = () => {
  return (
    <section id="top" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Animated grid + scan line */}
      <div className="absolute inset-0 grid-overlay opacity-40 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal/40 to-transparent"
          style={{ animation: "scan 8s linear infinite" }}
        />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative z-10 grid lg:grid-cols-12 gap-8 items-center py-20">
        {/* Left: Text */}
        <div className="lg:col-span-7 space-y-8 animate-fade-up">
          <div className="section-label">
            <span>system.online</span>
          </div>

          <div className="space-y-3">
            <p className="font-mono text-sm text-muted-foreground">
              <span className="text-teal">$</span> whoami
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
              <span className="text-gradient">Ovie David.</span>
              <br />
              <span className="text-foreground">Fullstack</span>{" "}
              <span className="text-gradient-accent">Engineer</span>
            </h1>
          </div>

          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
            I build <span className="text-foreground font-medium">scalable distributed systems</span> and {" "}
            <span className="text-foreground font-medium">AI-powered developer-first </span> products. Currently architecting low-latency platforms and exploring applied AI that {" "}
            <span className="text-teal">in production systems.</span>
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#projects"
              className="group inline-flex items-center gap-2 px-5 py-3 bg-teal text-primary-foreground font-medium rounded-md hover:bg-teal-glow transition-all hover:shadow-[0_0_24px_hsl(var(--teal)/0.4)]"
            >
              View Projects
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-5 py-3 border border-border text-foreground font-medium rounded-md hover:border-teal/40 hover:bg-surface transition-all"
            >
              <Mail size={16} />
              Contact
            </a>
            <a
              href="https://github.com/ovie-daveth"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center w-11 h-11 border border-border rounded-md text-muted-foreground hover:text-foreground hover:border-teal/40 transition-all"
              aria-label="GitHub"
            >
              <Github size={16} />
            </a>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border max-w-md">
            {[
              { v: "6+", l: "Years" },
              { v: "20+", l: "Projects" },
              { v: "99.9%", l: "Uptime" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-2xl font-bold text-foreground font-mono">{s.v}</div>
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Terminal card */}
        <div className="lg:col-span-5 animate-fade-up" style={{ animationDelay: "150ms" }}>
          <div className="surface-card overflow-hidden shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-elevated">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-green/70" />
              </div>
              <div className="flex-1 text-center font-mono text-xs text-muted-foreground">
                ~/portfolio — zsh
              </div>
            </div>
            <div className="p-5 font-mono text-sm space-y-2 leading-relaxed">
              <div>
                <span className="text-teal">➜</span> <span className="text-blue">~</span> cat profile.json
              </div>
              <div className="pl-2 text-muted-foreground">
                <span className="text-foreground">{"{"}</span>
                <div className="pl-4 space-y-1">
                  <div>
                    <span className="text-pink">"role"</span>: <span className="text-green">"Fullstack Engineer"</span>,
                  </div>
                  <div>
                    <span className="text-pink">"location"</span>: <span className="text-green">"Remote / SF"</span>,
                  </div>
                  <div>
                    <span className="text-pink">"focus"</span>: <span className="text-amber">[</span>
                    <div className="pl-4 text-green">
                      "distributed-systems",<br />
                      "developer-tools",<br />
                      "performance"
                    </div>
                    <span className="text-amber">]</span>,
                  </div>
                  <div>
                    <span className="text-pink">"status"</span>: <span className="text-teal">"open-to-work"</span>
                  </div>
                </div>
                <span className="text-foreground">{"}"}</span>
              </div>
              <div className="pt-2">
                <span className="text-teal">➜</span> <span className="text-blue">~</span>{" "}
                <span className="terminal-cursor"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

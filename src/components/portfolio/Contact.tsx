import { useState } from "react";
import { Github, Linkedin, Mail, Send, Check } from "lucide-react";
import { toast } from "sonner";

const links = [
  { icon: Github, label: "github.com/ovie-daveth", href: "https://github.com/ovie-daveth" },
  { icon: Linkedin, label: "linkedin.com/in/omokefe-ovie", href: "https://linkedin.com/in/omokefe-ovie" },
  { icon: Mail, label: "ovie@ovie.dev", href: "mailto:oviedavid77@gmail.com" },
];

const Contact = () => {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSent(true);
    toast.success("Message queued — I'll reply within 24h.");
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <section id="contact" className="relative py-10 border-t border-border/50">
      <div className="container">
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5 space-y-6">
            <div className="section-label"><span>06 / contact</span></div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gradient">
              Let's build something.
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              I'm available for senior and staff-level fullstack roles, technical advisory, and short-term
              architecture engagements. Async-friendly across timezones.
            </p>
            <div className="space-y-3 pt-4">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="w-9 h-9 flex items-center justify-center border border-border rounded-md group-hover:border-teal/40 group-hover:text-teal transition-colors">
                    <l.icon size={15} />
                  </span>
                  <span className="font-mono">{l.label}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7">
            <form onSubmit={onSubmit} className="surface-card p-6 md:p-8 space-y-5">
              {/* <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  POST /api/v1/contact
                </div>
                <span className="font-mono text-xs text-teal">draft</span>
              </div> */}

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    name
                  </label>
                  <input
                    required
                    placeholder="Jane Doe"
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/30 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    email
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="jane@company.com"
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/30 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  subject
                </label>
                <input
                  required
                  placeholder="Staff engineer role / technical advisory / ..."
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/30 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  message
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Tell me about the system, the team, and the problem..."
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/30 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || sent}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-teal text-primary-foreground font-medium rounded-md hover:bg-teal-glow transition-colors disabled:opacity-60"
              >
                {sent ? (
                  <>
                    <Check size={16} /> Message sent
                  </>
                ) : loading ? (
                  "Sending..."
                ) : (
                  <>
                    <Send size={16} /> Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <footer className="mt-24 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs text-muted-foreground">
          <div>
            © 2025 Ovie David · Built with <span className="text-teal">React</span> &{" "}
            <span className="text-teal">TypeScript</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
            All systems operational
          </div>
        </footer>
      </div>
    </section>
  );
};

export default Contact;

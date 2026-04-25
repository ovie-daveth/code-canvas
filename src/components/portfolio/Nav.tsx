import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const navItems = [
  { id: "about", label: "About" },
  { id: "stack", label: "Stack" },
  { id: "projects", label: "Projects" },
  { id: "playground", label: "Playground" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
];

const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-md border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="container flex h-16 items-center justify-between">
        <a href="#top" className="flex items-center gap-2 font-mono text-sm font-semibold">
          <span className="inline-block w-2 h-2 rounded-full bg-teal animate-pulse" />
          <span className="text-foreground">alex.dev</span>
          <span className="text-muted-foreground">/~</span>
        </a>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item, i) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="group px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
            >
              <span className="text-teal mr-1.5">0{i + 1}.</span>
              {item.label}
            </a>
          ))}
        </nav>

        <a
          href="#contact"
          className="hidden md:inline-flex items-center gap-2 px-4 py-1.5 text-xs font-mono font-medium border border-teal/40 text-teal rounded-md hover:bg-teal/10 transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
          Available
        </a>

        <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-foreground" aria-label="Toggle menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
          <nav className="container py-4 flex flex-col gap-2">
            {navItems.map((item, i) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground font-mono"
              >
                <span className="text-teal mr-2">0{i + 1}.</span>
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Nav;

import { FormEvent, useMemo, useRef, useState } from "react";
import { Bot, ExternalLink, Maximize2, MessageCircle, Send, X } from "lucide-react";
import { projects, type Project } from "@/data/projects";

type ChatLink = {
  label: string;
  href: string;
};

type Message = {
  id: number;
  role: "assistant" | "user";
  text: string;
  links?: ChatLink[];
};

const experience = [
  {
    role: "Software Engineer",
    company: "PremiumTrust Bank",
    period: "2023 - Present",
    location: "Onsite",
    summary:
      "delivers C#/.NET APIs, converts Figma designs into Angular, React.js, and Next.js applications, documents engineering processes, and builds automation workflows.",
  },
  {
    role: "Frontend Engineer",
    company: "JustDeal Int. Ltd",
    period: "2022 - 2023",
    location: "Remote",
    summary:
      "built a production e-commerce web application from Figma within one month, collaborated with stakeholders, integrated backend endpoints with TanStack Query, and maintained the codebase.",
  },
  {
    role: "Junior Frontend Developer / Graphic Designer",
    company: "SwiftMall Inc",
    period: "2023 - Present",
    location: "Remote",
    summary:
      "designs SwiftMall's e-commerce UI, creates weekly social media graphics, and fixes frontend bugs across the website.",
  },
];

const stackGroups = [
  "Frontend: TypeScript, React, Next.js, Tailwind, Vite, WebSockets, React Native.",
  "Backend: Node.js, Go, Python, GraphQL, gRPC, PostgreSQL, Redis, Kafka.",
  "DevOps: Docker, Kubernetes, Terraform, GitHub Actions, ArgoCD, Prometheus, Grafana.",
  "Cloud: AWS, GCP, Firebase, Cloudflare, Vercel, Supabase.",
];

const starterPrompts = [
  "Show me your API projects",
  "Send me the EdgeCache link",
  "What experience do you have?",
];

const projectHref = (project: Project) => `/projects#project-${project.id}`;

const projectLinks = (project: Project): ChatLink[] => [
  { label: `Open ${project.name}`, href: projectHref(project) },
  ...(project.demo && project.demo !== "#" ? [{ label: "Live demo", href: project.demo }] : []),
  ...(project.repo && project.repo !== "#" ? [{ label: "Repository", href: project.repo }] : []),
];

const findProjects = (query: string) => {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter(Boolean);

  return projects.filter((project) => {
    const haystack = [
      project.id,
      project.name,
      project.tagline,
      project.description ?? "",
      project.primaryCategory,
      ...project.categories,
      ...project.stack,
    ]
      .join(" ")
      .toLowerCase();

    return terms.some((term) => haystack.includes(term));
  });
};

const formatProjectList = (items: Project[]) =>
  items
    .slice(0, 4)
    .map((project) => `${project.name}: ${project.tagline}`)
    .join("\n");

const answerQuestion = (rawQuestion: string): Omit<Message, "id" | "role"> => {
  const question = rawQuestion.trim();
  const normalized = question.toLowerCase();
  const wantsLink = /\b(link|open|show|send|bring|url|demo|repo|repository|project)\b/.test(normalized);
  const wantsApi = /\b(api|backend|endpoint|test)\b/.test(normalized);
  const wantsExperience = /\b(experience|work|job|role|company|premiumtrust|justdeal|swiftmall|onsite|remote)\b/.test(normalized);
  const wantsStack = /\b(stack|skill|tool|technology|tech|frontend|backend|cloud|devops)\b/.test(normalized);
  const wantsContact = /\b(contact|email|hire|available|reach|linkedin|github)\b/.test(normalized);

  const matchedProjects = findProjects(question);

  if (wantsExperience) {
    return {
      text: experience
        .map(
          (item) =>
            `${item.role} at ${item.company} (${item.period}, ${item.location}): ${item.summary}`,
        )
        .join("\n\n"),
      links: [{ label: "Jump to experience", href: "/#experience" }],
    };
  }

  if (matchedProjects.length > 0 && wantsLink) {
    const target = matchedProjects[0];
    return {
      text: `Here is ${target.name}. ${target.tagline}`,
      links: projectLinks(target),
    };
  }

  if (wantsApi) {
    const apiProjects = (matchedProjects.length ? matchedProjects : projects).filter((project) => project.hasApi);
    return {
      text: apiProjects.length
        ? `These portfolio projects have API surfaces you can test:\n${formatProjectList(apiProjects)}`
        : "I could not find an API-enabled project matching that question, but the projects archive has the full list.",
      links: apiProjects.slice(0, 4).flatMap(projectLinks),
    };
  }

  if (matchedProjects.length > 0) {
    return {
      text: formatProjectList(matchedProjects),
      links: matchedProjects.slice(0, 3).flatMap(projectLinks),
    };
  }

  if (wantsStack) {
    return {
      text: `The portfolio highlights this stack:\n${stackGroups.join("\n")}`,
      links: [{ label: "Jump to stack", href: "/#stack" }],
    };
  }

  if (wantsContact) {
    return {
      text: "You can reach Ovie by email, LinkedIn, or GitHub. The contact section also has a message form.",
      links: [
        { label: "Email Ovie", href: "mailto:oviedavid77@gmail.com" },
        { label: "LinkedIn", href: "https://linkedin.com/in/omokefe-ovie" },
        { label: "GitHub", href: "https://github.com/ovie-daveth" },
        { label: "Contact section", href: "/#contact" },
      ],
    };
  }

  return {
    text:
      "I can answer questions about Ovie's projects, API-enabled work, experience, stack, and contact links. Try asking for a specific project link, like 'send me the EdgeCache link'.",
    links: [
      { label: "Projects", href: "/projects" },
      { label: "Experience", href: "/#experience" },
      { label: "Contact", href: "/#contact" },
    ],
  };
};

const PortfolioChat = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      text: "Ask me anything about this portfolio. I can find projects, explain experience, list the stack, or bring you a project link.",
    },
  ]);
  const nextId = useRef(2);

  const visibleMessages = useMemo(() => messages.slice(-8), [messages]);

  const ask = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed) return;

    const userMessage: Message = { id: nextId.current++, role: "user", text: trimmed };
    const answer = answerQuestion(trimmed);
    const assistantMessage: Message = {
      id: nextId.current++,
      role: "assistant",
      ...answer,
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput("");
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    ask(input);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[60]">
      {open && (
        <div className="mb-3 flex h-[min(620px,calc(100vh-120px))] w-[min(390px,calc(100vw-40px))] flex-col overflow-hidden rounded-md border border-border bg-background shadow-[var(--shadow-card)]">
          <header className="flex items-center justify-between border-b border-border bg-surface-elevated px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-teal/10 text-teal">
                <Bot size={18} />
              </span>
              <div>
                <div className="font-mono text-sm font-semibold text-foreground">Portfolio Chat</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  local knowledge base
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <a
                href="/projects"
                className="rounded p-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                aria-label="Open projects"
              >
                <Maximize2 size={15} />
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                aria-label="Close portfolio chat"
              >
                <X size={15} />
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {visibleMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-md border px-3 py-2 text-sm leading-6 ${
                    message.role === "user"
                      ? "border-teal/40 bg-teal/10 text-foreground"
                      : "border-border bg-surface text-muted-foreground"
                  }`}
                >
                  <p className="whitespace-pre-line">{message.text}</p>
                  {message.links && message.links.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.links.map((link) => (
                        <a
                          key={`${message.id}-${link.label}-${link.href}`}
                          href={link.href}
                          className="inline-flex items-center gap-1.5 rounded border border-teal/40 px-2 py-1 font-mono text-[11px] text-teal transition-colors hover:bg-teal/10"
                        >
                          {link.label}
                          <ExternalLink size={11} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => ask(prompt)}
                  className="rounded border border-border px-2 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-teal/40 hover:text-teal"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form onSubmit={onSubmit} className="flex items-center gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about a project, role, or link..."
                className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal/50 focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-teal text-primary-foreground transition-colors hover:bg-teal-glow"
                aria-label="Ask portfolio chat"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="group flex h-14 w-14 items-center justify-center rounded-full border border-teal/40 bg-teal text-primary-foreground shadow-[0_0_24px_hsl(var(--teal)/0.28)] transition-all hover:bg-teal-glow"
        aria-label={open ? "Close portfolio chat" : "Open portfolio chat"}
      >
        {open ? <X size={22} /> : <MessageCircle size={23} />}
      </button>
    </div>
  );
};

export default PortfolioChat;

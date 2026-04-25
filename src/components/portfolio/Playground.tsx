import { useState } from "react";
import { Play, Loader2, Copy, Check } from "lucide-react";

type Endpoint = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  summary: string;
  params?: { name: string; in: "query" | "path" | "body"; type: string; example: string }[];
  responses: Record<string, unknown>;
  status: number;
  latency: number;
};

const endpoints: Endpoint[] = [
  {
    method: "GET",
    path: "/api/v1/profile",
    summary: "Returns the engineer profile object",
    responses: {
      name: "Alex Chen",
      title: "Fullstack Engineer",
      yearsExperience: 7,
      location: "San Francisco, CA",
      availability: "open-to-work",
    },
    status: 200,
    latency: 42,
  },
  {
    method: "GET",
    path: "/api/v1/skills",
    summary: "List skills filtered by category",
    params: [{ name: "category", in: "query", type: "string", example: "backend" }],
    responses: {
      category: "backend",
      count: 9,
      items: ["Node.js", "Go", "Python", "Rust", "GraphQL", "gRPC", "PostgreSQL", "Redis", "Kafka"],
    },
    status: 200,
    latency: 28,
  },
  {
    method: "POST",
    path: "/api/v1/contact",
    summary: "Send a message — routes to inbox",
    params: [
      { name: "email", in: "body", type: "string", example: "you@company.com" },
      { name: "message", in: "body", type: "string", example: "Let's build something." },
    ],
    responses: { ok: true, id: "msg_a8f3k29d", queuedAt: "2025-04-25T10:14:22Z" },
    status: 201,
    latency: 89,
  },
  {
    method: "GET",
    path: "/api/v1/projects/{id}",
    summary: "Fetch a single project by id",
    params: [{ name: "id", in: "path", type: "string", example: "edge-cache" }],
    responses: {
      id: "edge-cache",
      name: "EdgeCache",
      stack: ["Go", "Redis", "Cloudflare Workers"],
      metrics: { p99_read_ms: 0.8, regions: 14, qps: 240000 },
    },
    status: 200,
    latency: 51,
  },
];

const methodColors: Record<string, string> = {
  GET: "text-teal bg-teal/10 border-teal/30",
  POST: "text-green bg-green/10 border-green/30",
  PUT: "text-amber bg-amber/10 border-amber/30",
  DELETE: "text-destructive bg-destructive/10 border-destructive/30",
};

const Playground = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [respMeta, setRespMeta] = useState<{ status: number; ms: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const active = endpoints[activeIdx];

  const send = async () => {
    setLoading(true);
    setResponse(null);
    const ms = active.latency + Math.floor(Math.random() * 30);
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
    setResponse(JSON.stringify(active.responses, null, 2));
    setRespMeta({ status: active.status, ms });
    setLoading(false);
  };

  const copy = () => {
    if (!response) return;
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section id="playground" className="relative py-10 border-t border-border/50">
      <div className="container">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
          <div className="space-y-4 max-w-2xl">
            <div className="section-label"><span>04 / playground</span></div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gradient">
              Try the API.
            </h2>
            <p className="text-muted-foreground">
              A live, in-browser API explorer. Pick an endpoint, send the request, inspect the response.
              Inspired by Swagger — built as a first-class part of this site.
            </p>
          </div>
          <div className="font-mono text-xs text-muted-foreground space-y-1">
            <div><span className="text-green">●</span> api.alex.dev — operational</div>
            <div className="text-right">v1.4.2 · 99.98% uptime</div>
          </div>
        </div>

        <div className="surface-card overflow-hidden shadow-[var(--shadow-card)]">
          <div className="grid lg:grid-cols-12 min-h-[560px]">
            {/* Sidebar: endpoints */}
            <aside className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-border bg-surface-elevated">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Endpoints
                </div>
                <span className="font-mono text-xs text-teal">{endpoints.length}</span>
              </div>
              <div className="p-2">
                {endpoints.map((ep, i) => (
                  <button
                    key={ep.path}
                    onClick={() => {
                      setActiveIdx(i);
                      setResponse(null);
                      setRespMeta(null);
                    }}
                    className={`w-full text-left p-3 rounded-md transition-all flex items-start gap-3 ${
                      activeIdx === i ? "bg-background" : "hover:bg-background/50"
                    }`}
                  >
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded border ${methodColors[ep.method]} flex-shrink-0`}
                    >
                      {ep.method}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-xs text-foreground truncate">{ep.path}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">{ep.summary}</div>
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            {/* Main: request/response */}
            <div className="lg:col-span-8 flex flex-col">
              {/* URL bar */}
              <div className="flex items-center gap-2 px-5 py-4 border-b border-border bg-background/40">
                <span
                  className={`px-2 py-1 text-xs font-mono font-semibold rounded border ${methodColors[active.method]}`}
                >
                  {active.method}
                </span>
                <code className="flex-1 font-mono text-sm text-foreground truncate">
                  https://api.alex.dev{active.path}
                </code>
                <button
                  onClick={send}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal text-primary-foreground text-sm font-medium rounded-md hover:bg-teal-glow transition-colors disabled:opacity-60"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  Send
                </button>
              </div>

              {/* Params */}
              <div className="px-5 py-4 border-b border-border">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
                  Parameters
                </div>
                {active.params && active.params.length > 0 ? (
                  <div className="space-y-2">
                    {active.params.map((p) => (
                      <div key={p.name} className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-4 font-mono text-sm">
                          <span className="text-foreground">{p.name}</span>
                          <span className="text-muted-foreground"> ({p.in})</span>
                        </div>
                        <input
                          defaultValue={p.example}
                          className="col-span-8 px-3 py-1.5 bg-background border border-border rounded font-mono text-sm text-foreground focus:outline-none focus:border-teal/50"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground font-mono">// no parameters required</p>
                )}
              </div>

              {/* Response */}
              <div className="flex-1 flex flex-col">
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Response
                    </div>
                    {respMeta && (
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span
                          className={`px-1.5 py-0.5 rounded border ${
                            respMeta.status < 300 ? "text-green border-green/30 bg-green/10" : "text-amber border-amber/30 bg-amber/10"
                          }`}
                        >
                          {respMeta.status} OK
                        </span>
                        <span className="text-muted-foreground">{respMeta.ms}ms</span>
                      </div>
                    )}
                  </div>
                  {response && (
                    <button
                      onClick={copy}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? "copied" : "copy"}
                    </button>
                  )}
                </div>
                <div className="flex-1 p-5 bg-background/40 font-mono text-sm overflow-auto min-h-[200px]">
                  {loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 size={14} className="animate-spin text-teal" />
                      waiting for response...
                    </div>
                  ) : response ? (
                    <pre className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{response}</pre>
                  ) : (
                    <div className="text-muted-foreground">
                      <span className="text-teal">{">"}</span> Press <span className="text-foreground">Send</span> to execute the request.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Playground;

import { useMemo, useState } from "react";
import { Check, Copy, Loader2, Play, Terminal } from "lucide-react";
import type { Project } from "@/data/projects";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Endpoint = {
  method: "GET" | "POST";
  path: string;
  summary: string;
  params?: { name: string; in: "query" | "path" | "body"; type: string; example: string }[];
  response: unknown;
  status: number;
  latency: number;
};

const methodColors: Record<Endpoint["method"], string> = {
  GET: "text-teal bg-teal/10 border-teal/30",
  POST: "text-green bg-green/10 border-green/30",
};

const createEndpoints = (project: Project): Endpoint[] => {
  const basePath = project.apiEndpoint ?? `/api/v1/projects/${project.id}`;

  return [
    {
      method: "GET",
      path: basePath,
      summary: `Fetch ${project.name} service status and headline metrics`,
      response: {
        id: project.id,
        name: project.name,
        status: project.status,
        metric: project.metric,
        stack: project.stack,
      },
      status: 200,
      latency: 38,
    },
    {
      method: "GET",
      path: `${basePath}/health`,
      summary: "Inspect uptime, region health, and dependency state",
      response: {
        ok: true,
        service: project.id,
        uptime: "99.98%",
        regions: ["iad", "lhr", "sfo"],
        dependencies: project.stack.slice(0, 3).map((item) => ({ name: item, state: "healthy" })),
      },
      status: 200,
      latency: 24,
    },
    {
      method: "POST",
      path: `${basePath}/query`,
      summary: "Run a sample request against the project API",
      params: [{ name: "query", in: "body", type: "string", example: "latest metrics" }],
      response: {
        ok: true,
        requestId: `req_${project.id.replace(/-/g, "_")}_8f3k`,
        result: project.tagline,
      },
      status: 201,
      latency: 82,
    },
  ];
};

const getEndpointUrl = (path: string) =>
  /^https?:\/\//i.test(path) ? path : `https://api.portfolio.dev${path}`;

type ApiPlaygroundModalProps = {
  project: Project;
  triggerClassName?: string;
};

const ApiPlaygroundModal = ({ project, triggerClassName }: ApiPlaygroundModalProps) => {
  const endpoints = useMemo(() => createEndpoints(project), [project]);
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
    await new Promise((resolve) => setTimeout(resolve, 450 + Math.random() * 350));
    setResponse(JSON.stringify(active.response, null, 2));
    setRespMeta({ status: active.status, ms });
    setLoading(false);
  };

  const copy = async () => {
    if (!response) return;
    await navigator.clipboard.writeText(response);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog
      onOpenChange={() => {
        setResponse(null);
        setRespMeta(null);
      }}
    >
      <DialogTrigger asChild>
        <button type="button" className={triggerClassName}>
          <Terminal size={12} />
          Test API
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden border-border bg-background p-0 shadow-[var(--shadow-card)]">
        <DialogHeader className="border-b border-border bg-surface-elevated px-5 py-4">
          <DialogTitle className="flex items-center gap-2 font-mono text-base text-foreground">
            <Terminal size={16} className="text-teal" />
            {project.name} API Playground
          </DialogTitle>
          <DialogDescription>{project.apiEndpoint ?? `/api/v1/projects/${project.id}`}</DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[calc(90vh-88px)] overflow-hidden lg:grid-cols-12">
          <aside className="border-b border-border bg-surface-elevated lg:col-span-4 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Endpoints
              </span>
              <span className="font-mono text-xs text-teal">{endpoints.length}</span>
            </div>
            <div className="space-y-1 p-2">
              {endpoints.map((ep, i) => (
                <button
                  key={`${ep.method}-${ep.path}`}
                  type="button"
                  onClick={() => {
                    setActiveIdx(i);
                    setResponse(null);
                    setRespMeta(null);
                  }}
                  className={`flex w-full items-start gap-3 rounded-md p-3 text-left transition-colors ${
                    activeIdx === i ? "bg-background" : "hover:bg-background/50"
                  }`}
                >
                  <span
                    className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${methodColors[ep.method]}`}
                  >
                    {ep.method}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-xs text-foreground">{ep.path}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {ep.summary}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <div className="flex min-h-[520px] flex-col lg:col-span-8">
            <div className="flex items-center gap-2 border-b border-border bg-background/40 px-5 py-4">
              <span
                className={`rounded border px-2 py-1 font-mono text-xs font-semibold ${methodColors[active.method]}`}
              >
                {active.method}
              </span>
              <code className="flex-1 truncate font-mono text-sm text-foreground">
                {getEndpointUrl(active.path)}
              </code>
              <button
                type="button"
                onClick={send}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-teal-glow disabled:opacity-60"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                Send
              </button>
            </div>

            <div className="border-b border-border px-5 py-4">
              <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Parameters
              </div>
              {active.params?.length ? (
                <div className="space-y-2">
                  {active.params.map((param) => (
                    <label key={param.name} className="grid grid-cols-12 items-center gap-3">
                      <span className="col-span-4 font-mono text-sm">
                        <span className="text-foreground">{param.name}</span>
                        <span className="text-muted-foreground"> ({param.in})</span>
                      </span>
                      <input
                        defaultValue={param.example}
                        className="col-span-8 rounded border border-border bg-background px-3 py-1.5 font-mono text-sm text-foreground focus:border-teal/50 focus:outline-none"
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <p className="font-mono text-sm text-muted-foreground">// no parameters required</p>
              )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Response
                  </span>
                  {respMeta && (
                    <span className="flex items-center gap-2 font-mono text-xs">
                      <span className="rounded border border-green/30 bg-green/10 px-1.5 py-0.5 text-green">
                        {respMeta.status} OK
                      </span>
                      <span className="text-muted-foreground">{respMeta.ms}ms</span>
                    </span>
                  )}
                </div>
                {response && (
                  <button
                    type="button"
                    onClick={copy}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? "copied" : "copy"}
                  </button>
                )}
              </div>
              <div className="min-h-[220px] flex-1 overflow-auto bg-background/40 p-5 font-mono text-sm">
                {loading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 size={14} className="animate-spin text-teal" />
                    waiting for response...
                  </div>
                ) : response ? (
                  <pre className="whitespace-pre-wrap leading-relaxed text-foreground/90">{response}</pre>
                ) : (
                  <div className="text-muted-foreground">
                    <span className="text-teal">{">"}</span> Press{" "}
                    <span className="text-foreground">Send</span> to execute the request.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiPlaygroundModal;

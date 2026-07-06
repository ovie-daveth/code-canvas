import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Server,
} from "lucide-react";
import Nav from "@/components/portfolio/Nav";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

type OpenApiParameter = {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required?: boolean;
  description?: string;
  schema?: Record<string, unknown>;
  example?: unknown;
};

type OpenApiOperation = {
  summary?: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  parameters?: OpenApiParameter[];
  requestBody?: {
    required?: boolean;
    content?: Record<string, { schema?: Record<string, unknown>; example?: unknown }>;
  };
  responses?: Record<string, { description?: string; content?: Record<string, unknown> }>;
};

type OpenApiDocument = {
  info?: { title?: string; version?: string; description?: string };
  servers?: { url: string; description?: string }[];
  paths?: Record<string, Partial<Record<HttpMethod, OpenApiOperation>>>;
  components?: { schemas?: Record<string, Record<string, unknown>> };
};

type Endpoint = {
  key: string;
  method: HttpMethod;
  path: string;
  operation: OpenApiOperation;
};

type ApiResponse = {
  ok?: boolean;
  status?: number;
  statusText?: string;
  ms?: number;
  url?: string;
  contentType?: string;
  body?: unknown;
  error?: string;
};

const methodStyles: Record<HttpMethod, string> = {
  get: "border-teal/30 bg-teal/10 text-teal",
  post: "border-green/30 bg-green/10 text-green",
  put: "border-blue/30 bg-blue/10 text-blue",
  patch: "border-amber/30 bg-amber/10 text-amber",
  delete: "border-destructive/30 bg-destructive/10 text-destructive",
};

const methodOrder: HttpMethod[] = ["get", "post", "put", "patch", "delete"];

const resolveRef = (schema: Record<string, unknown>, document: OpenApiDocument) => {
  const ref = schema.$ref;
  if (typeof ref !== "string") return schema;
  const name = ref.split("/").pop();
  return (name && document.components?.schemas?.[name]) || schema;
};

const sampleFromSchema = (
  schema: Record<string, unknown> | undefined,
  document: OpenApiDocument,
): unknown => {
  if (!schema) return {};

  const resolved = resolveRef(schema, document);
  if (resolved.example !== undefined) return resolved.example;
  if (resolved.default !== undefined) return resolved.default;

  const type = resolved.type;
  if (type === "array") {
    return [sampleFromSchema(resolved.items as Record<string, unknown>, document)];
  }

  if (type === "object" || resolved.properties) {
    const properties = (resolved.properties || {}) as Record<string, Record<string, unknown>>;
    return Object.fromEntries(
      Object.entries(properties).map(([key, value]) => [key, sampleFromSchema(value, document)]),
    );
  }

  if (type === "number" || type === "integer") return 0;
  if (type === "boolean") return false;
  return "";
};

const getRequestBodySample = (operation: OpenApiOperation, document: OpenApiDocument) => {
  const jsonBody = operation.requestBody?.content?.["application/json"];
  const sample = jsonBody?.example ?? sampleFromSchema(jsonBody?.schema, document);
  const empty =
    sample &&
    typeof sample === "object" &&
    !Array.isArray(sample) &&
    Object.keys(sample as Record<string, unknown>).length === 0;

  return empty ? "" : JSON.stringify(sample, null, 2);
};

const flattenEndpoints = (document: OpenApiDocument): Endpoint[] =>
  Object.entries(document.paths || {}).flatMap(([path, operations]) =>
    methodOrder.flatMap((method) => {
      const operation = operations?.[method];
      return operation ? [{ key: `${method}:${path}`, method, path, operation }] : [];
    }),
  );

const getSuccessResponse = (operation: OpenApiOperation) => {
  const responses = operation.responses || {};
  const key = Object.keys(responses).find((code) => code.startsWith("2")) || Object.keys(responses)[0];
  return key ? `${key} ${responses[key]?.description || ""}`.trim() : "No response documented";
};

const RecurrDocsPage = () => {
  const [document, setDocument] = useState<OpenApiDocument | null>(null);
  const [selectedKey, setSelectedKey] = useState("");
  const [query, setQuery] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [requestBody, setRequestBody] = useState("");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadDocument = async () => {
    setLoadingDocs(true);
    setError("");

    try {
      const res = await fetch("/api/recurr/openapi");
      const payload = (await res.json()) as { ok?: boolean; document?: OpenApiDocument; error?: string };
      if (!res.ok || !payload.ok || !payload.document) {
        throw new Error(payload.error || "Unable to load Recurr API documentation.");
      }
      setDocument(payload.document);
      const endpoints = flattenEndpoints(payload.document);
      setSelectedKey((current) => current || endpoints[0]?.key || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load Recurr API documentation.");
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadDocument();
  }, []);

  const endpoints = useMemo(() => (document ? flattenEndpoints(document) : []), [document]);
  const filteredEndpoints = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return endpoints;
    return endpoints.filter((endpoint) =>
      [
        endpoint.method,
        endpoint.path,
        endpoint.operation.summary,
        endpoint.operation.description,
        ...(endpoint.operation.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [endpoints, query]);

  const active = endpoints.find((endpoint) => endpoint.key === selectedKey) || endpoints[0];
  const pathParams = active?.operation.parameters?.filter((param) => param.in === "path") || [];
  const queryParams = active?.operation.parameters?.filter((param) => param.in === "query") || [];

  useEffect(() => {
    if (!active || !document) return;

    const nextParams: Record<string, string> = {};
    [...pathParams, ...queryParams].forEach((param) => {
      const example = param.example ?? param.schema?.example ?? param.schema?.default ?? "";
      nextParams[param.name] = String(example);
    });

    setParamValues(nextParams);
    setRequestBody(getRequestBodySample(active.operation, document));
    setResponse(null);
  }, [active?.key, document]);

  const callEndpoint = async () => {
    if (!active) return;

    let path = active.path;
    pathParams.forEach((param) => {
      path = path.replace(`{${param.name}}`, encodeURIComponent(paramValues[param.name] || ""));
    });

    const queryPayload = Object.fromEntries(
      queryParams.map((param) => [param.name, paramValues[param.name] || ""]),
    );

    let body: unknown = undefined;
    if (requestBody.trim()) {
      try {
        body = JSON.parse(requestBody);
      } catch {
        setResponse({ ok: false, error: "Request body must be valid JSON." });
        return;
      }
    }

    setSending(true);
    setResponse(null);

    try {
      const res = await fetch("/api/recurr/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: active.method.toUpperCase(),
          path,
          query: queryPayload,
          authorization: authToken,
          body,
        }),
      });
      const payload = (await res.json()) as ApiResponse;
      setResponse(payload);
    } catch (err) {
      setResponse({
        ok: false,
        error: err instanceof Error ? err.message : "Unable to call Recurr API.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Nav />

      <section className="border-b border-border/50 pt-28 pb-8">
        <div className="container">
          <Link
            to="/projects"
            className="mb-8 inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-teal"
          >
            <ArrowLeft size={14} /> back to /projects
          </Link>

          <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="space-y-4 lg:col-span-8">
              <div className="section-label"><span>Recurr API docs</span></div>
              <h1 className="text-4xl font-bold tracking-tight text-gradient md:text-6xl">
                In-house backend docs.
              </h1>
              <p className="max-w-3xl text-muted-foreground">
                Browse the live Recurr OpenAPI contract, inspect request shapes, and call the real
                Railway backend through this portfolio.
              </p>
            </div>

            <div className="surface-card p-4 font-mono text-xs lg:col-span-4">
              <div className="mb-2 flex items-center gap-2 text-teal">
                <Server size={14} /> Live target
              </div>
              <a
                href="https://recurr-be-production.up.railway.app/api/v1"
                target="_blank"
                rel="noreferrer"
                className="break-all text-muted-foreground transition-colors hover:text-foreground"
              >
                https://recurr-be-production.up.railway.app/api/v1
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container">
          {loadingDocs ? (
            <div className="surface-card flex items-center gap-3 p-8 text-muted-foreground">
              <Loader2 size={18} className="animate-spin text-teal" />
              Loading Recurr OpenAPI document...
            </div>
          ) : error ? (
            <div className="surface-card space-y-4 p-8">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle size={18} /> {error}
              </div>
              <button
                type="button"
                onClick={loadDocument}
                className="inline-flex items-center gap-2 rounded-md border border-teal/40 px-4 py-2 font-mono text-sm text-teal transition-colors hover:bg-teal/10"
              >
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-12">
              <aside className="surface-card overflow-hidden lg:col-span-4 xl:col-span-3">
                <div className="border-b border-border p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {document?.info?.title || "Recurr API"}
                      </div>
                      <div className="mt-1 font-mono text-xs text-teal">
                        {endpoints.length} endpoints
                      </div>
                    </div>
                    <a
                      href="https://recurr-be-production.up.railway.app/api/docs/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground transition-colors hover:text-teal"
                      title="Open Swagger UI"
                    >
                      <ExternalLink size={15} />
                    </a>
                  </div>
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="search endpoints..."
                      className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 font-mono text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-teal/50"
                    />
                  </div>
                </div>

                <div className="max-h-[72vh] overflow-auto p-2">
                  {filteredEndpoints.map((endpoint) => (
                    <button
                      key={endpoint.key}
                      type="button"
                      onClick={() => setSelectedKey(endpoint.key)}
                      className={`mb-1 flex w-full items-start gap-3 rounded-md p-3 text-left transition-colors ${
                        active?.key === endpoint.key ? "bg-background" : "hover:bg-background/60"
                      }`}
                    >
                      <span
                        className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${methodStyles[endpoint.method]}`}
                      >
                        {endpoint.method}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-mono text-xs text-foreground">
                          {endpoint.path}
                        </span>
                        <span className="mt-1 block truncate text-xs text-muted-foreground">
                          {endpoint.operation.summary || "No summary"}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </aside>

              {active && (
                <section className="space-y-5 lg:col-span-8 xl:col-span-9">
                  <div className="surface-card p-5">
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded border px-2 py-1 font-mono text-xs font-semibold uppercase ${methodStyles[active.method]}`}
                      >
                        {active.method}
                      </span>
                      <code className="min-w-0 flex-1 break-all font-mono text-sm text-foreground">
                        {active.path}
                      </code>
                      <span className="rounded border border-green/30 bg-green/10 px-2 py-1 font-mono text-xs text-green">
                        {getSuccessResponse(active.operation)}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold text-foreground">
                      {active.operation.summary || active.operation.operationId || active.path}
                    </h2>
                    {active.operation.description && (
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {active.operation.description}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-5 xl:grid-cols-2">
                    <div className="surface-card p-5">
                      <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        <KeyRound size={14} /> Authorization
                      </div>
                      <input
                        value={authToken}
                        onChange={(event) => setAuthToken(event.target.value)}
                        placeholder="Paste Bearer token or sk_test_ key for protected endpoints"
                        className="w-full rounded-md border border-border bg-background px-3 py-2.5 font-mono text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-teal/50"
                      />
                    </div>

                    <div className="surface-card p-5">
                      <div className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        Parameters
                      </div>
                      {[...pathParams, ...queryParams].length ? (
                        <div className="space-y-3">
                          {[...pathParams, ...queryParams].map((param) => (
                            <label key={`${param.in}-${param.name}`} className="block">
                              <span className="mb-1 flex items-center gap-2 font-mono text-xs">
                                <span className="text-foreground">{param.name}</span>
                                <span className="text-muted-foreground">({param.in})</span>
                                {param.required && <span className="text-amber">required</span>}
                              </span>
                              <input
                                value={paramValues[param.name] || ""}
                                onChange={(event) =>
                                  setParamValues((current) => ({
                                    ...current,
                                    [param.name]: event.target.value,
                                  }))
                                }
                                className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground outline-none transition-colors focus:border-teal/50"
                              />
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="font-mono text-sm text-muted-foreground">
                          // no path or query parameters
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="surface-card overflow-hidden">
                    <div className="flex items-center justify-between border-b border-border px-5 py-4">
                      <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        Request body
                      </div>
                      <button
                        type="button"
                        onClick={callEndpoint}
                        disabled={sending}
                        className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-teal-glow disabled:opacity-60"
                      >
                        {sending ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                        Try it
                      </button>
                    </div>
                    <textarea
                      value={requestBody}
                      onChange={(event) => setRequestBody(event.target.value)}
                      placeholder="// no JSON body required"
                      className="min-h-[220px] w-full resize-y border-0 bg-background/40 p-5 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    />
                  </div>

                  <div className="surface-card overflow-hidden">
                    <div className="flex items-center justify-between border-b border-border px-5 py-4">
                      <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        Live response
                      </div>
                      {response?.status && (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 font-mono text-xs ${
                            response.ok
                              ? "border-green/30 bg-green/10 text-green"
                              : "border-destructive/30 bg-destructive/10 text-destructive"
                          }`}
                        >
                          {response.ok ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                          {response.status} {response.ms}ms
                        </span>
                      )}
                    </div>
                    <div className="min-h-[220px] overflow-auto bg-background/40 p-5">
                      {sending ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 size={14} className="animate-spin text-teal" />
                          Calling Recurr backend...
                        </div>
                      ) : response ? (
                        <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-foreground/90">
                          {JSON.stringify(response.error ? { error: response.error } : response.body, null, 2)}
                        </pre>
                      ) : (
                        <div className="font-mono text-sm text-muted-foreground">
                          <span className="text-teal">{">"}</span> Choose an endpoint and run a
                          real request.
                        </div>
                      )}
                    </div>
                    {response?.url && (
                      <div className="border-t border-border px-5 py-3 font-mono text-[11px] text-muted-foreground">
                        {response.url}
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default RecurrDocsPage;

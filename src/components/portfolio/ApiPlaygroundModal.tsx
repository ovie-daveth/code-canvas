import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Maximize2,
  Minimize2,
  Play,
  Search,
  Terminal,
} from "lucide-react";
import type { Project } from "@/data/projects";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
    description?: string;
    content?: Record<
      string,
      {
        schema?: Record<string, unknown>;
        example?: unknown;
        examples?: Record<string, { summary?: string; description?: string; value?: unknown }>;
      }
    >;
  };
  responses?: Record<string, { description?: string; content?: Record<string, unknown> }>;
};

type OpenApiDocument = {
  info?: { title?: string; version?: string; description?: string };
  servers?: { url: string; description?: string }[];
  paths?: Record<string, Partial<Record<HttpMethod, OpenApiOperation>>>;
  components?: { schemas?: Record<string, Record<string, unknown>> };
};

type LiveEndpoint = {
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

type MockEndpoint = {
  method: "GET" | "POST";
  path: string;
  summary: string;
  params?: { name: string; in: "query" | "path" | "body"; type: string; example: string }[];
  response: unknown;
  status: number;
  latency: number;
};

type ApiPlaygroundModalProps = {
  project: Project;
  triggerClassName?: string;
};

const methodOrder: HttpMethod[] = ["get", "post", "put", "patch", "delete"];

const methodColors: Record<HttpMethod | MockEndpoint["method"], string> = {
  get: "text-teal bg-teal/10 border-teal/30",
  post: "text-green bg-green/10 border-green/30",
  put: "text-blue bg-blue/10 border-blue/30",
  patch: "text-amber bg-amber/10 border-amber/30",
  delete: "text-destructive bg-destructive/10 border-destructive/30",
  GET: "text-teal bg-teal/10 border-teal/30",
  POST: "text-green bg-green/10 border-green/30",
};

const supportsLiveOpenApi = (project: Project) => project.id === "recurr";

const createMockEndpoints = (project: Project): MockEndpoint[] => {
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

const readApiJson = async <T,>(response: Response): Promise<T> => {
  const text = await response.text();

  try {
    return (text ? JSON.parse(text) : {}) as T;
  } catch {
    throw new Error(text || `Request failed with ${response.status}`);
  }
};

const resolveRef = (schema: Record<string, unknown>, document: OpenApiDocument) => {
  const ref = schema.$ref;
  if (typeof ref !== "string") return schema;
  const name = ref.split("/").pop();
  return (name && document.components?.schemas?.[name]) || schema;
};

const firstRecord = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const sampleFromSchema = (
  schema: Record<string, unknown> | undefined,
  document: OpenApiDocument,
): unknown => {
  if (!schema) return {};

  const resolved = resolveRef(schema, document);
  if (resolved.example !== undefined) return resolved.example;
  if (resolved.default !== undefined) return resolved.default;

  const oneOf = Array.isArray(resolved.oneOf) ? resolved.oneOf : undefined;
  const anyOf = Array.isArray(resolved.anyOf) ? resolved.anyOf : undefined;
  const allOf = Array.isArray(resolved.allOf) ? resolved.allOf : undefined;

  if (oneOf?.length) return sampleFromSchema(oneOf[0] as Record<string, unknown>, document);
  if (anyOf?.length) return sampleFromSchema(anyOf[0] as Record<string, unknown>, document);
  if (allOf?.length) {
    return allOf.reduce<Record<string, unknown>>((merged, item) => {
      const sample = sampleFromSchema(item as Record<string, unknown>, document);
      return sample && typeof sample === "object" && !Array.isArray(sample)
        ? { ...merged, ...(sample as Record<string, unknown>) }
        : merged;
    }, {});
  }

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

  if (Array.isArray(resolved.enum) && resolved.enum.length) return resolved.enum[0];
  if (type === "number" || type === "integer") return 0;
  if (type === "boolean") return false;
  if (resolved.format === "email") return "user@example.com";
  if (resolved.format === "uri") return "https://example.com";
  if (resolved.format === "date-time") return new Date().toISOString();
  return "";
};

const getJsonMediaEntry = (operation: OpenApiOperation) => {
  const entries = Object.entries(operation.requestBody?.content || {});
  return (
    entries.find(([type]) => type.toLowerCase().includes("application/json")) ||
    entries[0] ||
    undefined
  );
};

const getRequestExamples = (operation: OpenApiOperation) => {
  const entry = getJsonMediaEntry(operation);
  if (!entry) return [];

  const [, media] = entry;
  const examples = Object.entries(media.examples || {}).map(([key, example]) => ({
    key,
    label: example.summary || key,
    value: example.value,
  }));

  if (examples.length) return examples;
  if (media.example !== undefined) {
    return [{ key: "example", label: "Example", value: media.example }];
  }

  return [];
};

const getRequestBodySample = (operation: OpenApiOperation, document: OpenApiDocument) => {
  const examples = getRequestExamples(operation);
  const jsonBody = getJsonMediaEntry(operation)?.[1];
  const sample = examples[0]?.value ?? sampleFromSchema(jsonBody?.schema, document);
  const empty =
    sample &&
    typeof sample === "object" &&
    !Array.isArray(sample) &&
    Object.keys(sample as Record<string, unknown>).length === 0;

  return empty ? "" : JSON.stringify(sample, null, 2);
};

type SchemaField = {
  name: string;
  type: string;
  required: boolean;
  description?: string;
};

const getSchemaType = (schema: Record<string, unknown> | undefined, document: OpenApiDocument): string => {
  if (!schema) return "unknown";
  const resolved = resolveRef(schema, document);
  if (Array.isArray(resolved.enum)) return `enum: ${resolved.enum.join(" | ")}`;
  if (resolved.format && typeof resolved.type === "string") return `${resolved.type}<${resolved.format}>`;
  if (Array.isArray(resolved.oneOf)) return "oneOf";
  if (Array.isArray(resolved.anyOf)) return "anyOf";
  if (Array.isArray(resolved.allOf)) return "allOf";
  if (typeof resolved.type === "string") return resolved.type;
  if (resolved.properties) return "object";
  return "unknown";
};

const getSchemaVariants = (
  schema: Record<string, unknown> | undefined,
  document: OpenApiDocument,
): { title: string; description?: string; fields: SchemaField[] }[] => {
  if (!schema) return [];

  const resolved = resolveRef(schema, document);
  const variants = (Array.isArray(resolved.oneOf) && resolved.oneOf) ||
    (Array.isArray(resolved.anyOf) && resolved.anyOf);

  if (variants?.length) {
    return variants.flatMap((variant, index) => {
      const variantSchema = resolveRef(variant as Record<string, unknown>, document);
      return getSchemaVariants(variantSchema, document).map((item) => ({
        ...item,
        title:
          (typeof variantSchema.title === "string" && variantSchema.title) ||
          item.title ||
          `Option ${index + 1}`,
      }));
    });
  }

  const allOf = Array.isArray(resolved.allOf) ? resolved.allOf : undefined;
  if (allOf?.length) {
    const merged = allOf.reduce<Record<string, unknown>>(
      (acc, item) => {
        const part = resolveRef(item as Record<string, unknown>, document);
        return {
          ...acc,
          properties: {
            ...(firstRecord(acc.properties) || {}),
            ...(firstRecord(part.properties) || {}),
          },
          required: [...((acc.required as string[]) || []), ...((part.required as string[]) || [])],
        };
      },
      { properties: {}, required: [] },
    );
    return getSchemaVariants(merged, document);
  }

  const properties = firstRecord(resolved.properties) || {};
  const required = new Set(Array.isArray(resolved.required) ? (resolved.required as string[]) : []);
  const fields = Object.entries(properties).map(([name, value]) => {
    const fieldSchema = resolveRef(value as Record<string, unknown>, document);
    return {
      name,
      type: getSchemaType(fieldSchema, document),
      required: required.has(name),
      description: typeof fieldSchema.description === "string" ? fieldSchema.description : undefined,
    };
  });

  return [
    {
      title: typeof resolved.title === "string" ? resolved.title : "Request body",
      description: typeof resolved.description === "string" ? resolved.description : undefined,
      fields,
    },
  ];
};

const getResponseEntries = (operation: OpenApiOperation) =>
  Object.entries(operation.responses || {}).map(([code, response]) => ({
    code,
    description: response.description || "No description",
  }));

const getEndpointController = (endpoint: LiveEndpoint) =>
  endpoint.operation.tags?.[0] || "Other";

const groupEndpointsByController = (endpoints: LiveEndpoint[]) =>
  endpoints.reduce<{ controller: string; endpoints: LiveEndpoint[] }[]>((groups, endpoint) => {
    const controller = getEndpointController(endpoint);
    const existing = groups.find((group) => group.controller === controller);

    if (existing) {
      existing.endpoints.push(endpoint);
    } else {
      groups.push({ controller, endpoints: [endpoint] });
    }

    return groups;
  }, []);

const flattenEndpoints = (document: OpenApiDocument): LiveEndpoint[] =>
  Object.entries(document.paths || {}).flatMap(([path, operations]) =>
    methodOrder.flatMap((method) => {
      const operation = operations?.[method];
      return operation ? [{ key: `${method}:${path}`, method, path, operation }] : [];
    }),
  );

const MockPlayground = ({ project }: { project: Project }) => {
  const endpoints = useMemo(() => createMockEndpoints(project), [project]);
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
    <div className="grid max-h-[calc(90vh-88px)] overflow-hidden lg:grid-cols-12">
      <EndpointList
        endpoints={endpoints.map((ep, idx) => ({
          key: `${ep.method}-${ep.path}`,
          method: ep.method,
          path: ep.path,
          summary: ep.summary,
          active: idx === activeIdx,
          onClick: () => {
            setActiveIdx(idx);
            setResponse(null);
            setRespMeta(null);
          },
        }))}
      />

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

        <ResponsePanel
          loading={loading}
          response={response}
          meta={respMeta}
          copied={copied}
          onCopy={copy}
          loadingText="waiting for response..."
          emptyText="Press Send to execute the request."
        />
      </div>
    </div>
  );
};

const LiveOpenApiPlayground = ({ project }: { project: Project }) => {
  const [document, setDocument] = useState<OpenApiDocument | null>(null);
  const [selectedKey, setSelectedKey] = useState("");
  const [query, setQuery] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [requestBody, setRequestBody] = useState("");
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadDocument = async () => {
      setLoadingDocs(true);
      setError("");

      try {
        const res = await fetch("/api/recurr/openapi");
        const payload = await readApiJson<{
          ok?: boolean;
          document?: OpenApiDocument;
          error?: string;
        }>(res);

        if (!res.ok || !payload.ok || !payload.document) {
          throw new Error(payload.error || "Unable to load the live API document.");
        }

        if (cancelled) return;
        const endpoints = flattenEndpoints(payload.document);
        setDocument(payload.document);
        setSelectedKey(endpoints[0]?.key || "");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load the live API document.");
        }
      } finally {
        if (!cancelled) setLoadingDocs(false);
      }
    };

    loadDocument();
    return () => {
      cancelled = true;
    };
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
  const groupedEndpoints = useMemo(
    () => groupEndpointsByController(filteredEndpoints),
    [filteredEndpoints],
  );

  const active = endpoints.find((endpoint) => endpoint.key === selectedKey) || endpoints[0];
  const pathParams = active?.operation.parameters?.filter((param) => param.in === "path") || [];
  const queryParams = active?.operation.parameters?.filter((param) => param.in === "query") || [];
  const activeMediaEntry = active ? getJsonMediaEntry(active.operation) : undefined;
  const requestExamples = active ? getRequestExamples(active.operation) : [];
  const schemaVariants =
    active && document ? getSchemaVariants(activeMediaEntry?.[1]?.schema, document) : [];
  const responseEntries = active ? getResponseEntries(active.operation) : [];

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
          serverUrl: document?.servers?.[0]?.url,
          authorization: authToken,
          body,
        }),
      });
      const payload = await readApiJson<ApiResponse>(res);
      setResponse(payload);
    } catch (err) {
      setResponse({
        ok: false,
        error: err instanceof Error ? err.message : "Unable to call the live API.",
      });
    } finally {
      setSending(false);
    }
  };

  const copy = async () => {
    if (!response) return;
    await navigator.clipboard.writeText(JSON.stringify(response.error ? { error: response.error } : response.body, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  if (loadingDocs) {
    return (
      <div className="flex min-h-[520px] items-center justify-center gap-3 text-muted-foreground">
        <Loader2 size={18} className="animate-spin text-teal" />
        Loading live API endpoints...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[520px] items-center justify-center p-6">
        <div className="surface-card max-w-lg space-y-3 p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle size={18} /> {error}
          </div>
          <p className="text-sm text-muted-foreground">
            The modal loads the live OpenAPI JSON through this portfolio&apos;s API proxy.
          </p>
        </div>
      </div>
    );
  }

  if (!active) {
    return (
      <div className="flex min-h-[520px] items-center justify-center text-muted-foreground">
        No endpoints found for {project.name}.
      </div>
    );
  }

  return (
    <div className="grid max-h-[calc(90vh-88px)] overflow-hidden lg:grid-cols-12">
      <aside className="border-b border-border bg-surface-elevated lg:col-span-4 lg:border-b-0 lg:border-r">
        <div className="border-b border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Live endpoints
            </span>
            <span className="font-mono text-xs text-teal">{filteredEndpoints.length}</span>
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
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-teal/50"
            />
          </div>
        </div>

        <GroupedEndpointList
          groups={groupedEndpoints.map((group) => ({
            controller: group.controller,
            endpoints: group.endpoints.map((endpoint) => ({
              key: endpoint.key,
              method: endpoint.method.toUpperCase(),
              path: endpoint.path,
              summary: endpoint.operation.summary || endpoint.operation.operationId || "No summary",
              active: endpoint.key === active.key,
              onClick: () => {
                setSelectedKey(endpoint.key);
                setResponse(null);
              },
            })),
          }))}
        />
      </aside>

      <div className="flex min-h-[520px] flex-col lg:col-span-8">
        <div className="flex items-center gap-2 border-b border-border bg-background/40 px-5 py-4">
          <span
            className={`rounded border px-2 py-1 font-mono text-xs font-semibold uppercase ${methodColors[active.method]}`}
          >
            {active.method}
          </span>
          <code className="flex-1 truncate font-mono text-sm text-foreground">{active.path}</code>
          <button
            type="button"
            onClick={callEndpoint}
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-teal-glow disabled:opacity-60"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Send
          </button>
        </div>

        <div className="grid gap-4 border-b border-border p-5 xl:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <KeyRound size={13} /> Authorization
            </div>
            <input
              value={authToken}
              onChange={(event) => setAuthToken(event.target.value)}
              placeholder="Bearer token or sk_test_ key for protected endpoints"
              className="w-full rounded border border-border bg-background px-3 py-2 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-teal/50"
            />
          </div>

          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Parameters
            </div>
            {[...pathParams, ...queryParams].length ? (
              <div className="grid gap-2">
                {[...pathParams, ...queryParams].map((param) => (
                  <label key={`${param.in}-${param.name}`} className="grid grid-cols-12 items-center gap-2">
                    <span className="col-span-4 truncate font-mono text-xs text-foreground">
                      {param.name}
                    </span>
                    <input
                      value={paramValues[param.name] || ""}
                      onChange={(event) =>
                        setParamValues((current) => ({
                          ...current,
                          [param.name]: event.target.value,
                        }))
                      }
                      placeholder={param.in}
                      className="col-span-8 rounded border border-border bg-background px-3 py-1.5 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-teal/50"
                    />
                  </label>
                ))}
              </div>
            ) : (
              <p className="font-mono text-sm text-muted-foreground">// no path or query parameters</p>
            )}
          </div>
        </div>

        <div className="grid min-h-[300px] border-b border-border lg:grid-cols-2">
          <div className="flex min-h-0 flex-col border-b border-border lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Request body
              </span>
              {requestExamples.length > 0 && (
                <div className="flex flex-wrap justify-end gap-1.5">
                  {requestExamples.map((example) => (
                    <button
                      key={example.key}
                      type="button"
                      onClick={() => setRequestBody(JSON.stringify(example.value, null, 2))}
                      className="rounded border border-teal/40 px-2 py-0.5 font-mono text-[10px] text-teal transition-colors hover:bg-teal/10"
                    >
                      {example.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <textarea
              value={requestBody}
              onChange={(event) => setRequestBody(event.target.value)}
              placeholder="// no JSON body required"
              className="min-h-[240px] flex-1 resize-none bg-background/40 p-5 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <ResponsePanel
            loading={sending}
            response={response ? JSON.stringify(response.error ? { error: response.error } : response.body, null, 2) : null}
            meta={response?.status ? { status: response.status, ms: response.ms || 0 } : null}
            copied={copied}
            onCopy={copy}
            loadingText="calling live backend..."
            emptyText="Edit the request body, then press Send."
            footer={response?.url}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-5">
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-background/40 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {active.operation.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-teal/30 bg-teal/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-teal"
                  >
                    {tag}
                  </span>
                ))}
                {active.operation.requestBody?.required && (
                  <span className="rounded border border-amber/30 bg-amber/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber">
                    body required
                  </span>
                )}
                {activeMediaEntry && (
                  <span className="rounded border border-border bg-surface-elevated px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {activeMediaEntry[0]}
                  </span>
                )}
              </div>

              <h3 className="text-lg font-semibold text-foreground">
                {active.operation.summary || active.operation.operationId || active.path}
              </h3>
              {(active.operation.description || active.operation.requestBody?.description) && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {active.operation.description || active.operation.requestBody?.description}
                </p>
              )}

              <div className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Documentation
              </div>
            </div>

            {schemaVariants.length > 0 && (
              <div className="grid gap-3 lg:grid-cols-2">
                {schemaVariants.map((variant, index) => (
                  <div
                    key={`${variant.title}-${index}`}
                    className="rounded-md border border-border bg-background/40 p-4"
                  >
                    <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-teal">
                      {variant.title}
                    </div>
                    {variant.description && (
                      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                        {variant.description}
                      </p>
                    )}
                    {variant.fields.length ? (
                      <div className="max-h-44 space-y-2 overflow-auto pr-1">
                        {variant.fields.map((field) => (
                          <div
                            key={field.name}
                            className="grid grid-cols-12 gap-2 border-b border-border/60 pb-2 last:border-b-0 last:pb-0"
                          >
                            <div className="col-span-5 min-w-0">
                              <div className="truncate font-mono text-xs text-foreground">
                                {field.name}
                              </div>
                              {field.required && (
                                <div className="font-mono text-[10px] text-amber">required</div>
                              )}
                            </div>
                            <div className="col-span-7 min-w-0">
                              <div className="truncate font-mono text-xs text-muted-foreground">
                                {field.type}
                              </div>
                              {field.description && (
                                <div className="line-clamp-2 text-xs text-muted-foreground">
                                  {field.description}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="font-mono text-xs text-muted-foreground">
                        // schema fields are not expanded in the OpenAPI document
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {responseEntries.length > 0 && (
              <div className="rounded-md border border-border bg-background/40 p-4">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Documented responses
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {responseEntries.map((item) => (
                    <div key={item.code} className="flex gap-2 text-xs">
                      <span
                        className={`shrink-0 rounded border px-1.5 py-0.5 font-mono ${
                          item.code.startsWith("2")
                            ? "border-green/30 bg-green/10 text-green"
                            : "border-destructive/30 bg-destructive/10 text-destructive"
                        }`}
                      >
                        {item.code}
                      </span>
                      <span className="text-muted-foreground">{item.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const EndpointList = ({
  endpoints,
}: {
  endpoints: {
    key: string;
    method: string;
    path: string;
    summary: string;
    active: boolean;
    onClick: () => void;
  }[];
}) => (
  <div className="max-h-[72vh] space-y-1 overflow-auto p-2">
    {endpoints.map((ep) => (
      <button
        key={ep.key}
        type="button"
        onClick={ep.onClick}
        className={`flex w-full items-start gap-3 rounded-md p-3 text-left transition-colors ${
          ep.active ? "bg-background" : "hover:bg-background/50"
        }`}
      >
        <span
          className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${
            methodColors[ep.method.toLowerCase() as HttpMethod] || methodColors[ep.method as MockEndpoint["method"]]
          }`}
        >
          {ep.method}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-mono text-xs text-foreground">{ep.path}</span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{ep.summary}</span>
        </span>
      </button>
    ))}
  </div>
);

const GroupedEndpointList = ({
  groups,
}: {
  groups: {
    controller: string;
    endpoints: {
      key: string;
      method: string;
      path: string;
      summary: string;
      active: boolean;
      onClick: () => void;
    }[];
  }[];
}) => (
  <div className="max-h-[72vh] space-y-3 overflow-auto p-2">
    {groups.length ? (
      groups.map((group) => (
        <section key={group.controller} className="space-y-1">
          <div className="sticky top-0 z-10 flex items-center justify-between rounded bg-surface-elevated/95 px-2 py-2 backdrop-blur">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {group.controller}
            </span>
            <span className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-teal">
              {group.endpoints.length}
            </span>
          </div>
          {group.endpoints.map((ep) => (
            <button
              key={ep.key}
              type="button"
              onClick={ep.onClick}
              className={`flex w-full items-start gap-3 rounded-md p-3 text-left transition-colors ${
                ep.active ? "bg-background" : "hover:bg-background/50"
              }`}
            >
              <span
                className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${
                  methodColors[ep.method.toLowerCase() as HttpMethod] ||
                  methodColors[ep.method as MockEndpoint["method"]]
                }`}
              >
                {ep.method}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-mono text-xs text-foreground">
                  {ep.path}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {ep.summary}
                </span>
              </span>
            </button>
          ))}
        </section>
      ))
    ) : (
      <div className="p-4 font-mono text-xs text-muted-foreground">
        // no endpoints matched
      </div>
    )}
  </div>
);

const ResponsePanel = ({
  loading,
  response,
  meta,
  copied,
  onCopy,
  loadingText,
  emptyText,
  footer,
}: {
  loading: boolean;
  response: string | null;
  meta: { status: number; ms: number } | null;
  copied: boolean;
  onCopy: () => void;
  loadingText: string;
  emptyText: string;
  footer?: string;
}) => (
  <div className="flex min-h-0 flex-1 flex-col">
    <div className="flex items-center justify-between border-b border-border px-5 py-3">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Response
        </span>
        {meta && (
          <span className="flex items-center gap-2 font-mono text-xs">
            <span
              className={`rounded border px-1.5 py-0.5 ${
                meta.status >= 200 && meta.status < 300
                  ? "border-green/30 bg-green/10 text-green"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              }`}
            >
              {meta.status}
            </span>
            <span className="text-muted-foreground">{meta.ms}ms</span>
          </span>
        )}
      </div>
      {response && (
        <button
          type="button"
          onClick={onCopy}
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
          {loadingText}
        </div>
      ) : response ? (
        <pre className="whitespace-pre-wrap break-words leading-relaxed text-foreground/90">
          {response}
        </pre>
      ) : (
        <div className="text-muted-foreground">
          <span className="text-teal">{">"}</span> {emptyText}
        </div>
      )}
    </div>
    {footer && (
      <div className="border-t border-border px-5 py-3 font-mono text-[11px] text-muted-foreground">
        {footer}
      </div>
    )}
  </div>
);

const ApiPlaygroundModal = ({ project, triggerClassName }: ApiPlaygroundModalProps) => {
  const liveOpenApi = supportsLiveOpenApi(project);
  const [expanded, setExpanded] = useState(false);

  return (
    <Dialog onOpenChange={(open) => !open && setExpanded(false)}>
      <DialogTrigger asChild>
        <button type="button" className={triggerClassName}>
          <Terminal size={12} />
          Test API
        </button>
      </DialogTrigger>
      <DialogContent
        className={`overflow-hidden border-border bg-background p-0 shadow-[var(--shadow-card)] ${
          expanded
            ? "h-screen max-h-screen w-screen max-w-none rounded-none sm:rounded-none"
            : "max-h-[90vh] max-w-6xl"
        }`}
      >
        <DialogHeader className="relative border-b border-border bg-surface-elevated px-5 py-4 pr-24">
          <div>
            <DialogTitle className="flex items-center gap-2 font-mono text-base text-foreground">
              <Terminal size={16} className="text-teal" />
              {project.name} API Playground
            </DialogTitle>
            <DialogDescription>
              {liveOpenApi
                ? "Live OpenAPI endpoints from the production backend"
                : project.apiEndpoint ?? `/api/v1/projects/${project.id}`}
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            title={expanded ? "Exit full screen" : "Expand full screen"}
            aria-label={expanded ? "Exit full screen" : "Expand full screen"}
            className="absolute right-11 top-4 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </DialogHeader>

        {liveOpenApi ? <LiveOpenApiPlayground project={project} /> : <MockPlayground project={project} />}
      </DialogContent>
    </Dialog>
  );
};

export default ApiPlaygroundModal;

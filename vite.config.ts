import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const RECURR_API_BASE = "https://recurr-be-production.up.railway.app/api/v1";
const RECURR_OPENAPI_URL = "https://recurr-be-production.up.railway.app/api/docs/openapi.json";

const readJsonBody = (req: import("node:http").IncomingMessage) =>
  new Promise<Record<string, unknown>>((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 250_000) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
  });

const writeJson = (
  res: import("node:http").ServerResponse,
  status: number,
  payload: unknown,
) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
};

const clean = (value: unknown) => String(value || "").trim();

const getRecurrBaseUrl = (requestedBase: unknown) => {
  const fallback = new URL(RECURR_API_BASE);
  const requested = clean(requestedBase);

  if (!requested) return fallback;

  try {
    const absolute = requested.startsWith("/")
      ? new URL(requested, fallback.origin)
      : new URL(requested);

    return absolute.origin === fallback.origin ? absolute : fallback;
  } catch {
    return fallback;
  }
};

const buildRecurrUrl = (
  pathValue: unknown,
  query: Record<string, unknown> = {},
  requestedBase?: unknown,
) => {
  const base = getRecurrBaseUrl(requestedBase);
  const normalizedPath = clean(pathValue).startsWith("/")
    ? clean(pathValue)
    : `/${clean(pathValue)}`;
  const basePath = base.pathname.replace(/\/$/, "");
  const pathname = normalizedPath.startsWith(basePath)
    ? normalizedPath
    : `${basePath}${normalizedPath}`;
  const url = new URL(pathname, base.origin);

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });

  return url;
};

const recurrApiDevMiddleware = () => ({
  name: "recurr-api-dev-middleware",
  configureServer(server: import("vite").ViteDevServer) {
    server.middlewares.use(async (req, res, next) => {
      const requestUrl = new URL(req.url || "/", "http://localhost");

      if (requestUrl.pathname === "/api/recurr/openapi" && req.method === "GET") {
        try {
          const response = await fetch(RECURR_OPENAPI_URL, {
            headers: { Accept: "application/json" },
          });

          if (!response.ok) {
            throw new Error(`Unable to load Recurr OpenAPI document (${response.status}).`);
          }

          writeJson(res, 200, { ok: true, document: await response.json() });
        } catch (error) {
          writeJson(res, 502, {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load Recurr API documentation.",
          });
        }
        return;
      }

      if (requestUrl.pathname === "/api/recurr/request" && req.method === "POST") {
        try {
          const body = await readJsonBody(req);
          const method = clean(body.method || "GET").toUpperCase();
          const allowedMethods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

          if (!allowedMethods.has(method)) {
            throw new Error("Unsupported request method.");
          }

          const targetUrl = buildRecurrUrl(
            body.path,
            (body.query || {}) as Record<string, unknown>,
            body.serverUrl,
          );
          const headers: Record<string, string> = { Accept: "application/json" };
          const authorization = clean(body.authorization);

          if (authorization) {
            headers.Authorization = authorization.toLowerCase().startsWith("bearer ")
              ? authorization
              : `Bearer ${authorization}`;
          }

          const request: RequestInit = { method, headers };
          const hasBody = !["GET", "DELETE"].includes(method) && body.body !== undefined;

          if (hasBody) {
            headers["Content-Type"] = "application/json";
            request.body =
              typeof body.body === "string" ? body.body : JSON.stringify(body.body);
          }

          const startedAt = Date.now();
          const response = await fetch(targetUrl, request);
          const text = await response.text();
          let responseBody: unknown = text;

          try {
            responseBody = text ? JSON.parse(text) : null;
          } catch {
            responseBody = text;
          }

          writeJson(res, 200, {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            ms: Date.now() - startedAt,
            url: targetUrl.toString(),
            contentType: response.headers.get("content-type"),
            body: responseBody,
          });
        } catch (error) {
          writeJson(res, 400, {
            ok: false,
            error: error instanceof Error ? error.message : "Unable to call Recurr API.",
          });
        }
        return;
      }

      next();
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && recurrApiDevMiddleware(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));

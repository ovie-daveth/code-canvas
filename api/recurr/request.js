const RECURR_API_BASE =
  process.env.RECURR_API_BASE || "https://recurr-be-production.up.railway.app/api/v1";

const clean = (value) => String(value || "").trim();

const parseBody = (body) => {
  if (!body) return {};
  if (typeof body === "string") return JSON.parse(body);
  return body;
};

const getRecurrBaseUrl = (requestedBase) => {
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

const buildRecurrUrl = (pathValue, query = {}, requestedBase) => {
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

const proxyRecurrRequest = async (payload) => {
  const method = clean(payload.method || "GET").toUpperCase();
  const allowedMethods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

  if (!allowedMethods.has(method)) {
    throw new Error("Unsupported request method.");
  }

  const targetUrl = buildRecurrUrl(payload.path, payload.query, payload.serverUrl);
  const headers = { Accept: "application/json" };
  const authorization = clean(payload.authorization);

  if (authorization) {
    headers.Authorization = authorization.toLowerCase().startsWith("bearer ")
      ? authorization
      : `Bearer ${authorization}`;
  }

  const request = { method, headers };
  const hasBody = !["GET", "DELETE"].includes(method) && payload.body !== undefined;

  if (hasBody) {
    headers["Content-Type"] = "application/json";
    request.body =
      typeof payload.body === "string" ? payload.body : JSON.stringify(payload.body);
  }

  const startedAt = Date.now();
  const response = await fetch(targetUrl, request);
  const text = await response.text();
  let body = text;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    ms: Date.now() - startedAt,
    url: targetUrl.toString(),
    contentType: response.headers.get("content-type"),
    body,
  };
};

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed." });
    return;
  }

  try {
    res.status(200).json(await proxyRecurrRequest(parseBody(req.body)));
  } catch (error) {
    console.error(error);
    res.status(400).json({
      ok: false,
      error: error.message || "Unable to call Recurr API.",
    });
  }
}

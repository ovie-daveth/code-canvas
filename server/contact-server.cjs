const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const nodemailer = require("nodemailer");

const loadDotEnv = () => {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const separator = trimmed.indexOf("=");
    if (separator === -1) return;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
};

loadDotEnv();

const PORT = Number(process.env.PORT || 3000);
const CONTACT_TO = process.env.CONTACT_TO || "davethsite@gmail.com";
const DIST_DIR = path.join(__dirname, "..", "dist");
const RECURR_API_BASE =
  process.env.RECURR_API_BASE || "https://recurr-be-production.up.railway.app/api/v1";
const RECURR_OPENAPI_URL =
  process.env.RECURR_OPENAPI_URL ||
  "https://recurr-be-production.up.railway.app/api/docs/openapi.json";
const OPENAPI_CACHE_TTL_MS = 5 * 60 * 1000;

let openApiCache = null;
let openApiCacheTime = 0;

const json = (res, status, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
};

const readJsonBody = (req, maxBytes = 20_000) =>
  new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > maxBytes) {
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

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const clean = (value) => String(value || "").trim();

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const validateContact = (body) => {
  const payload = {
    name: clean(body.name),
    email: clean(body.email),
    subject: clean(body.subject),
    message: clean(body.message),
  };

  if (!payload.name || !payload.email || !payload.subject || !payload.message) {
    return { error: "Name, email, subject, and message are required." };
  }

  if (!isEmail(payload.email)) {
    return { error: "Enter a valid email address." };
  }

  if (payload.message.length < 10) {
    return { error: "Message must be at least 10 characters." };
  }

  return { payload };
};

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

  if (pass === "your-google-app-password") {
    throw new Error("Replace GMAIL_APP_PASSWORD with a real Google App Password.");
  }

  if (process.env.SMTP_SERVICE || process.env.GMAIL_USER) {
    if (!user || !pass) return null;
    return nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || "gmail",
      auth: { user, pass },
    });
  }

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
};

const sendContactEmail = async (payload) => {
  const transporter = createTransporter();

  if (!transporter) {
    throw new Error("Email service is not configured.");
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER;

  const safe = {
    name: escapeHtml(payload.name),
    email: escapeHtml(payload.email),
    subject: escapeHtml(payload.subject),
    message: escapeHtml(payload.message).replace(/\n/g, "<br>"),
  };

  await transporter.sendMail({
    from,
    to: CONTACT_TO,
    replyTo: payload.email,
    subject: `Portfolio contact: ${payload.subject}`,
    text: [
      `Name: ${payload.name}`,
      `Email: ${payload.email}`,
      `Subject: ${payload.subject}`,
      "",
      payload.message,
    ].join("\n"),
    html: `
      <p><strong>Name:</strong> ${safe.name}</p>
      <p><strong>Email:</strong> ${safe.email}</p>
      <p><strong>Subject:</strong> ${safe.subject}</p>
      <p>${safe.message}</p>
    `,
  });
};

const getOpenApiDocument = async () => {
  const fresh = openApiCache && Date.now() - openApiCacheTime < OPENAPI_CACHE_TTL_MS;
  if (fresh) return openApiCache;

  const response = await fetch(RECURR_OPENAPI_URL, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Unable to load Recurr OpenAPI document (${response.status}).`);
  }

  openApiCache = await response.json();
  openApiCacheTime = Date.now();
  return openApiCache;
};

const buildRecurrUrl = (pathValue, query = {}) => {
  const base = new URL(RECURR_API_BASE);
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

  const targetUrl = buildRecurrUrl(payload.path, payload.query);
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

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

const serveStatic = (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const requested = urlPath === "/" ? "index.html" : urlPath.slice(1);
  const filePath = path.join(DIST_DIR, requested);
  const resolved = filePath.startsWith(DIST_DIR) && fs.existsSync(filePath)
    ? filePath
    : path.join(DIST_DIR, "index.html");

  if (!fs.existsSync(resolved)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Build the frontend with `npm run build` before serving this app.");
    return;
  }

  const ext = path.extname(resolved);
  res.writeHead(200, { "Content-Type": contentTypes[ext] || "application/octet-stream" });
  fs.createReadStream(resolved).pipe(res);
};

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, "http://localhost");

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }

  if (requestUrl.pathname === "/api/recurr/openapi" && req.method === "GET") {
    try {
      const document = await getOpenApiDocument();
      json(res, 200, { ok: true, document });
    } catch (error) {
      console.error(error);
      json(res, 502, {
        ok: false,
        error: error.message || "Unable to load Recurr API documentation.",
      });
    }
    return;
  }

  if (requestUrl.pathname === "/api/recurr/request" && req.method === "POST") {
    try {
      const body = await readJsonBody(req, 250_000);
      const result = await proxyRecurrRequest(body);
      json(res, 200, result);
    } catch (error) {
      console.error(error);
      json(res, 400, {
        ok: false,
        error: error.message || "Unable to call Recurr API.",
      });
    }
    return;
  }

  if (requestUrl.pathname === "/api/contact" && req.method === "POST") {
    try {
      const body = await readJsonBody(req);
      const result = validateContact(body);

      if (result.error) {
        json(res, 400, { ok: false, error: result.error });
        return;
      }

      await sendContactEmail(result.payload);
      json(res, 200, { ok: true });
    } catch (error) {
      console.error(error);
      json(res, 500, {
        ok: false,
        error: error.message || "Unable to send message right now.",
      });
    }
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Portfolio server listening on http://localhost:${PORT}`);
});

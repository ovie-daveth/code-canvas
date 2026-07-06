const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const nodemailer = require("nodemailer");

const PORT = Number(process.env.PORT || 3000);
const CONTACT_TO = process.env.CONTACT_TO || "davethsite@gmail.com";
const DIST_DIR = path.join(__dirname, "..", "dist");

const json = (res, status, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
};

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 20_000) {
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
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (req.url === "/api/contact" && req.method === "POST") {
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

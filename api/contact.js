import nodemailer from "nodemailer";

const CONTACT_TO = process.env.CONTACT_TO || "davethsite@gmail.com";

const clean = (value) => String(value || "").trim();

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const parseBody = (body) => {
  if (!body) return {};
  if (typeof body === "string") return JSON.parse(body);
  return body;
};

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
    const result = validateContact(parseBody(req.body));

    if (result.error) {
      res.status(400).json({ ok: false, error: result.error });
      return;
    }

    await sendContactEmail(result.payload);
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      error: error.message || "Unable to send message right now.",
    });
  }
}

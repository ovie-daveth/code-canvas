const RECURR_OPENAPI_URL =
  process.env.RECURR_OPENAPI_URL ||
  "https://recurr-be-production.up.railway.app/api/docs/openapi.json";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed." });
    return;
  }

  try {
    const response = await fetch(RECURR_OPENAPI_URL, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Unable to load Recurr OpenAPI document (${response.status}).`);
    }

    res.status(200).json({ ok: true, document: await response.json() });
  } catch (error) {
    console.error(error);
    res.status(502).json({
      ok: false,
      error: error.message || "Unable to load Recurr API documentation.",
    });
  }
}

// ---------- Multi-provider AI call (bring-your-own-key) ----------
// SECURITY NOTE: API keys are stored in localStorage (client-side only).
// This is necessary for a static GitHub Pages app with no backend.
// Users should use restricted/limited-scope keys and clear them after use.

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export async function callAI({ provider, apiKey, content, maxTokens = 1500, useWebSearch = false }) {
  if (!apiKey) throw new Error("No API key set. Open Settings and add one.");

  if (provider === "gemini") {
    const parts = (Array.isArray(content) ? content : [{ type: "text", text: content }]).map((b) =>
      b.type === "image"
        ? { inline_data: { mime_type: b.source.media_type, data: b.source.data } }
        : { text: b.text }
    );
    const res = await fetch(`${GEMINI_API_URL}/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Gemini API returned ${res.status}. ${t.slice(0, 200)}`);
    }
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || "Gemini API error");
    const text = (data.candidates?.[0]?.content?.parts || [])
      .map((p) => p.text || "")
      .join("
")
      .trim();
    if (!text) throw new Error("Gemini returned an empty response.");
    return text;
  }

  // Claude
  const body = {
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    messages: [{ role: "user", content }],
  };
  if (useWebSearch) {
    body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  }
  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Claude API returned ${res.status}. ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "Claude API error");
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text || "")
    .join("
")
    .trim();
  if (!text) {
    throw new Error("The AI returned no analyzable text (it may have only performed search steps).");
  }
  return text;
}

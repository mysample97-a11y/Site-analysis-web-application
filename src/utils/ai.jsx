// ---------- Multi-provider AI call (bring-your-own-key) ----------
// SECURITY NOTE: API keys are stored in localStorage (client-side only).
// This is necessary for a static GitHub Pages app with no backend.
// Users should use restricted/limited-scope keys and clear them after use.

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export async function callAI({ provider, apiKey, content, maxTokens = 1500, useWebSearch = false }) {
  if (!apiKey) throw new Error("No API key set. Open Settings and add one.");

  if (provider === "gemini") {
    const parts = (Array.isArray(content) ? content : [{ type: "text", text: content }]).map((b) =>// src/utils/ai.jsx - Clean, Bug-Free AI API Utility

/**
 * Parses Gemini API Response
 */
export function parseGeminiResponse(data) {
  if (!data || !data.candidates || !data.candidates[0]) {
    throw new Error("Invalid response structure from Gemini API");
  }
  const text = (data.candidates[0]?.content?.parts || [])
    .map((p) => p.text || "")
    .join("\n")
    .trim();
  return text;
}

/**
 * Parses Claude / Anthropic API Response
 */
export function parseClaudeResponse(data) {
  if (!data || !data.content) {
    throw new Error("Invalid response structure from Claude API");
  }
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text || "")
    .join("\n")
    .trim();
  return text;
}

/**
 * Call Gemini API
 */
export async function callGemini(apiKey, prompt, systemInstruction = "") {
  if (!apiKey) throw new Error("Gemini API key is required.");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ]
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return parseGeminiResponse(data);
}

/**
 * Call Anthropic Claude API
 */
export async function callClaude(apiKey, prompt, systemInstruction = "") {
  if (!apiKey) throw new Error("Claude API key is required.");

  const url = "https://api.anthropic.com/v1/messages";

  const payload = {
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }]
  };

  if (systemInstruction) {
    payload.system = systemInstruction;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "dangerously-allow-browser": "true"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return parseClaudeResponse(data);
}

/**
 * Main Analysis Runner
 */
export async function runSiteAnalysis(provider, apiKey, promptData) {
  const systemPrompt = `You are an expert site analysis consultant providing detailed data for urban planning, solar feasibility, vegetation, wind dynamics, and survey reports. Respond with concise, structured JSON or markdown analysis.`;
  
  const userPrompt = typeof promptData === "string" 
    ? promptData 
    : JSON.stringify(promptData, null, 2);

  if (provider === "claude") {
    return await callClaude(apiKey, userPrompt, systemPrompt);
  } else {
    return await callGemini(apiKey, userPrompt, systemPrompt);
  }
}
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
      .join("\n")
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

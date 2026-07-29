// src/utils/ai.jsx

// Parses Gemini API Response
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

// Parses Claude / Anthropic API Response
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

// Call Gemini API
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

// Call Anthropic Claude API
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

// Main Analysis Runner
export async function runSiteAnalysis(provider, apiKey, promptData) {
  const systemPrompt = "You are an expert site analysis consultant providing detailed data for urban planning, solar feasibility, vegetation, wind dynamics, and survey reports. Respond with concise, structured JSON or markdown analysis.";
  
  const userPrompt = typeof promptData === "string" 
    ? promptData 
    : JSON.stringify(promptData, null, 2);

  if (provider === "claude") {
    return await callClaude(apiKey, userPrompt, systemPrompt);
  } else {
    return await callGemini(apiKey, userPrompt, systemPrompt);
  }
}

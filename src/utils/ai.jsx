// src/utils/ai.jsx - Non-intrusive API Router

// Intercepts and maps deprecated models to current active models
function resolveModelName(modelName) {
  if (!modelName || typeof modelName !== "string") return "gemini-2.5-flash";
  
  let clean = modelName.trim();
  if (clean.startsWith("models/")) {
    clean = clean.replace("models/", "");
  }
  
  // Direct mapping from retired 1.5 endpoints to 2.5/2.0
  if (clean.includes("1.5") || clean === "flash") {
    return "gemini-2.5-flash";
  }
  
  return clean || "gemini-2.5-flash";
}

// Parses Gemini API Responses
export function parseGeminiResponse(data) {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (data.candidates && data.candidates[0]) {
    const parts = data.candidates[0]?.content?.parts || [];
    return parts.map((p) => p.text || "").join("\n").trim();
  }
  return JSON.stringify(data);
}

// Parses Claude API Responses
export function parseClaudeResponse(data) {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (data.content && Array.isArray(data.content)) {
    return data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text || "")
      .join("\n")
      .trim();
  }
  return JSON.stringify(data);
}

// Core Gemini Handler
export async function callGemini(apiKey, prompt, systemInstruction = "", requestedModel = "", imageData = null) {
  const cleanKey = (apiKey || "").trim();
  if (!cleanKey) {
    throw new Error("Gemini API key is missing. Please enter your API key in Settings.");
  }

  const activeModel = resolveModelName(requestedModel);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${cleanKey}`;

  const parts = [];

  // Handle attached images if passed
  if (imageData) {
    let base64String = imageData;
    let mimeType = "image/jpeg";
    if (imageData.includes("data:")) {
      const split = imageData.split(",");
      mimeType = split[0].match(/:(.*?);/)?.[1] || "image/jpeg";
      base64String = split[1] || imageData;
    }
    parts.push({
      inlineData: { mimeType, data: base64String }
    });
  }

  if (prompt) {
    parts.push({ text: typeof prompt === "string" ? prompt : JSON.stringify(prompt) });
  }

  const payload = {
    contents: [{ role: "user", parts }]
  };

  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const errData = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errMsg = errData?.error?.message || `API Error (${response.status})`;
    if (response.status === 400 && errMsg.toLowerCase().includes("key")) {
      throw new Error("API key invalid. Please verify your Google AI Studio key in Settings.");
    }
    throw new Error(errMsg);
  }

  return parseGeminiResponse(errData);
}

// Core Claude Handler
export async function callClaude(apiKey, prompt, systemInstruction = "", model = "claude-3-5-sonnet-20241022", imageData = null) {
  const cleanKey = (apiKey || "").trim();
  if (!cleanKey) {
    throw new Error("Claude API key is missing. Please enter your API key in Settings.");
  }

  const url = "https://api.anthropic.com/v1/messages";
  const content = [];

  if (imageData) {
    let base64String = imageData;
    let mimeType = "image/jpeg";
    if (imageData.includes("data:")) {
      const split = imageData.split(",");
      mimeType = split[0].match(/:(.*?);/)?.[1] || "image/jpeg";
      base64String = split[1] || imageData;
    }
    content.push({
      type: "image",
      source: { type: "base64", media_type: mimeType, data: base64String }
    });
  }

  content.push({ type: "text", text: typeof prompt === "string" ? prompt : JSON.stringify(prompt) });

  const payload = {
    model: model || "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    messages: [{ role: "user", content }]
  };

  if (systemInstruction) {
    payload.system = systemInstruction;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": cleanKey,
      "anthropic-version": "2023-06-01",
      "dangerously-allow-browser": "true"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Claude API Error (${response.status})`);
  }

  const data = await response.json();
  return parseClaudeResponse(data);
}

// Flexible Universal Wrapper for all Analyzers
export async function callAI(arg1, arg2, arg3, arg4, arg5) {
  let provider = "gemini";
  let apiKey = "";
  let prompt = "";
  let systemInstruction = "";
  let model = "";
  let imageData = null;

  if (typeof arg1 === "object" && arg1 !== null) {
    provider = arg1.provider || arg1.apiProvider || "gemini";
    apiKey = arg1.apiKey || arg1.key || "";
    prompt = arg1.prompt || arg1.userPrompt || "";
    systemInstruction = arg1.systemInstruction || arg1.systemPrompt || arg1.system || "";
    model = arg1.model || "";
    imageData = arg1.imageData || arg1.image || arg1.fileData || null;
  } else {
    prompt = arg1 || "";
    apiKey = arg2 || "";
    provider = arg3 || "gemini";
    systemInstruction = arg4 || "";
    model = arg5 || "";
  }

  const normalizedProvider = String(provider).toLowerCase();

  if (normalizedProvider.includes("claude") || normalizedProvider.includes("anthropic")) {
    return await callClaude(apiKey, prompt, systemInstruction, model, imageData);
  } else {
    return await callGemini(apiKey, prompt, systemInstruction, model, imageData);
  }
}

export default callAI;

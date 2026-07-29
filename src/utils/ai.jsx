// src/utils/ai.jsx - Production Gemini & Claude API Handler

// Helper to normalize Gemini model names
function cleanGeminiModel(modelName) {
  if (!modelName) return "gemini-2.5-flash";
  let clean = modelName.trim();
  if (clean.startsWith("models/")) {
    clean = clean.replace("models/", "");
  }
  if (clean === "gemini-1.5-flash" || clean === "gemini-1.5-pro") {
    return "gemini-2.5-flash";
  }
  return clean;
}

// Parses Gemini API Response
export function parseGeminiResponse(data) {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (data.candidates && data.candidates[0]) {
    const parts = data.candidates[0]?.content?.parts || [];
    return parts.map((p) => p.text || "").join("\n").trim();
  }
  return JSON.stringify(data);
}

// Parses Claude / Anthropic API Response
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

// Call Gemini API with automatic model fallbacks
export async function callGemini(apiKey, prompt, systemInstruction = "", requestedModel = "") {
  if (!apiKey) throw new Error("Gemini API Key is missing. Please configure it in Settings.");

  const primaryModel = cleanGeminiModel(requestedModel);
  const modelsToTry = Array.from(new Set([primaryModel, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest"]));

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      };

      if (systemInstruction) {
        payload.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData?.error?.message || `Error ${response.status}`;
        
        if (response.status === 404 || errMsg.includes("not found")) {
          lastError = new Error(errMsg);
          continue; // Fallback to next model
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      return parseGeminiResponse(data);
    } catch (err) {
      lastError = err;
      if (err.message && !err.message.includes("not found") && !err.message.includes("404")) {
        throw err;
      }
    }
  }

  throw lastError || new Error("Failed to connect to Gemini API with available models.");
}

// Call Anthropic Claude API
export async function callClaude(apiKey, prompt, systemInstruction = "", model = "claude-3-5-sonnet-20241022") {
  if (!apiKey) throw new Error("Claude API Key is missing. Please configure it in Settings.");

  const url = "https://api.anthropic.com/v1/messages";

  const payload = {
    model: model || "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
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
    throw new Error(errData?.error?.message || `Claude API Error (${response.status})`);
  }

  const data = await response.json();
  return parseClaudeResponse(data);
}

// Universal callAI function imported across analyzers
export async function callAI(arg1, arg2, arg3, arg4, arg5) {
  let provider = "gemini";
  let apiKey = "";
  let prompt = "";
  let systemInstruction = "";
  let model = "";

  if (typeof arg1 === "object" && arg1 !== null) {
    provider = arg1.provider || arg1.apiProvider || "gemini";
    apiKey = arg1.apiKey || arg1.key || "";
    prompt = arg1.prompt || arg1.userPrompt || "";
    systemInstruction = arg1.systemInstruction || arg1.systemPrompt || arg1.system || "";
    model = arg1.model || "";
  } else if (typeof arg1 === "string" && (arg1.includes("gemini") || arg1.includes("claude") || arg1.includes("anthropic"))) {
    provider = arg1;
    apiKey = arg2 || "";
    prompt = arg3 || "";
    systemInstruction = arg4 || "";
    model = arg5 || "";
  } else {
    prompt = arg1 || "";
    apiKey = arg2 || "";
    provider = arg3 || "gemini";
    systemInstruction = arg4 || "";
    model = arg5 || "";
  }

  const normalizedProvider = String(provider).toLowerCase();

  if (normalizedProvider.includes("claude") || normalizedProvider.includes("anthropic")) {
    return await callClaude(apiKey, prompt, systemInstruction, model);
  } else {
    return await callGemini(apiKey, prompt, systemInstruction, model);
  }
}

export async function runSiteAnalysis(provider, apiKey, promptData, systemInstruction) {
  return await callAI({ provider, apiKey, prompt: promptData, systemInstruction });
}

export default callAI;

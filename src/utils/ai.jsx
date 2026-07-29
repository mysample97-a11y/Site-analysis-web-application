// src/utils/ai.jsx - Production AI Handler with 404 & 429 Quota Fallback

function sanitizeModelName(modelName) {
  if (!modelName || typeof modelName !== "string") {
    return "gemini-2.5-flash";
  }

  let clean = modelName.trim();
  if (clean.startsWith("models/")) {
    clean = clean.replace("models/", "");
  }

  if (clean.includes("1.5") || clean === "gemini-flash" || clean === "flash") {
    return "gemini-2.5-flash";
  }

  return clean || "gemini-2.5-flash";
}

export function parseGeminiResponse(data) {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (data.candidates && data.candidates[0]) {
    const parts = data.candidates[0]?.content?.parts || [];
    return parts.map((p) => p.text || "").join("\n").trim();
  }
  return JSON.stringify(data);
}

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

export async function callGemini(apiKey, prompt, systemInstruction = "", rawModel = "") {
  if (!apiKey) throw new Error("Gemini API Key is missing. Please configure it in Settings.");

  const primaryModel = sanitizeModelName(rawModel);
  
  // Sequence of active models with available free tier allocations
  const modelsToTry = Array.from(new Set([
    primaryModel,
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-1.5-flash"
  ]));

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      
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
        const errMsg = errData?.error?.message || `API Error (${response.status})`;
        
        // If the model fails due to 404 (Not Found) or 429 (Quota limit 0), try the next fallback model
        if (
          response.status === 404 || 
          response.status === 429 || 
          errMsg.toLowerCase().includes("not found") ||
          errMsg.toLowerCase().includes("quota") ||
          errMsg.toLowerCase().includes("limit")
        ) {
          lastError = new Error(errMsg);
          console.warn(`Model ${model} failed (${response.status}). Attempting fallback model...`);
          continue; 
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      return parseGeminiResponse(data);
    } catch (err) {
      lastError = err;
      const isQuotaOrNotFound = 
        err.message && 
        (err.message.toLowerCase().includes("not found") || 
         err.message.toLowerCase().includes("quota") || 
         err.message.toLowerCase().includes("limit") ||
         err.message.toLowerCase().includes("404") || 
         err.message.toLowerCase().includes("429"));
      
      if (!isQuotaOrNotFound) {
        throw err;
      }
    }
  }

  throw lastError || new Error("Quota exceeded or model unavailable. Please verify API key in Google AI Studio.");
}

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
      "x-api-key": apiKey.trim(),
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

// src/utils/helpers.js - Complete Helper Utilities

/**
 * Unique ID Generator
 */
export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
}
export const generateUid = uid;
export const getUid = uid;

/**
 * User-Friendly Error Formatter
 */
export function friendlyError(err) {
  if (!err) return "An unknown error occurred.";
  if (typeof err === "string") return err;
  if (err.message) {
    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      return "Network error. Please check your connection or CORS settings.";
    }
    if (err.message.includes("API Key") || err.message.includes("401") || err.message.includes("403")) {
      return "API key error. Please check your API key in settings.";
    }
    return err.message;
  }
  return JSON.stringify(err);
}

/**
 * Robust JSON Extractor (Handles Markdown Code Blocks & Raw Responses)
 */
export function extractJSON(text, fallback = null) {
  if (!text) return fallback;
  if (typeof text === "object") return text;

  try {
    return JSON.parse(text);
  } catch (e) {
    // Check for markdown code blocks ```json ... ```
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (err) {}
    }

    // Check for raw JSON object braces { ... }
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(text.substring(firstBrace, lastBrace + 1));
      } catch (err) {}
    }

    // Check for raw JSON array brackets [ ... ]
    const firstBracket = text.indexOf("[");
    const lastBracket = text.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(text.substring(firstBracket, lastBracket + 1));
      } catch (err) {}
    }
  }

  return fallback;
}
export const safeJSONParse = extractJSON;

/**
 * Formatting Helpers
 */
export function formatNumber(val, decimals = 2) {
  if (val === undefined || val === null || isNaN(val)) return "N/A";
  return Number(val).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(val) {
  if (val === undefined || val === null || isNaN(val)) return "0%";
  return `${Number(val).toFixed(1)}%`;
}

export function formatDate(dateStr) {
  if (!dateStr) return new Date().toLocaleDateString();
  return new Date(dateStr).toLocaleDateString();
}

/**
 * Download Helper for Export Buttons
 */
export function downloadFile(content, filename, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

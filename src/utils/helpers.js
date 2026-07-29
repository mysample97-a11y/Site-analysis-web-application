// src/utils/helpers.js - Complete Helper & Utility Functions

/**
 * Converts a File object to Base64 String (Used by SurveyAnalyzer)
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

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
      return "Network error. Please check your internet connection or API settings.";
    }
    if (err.message.includes("API Key") || err.message.includes("401") || err.message.includes("403")) {
      return "API key error. Please check your API key in Settings.";
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
    // Try extracting JSON from markdown ```json ... ``` blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (err) {}
    }

    // Try extracting JSON object {...}
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(text.substring(firstBrace, lastBrace + 1));
      } catch (err) {}
    }

    // Try extracting JSON array [...]
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
export const parseJSON = extractJSON;
export const parseJson = extractJSON;

/**
 * Number & Date Formatting Helpers
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
 * Download & Export Helpers (Used by ExportButtons)
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

export function exportToJSON(data, filename = "analysis-report.json") {
  const content = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  downloadFile(content, filename, "application/json");
}

export function exportToCSV(data, filename = "analysis-report.csv") {
  let csv = "";
  if (Array.isArray(data) && data.length > 0) {
    const headers = Object.keys(data[0]);
    csv += headers.join(",") + "\n";
    data.forEach((row) => {
      csv += headers.map((h) => JSON.stringify(row[h] || "")).join(",") + "\n";
    });
  } else if (typeof data === "string") {
    csv = data;
  }
  downloadFile(csv, filename, "text/csv");
}

export function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    return Promise.resolve();
  }
}

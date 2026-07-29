export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function extractJSON(text) {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON object found in the AI response.");
  return JSON.parse(text.slice(firstBrace, lastBrace + 1));
}

export function extractJSONArray(text) {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("No JSON array found in the AI response.");
  return JSON.parse(text.slice(start, end + 1));
}

export function friendlyError(rawMessage) {
  const msg = (rawMessage || "").toLowerCase();
  if (msg.includes("no api key") || msg.includes("api key")) {
    return "You need to add an API key in Settings before using AI features.";
  }
  if (msg.includes("json") || msg.includes("expected") || msg.includes("unexpected token")) {
    return "The AI's answer got cut off before it finished. Try again — it often succeeds on retry.";
  }
  if (msg.includes("api returned") || msg.includes("status") || msg.includes("401") || msg.includes("403")) {
    return "The AI service didn't respond successfully — check your API key is correct and has quota remaining, or wait a moment and try again.";
  }
  if (msg.includes("empty response")) {
    return "The AI didn't send back any content that time. Try again.";
  }
  return "Something unexpected happened. Try again — if it keeps failing, note the technical detail below.";
}

export function barsHtml(data, valueKey, nameKey, color) {
  const max = Math.max(1, ...data.map((d) => d[valueKey]));
  return data
    .map(
      (d) => `<div style="display:flex;align-items:center;margin-bottom:4px;">
        <div style="width:170px;font-size:11px;padding-right:8px;text-align:right;">${d[nameKey]}</div>
        <div style="background:${color};height:14px;width:${Math.max(4, (d[valueKey] / max) * 220)}px;border-radius:2px;margin-right:6px;"></div>
        <div style="font-size:11px;font-weight:600;">${d[valueKey]}</div>
      </div>`
    )
    .join("");
}

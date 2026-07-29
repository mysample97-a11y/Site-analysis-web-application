// src/analyzers/SiteContextAnalyzer.jsx - Clean Site Context Analyzer

import React, { useState } from "react";
import { callAI } from "../utils/ai";
import { fileToBase64, friendlyError, copyToClipboard, exportToJSON } from "../utils/helpers";

export default function SiteContextAnalyzer({ apiKey, apiProvider }) {
  const [siteName, setSiteName] = useState("");
  const [surroundings, setSurroundings] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imageData, setImageData] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState("");

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      try {
        const base64 = await fileToBase64(file);
        setImageData(base64);
      } catch (err) {
        console.error("Image read error:", err);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!siteName && !surroundings && !imageData) {
      setError("Please describe the site location, surroundings, or upload a map/GIS image.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis("");

    const systemInstruction = 
      "You are an expert urban planner and architectural site analysis consultant. " +
      "Provide a thorough, professional site context evaluation covering: " +
      "1. Location & Context Summary, 2. Urban & Zoning Dynamics, 3. Accessibility & Infrastructure, " +
      "4. Environmental & Microclimate Considerations, 5. SWOT Analysis, and 6. Strategic Recommendations.";

    const prompt = `Site Name / Location: ${siteName || "Unspecified"}
Surrounding Context / Notes: ${surroundings || "None provided"}

Analyze the architectural and urban site context based on this location information and attached image (if provided).`;

    try {
      const response = await callAI({
        provider: apiProvider || "gemini",
        apiKey: apiKey,
        prompt: prompt,
        systemInstruction: systemInstruction,
        model: "gemini-2.5-flash",
        imageData: imageData
      });

      setAnalysis(response);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-amber-200">
        <h2 className="text-xl font-semibold text-amber-900 mb-4">
          STEP 1 — DESCRIBE YOUR SITE
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site Name or Address
            </label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="e.g. Al Safa 2 Park, Dubai"
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site Surroundings & Context
            </label>
            <textarea
              rows={4}
              value={surroundings}
              onChange={(e) => setSurroundings(e.target.value)}
              placeholder="Describe what's around the site (adjacent buildings, roads, land uses) - or upload a GIS/map image below instead"
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload GIS / Site Map Image
            </label>
            <input
              type="file"
              accept="image/*,.heic"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
            />
            {imageFile && (
              <p className="mt-1 text-xs text-amber-700">Loaded file: {imageFile.name}</p>
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-md shadow-sm transition-colors duration-150 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span>Analyzing Site Context...</span>
            ) : (
              <span>🔍 Analyze Site Context</span>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
            <strong>⚠️ Error:</strong> {error}
          </div>
        )}
      </div>

      {analysis && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b">
            <h3 className="text-lg font-bold text-gray-800">Site Context Analysis Report</h3>
            <div className="space-x-2">
              <button
                onClick={() => copyToClipboard(analysis)}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border"
              >
                Copy
              </button>
              <button
                onClick={() => exportToJSON({ siteName, analysis })}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border"
              >
                Export JSON
              </button>
            </div>
          </div>

          <div className="prose max-w-none text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
            {analysis}
          </div>
        </div>
      )}
    </div>
  );
}

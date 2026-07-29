import React, { useState } from "react";
import { Sparkles, Search, Image as ImageIcon, Copy, Check, Download, FileText, AlertTriangle, Trash2, Lightbulb, FileJson } from "lucide-react";
import { callAI } from "../utils/ai";

export default function SiteContextAnalyzer({ apiKey, apiProvider, model, onGenerateInsights }) {
  const [siteLocation, setSiteLocation] = useState("Al safa 2 Park,Dubai");
  const [surroundings, setSurroundings] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageData, setImageData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [technicalError, setTechnicalError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState("");

  const [copied, setCopied] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageData(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setImageData(null);
  };

  const handleAnalyze = async () => {
    if (!siteLocation && !surroundings && !imageData) {
      setError("Please describe the site location, surroundings, or upload a GIS/map image.");
      return;
    }

    setLoading(true);
    setError(null);
    setTechnicalError(null);
    setAnalysisResult("");
    setAiInsights("");

    const systemPrompt = `You are an expert urban planning and architectural site analysis consultant. Provide a detailed, professional analysis of the site context based on the location, surroundings, and image provided. Include urban context, accessibility, environmental factors, microclimate, and strategic design recommendations.`;

    const userPrompt = `Site Name or Address: ${siteLocation || "Unspecified"}
Site Surroundings & Context: ${surroundings || "None provided"}

Please provide a comprehensive site context analysis.`;

    try {
      // Uses active model gemini-2.5-flash instead of deprecated 1.5
      const activeModel = (!model || model.includes("1.5")) ? "gemini-2.5-flash" : model;

      const result = await callAI({
        provider: apiProvider || "gemini",
        apiKey: apiKey,
        prompt: userPrompt,
        systemInstruction: systemPrompt,
        model: activeModel,
        imageData: imageData
      });

      setAnalysisResult(result);
    } catch (err) {
      console.error("Site Context Analysis Error:", err);
      const errMsg = err.message || "An unexpected error occurred during analysis.";
      setError(errMsg);
      setTechnicalError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    if (!analysisResult) return;

    setInsightsLoading(true);
    try {
      const activeModel = (!model || model.includes("1.5")) ? "gemini-2.5-flash" : model;
      
      const prompt = `Based on the following site context analysis, extract 5 key actionable strategic design insights for landscape architecture:

${analysisResult}`;

      const insights = await callAI({
        provider: apiProvider || "gemini",
        apiKey: apiKey,
        prompt: prompt,
        systemInstruction: "You are an architectural strategy consultant. Extract key high-impact design insights.",
        model: activeModel
      });

      setAiInsights(insights);
      if (onGenerateInsights) {
        onGenerateInsights(insights);
      }
    } catch (err) {
      console.error("Error generating insights:", err);
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleCopy = () => {
    const text = aiInsights ? `${analysisResult}\n\n--- AI INSIGHTS ---\n${aiInsights}` : analysisResult;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportText = () => {
    const textContent = `SITE CONTEXT ANALYSIS REPORT\nSite: ${siteLocation}\n\n${analysisResult}\n\n${aiInsights ? `AI INSIGHTS:\n${aiInsights}` : ""}`;
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Site_Analysis_${siteLocation.replace(/[^a-z0-9]/gi, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const data = {
      siteName: siteLocation,
      surroundings: surroundings,
      analysis: analysisResult,
      insights: aiInsights || null
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Site_Analysis_${siteLocation.replace(/[^a-z0-9]/gi, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* STEP 1 CARD */}
      <div className="bg-[#fcfaf7] border border-[#e8ded1] rounded-lg p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[#6b471c] uppercase tracking-wide mb-4">
          STEP 1 — DESCRIBE YOUR SITE
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site Name or Address
            </label>
            <input
              type="text"
              value={siteLocation}
              onChange={(e) => setSiteLocation(e.target.value)}
              placeholder="Al safa 2 Park,Dubai"
              className="w-full p-3 bg-white border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
              className="w-full p-3 bg-white border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload GIS / Site Map Image
            </label>
            <div className="flex items-center space-x-3">
              <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-[#fbf3e6] hover:bg-[#f3e7d3]">
                <ImageIcon className="w-4 h-4 mr-2 text-gray-600" />
                Choose file
                <input
                  type="file"
                  accept="image/*,.heic"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <span className="text-sm text-gray-600">
                {selectedFile ? selectedFile.name : "No file chosen"}
              </span>
              {selectedFile && (
                <button
                  onClick={handleClearFile}
                  className="p-1 text-gray-400 hover:text-red-500"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Image upload may not work inside the Claude mobile app (platform restriction) - try your phone's regular browser, or use the text fields above.
            </p>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full py-3 px-4 bg-[#c59b27] hover:bg-[#b08920] text-white font-medium rounded-md shadow-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Search className="w-5 h-5" />
            <span>{loading ? "Analyzing Site Context..." : "Analyze Site Context"}</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm space-y-1">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong>Error:</strong> {error}
              </div>
            </div>
            {technicalError && (
              <p className="text-xs text-red-500 font-mono mt-1 break-all">
                Technical: {technicalError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* RESULTS DISPLAY WITH ORIGINAL EXPORT BUTTONS & AI INSIGHTS */}
      {analysisResult && (
        <div className="bg-white border border-[#e8ded1] rounded-lg p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <h3 className="text-lg font-bold text-gray-800">Site Context Analysis Report</h3>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleGenerateInsights}
                disabled={insightsLoading}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 rounded border border-amber-300 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-700" />
                {insightsLoading ? "Generating..." : "Generate AI Insights"}
              </button>

              <button
                onClick={handleCopy}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
              >
                {copied ? <Check className="w-3.5 h-3.5 mr-1 text-green-600" /> : <Copy className="w-3.5 h-3.5 mr-1 text-gray-600" />}
                {copied ? "Copied" : "Copy"}
              </button>

              <button
                onClick={handleExportText}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
              >
                <FileText className="w-3.5 h-3.5 mr-1 text-gray-600" />
                Export Text
              </button>

              <button
                onClick={handleExportJSON}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
              >
                <FileJson className="w-3.5 h-3.5 mr-1 text-gray-600" />
                Export JSON
              </button>
            </div>
          </div>

          {aiInsights && (
            <div className="bg-amber-50 border border-amber-200 rounded p-4 space-y-2">
              <div className="flex items-center space-x-2 text-amber-900 font-semibold text-sm">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>General AI Insights</span>
              </div>
              <div className="prose max-w-none text-xs text-amber-950 whitespace-pre-wrap leading-relaxed">
                {aiInsights}
              </div>
            </div>
          )}

          <div className="prose max-w-none text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
            {analysisResult}
          </div>
        </div>
      )}
    </div>
  );
}

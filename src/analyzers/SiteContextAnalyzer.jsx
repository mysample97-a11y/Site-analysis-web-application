import React, { useState } from "react";
import { 
  Sparkles, 
  Search, 
  Image as ImageIcon, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  AlertTriangle, 
  Trash2,
  Lightbulb,
  FileJson
} from "lucide-react";
import { callAI } from "../utils/ai";

export default function SiteContextAnalyzer({ apiKey, apiProvider, model }) {
  // Input States
  const [siteLocation, setSiteLocation] = useState("");
  const [surroundings, setSurroundings] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageData, setImageData] = useState(null);

  // Analysis & Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [technicalError, setTechnicalError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState("");

  // Insights & UI Action States
  const [copied, setCopied] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState("");

  // Handle File Upload
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

  // Main Site Context Analysis
  const handleAnalyze = async () => {
    if (!siteLocation && !surroundings && !imageData) {
      setError("Please provide a site location, context description, or upload a GIS/map image.");
      return;
    }

    setLoading(true);
    setError(null);
    setTechnicalError(null);
    setAnalysisResult("");
    setAiInsights("");

    const systemPrompt = `You are an expert urban planner and architectural site analysis consultant for landscape architecture competitions. 
Provide a comprehensive, professional site context evaluation covering:
1. Location & Context Summary
2. Urban & Zoning Dynamics
3. Accessibility, Transport & Pedestrian Circulation
4. Environmental, Views & Microclimate Considerations
5. SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats)
6. Strategic Design Recommendations for the site competition.`;

    const userPrompt = `Site Name / Location: ${siteLocation || "Unspecified"}
Site Surroundings & Context Description: ${surroundings || "None provided"}

Analyze the architectural and urban site context based on this location information and attached map/GIS image (if provided).`;

    try {
      const result = await callAI({
        provider: apiProvider || "gemini",
        apiKey: apiKey,
        prompt: userPrompt,
        systemInstruction: systemPrompt,
        model: model || "gemini-2.5-flash",
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

  // Generate Key AI Insights Summary
  const handleGenerateInsights = async () => {
    if (!analysisResult) return;

    setInsightsLoading(true);
    try {
      const prompt = `Based on the following site context analysis report, extract 5 key high-impact design insights and strategic opportunities for a landscape architecture concept:

---
${analysisResult}
---`;

      const insights = await callAI({
        provider: apiProvider || "gemini",
        apiKey: apiKey,
        prompt: prompt,
        systemInstruction: "You are an executive architectural advisor. Extract high-priority actionable design insights.",
        model: model || "gemini-2.5-flash"
      });

      setAiInsights(insights);
    } catch (err) {
      console.error("Error generating insights:", err);
    } finally {
      setInsightsLoading(false);
    }
  };

  // Action Bar Handlers: Copy, Export Text, Export JSON
  const handleCopy = () => {
    const textToCopy = aiInsights 
      ? `${analysisResult}\n\n=== KEY AI INSIGHTS ===\n${aiInsights}`
      : analysisResult;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportText = () => {
    const textContent = `SITE CONTEXT ANALYSIS REPORT\nLocation: ${siteLocation || "Unspecified"}\nDate: ${new Date().toLocaleDateString()}\n\n${analysisResult}\n\n${aiInsights ? `KEY AI INSIGHTS:\n${aiInsights}` : ""}`;
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Site_Analysis_${siteLocation ? siteLocation.replace(/[^a-z0-9]/gi, '_') : 'Report'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const jsonData = {
      siteName: siteLocation,
      surroundings: surroundings,
      date: new Date().toISOString(),
      analysis: analysisResult,
      insights: aiInsights || null
    };
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Site_Analysis_${siteLocation ? siteLocation.replace(/[^a-z0-9]/gi, '_') : 'Data'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* STEP 1 CARD */}
      <div className="bg-[#fcfaf7] border border-[#e8ded1] rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[#6b471c] uppercase tracking-wider mb-4">
          STEP 1 — DESCRIBE YOUR SITE
        </h2>

        <div className="space-y-4">
          {/* Site Name / Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site Name or Address
            </label>
            <input
              type="text"
              value={siteLocation}
              onChange={(e) => setSiteLocation(e.target.value)}
              placeholder="Al safa 2 Park,Dubai"
              className="w-full p-3 bg-white border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#c59b27]"
            />
          </div>

          {/* Site Surroundings & Context */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site Surroundings & Context
            </label>
            <textarea
              rows={4}
              value={surroundings}
              onChange={(e) => setSurroundings(e.target.value)}
              placeholder="Describe what's around the site (adjacent buildings, roads, land uses) - or upload a GIS/map image below instead"
              className="w-full p-3 bg-white border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#c59b27]"
            />
          </div>

          {/* Upload File Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload GIS / Site Map Image
            </label>
            <div className="flex items-center space-x-3">
              <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-[#fbf3e6] hover:bg-[#f3e7d3] focus:outline-none transition-colors">
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
                  className="p-1 text-gray-400 hover:text-red-500 rounded"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {selectedFile && (
              <p className="text-xs text-amber-700 mt-1">
                Loaded file: {selectedFile.name}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Image upload may not work inside the Claude mobile app (platform restriction) - try your phone's regular browser, or use the text fields above.
            </p>
          </div>

          {/* Primary Submit Button */}
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full py-3 px-4 bg-[#c59b27] hover:bg-[#b08920] text-white font-medium rounded-md shadow-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Search className="w-5 h-5" />
            <span>{loading ? "Analyzing Site Context..." : "Analyze Site Context"}</span>
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm space-y-1">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong>Error:</strong> {error}
              </div>
            </div>
            {technicalError && (
              <p className="text-xs text-red-600 mt-2 font-mono break-all">
                Technical: {technicalError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ANALYSIS RESULTS CARD */}
      {analysisResult && (
        <div className="bg-white border border-[#e8ded1] rounded-xl p-6 shadow-sm space-y-6">
          {/* Header & Export Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <h3 className="text-lg font-bold text-gray-800">
              Site Context Analysis Report
            </h3>

            {/* ACTION & EXPORT BUTTONS */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Generate AI Insights */}
              <button
                onClick={handleGenerateInsights}
                disabled={insightsLoading}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-md border border-amber-300 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-700" />
                {insightsLoading ? "Extracting..." : "Generate AI Insights"}
              </button>

              {/* Copy Report */}
              <button
                onClick={handleCopy}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1 text-gray-600" />
                    Copy Report
                  </>
                )}
              </button>

              {/* Export Text */}
              <button
                onClick={handleExportText}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 mr-1 text-gray-600" />
                Export Text
              </button>

              {/* Export JSON */}
              <button
                onClick={handleExportJSON}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 transition-colors"
              >
                <FileJson className="w-3.5 h-3.5 mr-1 text-gray-600" />
                Export JSON
              </button>
            </div>
          </div>

          {/* AI Insights Highlight Box */}
          {aiInsights && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center space-x-2 text-amber-900 font-semibold text-sm">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>Strategic AI Insights & Key Takeaways</span>
              </div>
              <div className="prose max-w-none text-xs text-amber-950 whitespace-pre-wrap leading-relaxed">
                {aiInsights}
              </div>
            </div>
          )}

          {/* Main Body Report */}
          <div className="prose max-w-none text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
            {analysisResult}
          </div>
        </div>
      )}
    </div>
  );
}

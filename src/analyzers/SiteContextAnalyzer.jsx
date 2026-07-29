import { useState } from "react";
import { Sparkles, Plus, Trash2, MapPin, Info, CheckCircle2, AlertTriangle, XCircle, Search, Image as ImageIcon } from "lucide-react";
import { callAI } from "../utils/ai";

export default function SiteContextAnalyzer({ apiKey, apiProvider, model }) {
  const [siteLocation, setSiteLocation] = useState("");
  const [surroundings, setSurroundings] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [technicalError, setTechnicalError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState("");

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

  const handleAnalyze = async () => {
    if (!siteLocation && !surroundings && !imageData) {
      setError("Please provide a site location, context description, or upload a GIS/map image.");
      return;
    }

    setLoading(true);
    setError(null);
    setTechnicalError(null);

    const systemPrompt = `You are an expert urban planning and architectural site analyst. Provide a detailed, professional analysis of the site context based on the location, surroundings, and image provided. Include urban context, accessibility, environmental factors, microclimate, and strategic design recommendations.`;

    const userPrompt = `Site Location: ${siteLocation || "Not specified"}
Surroundings Context: ${surroundings || "Not specified"}

Please perform a comprehensive site context analysis.`;

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* STEP 1 Card */}
      <div className="bg-[#fcfaf7] border border-[#e8ded1] rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#6b471c] uppercase tracking-wide mb-4">
          STEP 1 — DESCRIBE YOUR SITE
        </h2>

        <div className="space-y-4">
          {/* Site Location Input */}
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

          {/* Site Surroundings Textarea */}
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
              <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-[#fbf3e6] hover:bg-[#f3e7d3] focus:outline-none">
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

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full py-3 px-4 bg-[#c59b27] hover:bg-[#b08920] text-white font-medium rounded-md shadow-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Search className="w-5 h-5" />
            <span>{loading ? "Analyzing Site Context..." : "Analyze Site Context"}</span>
          </button>
        </div>

        {/* Error Notification */}
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

      {/* Results Display */}
      {analysisResult && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
            Site Context Analysis Results
          </h3>
          <div className="prose max-w-none text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
            {analysisResult}
          </div>
        </div>
      )}
    </div>
  );
}

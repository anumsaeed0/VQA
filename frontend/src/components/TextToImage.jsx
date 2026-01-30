import React, { useState, useEffect } from "react";
import "../App.css";

const TextToImage = () => {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState(
    "blurry, bad quality, distorted, ugly, low resolution"
  );
  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [seed, setSeed] = useState("");
  const [usedSeed, setUsedSeed] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [generationTime, setGenerationTime] = useState(null);
  const [imageSize, setImageSize] = useState(null);

  // Advanced settings
  const [numSteps, setNumSteps] = useState(30);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);

  // Preset prompts for inspiration
  const presetPrompts = [
    "A majestic dragon flying over a medieval castle, fantasy art, highly detailed",
    "A futuristic cyberpunk city at night with neon lights, cinematic lighting",
    "A serene Japanese garden with cherry blossoms, peaceful atmosphere, digital art",
    "An astronaut riding a horse on Mars, surreal, photorealistic",
    "A magical forest with glowing mushrooms, enchanted atmosphere, vibrant colors",
    "A steampunk airship floating among clouds, intricate details, golden hour lighting",
    "A cozy coffee shop on a rainy day, warm lighting, artistic illustration",
    "A majestic phoenix rising from flames, epic, highly detailed digital art"
  ];

  useEffect(() => {
    fetchGeneratedImages();
  }, []);

  const fetchGeneratedImages = async () => {
    try {
      const res = await fetch("http://localhost:8000/generated-images/");
      if (!res.ok) throw new Error("Failed to fetch images");
      const data = await res.json();
      setGeneratedImages(data);
    } catch (err) {
      console.error("Error fetching generated images:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!prompt.trim()) {
      return alert("Please enter a prompt to generate an image.");
    }

    setLoading(true);
    setGeneratedImage(null);
    setUsedSeed(null);
    setGenerationTime(null);
    const startTime = Date.now();

    try {
      const requestBody = {
        prompt: prompt.trim(),
        negative_prompt: negativePrompt.trim(),
        num_inference_steps: numSteps,
        guidance_scale: guidanceScale,
        width: width,
        height: height,
        seed: seed ? parseInt(seed) : null,
      };

      const res = await fetch("http://localhost:8000/text-to-image/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      setGeneratedImage(data.image_data);
      setUsedSeed(data.seed);
      setImageSize({ width, height });
      setGenerationTime(((Date.now() - startTime) / 1000).toFixed(2));
      
      // Refresh gallery
      fetchGeneratedImages();
    } catch (err) {
      console.error(err);
      alert("Error generating image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPrompt("");
    setNegativePrompt("blurry, bad quality, distorted, ugly, low resolution");
    setGeneratedImage(null);
    setSeed("");
    setUsedSeed(null);
    setNumSteps(30);
    setGuidanceScale(7.5);
    setWidth(512);
    setHeight(512);
    setGenerationTime(null);
    setImageSize(null);
  };

  const handlePresetClick = (presetPrompt) => {
    setPrompt(presetPrompt);
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `generated_image_${usedSeed || Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  // Estimate file size (rough approximation)
  const estimateFileSize = () => {
    if (!imageSize) return null;
    const pixels = imageSize.width * imageSize.height;
    const estimatedBytes = pixels * 3; // RGB
    return formatFileSize(estimatedBytes);
  };

  return (
    <div className="split-layout-container">
      {/* Left Panel - Form */}
      <div className="split-layout-left">
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{
            fontSize: "2.25rem",
            fontWeight: "800",
            background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "0.5rem"
          }}>
            🎨 Text-to-Image Generation
          </h1>
          <p style={{ 
            textAlign: "center", 
            color: "#6b7280", 
            fontSize: "1.1rem",
            fontWeight: "500"
          }}>
            Transform your imagination into stunning visuals with AI
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Main Prompt Input */}
          <div>
            <label style={{
              display: "block",
              marginBottom: "0.75rem",
              fontWeight: "700",
              color: "#374151",
              fontSize: "1.05rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              <span>✨</span> Describe your image
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., A beautiful landscape with mountains and a lake at sunset, digital art, highly detailed"
              style={{
                width: "100%",
                minHeight: "120px",
                padding: "1.25rem",
                fontSize: "1.05rem",
                border: "2px solid #e5e7eb",
                borderRadius: "16px",
                resize: "vertical",
                fontFamily: "inherit",
                transition: "all 0.3s ease",
                lineHeight: "1.6"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#8b5cf6";
                e.target.style.boxShadow = "0 0 0 4px #f3e8ff";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e5e7eb";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Preset Prompts */}
          {!prompt && (
            <div>
              <label style={{
                display: "block",
                marginBottom: "0.75rem",
                fontWeight: "700",
                color: "#374151",
                fontSize: "1.05rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <span>💡</span> Or try these ideas
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
                {presetPrompts.slice(0, 6).map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    style={{
                      padding: "0.625rem 1.125rem",
                      fontSize: "0.9rem",
                      background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                      color: "#374151",
                      border: "2px solid #d1d5db",
                      borderRadius: "9999px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      fontWeight: "600"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)";
                      e.target.style.color = "white";
                      e.target.style.transform = "translateY(-3px)";
                      e.target.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)";
                      e.target.style.color = "#374151";
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    {preset.substring(0, 40)}...
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Advanced Settings Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
              padding: "1rem 1.5rem",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              fontWeight: "700",
              fontSize: "1.05rem",
              borderRadius: "16px",
              transition: "all 0.3s ease"
            }}
          >
            <span style={{ fontSize: "1.25rem" }}>{showAdvanced ? "▼" : "▶"}</span>
            Advanced Settings
          </button>

          {/* Advanced Settings Panel */}
          {showAdvanced && (
            <div style={{
              padding: "2rem",
              backgroundColor: "#f9fafb",
              borderRadius: "16px",
              border: "2px solid #e5e7eb",
              animation: "fadeIn 0.3s ease"
            }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: "700", color: "#374151" }}>
                  🚫 Negative Prompt (what to avoid)
                </label>
                <input
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  style={{ 
                    width: "100%",
                    padding: "0.875rem 1rem",
                    borderRadius: "12px"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: "700", color: "#374151" }}>
                    Steps: {numSteps}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={numSteps}
                    onChange={(e) => setNumSteps(parseInt(e.target.value))}
                    style={{ width: "100%" }}
                  />
                  <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.25rem" }}>
                    Higher = Better quality
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: "700", color: "#374151" }}>
                    Guidance: {guidanceScale}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={guidanceScale}
                    onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                    style={{ width: "100%" }}
                  />
                  <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.25rem" }}>
                    7-9 recommended
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: "700", color: "#374151" }}>
                    Width: {width}px
                  </label>
                  <select
                    value={width}
                    onChange={(e) => setWidth(parseInt(e.target.value))}
                    style={{ 
                      width: "100%", 
                      padding: "0.875rem 1rem", 
                      borderRadius: "12px",
                      border: "2px solid #e5e7eb",
                      fontWeight: "600"
                    }}
                  >
                    <option value="512">512</option>
                    <option value="768">768</option>
                    <option value="1024">1024</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: "700", color: "#374151" }}>
                    Height: {height}px
                  </label>
                  <select
                    value={height}
                    onChange={(e) => setHeight(parseInt(e.target.value))}
                    style={{ 
                      width: "100%", 
                      padding: "0.875rem 1rem", 
                      borderRadius: "12px",
                      border: "2px solid #e5e7eb",
                      fontWeight: "600"
                    }}
                  >
                    <option value="512">512</option>
                    <option value="768">768</option>
                    <option value="1024">1024</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: "1.25rem" }}>
                <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: "700", color: "#374151" }}>
                  🎲 Seed (optional, for reproducibility)
                </label>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="Leave empty for random"
                  style={{ 
                    width: "100%",
                    padding: "0.875rem 1rem",
                    borderRadius: "12px"
                  }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            <button 
              type="submit" 
              disabled={loading || !prompt.trim()}
              style={{ 
                flex: 2,
                padding: "1rem 1.5rem",
                fontSize: "1.05rem",
                fontWeight: "700",
                background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
                opacity: (loading || !prompt.trim()) ? 0.5 : 1,
                boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)"
              }}
            >
              {loading ? "🎨 Creating Magic..." : "🚀 Generate Image"}
            </button>
            {(prompt || generatedImage) && (
              <button
                type="button"
                onClick={handleReset}
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
                  padding: "1rem 1.5rem",
                  fontSize: "1.05rem",
                  fontWeight: "700"
                }}
              >
                🔄 Reset
              </button>
            )}
          </div>
        </form>

        {/* Loading Animation */}
        {loading && (
          <div className="loader-container" style={{ marginTop: "2rem" }}>
            <div className="loader"></div>
            <p style={{ fontSize: "1.1rem", fontWeight: "600" }}>
              🎨 AI is painting your masterpiece...
            </p>
            <p style={{ fontSize: "0.95rem", color: "#9ca3af", marginTop: "0.5rem" }}>
              This may take 30-60 seconds depending on settings
            </p>
          </div>
        )}

        {/* Tips - Only show when no image */}
        {!loading && !generatedImage && (
          <div className="info-panel" style={{ marginTop: "2rem" }}>
            <h3>💡 Tips for Amazing Results</h3>
            <ul>
              <li><strong>Be specific and descriptive</strong> in your prompts</li>
              <li>Include <strong>art style keywords</strong> like "digital art", "oil painting", "photorealistic"</li>
              <li>Add <strong>quality descriptors:</strong> "highly detailed", "8k", "cinematic lighting"</li>
              <li>Use <strong>negative prompts</strong> to avoid unwanted elements</li>
              <li>Higher steps = better quality but slower generation</li>
              <li>Guidance scale <strong>7-9 usually works best</strong></li>
            </ul>
          </div>
        )}
      </div>

      {/* Right Panel - Generated Image Display */}
      {generatedImage && (
        <div className="split-layout-right image-display-container">
          <div className="image-display-header">
            <h2 className="image-display-title">
              🎨 Generated Image
            </h2>
            <button
              onClick={handleReset}
              style={{
                background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
                padding: "0.625rem 1.25rem",
                fontSize: "0.9rem",
                borderRadius: "12px",
                border: "none",
                color: "white",
                cursor: "pointer",
                fontWeight: "700",
                transition: "all 0.3s ease"
              }}
            >
              🗑️ Clear
            </button>
          </div>

          {/* Image Container */}
          <div className="image-wrapper" style={{ marginBottom: "1.5rem" }}>
            <img
              src={generatedImage}
              alt="Generated"
              style={{
                width: "100%",
                height: "auto",
                display: "block"
              }}
            />
            <div className="image-overlay">
              Generated with seed {usedSeed}
            </div>
          </div>

          {/* Generation Details */}
          <div>
            <h3 style={{
              fontSize: "1.15rem",
              fontWeight: "700",
              color: "#0c4a6e",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              📊 Generation Details
            </h3>

            {/* Prompt Display */}
            <div style={{
              padding: "1.25rem",
              backgroundColor: "white",
              borderRadius: "12px",
              border: "1px solid #bae6fd",
              marginBottom: "1.25rem"
            }}>
              <div style={{ fontWeight: "700", color: "#0c4a6e", marginBottom: "0.5rem" }}>
                ✨ Prompt
              </div>
              <div style={{ color: "#374151", lineHeight: "1.6" }}>
                {prompt}
              </div>
            </div>

            <div className="image-metadata">
              {/* Seed */}
              <div className="metadata-item">
                <div className="metadata-label">SEED</div>
                <div className="metadata-value">{usedSeed}</div>
                <div className="metadata-value-small">For reproducibility</div>
              </div>

              {/* Dimensions */}
              <div className="metadata-item">
                <div className="metadata-label">DIMENSIONS</div>
                <div className="metadata-value">{width} × {height}</div>
                <div className="metadata-value-small">
                  {((width * height) / 1000000).toFixed(2)}MP
                </div>
              </div>

              {/* Steps */}
              <div className="metadata-item">
                <div className="metadata-label">STEPS</div>
                <div className="metadata-value">{numSteps}</div>
                <div className="metadata-value-small">Inference steps</div>
              </div>

              {/* Guidance */}
              <div className="metadata-item">
                <div className="metadata-label">GUIDANCE</div>
                <div className="metadata-value">{guidanceScale}</div>
                <div className="metadata-value-small">Guidance scale</div>
              </div>

              {/* Generation Time */}
              {generationTime && (
                <div className="metadata-item">
                  <div className="metadata-label">TIME TAKEN</div>
                  <div className="metadata-value">{generationTime}s</div>
                  <div className="metadata-value-small">Generation time</div>
                </div>
              )}

              {/* Estimated Size */}
              <div className="metadata-item">
                <div className="metadata-label">EST. SIZE</div>
                <div className="metadata-value">{estimateFileSize()}</div>
                <div className="metadata-value-small">Approximate</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons" style={{ marginTop: "1.5rem" }}>
            <button
              onClick={handleDownload}
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                flex: 1,
                padding: "1rem 1.5rem",
                fontSize: "1.05rem",
                fontWeight: "700",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
              }}
            >
              📥 Download Image
            </button>
          </div>

          {/* Success Badge */}
          <div className="status-badge success" style={{ 
            width: "100%", 
            marginTop: "1.5rem",
            justifyContent: "flex-start"
          }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              flexShrink: 0,
              color: "white",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
            }}>
              ✓
            </div>
            <div>
              <div style={{ fontWeight: "700", fontSize: "1.05rem" }}>
                Generation Complete!
              </div>
              <div style={{ fontSize: "0.9rem", marginTop: "0.25rem", opacity: 0.9 }}>
                Your AI-generated masterpiece is ready to download
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextToImage;
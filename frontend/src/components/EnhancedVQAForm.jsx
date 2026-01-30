import React, { useState } from "react";

const EnhancedVQAForm = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [fileName, setFileName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [imageDimensions, setImageDimensions] = useState(null);
  const [fileType, setFileType] = useState("");
  const [uploadTime, setUploadTime] = useState(null);
  
  const quickQuestions = [
    "What is happening in this image?",
    "Describe the main objects",
    "What colors dominate the image?",
    "Is this an indoor or outdoor scene?",
    "How many people are visible?",
    "What are the people doing?",
    "What is in the background?",
    "What is the main focus of the image?",
    "Are there any vehicles present?",
    "Is there any text in the image?",
    "What time of day does it appear to be?",
    "What emotions are visible?",
    "What stands out the most?",
    "What might happen next?",
    "Summarize this image in one sentence"
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    processFile(selectedFile);
  };

  const processFile = (selectedFile) => {
    setFile(selectedFile);
    setFileName(selectedFile?.name || "");
    setFileType(selectedFile?.type || "");
    setUploadTime(new Date());

    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
      setFileName("");
      setFileType("");
      setUploadTime(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || !question) {
      alert("Please upload an image and enter a question.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("question", question);

    setLoading(true);
    setAnswer("");
    setConfidence(null);
    setFromCache(false);

    try {
      const res = await fetch("http://localhost:8000/vqa/", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error: ${res.status} - ${text}`);
      }

      const data = await res.json();
      setAnswer(data.answer);
      setConfidence(data.confidence ?? null);
      setFromCache(data.from_cache || false);
    } catch (err) {
      console.error(err);
      setAnswer("Error processing request. Please try again.");
      setConfidence(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setQuestion("");
    setAnswer("");
    setConfidence(null);
    setFromCache(false);
    setFileName("");
    setImageDimensions(null);
    setFileType("");
    setUploadTime(null);
  };

  const getConfidenceEmoji = (conf) => {
    if (conf >= 0.8) return "✅";
    if (conf >= 0.5) return "~";
    return "!";
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const getOrientation = () => {
    if (!imageDimensions) return "";
    const { width, height } = imageDimensions;
    if (width > height) return "Landscape";
    if (width < height) return "Portrait";
    return "Square";
  };

  return (
    <div className="split-layout-container">
      {/* Left Panel - Form */}
      <div className="split-layout-left">
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{
            fontSize: "2.25rem",
            fontWeight: "800",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "0.5rem"
          }}>
            🔍 Visual Question Answering
          </h1>
          <p style={{ 
            textAlign: "center", 
            color: "#6b7280", 
            fontSize: "1.1rem",
            fontWeight: "500"
          }}>
            Upload an image and ask questions about it — powered by AI
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* File Upload Area */}
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
              <span>📤</span> Upload Image
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: dragActive ? "3px dashed #6366f1" : "3px dashed #e5e7eb",
                backgroundColor: dragActive ? "#eef2ff" : "#f9fafb",
                borderRadius: "16px",
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden"
              }}
            >
              <input
                type="file"
                id="file-upload"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <label 
                htmlFor="file-upload" 
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "1rem",
                  padding: "3rem 1.5rem",
                  cursor: "pointer",
                  color: dragActive ? "#6366f1" : "#6b7280"
                }}
              >
                <div style={{ 
                  fontSize: "3rem",
                  animation: dragActive ? "bounce 1s infinite" : "none"
                }}>
                  {fileName ? "📸" : "🖼️"}
                </div>
                {fileName ? (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ 
                      fontWeight: "700", 
                      fontSize: "1.1rem", 
                      color: "#1f2937",
                      marginBottom: "0.5rem"
                    }}>
                      {fileName}
                    </div>
                    <div style={{ 
                      fontSize: "0.9rem", 
                      color: "#6b7280",
                      fontWeight: "500"
                    }}>
                      Click to change or drag a new file
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ 
                      fontWeight: "700", 
                      fontSize: "1.1rem", 
                      color: "#1f2937",
                      marginBottom: "0.5rem"
                    }}>
                      {dragActive ? "Drop your image here" : "Choose an image or drag & drop"}
                    </div>
                    <div style={{ 
                      fontSize: "0.875rem", 
                      color: "#9ca3af"
                    }}>
                      PNG, JPG, GIF up to 10MB
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Question Input */}
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
              <span>💬</span> Your Question
            </label>
            <textarea
              placeholder="What would you like to know about this image?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
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
                e.target.style.borderColor = "#6366f1";
                e.target.style.boxShadow = "0 0 0 4px #eef2ff";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e5e7eb";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Quick Questions */}
          {!question && (
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
                <span>💡</span> Quick Questions
              </label>
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.625rem"
              }}>
                {quickQuestions.slice(0, 8).map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setQuestion(q)}
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
                      e.target.style.background = "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)";
                      e.target.style.color = "white";
                      e.target.style.transform = "translateY(-3px)";
                      e.target.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)";
                      e.target.style.color = "#374151";
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            <button 
              type="submit"
              disabled={loading || !file || !question} 
              style={{ 
                flex: 2,
                padding: "1rem 1.5rem",
                fontSize: "1.05rem",
                fontWeight: "700",
                border: "none",
                borderRadius: "16px",
                cursor: loading || !file || !question ? "not-allowed" : "pointer",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                color: "white",
                opacity: (loading || !file || !question) ? 0.5 : 1,
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)"
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
                  <span style={{
                    border: "3px solid rgba(255,255,255,0.3)",
                    borderTop: "3px solid white",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    animation: "spin 0.8s linear infinite"
                  }}></span>
                  Processing...
                </span>
              ) : "🚀 Ask Question"}
            </button>
            {(file || question) && (
              <button
                type="button"
                onClick={handleReset}
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
                  color: "white",
                  padding: "1rem 1.5rem",
                  fontSize: "1.05rem",
                  fontWeight: "700",
                  border: "none",
                  borderRadius: "16px",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
              >
                🔄 Reset
              </button>
            )}
          </div>
        </form>

        {/* Answer Display */}
        {!loading && answer && (
          <div className="result-card" style={{ marginTop: "2rem" }}>
            {fromCache && (
              <div style={{
                backgroundColor: "#fef3c7",
                color: "#92400e",
                padding: "1rem 1.25rem",
                borderRadius: "12px",
                fontSize: "0.95rem",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                fontWeight: "700",
                border: "2px solid #fde68a"
              }}>
                <span style={{ fontSize: "1.5rem" }}>⚡</span>
                <span>Retrieved from cache (instant result!)</span>
              </div>
            )}
            
            <div style={{
              display: "flex",
              alignItems: "start",
              gap: "1.25rem",
              marginBottom: "1.25rem"
            }}>
              <div style={{ fontSize: "2.5rem", flexShrink: 0 }}>💬</div>
              <div className="answer-text" style={{
                fontSize: "1.35rem",
                fontWeight: "700",
                color: "#1f2937",
                lineHeight: "1.7"
              }}>
                {answer}
              </div>
            </div>
            
            {confidence !== null && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <span className={`confidence-badge ${confidence >= 0.8 ? 'high' : confidence >= 0.5 ? 'medium' : 'low'}`} style={{
                  padding: "0.75rem 1.5rem",
                  fontSize: "0.95rem"
                }}>
                  {getConfidenceEmoji(confidence)} {(confidence * 100).toFixed(1)}% Confident
                </span>
              </div>
            )}
          </div>
        )}

        {/* Loading Animation */}
        {loading && (
          <div className="loader-container" style={{ marginTop: "2rem" }}>
            <div className="loader"></div>
            <p style={{ fontSize: "1.1rem", color: "#6b7280", fontWeight: "600" }}>
              🤖 AI is analyzing your image...
            </p>
            <p style={{ fontSize: "0.95rem", color: "#9ca3af", marginTop: "0.5rem" }}>
              This usually takes 5-10 seconds
            </p>
          </div>
        )}

        {/* Tips - Only show when no image */}
        {!preview && !loading && !answer && (
          <div className="info-panel" style={{ marginTop: "2rem" }}>
            <h3>💡 Tips for Better Results</h3>
            <ul>
              <li><strong>Clear images work best:</strong> Use well-lit, focused photos</li>
              <li><strong>Be specific:</strong> Ask direct questions about visible elements</li>
              <li><strong>Examples:</strong> "What color is the car?" or "How many dogs are in the image?"</li>
              <li><strong>Avoid abstract questions:</strong> Focus on what can be seen</li>
            </ul>
          </div>
        )}
      </div>

      {/* Right Panel - Image Preview */}
      {preview && (
        <div className="split-layout-right image-display-container">
          <div className="image-display-header">
            <h2 className="image-display-title">
              🖼️ Image Preview
            </h2>
            <button
              onClick={() => {
                setFile(null);
                setPreview(null);
                setFileName("");
                setImageDimensions(null);
                setFileType("");
                setUploadTime(null);
              }}
              style={{
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                padding: "0.625rem 1.25rem",
                fontSize: "0.9rem",
                borderRadius: "12px",
                border: "none",
                color: "white",
                cursor: "pointer",
                fontWeight: "700",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)"
              }}
            >
              ✕ Remove
            </button>
          </div>

          {/* Image Container */}
          <div className="image-wrapper" style={{ marginBottom: "1.5rem" }}>
            <img
              src={preview}
              alt="Preview"
              style={{ 
                width: "100%",
                height: "auto",
                maxHeight: "500px",
                objectFit: "contain",
                display: "block"
              }}
              onLoad={(e) => {
                const { naturalWidth, naturalHeight } = e.target;
                setImageDimensions({ width: naturalWidth, height: naturalHeight });
              }}
            />
            <div className="image-overlay">
              {fileName}
            </div>
          </div>

          {/* Image Details */}
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
              📊 Image Details
            </h3>
            
            <div className="image-metadata">
              {/* File Name */}
              <div className="metadata-item" style={{ gridColumn: "1 / -1" }}>
                <div className="metadata-label">FILE NAME</div>
                <div className="metadata-value" style={{ fontSize: "0.95rem", wordBreak: "break-word" }}>
                  {fileName}
                </div>
              </div>

              {/* File Size */}
              <div className="metadata-item">
                <div className="metadata-label">FILE SIZE</div>
                <div className="metadata-value">{formatFileSize(file.size)}</div>
                <div className="metadata-value-small">({file.size.toLocaleString()} bytes)</div>
              </div>

              {/* File Type */}
              <div className="metadata-item">
                <div className="metadata-label">FILE TYPE</div>
                <div className="metadata-value" style={{ textTransform: "uppercase" }}>
                  {fileType.split('/')[1] || 'Unknown'}
                </div>
                <div className="metadata-value-small">{fileType}</div>
              </div>

              {/* Dimensions */}
              {imageDimensions && (
                <>
                  <div className="metadata-item">
                    <div className="metadata-label">DIMENSIONS</div>
                    <div className="metadata-value">
                      {imageDimensions.width} × {imageDimensions.height}
                    </div>
                    <div className="metadata-value-small">
                      {(imageDimensions.width * imageDimensions.height / 1000000).toFixed(2)}MP
                    </div>
                  </div>

                  <div className="metadata-item">
                    <div className="metadata-label">ASPECT RATIO</div>
                    <div className="metadata-value">
                      {(imageDimensions.width / imageDimensions.height).toFixed(2)}:1
                    </div>
                    <div className="metadata-value-small">{getOrientation()}</div>
                  </div>
                </>
              )}

              {/* Upload Time */}
              <div className="metadata-item" style={{ gridColumn: "1 / -1" }}>
                <div className="metadata-label">UPLOADED</div>
                <div className="metadata-value" style={{ fontSize: "0.95rem" }}>
                  {uploadTime?.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Status Indicator */}
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
                Ready for Analysis
              </div>
              <div style={{ fontSize: "0.9rem", marginTop: "0.25rem", opacity: 0.9 }}>
                Your image has been successfully uploaded and is ready for questioning
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedVQAForm;
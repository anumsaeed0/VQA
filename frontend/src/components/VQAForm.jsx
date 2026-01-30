import React, { useState } from "react";
import "../App.css";

const VQAForm = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setFileName(selectedFile?.name || "");

    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
      setFileName("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || !question) {
      return alert("Please upload an image and enter a question.");
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
  };

  const getConfidenceLevel = (conf) => {
    if (conf >= 0.8) return "high";
    if (conf >= 0.5) return "medium";
    return "low";
  };

  return (
    <div className="container fade-in">
      <h1>🔍 Visual Question Answering</h1>
      <p style={{ textAlign: "center", color: "#6b7280", marginBottom: "2rem" }}>
        Upload an image and ask questions about it
      </p>

      <form onSubmit={handleSubmit}>
        {/* Custom File Input */}
        <div className="file-input-wrapper">
          <input
            type="file"
            id="file-upload"
            accept="image/*"
            onChange={handleFileChange}
          />
          <label htmlFor="file-upload" className="file-input-label">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {fileName ? fileName : "Choose an image"}
          </label>
        </div>

        {/* Question Input */}
        <input
          type="text"
          placeholder="What would you like to know about this image?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "1rem" }}>
          <button type="submit" disabled={loading || !file || !question} style={{ flex: 1 }}>
            {loading ? "Processing..." : "Ask Question"}
          </button>
          {(file || question) && (
            <button
              type="button"
              onClick={handleReset}
              style={{
                background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
                flex: "0 0 auto",
                padding: "0.875rem 1.25rem"
              }}
            >
              Reset
            </button>
          )}
        </div>
      </form>

      {/* Image Preview */}
      {preview && (
        <div className="image-preview">
          <img src={preview} alt="Preview" />
        </div>
      )}

      {/* Loader */}
      {loading && (
        <div className="loader-container">
          <div className="loader"></div>
          <p>🤖 AI is analyzing your image...</p>
        </div>
      )}

      {/* Answer Display */}
      {!loading && answer && (
        <div className="result-card">
          {fromCache && (
            <div style={{
              backgroundColor: "#fef3c7",
              color: "#92400e",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              fontSize: "0.875rem",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              ⚡ Retrieved from cache
            </div>
          )}
          
          <div className="answer-text">{answer}</div>
          
          {confidence !== null && (
            <div className="confidence-container">
              <span className={`confidence-badge ${getConfidenceLevel(confidence)}`}>
                {getConfidenceLevel(confidence) === "high" && "✓"}
                {getConfidenceLevel(confidence) === "medium" && "~"}
                {getConfidenceLevel(confidence) === "low" && "!"}
                {(confidence * 100).toFixed(2)}% Confident
              </span>
            </div>
          )}
        </div>
      )}

      {/* Helpful Tips */}
      {!preview && !loading && !answer && (
        <div style={{
          marginTop: "2rem",
          padding: "1.5rem",
          backgroundColor: "#f0f9ff",
          borderRadius: "12px",
          border: "1px solid #bfdbfe"
        }}>
          <h3 style={{ color: "#1e40af", marginBottom: "0.75rem", fontSize: "1.1rem" }}>
            💡 Tips for better results
          </h3>
          <ul style={{
            color: "#1e3a8a",
            paddingLeft: "1.5rem",
            lineHeight: "1.8"
          }}>
            <li>Use clear, well-lit images</li>
            <li>Ask specific questions about visible elements</li>
            <li>Questions work best when they're direct and focused</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default VQAForm;
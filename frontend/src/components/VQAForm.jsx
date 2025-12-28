import React, { useState } from "react";
import "../App.css";

const VQAForm = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [loading, setLoading] = useState(false); // <-- loader state

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
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

    setLoading(true); // start loader
    setAnswer(""); // clear previous answer
    setConfidence(null);

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
    } catch (err) {
      console.error(err);
      setAnswer("Error processing request");
      setConfidence(null);
    } finally {
      setLoading(false); // stop loader
    }
  };

  return (
    <div className="container">
      <h1>Visual Question Answering</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        <input
          type="text"
          placeholder="Enter your question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="submit">Ask</button>
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
          <p>Processing...</p>
        </div>
      )}

      {/* Answer and confidence */}
      {!loading && answer && (
        <div className="result-card">
          <div className="answer-text">{answer}</div>
          {confidence !== null && (
            <div className="confidence-container">
              <span
                className={`confidence-badge ${
                  confidence >= 0.8
                    ? "high"
                    : confidence >= 0.5
                    ? "medium"
                    : "low"
                }`}
              >
                {Math.round(confidence * 100)}% confident
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VQAForm;

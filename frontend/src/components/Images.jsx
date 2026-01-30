// frontend/src/components/Images.jsx - Enhanced Gallery with Split Views
import React, { useEffect, useState } from "react";

const Images = () => {
  const [vqaImages, setVqaImages] = useState([]);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [loadingVQA, setLoadingVQA] = useState(true);
  const [loadingGenerated, setLoadingGenerated] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageQuestions, setImageQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [activeTab, setActiveTab] = useState("vqa"); // "vqa" or "generated"
  const [selectedGenerated, setSelectedGenerated] = useState(null);

  useEffect(() => {
    fetchVQAImages();
    fetchGeneratedImages();
  }, []);

  const fetchVQAImages = async () => {
    try {
      const res = await fetch("http://localhost:8000/images/");
      if (!res.ok) throw new Error("Failed to fetch VQA images");
      const data = await res.json();
      setVqaImages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVQA(false);
    }
  };

  const fetchGeneratedImages = async () => {
    try {
      const res = await fetch("http://localhost:8000/generated-images/");
      if (!res.ok) throw new Error("Failed to fetch generated images");
      const data = await res.json();
      setGeneratedImages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGenerated(false);
    }
  };

  const fetchImageQuestions = async (imageId) => {
    setLoadingQuestions(true);
    try {
      const res = await fetch(`http://localhost:8000/images/${imageId}/questions/`);
      if (!res.ok) throw new Error("Failed to fetch questions");
      const data = await res.json();
      setImageQuestions(data);
    } catch (err) {
      console.error(err);
      setImageQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleVQAImageClick = (image) => {
    setSelectedImage(image);
    fetchImageQuestions(image.image_id);
  };

  const handleGeneratedImageClick = (image) => {
    setSelectedGenerated(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
    setSelectedGenerated(null);
    setImageQuestions([]);
  };

  const handleDownload = (imageData, filename) => {
    const link = document.createElement("a");
    link.href = imageData;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const LoadingSpinner = () => (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "40vh",
      gap: "1rem"
    }}>
      <div className="loader"></div>
      <p style={{ color: "#ffffffff", fontSize: "1.1rem" }}>Loading gallery...</p>
    </div>
  );

  const EmptyState = ({ type }) => (
    <div style={{
      textAlign: "center",
      padding: "4rem 2rem",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderRadius: "16px",
      maxWidth: "600px",
      margin: "2rem auto",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
    }}>
      <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>
        {type === "vqa" ? "🔍" : "🎨"}
      </div>
      <h2 style={{ color: "#1f2937", marginBottom: "0.5rem" }}>
        {type === "vqa" ? "No VQA Images Yet" : "No Generated Images Yet"}
      </h2>
      <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
        {type === "vqa" 
          ? "Upload images and ask questions to see them here!"
          : "Generate your first AI image to start your collection!"}
      </p>
      <a
        href={type === "vqa" ? "/vqa" : "/text-to-image"}
        style={{
          display: "inline-block",
          padding: "0.75rem 1.5rem",
          background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
          color: "white",
          textDecoration: "none",
          borderRadius: "8px",
          fontWeight: "600",
          transition: "all 0.3s ease"
        }}
        onMouseOver={(e) => e.target.style.transform = "translateY(-2px)"}
        onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
      >
        Get Started
      </a>
    </div>
  );

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", color: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}>
          🖼️ Gallery
        </h1>
        <p style={{ color: "#e5e7eb", fontSize: "1.1rem" }}>
          Browse your VQA images and AI-generated masterpieces
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: "flex",
        gap: "1rem",
        justifyContent: "center",
        marginBottom: "2rem",
        flexWrap: "wrap"
      }}>
        <button
          onClick={() => setActiveTab("vqa")}
          style={{
            padding: "0.875rem 2rem",
            fontSize: "1rem",
            fontWeight: "600",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            transition: "all 0.3s ease",
            background: activeTab === "vqa" 
              ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
              : "rgba(255, 255, 255, 0.1)",
            color: activeTab === "vqa" ? "white" : "#e5e7eb",
            boxShadow: activeTab === "vqa" ? "0 4px 6px -1px rgba(0, 0, 0, 0.2)" : "none",
            transform: activeTab === "vqa" ? "translateY(-2px)" : "none"
          }}
        >
          🔍 VQA Images ({vqaImages.length})
        </button>
        <button
          onClick={() => setActiveTab("generated")}
          style={{
            padding: "0.875rem 2rem",
            fontSize: "1rem",
            fontWeight: "600",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            transition: "all 0.3s ease",
            background: activeTab === "generated"
              ? "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
              : "rgba(255, 255, 255, 0.1)",
            color: activeTab === "generated" ? "white" : "#e5e7eb",
            boxShadow: activeTab === "generated" ? "0 4px 6px -1px rgba(0, 0, 0, 0.2)" : "none",
            transform: activeTab === "generated" ? "translateY(-2px)" : "none"
          }}
        >
          🎨 Generated Images ({generatedImages.length})
        </button>
      </div>

      {/* VQA Images Tab */}
      {activeTab === "vqa" && (
        <div className="fade-in">
          {loadingVQA ? (
            <LoadingSpinner />
          ) : vqaImages.length === 0 ? (
            <EmptyState type="vqa" />
          ) : (
            <div className="images-container">
              {vqaImages.map((img) => (
                <div
                  key={img.image_id}
                  className="image-card"
                  onClick={() => handleVQAImageClick(img)}
                  style={{
                    position: "relative",
                    overflow: "hidden"
                  }}
                >
                  {img.image_data ? (
                    <img src={img.image_data} alt={img.filename} />
                  ) : (
                    <div style={{
                      width: "100%",
                      height: "180px",
                      backgroundColor: "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "6px",
                      marginBottom: "0.75rem"
                    }}>
                      <span style={{ color: "#9ca3af" }}>Image not available</span>
                    </div>
                  )}
                  <div className="image-info">
                    <strong>{img.filename}</strong>
                    <p style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      color: "#6366f1",
                      fontWeight: "600",
                      marginTop: "0.5rem"
                    }}>
                      <span>💬</span> {img.questions_count} question{img.questions_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Generated Images Tab */}
      {activeTab === "generated" && (
        <div className="fade-in">
          {loadingGenerated ? (
            <LoadingSpinner />
          ) : generatedImages.length === 0 ? (
            <EmptyState type="generated" />
          ) : (
            <div className="images-container">
              {generatedImages.map((img) => (
                <div
                  key={img.generated_image_id}
                  className="image-card"
                  onClick={() => handleGeneratedImageClick(img)}
                  style={{
                    position: "relative",
                    overflow: "hidden"
                  }}
                >
                  <img src={img.image_data} alt={img.prompt} />
                  <div className="image-info">
                    <strong style={{ 
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {img.prompt.substring(0, 50)}...
                    </strong>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "0.5rem",
                      fontSize: "0.875rem",
                      color: "#6b7280"
                    }}>
                      <span>🎲 {img.seed}</span>
                      <span>👁️ {img.view_count || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VQA Modal */}
      {selectedImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
            animation: "fadeIn 0.3s ease",
            backdropFilter: "blur(5px)"
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "20px",
              maxWidth: "900px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              position: "relative",
              animation: "slideUp 0.4s ease"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              style={{
                position: "sticky",
                top: "1rem",
                right: "1rem",
                float: "right",
                background: "white",
                border: "none",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                color: "#6b7280",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                zIndex: 10,
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "scale(1.1)";
                e.target.style.backgroundColor = "#f3f4f6";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "scale(1)";
                e.target.style.backgroundColor = "white";
              }}
            >
              ×
            </button>

            <div style={{ padding: "2rem" }}>
              <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                {selectedImage.image_data && (
                  <img
                    src={selectedImage.image_data}
                    alt={selectedImage.filename}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "400px",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                    }}
                  />
                )}
                <h2 style={{ marginTop: "1rem", color: "#1f2937" }}>
                  {selectedImage.filename}
                </h2>
              </div>

              <div>
                <h3 style={{
                  fontSize: "1.5rem",
                  color: "#1f2937",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}>
                  💬 Questions & Answers
                </h3>

                {loadingQuestions ? (
                  <div style={{ textAlign: "center", padding: "2rem" }}>
                    <div className="loader" style={{ margin: "0 auto" }}></div>
                  </div>
                ) : imageQuestions.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {imageQuestions.map((qa, index) => (
                      <div
                        key={qa.question_id}
                        style={{
                          padding: "1.25rem",
                          backgroundColor: "#f9fafb",
                          borderRadius: "12px",
                          borderLeft: "4px solid #6366f1",
                          transition: "all 0.3s ease"
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = "#f3f4f6";
                          e.currentTarget.style.transform = "translateX(5px)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = "#f9fafb";
                          e.currentTarget.style.transform = "translateX(0)";
                        }}
                      >
                        <div style={{
                          fontWeight: "600",
                          color: "#1f2937",
                          marginBottom: "0.5rem",
                          display: "flex",
                          alignItems: "start",
                          gap: "0.5rem"
                        }}>
                          <span style={{ color: "#6366f1" }}>Q{index + 1}:</span>
                          {qa.question}
                        </div>
                        <div style={{
                          color: "#6b7280",
                          paddingLeft: "1.75rem",
                          lineHeight: "1.6"
                        }}>
                          <strong style={{ color: "#10b981" }}>A:</strong> {qa.answer || "No answer yet"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    textAlign: "center",
                    padding: "2rem",
                    color: "#6b7280",
                    backgroundColor: "#f9fafb",
                    borderRadius: "12px"
                  }}>
                    No questions asked yet for this image
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generated Image Modal */}
      {selectedGenerated && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
            animation: "fadeIn 0.3s ease",
            backdropFilter: "blur(5px)"
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "20px",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              position: "relative",
              animation: "slideUp 0.4s ease"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              style={{
                position: "sticky",
                top: "1rem",
                right: "1rem",
                float: "right",
                background: "white",
                border: "none",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                color: "#6b7280",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                zIndex: 10,
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "scale(1.1)";
                e.target.style.backgroundColor = "#f3f4f6";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "scale(1)";
                e.target.style.backgroundColor = "white";
              }}
            >
              ×
            </button>

            <div style={{ padding: "2rem" }}>
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <img
                  src={selectedGenerated.image_data}
                  alt={selectedGenerated.prompt}
                  style={{
                    maxWidth: "100%",
                    borderRadius: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                  }}
                />
              </div>

              <div style={{
                padding: "1.5rem",
                backgroundColor: "#f9fafb",
                borderRadius: "12px",
                marginBottom: "1rem"
              }}>
                <h3 style={{
                  color: "#1f2937",
                  marginBottom: "0.75rem",
                  fontSize: "1.1rem"
                }}>
                  ✨ Prompt
                </h3>
                <p style={{
                  color: "#6b7280",
                  lineHeight: "1.6",
                  marginBottom: "1rem"
                }}>
                  {selectedGenerated.prompt}
                </p>

                {selectedGenerated.negative_prompt && (
                  <>
                    <h3 style={{
                      color: "#1f2937",
                      marginBottom: "0.75rem",
                      fontSize: "1.1rem"
                    }}>
                      🚫 Negative Prompt
                    </h3>
                    <p style={{
                      color: "#6b7280",
                      lineHeight: "1.6"
                    }}>
                      {selectedGenerated.negative_prompt}
                    </p>
                  </>
                )}
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "0.75rem",
                marginBottom: "1rem"
              }}>
                <div style={{
                  padding: "1rem",
                  backgroundColor: "#eef2ff",
                  borderRadius: "8px",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>🎲</div>
                  <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Seed</div>
                  <div style={{ fontWeight: "600", color: "#1f2937" }}>{selectedGenerated.seed}</div>
                </div>
                <div style={{
                  padding: "1rem",
                  backgroundColor: "#f0fdf4",
                  borderRadius: "8px",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>📐</div>
                  <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Size</div>
                  <div style={{ fontWeight: "600", color: "#1f2937" }}>
                    {selectedGenerated.width} × {selectedGenerated.height}
                  </div>
                </div>
                <div style={{
                  padding: "1rem",
                  backgroundColor: "#fef3c7",
                  borderRadius: "8px",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>👁️</div>
                  <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Views</div>
                  <div style={{ fontWeight: "600", color: "#1f2937" }}>{selectedGenerated.view_count || 0}</div>
                </div>
                <div style={{
                  padding: "1rem",
                  backgroundColor: "#fce7f3",
                  borderRadius: "8px",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>📥</div>
                  <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Downloads</div>
                  <div style={{ fontWeight: "600", color: "#1f2937" }}>{selectedGenerated.download_count || 0}</div>
                </div>
              </div>

              <button
                onClick={() => handleDownload(selectedGenerated.image_data, selectedGenerated.filename)}
                style={{
                  width: "100%",
                  padding: "0.875rem",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  fontSize: "1rem",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
                onMouseOver={(e) => e.target.style.transform = "translateY(-2px)"}
                onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
              >
                📥 Download Image
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Images;
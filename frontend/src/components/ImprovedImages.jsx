import React, { useEffect, useState } from "react";

const ImprovedImages = () => {
  const [vqaImages, setVqaImages] = useState([]);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageQuestions, setImageQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [activeTab, setActiveTab] = useState('vqa'); // 'vqa' or 'generated'

  useEffect(() => {
    fetchAllImages();
  }, []);

  const fetchAllImages = async () => {
    setLoading(true);
    try {
      const [vqaRes, genRes] = await Promise.all([
        fetch("http://localhost:8000/images/"),
        fetch("http://localhost:8000/generated-images/")
      ]);

      if (vqaRes.ok) {
        const vqaData = await vqaRes.json();
        setVqaImages(vqaData);
      }

      if (genRes.ok) {
        const genData = await genRes.json();
        setGeneratedImages(genData);
      }
    } catch (err) {
      console.error("Error fetching images:", err);
    } finally {
      setLoading(false);
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
    setSelectedImage({ ...image, type: 'vqa' });
    fetchImageQuestions(image.image_id);
  };

  const handleGeneratedImageClick = (image) => {
    setSelectedImage({ ...image, type: 'generated' });
    setImageQuestions([]);
  };

  const closeModal = () => {
    setSelectedImage(null);
    setImageQuestions([]);
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: "1rem"
      }}>
        <div style={{
          border: "4px solid #f3f4f6",
          borderTop: "4px solid #6366f1",
          borderRadius: "50%",
          width: "48px",
          height: "48px",
          animation: "spin 0.8s linear infinite"
        }}></div>
        <p style={{ color: "#6b7280", fontSize: "1.1rem" }}>Loading your gallery...</p>
      </div>
    );
  }

  const totalImages = vqaImages.length + generatedImages.length;

  if (totalImages === 0) {
    return (
      <div style={{
        textAlign: "center",
        padding: "4rem 2rem",
        backgroundColor: "white",
        borderRadius: "16px",
        maxWidth: "600px",
        margin: "2rem auto",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
      }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🖼️</div>
        <h2 style={{ color: "#1f2937", marginBottom: "0.5rem" }}>No images yet</h2>
        <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
          Start by uploading an image and asking questions, or generate AI art!
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <a
            href="/vqa"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
              fontWeight: "600"
            }}
          >
            Ask Questions
          </a>
          <a
            href="/text-to-image"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
              fontWeight: "600"
            }}
          >
            Generate Art
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{
        maxWidth: "1600px",
        margin: "0 auto",
        padding: "2rem"
      }}>
        {/* Header */}
        <div style={{
          textAlign: "center",
          marginBottom: "2rem"
        }}>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", color: "#1f2937" }}>
            🎨 Visual Gallery
          </h1>
          <p style={{ color: "#6b7280", fontSize: "1.1rem" }}>
            {totalImages} image{totalImages !== 1 ? 's' : ''} in your collection
          </p>
        </div>

        {/* Two Column Layout */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
          marginBottom: "2rem"
        }}>
          {/* VQA Images Section */}
          <div style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "1.5rem",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.5rem",
              paddingBottom: "1rem",
              borderBottom: "2px solid #e5e7eb"
            }}>
              <h2 style={{
                fontSize: "1.5rem",
                color: "#1f2937",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                margin: 0
              }}>
                🔍 Question & Answer Images
              </h2>
              <span style={{
                backgroundColor: "#eef2ff",
                color: "#6366f1",
                padding: "0.25rem 0.75rem",
                borderRadius: "9999px",
                fontSize: "0.875rem",
                fontWeight: "600"
              }}>
                {vqaImages.length}
              </span>
            </div>

            {vqaImages.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "3rem 1rem",
                color: "#9ca3af"
              }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💭</div>
                <p>No Q&A images yet</p>
                <a
                  href="/vqa"
                  style={{
                    display: "inline-block",
                    marginTop: "1rem",
                    padding: "0.5rem 1rem",
                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    fontWeight: "600"
                  }}
                >
                  Upload & Ask
                </a>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "1rem",
                maxHeight: "70vh",
                overflowY: "auto",
                padding: "0.5rem"
              }}>
                {vqaImages.map((img) => (
                  <div
                    key={img.image_id}
                    onClick={() => handleVQAImageClick(img)}
                    style={{
                      backgroundColor: "#f9fafb",
                      borderRadius: "12px",
                      padding: "0.75rem",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      border: "2px solid transparent"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
                      e.currentTarget.style.borderColor = "#6366f1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.borderColor = "transparent";
                    }}
                  >
                    {img.image_data ? (
                      <img
                        src={img.image_data}
                        alt={img.filename}
                        style={{
                          width: "100%",
                          height: "140px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          marginBottom: "0.5rem"
                        }}
                      />
                    ) : (
                      <div style={{
                        width: "100%",
                        height: "140px",
                        backgroundColor: "#e5e7eb",
                        borderRadius: "8px",
                        marginBottom: "0.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#9ca3af",
                        fontSize: "0.75rem"
                      }}>
                        No preview
                      </div>
                    )}
                    <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.25rem" }}>
                      <strong style={{ color: "#1f2937" }}>{img.filename}</strong>
                    </div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      fontSize: "0.75rem",
                      color: "#6366f1",
                      fontWeight: "600"
                    }}>
                      <span>💬</span> {img.questions_count} Q&A
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Generated Images Section */}
          <div style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "1.5rem",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.5rem",
              paddingBottom: "1rem",
              borderBottom: "2px solid #e5e7eb"
            }}>
              <h2 style={{
                fontSize: "1.5rem",
                color: "#1f2937",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                margin: 0
              }}>
                🎨 AI Generated Images
              </h2>
              <span style={{
                backgroundColor: "#f0fdf4",
                color: "#10b981",
                padding: "0.25rem 0.75rem",
                borderRadius: "9999px",
                fontSize: "0.875rem",
                fontWeight: "600"
              }}>
                {generatedImages.length}
              </span>
            </div>

            {generatedImages.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "3rem 1rem",
                color: "#9ca3af"
              }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✨</div>
                <p>No AI art yet</p>
                <a
                  href="/text-to-image"
                  style={{
                    display: "inline-block",
                    marginTop: "1rem",
                    padding: "0.5rem 1rem",
                    background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    fontWeight: "600"
                  }}
                >
                  Generate Art
                </a>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "1rem",
                maxHeight: "70vh",
                overflowY: "auto",
                padding: "0.5rem"
              }}>
                {generatedImages.map((img, idx) => (
                  <div
                    key={img.generated_image_id || idx}
                    onClick={() => handleGeneratedImageClick(img)}
                    style={{
                      backgroundColor: "#f9fafb",
                      borderRadius: "12px",
                      padding: "0.75rem",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      border: "2px solid transparent"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
                      e.currentTarget.style.borderColor = "#8b5cf6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.borderColor = "transparent";
                    }}
                  >
                    <img
                      src={img.image_data}
                      alt={img.prompt}
                      style={{
                        width: "100%",
                        height: "140px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        marginBottom: "0.5rem"
                      }}
                    />
                    <div style={{
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      marginBottom: "0.25rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {img.prompt?.substring(0, 40)}...
                    </div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.7rem",
                      color: "#9ca3af"
                    }}>
                      <span>🎲 {img.seed}</span>
                      <span>👁️ {img.view_count || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for Image Details */}
      {selectedImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
            animation: "fadeIn 0.3s ease"
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              maxWidth: "900px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              position: "relative"
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
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                zIndex: 10
              }}
            >
              ×
            </button>

            <div style={{ padding: "2rem" }}>
              <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <img
                  src={selectedImage.image_data}
                  alt={selectedImage.filename || selectedImage.prompt}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "400px",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                  }}
                />
                <h2 style={{ marginTop: "1rem", color: "#1f2937" }}>
                  {selectedImage.filename || selectedImage.prompt?.substring(0, 60)}
                </h2>
                
                {selectedImage.type === 'generated' && (
                  <div style={{
                    marginTop: "1rem",
                    display: "flex",
                    gap: "1rem",
                    justifyContent: "center",
                    flexWrap: "wrap"
                  }}>
                    <span style={{
                      backgroundColor: "#f3f4f6",
                      padding: "0.5rem 1rem",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      color: "#6b7280"
                    }}>
                      🎲 Seed: {selectedImage.seed}
                    </span>
                    <span style={{
                      backgroundColor: "#f3f4f6",
                      padding: "0.5rem 1rem",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      color: "#6b7280"
                    }}>
                      📐 {selectedImage.width}×{selectedImage.height}
                    </span>
                    <span style={{
                      backgroundColor: "#f3f4f6",
                      padding: "0.5rem 1rem",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      color: "#6b7280"
                    }}>
                      👁️ {selectedImage.view_count || 0} views
                    </span>
                  </div>
                )}
              </div>

              {selectedImage.type === 'vqa' && (
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
                      <div style={{
                        border: "4px solid #f3f4f6",
                        borderTop: "4px solid #6366f1",
                        borderRadius: "50%",
                        width: "48px",
                        height: "48px",
                        animation: "spin 0.8s linear infinite",
                        margin: "0 auto"
                      }}></div>
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
                            borderLeft: "4px solid #6366f1"
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
              )}

              {selectedImage.type === 'generated' && selectedImage.prompt && (
                <div style={{ marginTop: "1.5rem" }}>
                  <h3 style={{
                    fontSize: "1.25rem",
                    color: "#1f2937",
                    marginBottom: "0.75rem"
                  }}>
                    ✨ Prompt
                  </h3>
                  <p style={{
                    backgroundColor: "#f9fafb",
                    padding: "1rem",
                    borderRadius: "8px",
                    color: "#6b7280",
                    lineHeight: "1.6",
                    border: "1px solid #e5e7eb"
                  }}>
                    {selectedImage.prompt}
                  </p>
                  
                  {selectedImage.negative_prompt && (
                    <>
                      <h3 style={{
                        fontSize: "1.25rem",
                        color: "#1f2937",
                        marginBottom: "0.75rem",
                        marginTop: "1rem"
                      }}>
                        🚫 Negative Prompt
                      </h3>
                      <p style={{
                        backgroundColor: "#fef2f2",
                        padding: "1rem",
                        borderRadius: "8px",
                        color: "#991b1b",
                        lineHeight: "1.6",
                        border: "1px solid #fecaca"
                      }}>
                        {selectedImage.negative_prompt}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default ImprovedImages;
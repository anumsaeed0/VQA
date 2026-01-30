import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Home.css";

// Note: Make sure to update App.jsx to import and route to this Home component

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalImages: 0,
    completedImages: 0,
    totalViews: 0,
    totalDownloads: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:8000/generation-statistics/");
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalImages: data.total_images || 0,
          completedImages: data.completed_images || 0,
          totalViews: data.total_views || 0,
          totalDownloads: data.total_downloads || 0
        });
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const features = [
    {
      icon: "🔍",
      title: "Visual Question Answering",
      description: "Upload any image and ask questions about it. Our AI analyzes and provides intelligent answers about what it sees.",
      route: "/enhanced-vqa",
      gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      bgColor: "#eef2ff"
    },
    {
      icon: "🎨",
      title: "Text-to-Image Generation",
      description: "Transform your imagination into reality. Describe what you want and watch AI create stunning images from your words.",
      route: "/text-to-image",
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
      bgColor: "#faf5ff"
    },
    {
      icon: "🖼️",
      title: "Smart Gallery",
      description: "Browse, search, and manage all your VQA images and AI-generated creations in one organized place.",
      route: "/images",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      bgColor: "#ecfdf5"
    }
  ];

  const useCases = [
    {
      icon: "📚",
      title: "Education & Learning",
      description: "Analyze diagrams, identify objects in photos, and generate educational illustrations"
    },
    {
      icon: "🎭",
      title: "Creative Design",
      description: "Create unique artwork, design concepts, and visual content for projects"
    },
    {
      icon: "🔬",
      title: "Research & Analysis",
      description: "Analyze images for scientific purposes and generate visual representations"
    },
    {
      icon: "💼",
      title: "Business & Marketing",
      description: "Create marketing visuals, analyze product images, and generate brand content"
    }
  ];

  const handleGetStarted = () => {
    navigate("/enhanced-vqa");
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            Powered by Advanced AI Models
          </div>
          
          <h1 className="hero-title">
            Welcome to
            <span className="gradient-text"> VisionFusion AI</span>
          </h1>
          
          <p className="hero-subtitle">
            See It. Ask It. Create It.
          </p>
          
          <p className="hero-description">
            Experience the power of multimodal AI with cutting-edge Visual Question Answering 
            and Text-to-Image generation. Transform how you interact with visual content.
          </p>

          <div className="hero-buttons">
            <button 
              className="btn-primary"
              onClick={handleGetStarted}
            >
              <span>🚀</span>
              Get Started Free
            </button>
            <button 
              className="btn-secondary"
              onClick={() => navigate("/images")}
            >
              <span>🖼️</span>
              View Gallery
            </button>
          </div>

          {/* Stats Bar */}
          <div className="stats-bar">
            <div className="stat-item">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalImages}+</div>
                <div className="stat-label">Total Images</div>
              </div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-value">{stats.completedImages}+</div>
                <div className="stat-label">Completed</div>
              </div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-icon">👁️</div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalViews}+</div>
                <div className="stat-label">Total Views</div>
              </div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-icon">📥</div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalDownloads}+</div>
                <div className="stat-label">Downloads</div>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Background Elements */}
        <div className="hero-background">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
          <div className="floating-shape shape-4"></div>
          <div className="floating-shape shape-5"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">
            Powerful Features
            <span className="title-accent"> at Your Fingertips</span>
          </h2>
          <p className="section-description">
            Explore the capabilities of our multimodal AI platform
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="feature-card"
              style={{ 
                animationDelay: `${index * 0.1}s`,
                background: feature.bgColor
              }}
              onClick={() => navigate(feature.route)}
            >
              <div className="feature-icon" style={{ background: feature.gradient }}>
                <span>{feature.icon}</span>
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <button 
                className="feature-button"
                style={{ background: feature.gradient }}
              >
                Try Now →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="section-header">
          <h2 className="section-title">
            How It
            <span className="title-accent"> Works</span>
          </h2>
          <p className="section-description">
            Get started in three simple steps
          </p>
        </div>

        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-content">
              <div className="step-icon">📤</div>
              <h3 className="step-title">Upload or Describe</h3>
              <p className="step-description">
                Upload an image for VQA or write a text description for image generation
              </p>
            </div>
          </div>

          <div className="step-arrow">→</div>

          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-content">
              <div className="step-icon">🤖</div>
              <h3 className="step-title">AI Processing</h3>
              <p className="step-description">
                Our advanced AI models analyze your input and generate intelligent responses
              </p>
            </div>
          </div>

          <div className="step-arrow">→</div>

          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-content">
              <div className="step-icon">✨</div>
              <h3 className="step-title">Get Results</h3>
              <p className="step-description">
                Receive answers or download your AI-generated images instantly
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="use-cases-section">
        <div className="section-header">
          <h2 className="section-title">
            Perfect For
            <span className="title-accent"> Every Need</span>
          </h2>
          <p className="section-description">
            Discover how VisionFusion AI can help you
          </p>
        </div>

        <div className="use-cases-grid">
          {useCases.map((useCase, index) => (
            <div 
              key={index}
              className="use-case-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="use-case-icon">{useCase.icon}</div>
              <h3 className="use-case-title">{useCase.title}</h3>
              <p className="use-case-description">{useCase.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="tech-section">
        <div className="section-header">
          <h2 className="section-title">
            Built With
            <span className="title-accent"> Cutting-Edge Technology</span>
          </h2>
        </div>

        <div className="tech-grid">
          <div className="tech-item">
            <div className="tech-icon">🧠</div>
            <h4>LLaVA 1.5</h4>
            <p>Visual Question Answering</p>
          </div>
          <div className="tech-item">
            <div className="tech-icon">🎨</div>
            <h4>Stable Diffusion</h4>
            <p>Text-to-Image Generation</p>
          </div>
          <div className="tech-item">
            <div className="tech-icon">⚡</div>
            <h4>FastAPI</h4>
            <p>High-Performance Backend</p>
          </div>
          <div className="tech-item">
            <div className="tech-icon">⚛️</div>
            <h4>React</h4>
            <p>Modern Frontend</p>
          </div>
          <div className="tech-item">
            <div className="tech-icon">🗄️</div>
            <h4>SQL Server</h4>
            <p>Robust Database</p>
          </div>
          <div className="tech-item">
            <div className="tech-icon">🔥</div>
            <h4>PyTorch</h4>
            <p>Deep Learning Framework</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">
            Ready to Experience the Future of AI?
          </h2>
          <p className="cta-description">
            Join thousands of users already leveraging VisionFusion AI for their creative and analytical needs
          </p>
          <button 
            className="cta-button"
            onClick={handleGetStarted}
          >
            <span>🚀</span>
            Start Creating Now
            <span className="button-shimmer"></span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>
              <span style={{ color: "#ffffff" }}>VisionFusion</span>
              <span style={{ color: "#60a5fa" }}> AI</span>
            </h3>
            <p>Empowering creativity with AI</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Features</h4>
              <a href="/enhanced-vqa">Visual Q&A</a>
              <a href="/text-to-image">Image Generation</a>
              <a href="/images">Gallery</a>
            </div>
            <div className="footer-column">
              <h4>Resources</h4>
              <a href="#docs">Documentation</a>
              <a href="#api">API Reference</a>
              <a href="#support">Support</a>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <a href="#about">About Us</a>
              <a href="#contact">Contact</a>
              <a href="#privacy">Privacy</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 VisionFusion AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
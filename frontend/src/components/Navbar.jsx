import React from "react";
import "../App.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="nav-left"></div> {/* empty left placeholder */}
      
      <div className="text-logo single-line">
        <a href="/">
          <span className="logo-main">VisionFusion</span>
          <span className="logo-accent">AI</span>
          <span className="logo-separator"> — </span>
          <span className="logo-desc">
            See It, Ask It, Create It.
          </span>
        </a>
        
      </div>

      <div className="nav-right">
        <ul className="nav-list">
          <li className="nav-item">
            <a href="/images" className="nav-link">Gallery</a>
          </li>
          {/* <li className="nav-item">
            <a href="/vqa" className="nav-link">Insight</a>
          </li> */}
          <li className="nav-item">
            <a href="/enhanced-vqa" className="nav-link">Insight</a>
          </li>
          <li className="nav-item">
            <a href="/text-to-image" className="nav-link">Imagine</a>
          </li>
          {/* <li className="nav-item">
            <a href="/improved-images" className="nav-link">Enhance</a>
          </li> */}
          
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;

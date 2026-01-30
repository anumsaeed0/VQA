import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/Home";
import VQAForm from "./components/VQAForm";
import Images from "./components/Images";
import TextToImage from "./components/TextToImage";
import Navbar from "./components/Navbar";
// import ImprovedImages from "./components/ImprovedImages";
import EnhancedVQAForm from "./components/EnhancedVQAForm";

function App() {
  return (
    <Router>
      <Navbar />
      <div style={{ padding: "0rem" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vqa" element={<VQAForm />} />
          <Route path="/images" element={<Images />} />
          <Route path="/text-to-image" element={<TextToImage />} />
          {/* <Route path='/improved-images' element={<ImprovedImages />} /> */}
          <Route path="/enhanced-vqa" element={<EnhancedVQAForm />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
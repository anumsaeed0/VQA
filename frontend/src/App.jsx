import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VQAForm from "./components/VQAForm";
import Images from "./components/Images";
import Navbar from "./components/Navbar";

function App() {
  return (
    <Router>
      <Navbar />
      <div style={{ padding: "2rem" }}>
        <Routes>
          <Route path="/vqa" element={<VQAForm />} />
          <Route path="/images" element={<Images />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

import React, { useEffect, useState } from "react";

const Images = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const res = await fetch("http://localhost:8000/images/");
      if (!res.ok) throw new Error("Failed to fetch images");
      const data = await res.json();
      setImages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading images...</p>;

  if (images.length === 0) return <p>No images found.</p>;

  return (
    <div className="images-container">
      {images.map((img) => (
        <div key={img.image_id} className="image-card">
          <img src={img.image_data} alt={img.filename} />
          <div className="image-info">
            <p><strong>{img.filename}</strong></p>
            <p>Questions: {img.questions_count}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Images;

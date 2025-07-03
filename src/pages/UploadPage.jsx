import { useEffect, useState } from "react";
import Select from "react-select";
import { COLOR_OPTIONS } from "../constants/colorOptions";
import { db, auth } from "../services/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const OPTIONS = {
  productLines: ["Enviroshake", "Enviroshingle", "EnviroSlate"],
  roofTags: [
    "Gable", "Gambrel", "Hip", "Mansard", "Siding", "Dormer", "Eyebrow", "Flared Rake", "Rake Metal",
    "Skylight", "Snow Guards", "Solar Panels", "Staggered Coursing", "Steeple", "Straight Coursing",
    "Turret", "valleys"
  ],
  projectTypes: [
    "Barn", "Clubhouse", "Commercial", "Education", "Gazebo", "Historic", "HOA",
    "Hospitality", "Multifamily", "National Monument", "National Register of Historic Sites",
    "Religious", "Residential", "Retail"
  ],
  countries: ["Canada", "USA", "Caribbean", "Other"]
};

export default function UploadPage() {
  const [selectedColors, setSelectedColors] = useState([]);
  const [productLine, setProductLine] = useState(null);
  const [roofTags, setRoofTags] = useState([]);
  const [projectTags, setProjectTags] = useState([]);
  const [countryTags, setCountryTags] = useState([]);
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email) {
        setUserEmail(user.email.toLowerCase());
      }
    });
    return () => unsubscribe();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!file || !productLine || selectedColors.length === 0) {
      alert("Please fill out all required fields.");
      return;
    }

    if (!userEmail) {
      alert("You must be logged in to upload.");
      return;
    }

    setUploading(true);

    try {
      // Step 1: Get signed URL
      const res = await fetch("http://localhost:4000/generate-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
        }),
      });

      const { uploadURL, key } = await res.json();

      // Step 2: Upload to S3
      await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      // Step 3: Save to Firestore
      await addDoc(collection(db, "images"), {
        colors: selectedColors.map((c) => c.value),
        productLine: productLine.value,
        roofTags: roofTags.map((r) => r.value),
        projectTags: projectTags.map((p) => p.value),
        countryTags: countryTags.map((c) => c.value),
        notes,
        s3Key: key,
        uploadedBy: userEmail,
        timestamp: serverTimestamp(),
      });

      setMessage("✅ Image uploaded and saved!");
      setSelectedColors([]);
      setProductLine(null);
      setRoofTags([]);
      setProjectTags([]);
      setCountryTags([]);
      setNotes("");
      setFile(null);
    } catch (err) {
      console.error("❌ Upload failed:", err);
      alert("Upload failed. See console.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Upload a New Image</h2>

      <form onSubmit={handleSubmit} style={{ maxWidth: "600px" }}>
        <div style={{ marginBottom: "1rem" }}>
          <label><strong>Choose an image:</strong></label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label><strong>Select Product Line:</strong></label>
          <Select
            placeholder="Choose product line..."
            options={OPTIONS.productLines.map((p) => ({ label: p, value: p }))}
            value={productLine}
            onChange={setProductLine}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label><strong>Select Color Tags:</strong></label>
          <Select
            isMulti
            placeholder="Choose colors..."
            options={COLOR_OPTIONS.map((color) => ({ label: color, value: color }))}
            value={selectedColors}
            onChange={setSelectedColors}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label><strong>Roof Tags:</strong></label>
          <Select
            isMulti
            placeholder="Select roof features..."
            options={OPTIONS.roofTags.map((t) => ({ label: t, value: t }))}
            value={roofTags}
            onChange={setRoofTags}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label><strong>Project Tags:</strong></label>
          <Select
            isMulti
            placeholder="Select project types..."
            options={OPTIONS.projectTypes.map((t) => ({ label: t, value: t }))}
            value={projectTags}
            onChange={setProjectTags}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label><strong>Country Tags:</strong></label>
          <Select
            isMulti
            placeholder="Select countries..."
            options={OPTIONS.countries.map((c) => ({ label: c, value: c }))}
            value={countryTags}
            onChange={setCountryTags}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label><strong>Notes (optional):</strong></label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter any notes..."
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: uploading ? "#ccc" : "#2ecc71",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: uploading ? "not-allowed" : "pointer",
          }}
        >
          {uploading ? "Uploading..." : "Upload Image"}
        </button>

        {message && (
          <div style={{ marginTop: "1rem", color: "green" }}>{message}</div>
        )}
      </form>
    </div>
  );
}

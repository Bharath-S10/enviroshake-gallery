import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Select from "react-select";
import { COLOR_OPTIONS } from "../constants/colorOptions";

const BUCKET_URL = "https://enviroshake-gallery-images.s3.amazonaws.com";

const OPTIONS = {
  productLines: ["Enviroshake", "Enviroshingle", "EnviroSlate"],
  roofTags: [
    "Gable", "Gambrel", "Hip", "Mansard", "Siding",
    "Dormer", "Eyebrow", "Flared Rake", "Rake Metal",
    "Skylight", "Snow Guards", "Solar Panels",
    "Staggered Coursing", "Steeple", "Straight Coursing", "Turret", "valleys"
  ],
  projectTypes: [
    "Barn", "Clubhouse", "Commercial", "Education", "Gazebo", "Historic", "HOA",
    "Hospitality", "Multifamily", "National Monument",
    "National Register of Historic Sites", "Religious", "Residential", "Retail"
  ],
  countries: ["Canada", "USA", "Caribbean", "Other"]
};

export default function GalleryPage() {
  const [images, setImages] = useState([]);
  const [groups, setGroups] = useState({});
  const [userEmail, setUserEmail] = useState("");
  const [productLineFilter, setProductLineFilter] = useState([]);
  const [colorFilter, setColorFilter] = useState([]);
  const [roofTagFilter, setRoofTagFilter] = useState([]);
  const [projectTypeFilter, setProjectTypeFilter] = useState([]);
  const [countryFilter, setCountryFilter] = useState([]);
  const [groupFilter, setGroupFilter] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [expandedGroupId, setExpandedGroupId] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user?.email) setUserEmail(user.email.toLowerCase());
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!userEmail) return;

    const q = query(
      collection(db, "images"),
      where("uploadedBy", "==", userEmail),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const imageData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setImages(imageData);

      const groupIds = [...new Set(imageData.map((img) => img.groupId).filter(Boolean))];
      const groupDocs = await getDocs(collection(db, "imageGroups"));
      const groupMap = {};
      groupDocs.forEach(doc => {
        const data = doc.data();
        if (groupIds.includes(data.groupId)) {
          groupMap[data.groupId] = { ...data, docId: doc.id };
        }
      });
      setGroups(groupMap);
    });

    return () => unsubscribe();
  }, [userEmail]);

  const clearAllFilters = () => {
    setProductLineFilter([]);
    setColorFilter([]);
    setRoofTagFilter([]);
    setProjectTypeFilter([]);
    setCountryFilter([]);
    setGroupFilter("");
  };

  const matchesFilters = (img) => {
    const matchGroup = !groupFilter || img.groupId === groupFilter;
    const matchProductLine =
      productLineFilter.length === 0 || productLineFilter.some(f => f.value === img.productLine);
    const matchColors =
      colorFilter.length === 0 || colorFilter.some(f => img.colors?.includes(f.value));
    const matchRoof =
      roofTagFilter.length === 0 || roofTagFilter.some(f => img.roofTags?.includes(f.value));
    const matchProject =
      projectTypeFilter.length === 0 || projectTypeFilter.some(f => img.projectTags?.includes(f.value));
    const matchCountry =
      countryFilter.length === 0 || countryFilter.some(f => img.countryTags?.includes(f.value));

    return matchGroup && matchProductLine && matchColors && matchRoof && matchProject && matchCountry;
  };

  const filteredImages = images.filter(matchesFilters);
  const grouped = filteredImages.reduce((acc, img) => {
    const key = img.groupId || `ungrouped-${img.id}`;
    acc[key] = acc[key] || [];
    acc[key].push(img);
    return acc;
  }, {});
  const groupIds = Object.keys(grouped);

  const makeOptions = (arr) => arr.map(item => ({ label: item, value: item }));

  const handleGroupRename = async (groupId) => {
    if (!groups[groupId]?.docId) return;
    try {
      await updateDoc(doc(db, "imageGroups", groups[groupId].docId), {
        groupName: newGroupName
      });
      setEditingGroupId(null);
      setNewGroupName("");
    } catch (err) {
      console.error("Rename error", err);
      alert("Failed to rename group.");
    }
  };

  const downloadGroup = async (groupId) => {
    try {
      const res = await fetch(`http://localhost:4000/download-group/${groupId}`);
      if (!res.ok) throw new Error("Failed to generate ZIP");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${groupId}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download ZIP");
    }
  };

  return (
    <div style={{ paddingBottom: "3rem" }}>
      {/* NAVBAR */}
      <div style={{
        width: "100%",
        backgroundColor: "#09713c",
        color: "white",
        padding: "1rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxSizing: "border-box"
      }}>
        <h2 style={{
          margin: 0,
          fontSize: "1.5rem",
          fontWeight: "bold",
          flexGrow: 1,
          textAlign: "center"
        }}>
          Photo Gallery
        </h2>
        <button
          onClick={() => auth.signOut()}
          style={{
            background: "white",
            color: "#09713c",
            border: "none",
            padding: "0.4rem 0.8rem",
            borderRadius: "4px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </div>

      {/* FILTERS */}
      <div style={{ margin: "2rem 0", textAlign: "center" }}>
        <button onClick={clearAllFilters} style={{
          padding: "0.5rem 1rem",
          borderRadius: "6px",
          fontWeight: "bold",
          border: "none",
          backgroundColor: "#f3f3f3"
        }}>Clear Filters</button>
      </div>

      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "1rem",
        justifyContent: "center",
        marginBottom: "2rem",
        width: "100%",
        padding: "0 2rem",
        boxSizing: "border-box"
      }}>
        <Select isMulti placeholder="Filter by Product Line" options={makeOptions(OPTIONS.productLines)} value={productLineFilter} onChange={setProductLineFilter} />
        <Select isMulti placeholder="Filter by Colors" options={makeOptions(COLOR_OPTIONS)} value={colorFilter} onChange={setColorFilter} />
        <Select isMulti placeholder="Filter by Roof Tags" options={makeOptions(OPTIONS.roofTags)} value={roofTagFilter} onChange={setRoofTagFilter} />
        <Select isMulti placeholder="Filter by Project Type" options={makeOptions(OPTIONS.projectTypes)} value={projectTypeFilter} onChange={setProjectTypeFilter} />
        <Select isMulti placeholder="Filter by Country" options={makeOptions(OPTIONS.countries)} value={countryFilter} onChange={setCountryFilter} />
        <Select placeholder="Filter by Group ID" options={groupIds.map(id => ({ value: id, label: id }))} value={groupFilter ? { value: groupFilter, label: groupFilter } : null} onChange={(opt) => setGroupFilter(opt ? opt.value : "")} isClearable />
      </div>

      {/* IMAGE DISPLAY */}
      <div style={{ width: "100%", padding: "0 2rem", boxSizing: "border-box" }}>
        {groupIds.map((groupId) => {
          const groupImages = grouped[groupId];
          const firstImage = groupImages[0];
          const isGrouped = !!firstImage.groupId;
          const isExpanded = expandedGroupId === groupId;

          return (
            <div key={groupId} style={{ marginBottom: "2rem", border: "1px solid #ccc", padding: "1rem", borderRadius: "8px" }}>
              <h3>{isGrouped ? groups[groupId]?.groupName || groupId : "Single Image"}</h3>
              {isGrouped ? (
                <div
                  style={{ cursor: "pointer" }}
                  onClick={() => setExpandedGroupId(isExpanded ? null : groupId)}
                >
                  <img
                    src={`${BUCKET_URL}/${firstImage.s3Key}`}
                    alt="Thumbnail"
                    style={{ width: "220px", borderRadius: "8px" }}
                  />
                  <div><strong>Click to view all images</strong></div>
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                  <div key={firstImage.id} style={{ width: "220px", textAlign: "center", border: "1px solid #ccc", padding: "0.5rem", borderRadius: "8px" }}>
                    <img
                      src={`${BUCKET_URL}/${firstImage.s3Key}`}
                      alt="Uploaded"
                      onClick={() => setSelectedImage(`${BUCKET_URL}/${firstImage.s3Key}`)}
                      style={{ width: "100%", borderRadius: "6px", cursor: "zoom-in" }}
                    />
                    <div><strong>Colors:</strong> {(firstImage.colors || []).join(", ")}</div>
                    <div><strong>Roof Tags:</strong> {(firstImage.roofTags || []).join(", ")}</div>
                    <div><strong>Project Types:</strong> {(firstImage.projectTags || []).join(", ")}</div>
                    <div><strong>Country:</strong> {(firstImage.countryTags || []).join(", ")}</div>
                    <div><strong>Notes:</strong> {firstImage.notes || "-"}</div>
                  </div>
                </div>
              )}

              {isGrouped && isExpanded && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "1rem" }}>
                  {groupImages.map(img => (
                    <div key={img.id} style={{ width: "220px", textAlign: "center", border: "1px solid #ccc", padding: "0.5rem", borderRadius: "8px" }}>
                      <img
                        src={`${BUCKET_URL}/${img.s3Key}`}
                        alt="Uploaded"
                        onClick={() => setSelectedImage(`${BUCKET_URL}/${img.s3Key}`)}
                        style={{ width: "100%", borderRadius: "6px", cursor: "zoom-in" }}
                      />
                      <div><strong>Colors:</strong> {(img.colors || []).join(", ")}</div>
                      <div><strong>Roof Tags:</strong> {(img.roofTags || []).join(", ")}</div>
                      <div><strong>Project Types:</strong> {(img.projectTags || []).join(", ")}</div>
                      <div><strong>Country:</strong> {(img.countryTags || []).join(", ")}</div>
                      <div><strong>Notes:</strong> {img.notes || "-"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedImage && (
        <div onClick={() => setSelectedImage(null)} style={{
          position: "fixed",
          top: 0, left: 0, width: "100vw", height: "100vh",
          backgroundColor: "rgba(0,0,0,0.8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, cursor: "zoom-out"
        }}>
          <img src={selectedImage} alt="Full view" style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: "10px" }} />
        </div>
      )}
    </div>
  );
}

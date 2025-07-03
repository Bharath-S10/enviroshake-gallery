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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

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
  const allGroupIds = Object.keys(grouped);
  const totalPages = Math.ceil(allGroupIds.length / pageSize);
  const paginatedGroupIds = allGroupIds.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          backgroundColor: "#09713c",
          color: "white",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 1000,
          boxSizing: "border-box",
        }}
      >
        <div style={{ width: "120px" }} />
        <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "bold", textAlign: "center", flexGrow: 1 }}>Photo Gallery</h2>
        <div>
          <button
            onClick={() => auth.signOut()}
            style={{ background: "white", color: "#09713c", border: "none", padding: "0.4rem 0.8rem", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ marginTop: "100px", padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
          <button
            onClick={clearAllFilters}
            style={{ padding: "0.5rem 1rem", borderRadius: "6px", fontWeight: "bold", border: "none", backgroundColor: "#f3f3f3" }}
          >
            Clear Filters
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", maxWidth: "960px", margin: "0 auto" }}>
          <Select isMulti placeholder="Filter by Product Line" options={makeOptions(OPTIONS.productLines)} value={productLineFilter} onChange={setProductLineFilter} />
          <Select isMulti placeholder="Filter by Colors" options={makeOptions(COLOR_OPTIONS)} value={colorFilter} onChange={setColorFilter} />
          <Select isMulti placeholder="Filter by Roof Tags" options={makeOptions(OPTIONS.roofTags)} value={roofTagFilter} onChange={setRoofTagFilter} />
          <Select isMulti placeholder="Filter by Project Type" options={makeOptions(OPTIONS.projectTypes)} value={projectTypeFilter} onChange={setProjectTypeFilter} />
          <Select isMulti placeholder="Filter by Country" options={makeOptions(OPTIONS.countries)} value={countryFilter} onChange={setCountryFilter} />
          <Select placeholder="Filter by Group ID" options={allGroupIds.map(id => ({ value: id, label: id }))} value={groupFilter ? { value: groupFilter, label: groupFilter } : null} onChange={(opt) => setGroupFilter(opt ? opt.value : "")} isClearable />
        </div>

        <div style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1.5rem" }}>
          {paginatedGroupIds.map((groupId) => {
            const groupImages = grouped[groupId];
            const firstImage = groupImages[0];
            const groupMeta = groups[groupId];
            return (
              <div key={groupId} style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
                <h3>{groupMeta?.groupName || groupId}</h3>
                <p>Uploaded by: {groupMeta?.uploadedBy || "-"}<br />Created: {groupMeta?.timestamp?.toDate().toLocaleString() || "-"}</p>
                <img
                  src={`${BUCKET_URL}/${firstImage.s3Key}`}
                  alt="Group Thumbnail"
                  style={{ width: "100%", borderRadius: "6px", cursor: "pointer" }}
                  onClick={() => setExpandedGroupId(groupId)}
                />
                <button onClick={() => downloadGroup(groupId)} style={{ marginTop: "0.5rem" }}>Download Group</button>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>{"<< Prev"}</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              style={{ margin: "0 5px", fontWeight: page === currentPage ? "bold" : "normal" }}
            >
              {page}
            </button>
          ))}
          <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>{"Next >>"}</button>
        </div>
      </div>
    </>
  );
}

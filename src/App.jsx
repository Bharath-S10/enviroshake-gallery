import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import GalleryPage from "./pages/GalleryPage";
import ImageUpload from "./components/ImageUpload";
import ProtectedRoute from "./components/ProtectedRoute";
import LogoutButton from "./components/LogoutButton";
import DashboardPage from "./pages/DashboardPage"; // ✅ Import the new page

function App() {
  return (
    <Routes>
      {/* Login Route */}
      <Route path="/login" element={<Login />} />

      {/* Dashboard Route with two buttons */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <>
              <LogoutButton />
              <DashboardPage />
            </>
          </ProtectedRoute>
        }
      />

      {/* My Uploaded Images Route */}
      <Route
        path="/gallery"
        element={
          <ProtectedRoute>
            <>
              <LogoutButton />
              <GalleryPage />
            </>
          </ProtectedRoute>
        }
      />

      {/* Upload Image Route */}
      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <>
              <LogoutButton />
              <ImageUpload />
            </>
          </ProtectedRoute>
        }
      />

      {/* Default Route → Redirect to Dashboard (you can change to /login if preferred) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <>
              <LogoutButton />
              <DashboardPage />
            </>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;

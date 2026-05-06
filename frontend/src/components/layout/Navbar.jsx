import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import API from "../../api/api.js";
import "./Navbar.css";

const AVATAR_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
];

const getAvatarColor = (name = "") => {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};

const getInitials = (name = "") => {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
};

const Navbar = () => {
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleAvatarClick = () => {
    if (!uploading) fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = ""; // reset so same file can be re-picked
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select an image file.");
      setTimeout(() => setAvatarError(""), 3500);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Avatar must be under 2 MB.");
      setTimeout(() => setAvatarError(""), 3500);
      return;
    }

    setUploading(true);
    setAvatarError("");

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await API.put("/users/profile/picture", {
        profilePicture: base64,
      });
      updateUser(res.data.user);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to upload avatar. Try again.";
      setAvatarError(msg);
      setTimeout(() => setAvatarError(""), 4000);
    } finally {
      setUploading(false);
    }
  };

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="brand-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="20"
            height="20"
          >
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
        </div>
        <span className="brand-name">ChatApp</span>
      </Link>

      <div className="navbar-right">
        {isAuthenticated ? (
          <>
            {/* Avatar error toast */}
            {avatarError && (
              <div className="avatar-error-toast">{avatarError}</div>
            )}

            <div className="navbar-user-info">
              {/* Clickable avatar — opens file picker */}
              <button
                className={`navbar-avatar-btn ${uploading ? "uploading" : ""}`}
                onClick={handleAvatarClick}
                title="Click to change profile picture"
                type="button"
              >
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="navbar-avatar-img"
                  />
                ) : (
                  <div
                    className="navbar-avatar"
                    style={{ background: getAvatarColor(user?.name) }}
                  >
                    {uploading ? (
                      <span className="avatar-spinner" />
                    ) : (
                      getInitials(user?.name)
                    )}
                  </div>
                )}

                {/* Camera overlay */}
                {!uploading && (
                  <div className="avatar-camera-overlay">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      width="13"
                      height="13"
                    >
                      <path d="M12 15.2A3.2 3.2 0 1 1 12 8.8a3.2 3.2 0 0 1 0 6.4zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9z" />
                    </svg>
                  </div>
                )}

                {uploading && user?.profilePicture && (
                  <div className="avatar-upload-overlay">
                    <span className="avatar-spinner" />
                  </div>
                )}
              </button>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
              />

              <span className="navbar-username">{user?.name}</span>
            </div>

            <button className="navbar-logout-btn" onClick={handleLogout}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="16"
                height="16"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="logout-label">Logout</span>
            </button>
          </>
        ) : (
          <div className="nav-auth-links">
            <Link to="/login" className="nav-link-ghost">
              Sign In
            </Link>
            <Link to="/register" className="nav-link-solid">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;

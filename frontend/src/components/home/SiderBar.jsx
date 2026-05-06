import { useState } from "react";
import { useSocket } from "../../context/SocketContext.jsx";
import "./SideBar.css";

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

const SiderBar = ({
  contacts,
  allContacts,
  selectedUser,
  setSelectedUser,
  loading,
}) => {
  const [activeTab, setActiveTab] = useState("chats");
  const [search, setSearch] = useState("");
  const { onlineUsers } = useSocket() || { onlineUsers: [] };

  const isOnline = (userId) => onlineUsers.includes(userId);

  const filterList = (list) =>
    list.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()),
    );

  const displayList =
    activeTab === "chats" ? filterList(contacts) : filterList(allContacts);

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <h2 className="sidebar-title">Messages</h2>
        <span className="online-count">
          <span className="online-dot-small" />
          {onlineUsers.length} online
        </span>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <div className="search-wrapper">
          <svg
            className="search-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="16"
            height="16"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search people..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch("")}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${activeTab === "chats" ? "active" : ""}`}
          onClick={() => setActiveTab("chats")}
        >
          Chats
          {contacts.length > 0 && (
            <span className="tab-badge">{contacts.length}</span>
          )}
        </button>
        <button
          className={`sidebar-tab ${activeTab === "people" ? "active" : ""}`}
          onClick={() => setActiveTab("people")}
        >
          People
          {allContacts.length > 0 && (
            <span className="tab-badge">{allContacts.length}</span>
          )}
        </button>
      </div>

      {/* Contact List */}
      <div className="contacts-list">
        {loading ? (
          <div className="sidebar-loading">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-item">
                <div className="skeleton-avatar" />
                <div className="skeleton-text">
                  <div className="skeleton-line short" />
                  <div className="skeleton-line" />
                </div>
              </div>
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <div className="sidebar-empty">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              width="40"
              height="40"
            >
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
            <p>
              {activeTab === "chats"
                ? "No conversations yet.\nSwitch to People to start one."
                : "No people found."}
            </p>
          </div>
        ) : (
          displayList.map((contact) => {
            const online = isOnline(contact._id);
            const isSelected = selectedUser?._id === contact._id;
            return (
              <div
                key={contact._id}
                className={`contact-item ${isSelected ? "active" : ""}`}
                onClick={() => setSelectedUser(contact)}
              >
                <div className="contact-avatar-wrapper">
                  <div
                    className="contact-avatar"
                    style={{ background: getAvatarColor(contact.name) }}
                  >
                    {getInitials(contact.name)}
                  </div>
                  {online && <span className="contact-online-dot" />}
                </div>
                <div className="contact-info">
                  <span className="contact-name">{contact.name}</span>
                  <span
                    className={`contact-status ${online ? "online" : "offline"}`}
                  >
                    {online ? "● Online" : "○ Offline"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

export default SiderBar;

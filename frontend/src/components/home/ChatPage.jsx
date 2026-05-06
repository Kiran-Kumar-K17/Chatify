import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useSocket } from "../../context/SocketContext.jsx";
import API from "../../api/api.js";
import MessageInput from "./MessageInput.jsx";
import "./ChatPage.css";

/* ─── helpers ──────────────────────────────────────────────────────── */

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

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

/* ─── Lightbox ─────────────────────────────────────────────────────── */

const Lightbox = ({ src, onClose }) => {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      <button
        className="lightbox-close-btn"
        onClick={onClose}
        aria-label="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          width="22"
          height="22"
        >
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt="Full size" className="lightbox-image" />
      </div>
      <p className="lightbox-hint">
        Click outside or press <kbd>Esc</kbd> to close
      </p>
    </div>
  );
};

/* ─── ChatPage ─────────────────────────────────────────────────────── */

const ChatPage = ({ user, onBack }) => {
  const { user: currentUser } = useAuth();
  const { socket, onlineUsers } = useSocket() || {
    socket: null,
    onlineUsers: [],
  };

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null); // ← lightbox state

  const messagesEndRef = useRef(null);
  const prevUserIdRef = useRef(null);

  const isOnline = onlineUsers.includes(user?._id);

  /* fetch messages when selected user changes */
  useEffect(() => {
    if (!user?._id) return;
    if (prevUserIdRef.current !== user._id) setMessages([]);
    prevUserIdRef.current = user._id;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/messages/${user._id}/messages`);
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [user?._id]);

  /* real-time incoming messages */
  useEffect(() => {
    if (!socket || !user?._id) return;
    const handleNewMessage = (message) => {
      const isRelevant =
        (message.senderId === user._id &&
          message.recipientId === currentUser?._id) ||
        (message.senderId === currentUser?._id &&
          message.recipientId === user._id);
      if (isRelevant) {
        setMessages((prev) => {
          if (prev.find((m) => m._id === message._id)) return prev; // dedupe
          return [...prev, message];
        });
      }
    };
    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, user?._id, currentUser?._id]);

  /* auto-scroll to bottom */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* group messages by date */
  const groupedMessages = [];
  let lastDate = "";
  messages.forEach((msg) => {
    const dateLabel = formatDate(msg.createdAt);
    if (dateLabel !== lastDate) {
      groupedMessages.push({
        type: "divider",
        label: dateLabel,
        id: `divider-${msg._id}`,
      });
      lastDate = dateLabel;
    }
    groupedMessages.push({ type: "message", ...msg });
  });

  /* ─── render ── */
  return (
    <div className="chat-page">
      {/* Lightbox */}
      {lightboxSrc && (
        <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}

      {/* ── Chat header ── */}
      <div className="chat-header">
        <div className="chat-header-left">
          {/* Back button — visible only on mobile via CSS */}
          {onBack && (
            <button
              className="chat-back-btn"
              onClick={onBack}
              aria-label="Back to contacts"
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="20"
                height="20"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          <div className="chat-avatar-wrapper">
            <div
              className="chat-avatar"
              style={{ background: getAvatarColor(user?.name) }}
            >
              {getInitials(user?.name)}
            </div>
            {isOnline && <span className="chat-online-dot" />}
          </div>
          <div className="chat-header-info">
            <h3 className="chat-header-name">{user?.name}</h3>
            <span
              className={`chat-header-status ${isOnline ? "online" : "offline"}`}
            >
              {isOnline ? "Active now" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Messages area ── */}
      <div className="messages-area">
        {loading ? (
          <div className="messages-loading">
            <div className="loading-spinner" />
            <span>Loading messages…</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="messages-empty">
            <div
              className="empty-avatar"
              style={{ background: getAvatarColor(user?.name) }}
            >
              {getInitials(user?.name)}
            </div>
            <h4>{user?.name}</h4>
            <p>This is the beginning of your conversation. Say hello! 👋</p>
          </div>
        ) : (
          groupedMessages.map((item) => {
            /* Date divider */
            if (item.type === "divider") {
              return (
                <div key={item.id} className="date-divider">
                  <span>{item.label}</span>
                </div>
              );
            }

            const isMine = item.senderId === currentUser?._id;

            return (
              <div
                key={item._id}
                className={`message-row ${isMine ? "mine" : "theirs"}`}
              >
                {/* Avatar (received only) */}
                {!isMine && (
                  <div
                    className="message-avatar"
                    style={{ background: getAvatarColor(user?.name) }}
                    title={user?.name}
                  >
                    {getInitials(user?.name)}
                  </div>
                )}

                <div className="message-content">
                  {/* ── Bubble: image + optional caption ── */}
                  {item.image && (
                    <div
                      className={`message-bubble ${isMine ? "bubble-sent" : "bubble-received"} bubble-image-wrap`}
                    >
                      <img
                        src={item.image}
                        alt="Shared image"
                        className="message-image"
                        onClick={() => setLightboxSrc(item.image)}
                        title="Click to view full size"
                      />
                      {/* caption text inside the same bubble */}
                      {item.text && (
                        <p className="image-caption">{item.text}</p>
                      )}
                      <span className="message-time">
                        {formatTime(item.createdAt)}
                      </span>
                    </div>
                  )}

                  {/* ── Bubble: text only ── */}
                  {!item.image && item.text && (
                    <div
                      className={`message-bubble ${isMine ? "bubble-sent" : "bubble-received"}`}
                    >
                      <p>{item.text}</p>
                      <span className="message-time">
                        {formatTime(item.createdAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Message input ── */}
      <MessageInput selectedUser={user} setMessages={setMessages} />
    </div>
  );
};

export default ChatPage;

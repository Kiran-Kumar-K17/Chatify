import { useCallback, useRef, useState } from "react";
import API from "../../api/api.js";
import "./MessageInput.css";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MessageInput = ({ selectedUser, setMessages }) => {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Image state
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMeta, setImageMeta] = useState(null); // { name, size }

  // Drag state
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  /* ─── file processing ──────────────────────────────────────────── */

  const processFile = useCallback((file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Only image files are supported (JPEG, PNG, GIF, WebP, etc.)");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError(
        `Image is too large (${formatBytes(file.size)}). Maximum allowed size is 5 MB.`,
      );
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setImageBase64(reader.result);
      setImageMeta({ name: file.name, size: formatBytes(file.size) });
    };
    reader.readAsDataURL(file);
  }, []);

  /* ─── file input ────────────────────────────────────────────────── */

  const handleFileInput = (e) => {
    processFile(e.target.files[0]);
    // reset so the same file can be selected again
    e.target.value = "";
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    setImageMeta(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ─── drag & drop ───────────────────────────────────────────────── */

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only leave if the cursor truly left the component (not just moved to a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  /* ─── clipboard paste ───────────────────────────────────────────── */

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        e.preventDefault(); // don't paste as text
        const file = item.getAsFile();
        processFile(file);
        break;
      }
    }
  };

  /* ─── send ──────────────────────────────────────────────────────── */

  const handleSend = async () => {
    if ((!text.trim() && !imageBase64) || sending) return;

    setSending(true);
    setError("");

    try {
      const payload = {};
      if (text.trim()) payload.text = text.trim();
      if (imageBase64) payload.image = imageBase64;

      const res = await API.post(`/messages/${selectedUser._id}/send`, payload);
      setMessages((prev) => [...prev, res.data]);
      setText("");
      removeImage();
      // keep focus on textarea after sending
      setTimeout(() => textareaRef.current?.focus(), 0);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to send message. Please try again.";
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = (text.trim().length > 0 || imageBase64 !== null) && !sending;

  /* ─── render ────────────────────────────────────────────────────── */

  return (
    <div
      className={`message-input-area ${isDragging ? "is-dragging" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ── Drop overlay ── */}
      {isDragging && (
        <div className="drop-overlay">
          <div className="drop-overlay-inner">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              width="40"
              height="40"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p>Drop image to attach</p>
          </div>
        </div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div className="input-error-banner">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="15"
            height="15"
            style={{ flexShrink: 0 }}
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span>{error}</span>
          <button
            className="error-dismiss"
            onClick={() => setError("")}
            type="button"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Image preview ── */}
      {imagePreview && (
        <div className="image-preview-strip">
          <div className="image-preview-card">
            <img
              src={imagePreview}
              alt="Attachment preview"
              className="preview-thumb"
            />
            <div className="preview-meta">
              <span className="preview-name" title={imageMeta?.name}>
                {imageMeta?.name}
              </span>
              <span className="preview-size">{imageMeta?.size}</span>
            </div>
            <button
              className="preview-remove-btn"
              onClick={removeImage}
              type="button"
              title="Remove image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                width="13"
                height="13"
              >
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="message-input-bar">
        {/* Attach button */}
        <button
          className="attach-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Attach image  (or drag & drop / paste)"
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
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileInput}
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="message-textarea"
          placeholder="Type a message… (Ctrl+V to paste image)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          rows={1}
        />

        {/* Send button */}
        <button
          className={`send-btn ${canSend ? "active" : ""}`}
          onClick={handleSend}
          disabled={!canSend}
          type="button"
          title="Send  (Enter)"
        >
          {sending ? (
            <span className="send-spinner" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              width="18"
              height="18"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Hint line ── */}
      <p className="input-hint">
        <kbd>Enter</kbd> to send &nbsp;·&nbsp; <kbd>Shift+Enter</kbd> new line
        &nbsp;·&nbsp; Drag &amp; drop or paste images
      </p>
    </div>
  );
};

export default MessageInput;

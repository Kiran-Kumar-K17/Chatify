import { useState } from "react";
import API from "../../api/api.js";
import "./MessageInput.css";

const MessageInput = ({ selectedUser, setMessages }) => {
  const [text, setText] = useState("");

  const handleSendMessage = async () => {
    if (!text.trim()) return;

    try {
      const res = await API.post(`/messages/${selectedUser._id}/send`, {
        text,
      });

      setMessages((prev) => [...prev, res.data]);

      setText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="message-input-container">
      <input
        type="text"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSendMessage();
          }
        }}
      />

      <button onClick={handleSendMessage}>Send</button>
    </div>
  );
};
export default MessageInput;

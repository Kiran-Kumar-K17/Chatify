import { useEffect, useState } from "react";
import API from "../../api/api.js";
import MessageInput from "./MessageInput.jsx";
import "./ChatPage.css";

const ChatPage = ({ user }) => {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    if (!user?._id) return;
    const fetchMessages = async () => {
      const res = await API.get(`/messages/${user._id}/messages`);
      setMessages(res.data);
    };
    fetchMessages();
  }, [user?._id]);
  return (
    <div className="chat-page">
      <h2>Chat with {user?.name}</h2>

      <div className="messages-container">
        {messages.map((message) => (
          <div key={message._id}>{message.text}</div>
        ))}
      </div>

      {/* 🔥 Input Component */}
      <MessageInput selectedUser={user} setMessages={setMessages} />
    </div>
  );
};

export default ChatPage;

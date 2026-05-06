import API from "../../api/api.js";
import SiderBar from "../../components/home/SiderBar.jsx";
import ChatPage from "../../components/home/ChatPage.jsx";
import { useEffect, useState } from "react";
import "./Home.css";

const Home = () => {
  const [contacts, setContacts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  useEffect(() => {
    const fetchUsers = async () => {
      const users = await API.get("/messages/partners");
      setContacts(users.data);
    };
    fetchUsers();
  }, []);
  return (
    <div>
      <h1>Home</h1>
      <div className="container">
        <div className="sidebar">
          <SiderBar contacts={contacts} setSelectedUser={setSelectedUser} />
        </div>
        <div className="chat-area">
          {selectedUser ? (
            <ChatPage user={selectedUser} />
          ) : (
            <div>Select a user to chat</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;

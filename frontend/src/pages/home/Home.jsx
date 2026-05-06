import { useEffect, useState } from "react";
import API from "../../api/api.js";
import SiderBar from "../../components/home/SiderBar.jsx";
import ChatPage from "../../components/home/ChatPage.jsx";
import "./Home.css";

const Home = () => {
  const [partners, setPartners] = useState([]);
  const [allContacts, setAllContacts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partnersRes, contactsRes] = await Promise.all([
          API.get("/messages/partners"),
          API.get("/messages/contacts"),
        ]);
        setPartners(partnersRes.data);
        setAllContacts(contactsRes.data);
      } catch (err) {
        console.error("Failed to fetch contacts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSelectUser = (contact) => {
    setSelectedUser(contact);
    // Add to partners list if not already there (new conversation)
    setPartners((prev) => {
      const exists = prev.find((p) => p._id === contact._id);
      if (!exists) return [contact, ...prev];
      return prev;
    });
  };

  return (
    <div className="home-layout">
      <SiderBar
        contacts={partners}
        allContacts={allContacts}
        selectedUser={selectedUser}
        setSelectedUser={handleSelectUser}
        loading={loading}
      />

      <main className="home-chat-area">
        {selectedUser ? (
          <ChatPage user={selectedUser} />
        ) : (
          <div className="home-empty-state">
            <div className="empty-state-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                width="56"
                height="56"
              >
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              </svg>
            </div>
            <h2>Your messages</h2>
            <p>Select a conversation or start a new one from the sidebar.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;

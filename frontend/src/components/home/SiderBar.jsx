const SiderBar = ({ contacts, setSelectedUser }) => {
  return (
    <div>
      <h2>Contacts</h2>
      <ul>
        {contacts.map((contact) => (
          <li
            key={contact._id}
            onClick={() => setSelectedUser(contact)}
            style={{ cursor: "pointer" }}
          >
            {contact.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SiderBar;

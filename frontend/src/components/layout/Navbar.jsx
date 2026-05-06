import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <h2 className="logo">
        <Link to="/">Chat App</Link>
      </h2>

      <div className="nav-links">
        <Link to="/login">Sign In</Link>
        <Link to="/register">Sign Up</Link>
      </div>
    </nav>
  );
};

export default Navbar;

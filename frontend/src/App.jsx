import Home from "./pages/home/Home.jsx";
import Navbar from "./components/layout/Navbar.jsx";
import { Routes, Route, useLocation } from "react-router-dom";
import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/Signup.jsx";
import "./App.css";
const App = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Signup />} />
      </Routes>
    </>
  );
};

export default App;

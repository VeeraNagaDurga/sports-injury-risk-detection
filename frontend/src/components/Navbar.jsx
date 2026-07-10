import { Link, useLocation } from "react-router-dom";
import { FaRunning } from "react-icons/fa";

function Navbar() {

  const location = useLocation();

  return (

    <nav className="navbar">

      <div className="container navbar-content">

        <Link to="/" className="logo">
          <FaRunning />
          <span>SportsAI</span>
        </Link>

        <div className="nav-links">

          <Link
            to="/"
            style={{
              color: location.pathname === "/" ? "#2563EB" : ""
            }}
          >
            Home
          </Link>

          <Link
            to="/dashboard"
            style={{
              color: location.pathname === "/dashboard" ? "#2563EB" : ""
            }}
          >
            Dashboard
          </Link>

          <Link
            to="/athlete-profile"
            style={{
              color:
                location.pathname === "/athlete-profile"
                  ? "#2563EB"
                  : ""
            }}
          >
            Athlete
          </Link>

          <Link
            to="/upload-video"
            style={{
              color:
                location.pathname === "/upload-video"
                  ? "#2563EB"
                  : ""
            }}
          >
            Upload
          </Link>

          <Link
            to="/results"
            style={{
              color: location.pathname === "/results" ? "#2563EB" : ""
            }}
          >
            Results
          </Link>

        </div>

        <div className="nav-actions">

          <Link to="/login" className="btn-outline">
            Login
          </Link>

          <Link to="/register" className="btn">
            Register
          </Link>

        </div>

      </div>

    </nav>

  );
}

export default Navbar;
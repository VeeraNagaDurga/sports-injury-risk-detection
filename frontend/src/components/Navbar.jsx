import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaRunning, FaSignOutAlt } from "react-icons/fa";
import NotificationBell from "./NotificationBell";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    setUser(null);
    alert("Logged out successfully");
    navigate("/login");
  };

  const isAdmin = user?.role === "Administrator";

  return (
    <nav className="navbar">
      <div className="container navbar-content">

        {/* Logo */}
        <Link to="/" className="logo">
          <FaRunning />
          <span>SportsAI</span>
        </Link>

        {/* Navigation Links */}
        <div className="nav-links">

          {/* Home - available to everyone */}
          <Link
            to="/"
            style={{
              color: location.pathname === "/" ? "#2563EB" : ""
            }}
          >
            Home
          </Link>

          {user && (
            <>
              {/* Normal User Navigation */}
              {!isAdmin && (
                <>
                  <Link
                    to="/dashboard"
                    style={{
                      color:
                        location.pathname === "/dashboard"
                          ? "#2563EB"
                          : ""
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
                    Profile
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

                  {/* Contact Support - normal users only */}
                  <Link
                    to="/support"
                    style={{
                      color:
                        location.pathname === "/support"
                          ? "#2563EB"
                          : ""
                    }}
                  >
                    Support
                  </Link>
                </>
              )}

              {/* Administrator Navigation */}
              {isAdmin && (
                <Link
                  to="/admin"
                  style={{
                    color:
                      location.pathname === "/admin"
                        ? "#2563EB"
                        : ""
                  }}
                >
                  Admin
                </Link>
              )}
            </>
          )}
        </div>

        {/* Right-side Actions */}
        <div className="nav-actions">
          {user ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px"
              }}
            >
              {/* Notifications */}
              <NotificationBell />

              {/* User information */}
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#475569"
                }}
              >
                {user.name} ({user.role})
              </span>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="btn-outline"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px"
                }}
              >
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          ) : (
            <>
              {/* Login */}
              <Link to="/login" className="btn-outline">
                Login
              </Link>

              {/* Register */}
              <Link to="/register" className="btn">
                Register
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}

export default Navbar;
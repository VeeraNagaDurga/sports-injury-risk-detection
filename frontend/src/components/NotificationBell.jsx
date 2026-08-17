import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import api from "../api/api";

// NEW. Notification & Alert System - bell icon + dropdown, shown in the
// Navbar for any logged-in user. Polls the unread count periodically so
// the badge updates even if the user never opens the dropdown (e.g. an
// analysis they started earlier finishes while they're on another page).
const POLL_INTERVAL_MS = 30000;

function NotificationBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setUnreadCount(res.data.unread_count);
    } catch (err) {
      // Silent - a failed poll shouldn't show an error banner in the navbar.
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openDropdown = async () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      setLoading(true);
      try {
        const res = await api.get("/notifications");
        setNotifications(res.data);
      } catch (err) {
        // leave notifications as-is; dropdown will just show the last-loaded list
      } finally {
        setLoading(false);
      }
    }
  };

  const ACCESS_REQUEST_TYPES = new Set([
    "access_request_received",
    "access_request_approved",
    "access_request_denied",
    "access_revoked",
  ]);

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await api.post(`/notifications/${notification.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        // non-critical - still navigate even if marking-as-read failed
      }
    }
    setIsOpen(false);

    // Access-request notifications have no analysis_id (there's no
    // analysis to view) - the Access Requests section lives on the
    // Dashboard instead of a dedicated page, so send those there.
    // Everything else (assessment_completed, injury_risk_alert, etc.) is
    // tied to a specific analysis, so it keeps going to Results as before.
    if (ACCESS_REQUEST_TYPES.has(notification.type)) {
      navigate("/dashboard");
    } else if (notification.analysis_id) {
      navigate(`/results?analysis_id=${notification.analysis_id}`);
    } else {
      navigate("/dashboard");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      // non-critical
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        onClick={openDropdown}
        aria-label="Notifications"
        style={{
          position: "relative",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: "18px",
          color: "#475569",
          padding: "6px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <FaBell />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              background: "#EF4444",
              color: "#fff",
              borderRadius: "999px",
              fontSize: "10px",
              fontWeight: 700,
              minWidth: "16px",
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "36px",
            right: 0,
            width: "340px",
            maxHeight: "420px",
            overflowY: "auto",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 20px 50px rgba(15,23,42,0.18)",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderBottom: "1px solid #E2E8F0",
            }}
          >
            <strong style={{ fontSize: "14px" }}>Notifications</strong>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#2563EB",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <p style={{ padding: "16px", color: "#94A3B8", fontSize: "13px" }}>Loading...</p>
          ) : notifications.length === 0 ? (
            <p style={{ padding: "16px", color: "#94A3B8", fontSize: "13px" }}>
              No notifications yet.
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #F1F5F9",
                  cursor: "pointer",
                  background: n.is_read ? "#fff" : "#EFF6FF",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
                  {n.title}
                </div>
                <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                  {n.message}
                </div>
                <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}>
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
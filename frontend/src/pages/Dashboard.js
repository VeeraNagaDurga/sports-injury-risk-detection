import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "../styles/dashboard.css";
import StatCard from "../components/StatCard";

import {
  FaUsers,
  FaVideo,
  FaHeartbeat,
  FaHourglassHalf,
  FaTrash,
  FaExternalLinkAlt
} from "react-icons/fa";

const STATUS_COLORS = {
  processing: "#F59E0B",
  completed: "#22C55E",
  failed: "#EF4444",
};

function statusLabel(status) {
  if (status === "processing") return "Processing...";
  if (status === "failed") return "Failed";
  return "Completed";
}

const TREND_COLORS = {
  Improving: "#22C55E",
  Declining: "#EF4444",
  Stable: "#64748B",
};

// NEW. Tab navigation - replaces the old single long-scroll layout.
const TABS = [
  { key: "overview", label: "Overview" },
  { key: "requests", label: "Access Requests" },
  { key: "analyses", label: "My Analyses" },
  { key: "profiles", label: "Athlete Profiles" },
];

function TabBar({ activeTab, setActiveTab, incomingPendingCount }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "4px",
        borderBottom: "2px solid #E2E8F0",
        marginBottom: "24px",
        overflowX: "auto",
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: isActive ? "3px solid #2563EB" : "3px solid transparent",
              color: isActive ? "#2563EB" : "#64748B",
              fontWeight: isActive ? 700 : 600,
              fontSize: "14px",
              padding: "10px 18px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "-2px",
            }}
          >
            {tab.label}
            {tab.key === "requests" && incomingPendingCount > 0 && (
              <span
                style={{
                  background: "#EF4444",
                  color: "#fff",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: 700,
                  minWidth: "18px",
                  height: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 5px",
                }}
              >
                {incomingPendingCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Plain SVG line chart, no charting library needed - plots each session's
 * overall risk score (0-100) in chronological order.
 */
function RiskTrendChart({ sessions }) {
  const width = 560;
  const height = 180;
  const padding = 36;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const maxScore = 100;

  const pointFor = (i, score) => {
    const x = padding + (sessions.length > 1 ? (i * usableWidth) / (sessions.length - 1) : usableWidth / 2);
    const y = padding + usableHeight - ((score ?? 0) / maxScore) * usableHeight;
    return [x, y];
  };

  const points = sessions.map((s, i) => pointFor(i, s.overall_score));
  const polyline = points.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
      {[0, 25, 50, 75, 100].map((v) => {
        const y = padding + usableHeight - (v / maxScore) * usableHeight;
        return (
          <g key={v}>
            <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#E2E8F0" strokeWidth="1" />
            <text x={4} y={y + 4} fontSize="10" fill="#94A3B8">{v}</text>
          </g>
        );
      })}

      <polyline points={polyline} fill="none" stroke="#2563EB" strokeWidth="2.5" />

      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5" fill="#2563EB" stroke="#fff" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

function Dashboard() {
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAthlete = currentUser.role === "Athlete";

  const [activeTab, setActiveTab] = useState("overview");

  const [profiles, setProfiles] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsError, setTrendsError] = useState(null);

  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [requestUsername, setRequestUsername] = useState("");
  const [requestingAccess, setRequestingAccess] = useState(false);

  const [usernameBannerDismissed, setUsernameBannerDismissed] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [settingUsername, setSettingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState(null);

  useEffect(() => {
    fetchProfiles();
    fetchAnalyses();
    fetchIncomingRequests();
    fetchOutgoingRequests();

    const interval = setInterval(() => {
      fetchAnalyses();
      fetchIncomingRequests();
      fetchOutgoingRequests();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchIncomingRequests = async () => {
    try {
      const res = await api.get("/access-requests/incoming");
      setIncomingRequests(res.data.requests || []);
    } catch (error) {
      console.error("Error fetching incoming access requests:", error);
    }
  };

  const fetchOutgoingRequests = async () => {
    try {
      const res = await api.get("/access-requests/outgoing");
      setOutgoingRequests(res.data.requests || []);
    } catch (error) {
      console.error("Error fetching outgoing access requests:", error);
    }
  };

  const requestAccess = async (e) => {
    e.preventDefault();
    if (!requestUsername.trim()) return;

    setRequestingAccess(true);
    try {
      const res = await api.post("/access-requests", { username: requestUsername.trim() });
      alert(res.data.message);
      setRequestUsername("");
      fetchOutgoingRequests();
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to send access request.");
    } finally {
      setRequestingAccess(false);
    }
  };

  const approveRequest = async (requestId, canUpload) => {
    try {
      await api.post(`/access-requests/${requestId}/approve`, { can_upload: canUpload });
      fetchIncomingRequests();
      fetchProfiles();
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to approve request.");
    }
  };

  const denyRequest = async (requestId) => {
    try {
      await api.post(`/access-requests/${requestId}/deny`);
      fetchIncomingRequests();
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to deny request.");
    }
  };

  const revokeRequest = async (requestId) => {
    if (!window.confirm("Revoke this access? They will immediately lose access to all past and future data for this athlete.")) {
      return;
    }
    try {
      await api.post(`/access-requests/${requestId}/revoke`);
      fetchIncomingRequests();
      fetchProfiles();
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to revoke access.");
    }
  };

  const fetchProfiles = async () => {
    try {
      const res = await api.get("/athlete-profiles");
      setProfiles(res.data.profiles || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      setLoading(false);
    }
  };

  const fetchAnalyses = async () => {
    try {
      const res = await api.get("/analyses");
      setAnalyses(res.data.analyses || []);
    } catch (error) {
      console.error("Error fetching analyses:", error);
    }
  };

  const deleteProfile = async (athlete_id) => {
    if (window.confirm(`Delete profile for ${athlete_id}?`)) {
      try {
        await api.delete(`/athlete-profile/${athlete_id}`);
        setProfiles(profiles.filter(p => p.athlete_id !== athlete_id));
        fetchAnalyses();
      } catch (error) {
        console.error("Error deleting profile:", error);
        const errorMessage = error.response?.data?.detail || "Failed to delete profile from database";
        alert(errorMessage);
      }
    }
  };

  const deleteAnalysis = async (video_id, filename) => {
    if (!video_id) {
      alert("Can't delete this entry - missing video reference.");
      return;
    }
    if (!window.confirm(`Delete "${filename || "this video"}" and its analysis/report? This can't be undone.`)) {
      return;
    }
    try {
      await api.delete(`/videos/${video_id}`);
      fetchAnalyses();
    } catch (error) {
      console.error("Error deleting video/analysis:", error);
      const errorMessage = error.response?.data?.detail || "Failed to delete this video.";
      alert(errorMessage);
    }
  };

  const fetchTrends = async (athlete_id) => {
    setTrendsLoading(true);
    setTrendsError(null);
    setTrendsData(null);
    try {
      const res = await api.get(`/athlete-profile/${encodeURIComponent(athlete_id)}/trends`);
      setTrendsData(res.data);
    } catch (error) {
      setTrendsError(error.response?.data?.detail || "Failed to load trend data.");
    } finally {
      setTrendsLoading(false);
    }
  };

  const handleSetUsername = async (e) => {
    e.preventDefault();
    const trimmed = usernameInput.trim();
    if (!trimmed) return;

    setSettingUsername(true);
    setUsernameError(null);
    try {
      const res = await api.patch("/users/me/username", { username: trimmed });
      const updatedUser = { ...currentUser, username: res.data.username };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUsernameBannerDismissed(true);
    } catch (error) {
      setUsernameError(error.response?.data?.detail || "Failed to set username.");
    } finally {
      setSettingUsername(false);
    }
  };

  const processingCount = analyses.filter(a => a.status === "processing").length;
  const highRiskCount = analyses.filter(a => {
    const level = a.risk_score_summary?.risk_level;
    return level === "High" || level === "Critical";
  }).length;

  const showUsernameBanner = !currentUser.username && !usernameBannerDismissed;
  const incomingPendingCount = incomingRequests.filter((r) => r.status === "pending").length;

  return (
    <div className="page">
      <div className="container">

        <h1 className="dashboard-title">
          Dashboard
        </h1>

        <p className="dashboard-subtitle">
          AI Sports Injury Detection Overview
        </p>

        {/* ---------------- Set Username Banner - always visible regardless of tab ---------------- */}
        {showUsernameBanner && (
          <div className="analytics-card" style={{ marginBottom: "24px", border: "1px solid #2563EB" }}>
            <h2>Set your username</h2>
            <p style={{ color: "#64748B", fontSize: "13px", marginTop: "-8px" }}>
              Your account doesn't have a username yet. Others use this to find and request
              access to your athlete data - set one to be discoverable.
            </p>
            <form onSubmit={handleSetUsername} style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-start" }}>
              <input
                className="form-control"
                style={{ maxWidth: "240px" }}
                placeholder="Choose a username"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
              />
              <button className="btn" type="submit" disabled={settingUsername || !usernameInput.trim()}>
                {settingUsername ? "Saving..." : "Save Username"}
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setUsernameBannerDismissed(true)}
              >
                Later
              </button>
            </form>
            {usernameError && (
              <p style={{ color: "#DC2626", fontSize: "13px", marginTop: "8px" }}>{usernameError}</p>
            )}
          </div>
        )}

        {/* ---------------- NEW: Tab Navigation ---------------- */}
        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} incomingPendingCount={incomingPendingCount} />

        {/* ============================================================
            TAB: Overview
        ============================================================ */}
        {activeTab === "overview" && (
          <>
            <div className="dashboard-grid">
              <StatCard
                title="Saved Athletes"
                value={profiles.length}
                icon={<FaUsers />}
                color="#2563EB"
              />
              <StatCard
                title="Total Videos"
                value={analyses.length}
                icon={<FaVideo />}
                color="#22C55E"
              />
              <StatCard
                title="High Risk Cases"
                value={highRiskCount}
                icon={<FaHeartbeat />}
                color="#EF4444"
              />
              <StatCard
                title="Currently Processing"
                value={processingCount}
                icon={<FaHourglassHalf />}
                color="#F59E0B"
              />
            </div>

            {!isAthlete && (
              <div className="analytics-card" style={{ marginTop: "24px" }}>
                <h2>Request Access to an Athlete</h2>
                <p style={{ color: "#64748B", fontSize: "13px", marginTop: "-8px" }}>
                  Enter the athlete's username to request read-only access to their analysis history.
                  They'll need to approve it before you can see anything.
                </p>
                <form onSubmit={requestAccess} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <input
                    className="form-control"
                    style={{ maxWidth: "240px" }}
                    placeholder="Athlete Username (e.g. veera123)"
                    value={requestUsername}
                    onChange={(e) => setRequestUsername(e.target.value)}
                  />
                  <button className="btn" type="submit" disabled={requestingAccess || !requestUsername.trim()}>
                    {requestingAccess ? "Sending..." : "Send Request"}
                  </button>
                </form>
              </div>
            )}
          </>
        )}

        {/* ============================================================
            TAB: Access Requests
        ============================================================ */}
        {activeTab === "requests" && (
          <>
            {outgoingRequests.length > 0 && (
              <div className="analytics-card" style={{ marginBottom: "24px" }}>
                <h2>My Access Requests</h2>
                <p style={{ color: "#64748B", fontSize: "13px", marginTop: "-8px" }}>
                  Requests you've sent, and their current status.
                </p>
                <div className="profiles-table-wrapper">
                  <table className="profiles-table">
                    <thead>
                      <tr>
                        <th>Athlete</th>
                        <th>Status</th>
                        <th>Can Upload</th>
                        <th>Requested</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outgoingRequests.map((r) => (
                        <tr key={r.id}>
                          <td>{r.athlete_id}</td>
                          <td style={{ color: STATUS_COLORS[r.status] || "#334155", fontWeight: 700, textTransform: "capitalize" }}>
                            {r.status}
                          </td>
                          <td>{r.can_upload ? "Yes" : "No"}</td>
                          <td>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="analytics-card">
              <h2>Access Requests to Your Athletes</h2>
              <p style={{ color: "#64748B", fontSize: "13px", marginTop: "-8px" }}>
                People asking to view your athlete's data. Approving grants read-only access
                (optionally including upload) until you revoke it.
              </p>
              {incomingRequests.length === 0 ? (
                <p>No access requests yet.</p>
              ) : (
                <div className="profiles-table-wrapper">
                  <table className="profiles-table">
                    <thead>
                      <tr>
                        <th>Athlete</th>
                        <th>Requested By</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomingRequests.map((r) => (
                        <tr key={r.id}>
                          <td>{r.athlete_id}</td>
                          <td>{r.requested_by_name || r.requested_by_email}</td>
                          <td>{r.requested_by_username || "—"}</td>
                          <td>{r.requested_by_role}</td>
                          <td style={{ color: STATUS_COLORS[r.status] || "#334155", fontWeight: 700, textTransform: "capitalize" }}>
                            {r.status}
                          </td>
                          <td>
                            {r.status === "pending" && (
                              <>
                                <button className="btn-view" onClick={() => approveRequest(r.id, false)}>
                                  Approve (view only)
                                </button>
                                <button
                                  className="btn-view"
                                  style={{ marginLeft: "6px" }}
                                  onClick={() => approveRequest(r.id, true)}
                                >
                                  Approve + Upload
                                </button>
                                <button
                                  className="btn-delete"
                                  style={{ marginLeft: "6px" }}
                                  onClick={() => denyRequest(r.id)}
                                >
                                  Deny
                                </button>
                              </>
                            )}
                            {r.status === "approved" && (
                              <button className="btn-delete" onClick={() => revokeRequest(r.id)}>
                                Revoke Access
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ============================================================
            TAB: My Analyses
        ============================================================ */}
        {activeTab === "analyses" && (
          <div className="analytics-card">
            <h2>My Analyses</h2>
            <p style={{ color: "#64748B", fontSize: "13px", marginTop: "-8px" }}>
              Every video you've uploaded, including ones still processing in the
              background - click into any of them anytime, from anywhere.
            </p>

            {analyses.length === 0 ? (
              <p>No videos uploaded yet. Go to Upload to analyze your first video.</p>
            ) : (
              <div className="profiles-table-wrapper">
                <table className="profiles-table">
                  <thead>
                    <tr>
                      <th>Video</th>
                      <th>Athlete</th>
                      <th>Status</th>
                      <th>Risk Level</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyses.slice().reverse().map((a) => (
                      <tr key={a.analysis_id}>
                        <td>{a.filename || "—"}</td>
                        <td>{a.athlete_id || "—"}</td>
                        <td style={{ color: STATUS_COLORS[a.status] || "#334155", fontWeight: 700 }}>
                          {statusLabel(a.status)}
                        </td>
                        <td>{a.risk_score_summary?.risk_level || "—"}</td>
                        <td>
                          <button
                            className="btn-view"
                            onClick={() => navigate(`/results?analysis_id=${encodeURIComponent(a.analysis_id)}`)}
                          >
                            <FaExternalLinkAlt style={{ marginRight: "6px" }} />
                            {a.status === "processing" ? "Check status" : "View"}
                          </button>
                          <button
                            className="btn-delete"
                            disabled={a.status === "processing"}
                            title={a.status === "processing" ? "Can't delete while still processing" : "Delete this video and its analysis/report"}
                            style={a.status === "processing" ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
                            onClick={() => deleteAnalysis(a.video_id, a.filename)}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            TAB: Athlete Profiles
        ============================================================ */}
        {activeTab === "profiles" && (
          <div className="analytics-card">
            <h2>Saved Athlete Profiles</h2>

            {loading ? (
              <p>Loading profiles...</p>
            ) : profiles.length === 0 ? (
              <p>No athlete profiles saved yet. Go to Athlete Profile to create one.</p>
            ) : (
              <div className="profiles-table-wrapper">
                <table className="profiles-table">
                  <thead>
                    <tr>
                      <th>Athlete ID</th>
                      <th>Sport Type</th>
                      <th>Position</th>
                      <th>Age</th>
                      <th>Height</th>
                      <th>Weight</th>
                      <th>Access</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((profile) => (
                      <tr key={profile.athlete_id}>
                        <td><strong>{profile.athlete_id}</strong></td>
                        <td>{profile.sport_type}</td>
                        <td>{profile.position || "N/A"}</td>
                        <td>{profile.age || "N/A"}</td>
                        <td>{profile.height || "N/A"}</td>
                        <td>{profile.weight || "N/A"}</td>
                        <td>
                          {profile.is_owner ? (
                            <span style={{ color: "#2563EB", fontWeight: 600, fontSize: "12px" }}>Owner</span>
                          ) : (
                            <span style={{ color: "#64748B", fontWeight: 600, fontSize: "12px" }}>Shared (view only)</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn-view"
                            onClick={() => setSelectedProfile(profile)}
                          >
                            View
                          </button>
                          <button
                            className="btn-view"
                            style={{ marginLeft: "6px" }}
                            onClick={() => fetchTrends(profile.athlete_id)}
                          >
                            Trends
                          </button>
                          {profile.is_owner && (
                            <>
                              <button
                                className="btn-delete"
                                onClick={() => deleteProfile(profile.athlete_id)}
                              >
                                <FaTrash />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {selectedProfile && (
          <div className="modal-overlay" onClick={() => setSelectedProfile(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button
                className="modal-close"
                onClick={() => setSelectedProfile(null)}
              >
                ✕
              </button>
              <h2>Athlete Profile Details</h2>
              <div className="profile-details">
                <p><strong>Athlete ID:</strong> {selectedProfile.athlete_id}</p>
                <p><strong>Sport Type:</strong> {selectedProfile.sport_type}</p>
                <p><strong>Position:</strong> {selectedProfile.position || "N/A"}</p>
                <p><strong>Age:</strong> {selectedProfile.age || "N/A"}</p>
                <p><strong>Height:</strong> {selectedProfile.height || "N/A"}</p>
                <p><strong>Weight:</strong> {selectedProfile.weight || "N/A"}</p>
                <p><strong>Injury History:</strong></p>
                <p className="details-text">{selectedProfile.injury_history || "None"}</p>
                <p><strong>Training Load:</strong></p>
                <p className="details-text">{selectedProfile.training_load || "None"}</p>
              </div>
            </div>
          </div>
        )}

        {(trendsLoading || trendsData || trendsError) && (
          <div
            className="modal-overlay"
            onClick={() => { setTrendsData(null); setTrendsError(null); }}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "640px" }}>
              <button
                className="modal-close"
                onClick={() => { setTrendsData(null); setTrendsError(null); }}
              >
                ✕
              </button>
              <h2>Athlete Trend {trendsData ? `- ${trendsData.athlete_id}` : ""}</h2>

              {trendsLoading && <p>Loading trend data...</p>}

              {trendsError && <p style={{ color: "#DC2626" }}>{trendsError}</p>}

              {trendsData && trendsData.trend.status === "insufficient_data" && (
                <p style={{ color: "#64748B" }}>{trendsData.trend.message}</p>
              )}

              {trendsData && trendsData.trend.status === "ok" && (
                <>
                  <div
                    style={{
                      display: "flex",
                      gap: "20px",
                      alignItems: "center",
                      marginBottom: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: TREND_COLORS[trendsData.trend.direction] || "#334155",
                        fontSize: "18px",
                      }}
                    >
                      {trendsData.trend.direction}
                    </div>
                    <div style={{ color: "#64748B", fontSize: "13px" }}>
                      Risk score: {trendsData.trend.first_score}% → {trendsData.trend.latest_score}%
                      {" "}({trendsData.trend.change > 0 ? "+" : ""}{trendsData.trend.change} over {trendsData.session_count} sessions)
                    </div>
                  </div>

                  <RiskTrendChart sessions={trendsData.sessions} />

                  <table className="profiles-table" style={{ marginTop: "16px" }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Video</th>
                        <th>Risk Score</th>
                        <th>Risk Level</th>
                        <th>Movement Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trendsData.sessions.map((s) => (
                        <tr key={s.analysis_id}>
                          <td>{s.date ? new Date(s.date).toLocaleDateString() : "—"}</td>
                          <td>{s.filename || "—"}</td>
                          <td>{s.overall_score ?? "—"}%</td>
                          <td>{s.risk_level || "—"}</td>
                          <td>{s.grade || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Dashboard;
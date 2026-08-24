import { useEffect, useState } from "react";
import api from "../api/api";
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import "../styles/dashboard.css";

const COLORS = ["#2563EB", "#22C55E", "#F59E0B", "#EF4444", "#F59E0B", "#06B6D4", "#EC4899", "#84CC16"];

const RISK_COLORS = {
  Low: "#22C55E",
  Moderate: "#F59E0B",
  High: "#EF4444",
  Critical: "#991B1B",
};

// Only print a label inside a slice if it's big enough not to collide with
// its neighbors; smaller slices still show up in the legend below.
const MIN_SLICE_PERCENT_FOR_LABEL = 8;

function renderInsideLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent * 100 < MIN_SLICE_PERCENT_FOR_LABEL) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={700}
      style={{ pointerEvents: "none" }}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

// A pie chart with a legend underneath (name + count + percentage), used
// instead of outer pointer-labels so nothing overlaps or spills past the card.
function LabeledPieChart({ data, dataKey, nameKey, colorFor }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          cx="50%"
          cy="46%"
          outerRadius={85}
          label={renderInsideLabel}
          labelLine={false}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={colorFor ? colorFor(entry, i) : COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, name]} />
        <Legend
          verticalAlign="bottom"
          align="center"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "12px", lineHeight: "20px" }}
          formatter={(value, entry) => {
            const p = entry?.payload?.percentage;
            return `${value}${p !== undefined ? ` (${p}%)` : ""}`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ---------- small shared bits ----------

function KpiCard({ title, value }) {
  return (
    <div style={{
      background: "#fff", borderRadius: "12px", padding: "20px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    }}>
      <div style={{ color: "#64748B", fontSize: "13px", marginBottom: "6px" }}>{title}</div>
      <div style={{ fontSize: "28px", fontWeight: 800, color: "#0F172A" }}>{value}</div>
    </div>
  );
}

function ChartCard({ title, children, subtitle }) {
  return (
    <div style={{
      background: "#fff", borderRadius: "12px", padding: "20px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "24px",
    }}>
      <h3 style={{ margin: "0 0 4px" }}>{title}</h3>
      {subtitle && <p style={{ color: "#64748B", fontSize: "13px", marginTop: 0 }}>{subtitle}</p>}
      {children}
    </div>
  );
}

// Icons (inline SVG, no extra deps)
const Icon = {
  Eye: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Ban: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M4.9 4.9l14.2 14.2" />
    </svg>
  ),
  Check: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

// A single, consistently-sized action button used everywhere in the Actions column.
function ActionButton({ variant = "neutral", icon, children, style, ...rest }) {
  const palette = {
    neutral: { bg: "#F1F5F9", color: "#334155", border: "#E2E8F0" },
    primary: { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
    danger:  { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
    success: { bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0" },
  }[variant];

  return (
    <button
      {...rest}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        borderRadius: "8px",
        fontSize: "12px",
        fontWeight: 700,
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        color: palette.color,
        cursor: rest.disabled ? "default" : "pointer",
        opacity: rest.disabled ? 0.6 : 1,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function StatusBadge({ active, activeLabel = "Active", inactiveLabel = "Revoked" }) {
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 700,
        background: active ? "#DCFCE7" : "#FEE2E2",
        color: active ? "#166534" : "#991B1B",
      }}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

// Tab navigation
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "support", label: "Support Messages" },
];

function TabNav({ active, onChange, unresolvedCount }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "4px",
        borderBottom: "1px solid #E2E8F0",
        margin: "24px 0",
      }}
    >
      {TABS.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              position: "relative",
              padding: "10px 18px",
              fontSize: "14px",
              fontWeight: 700,
              background: "transparent",
              border: "none",
              borderBottom: isActive ? "2px solid #2563EB" : "2px solid transparent",
              color: isActive ? "#2563EB" : "#64748B",
              cursor: "pointer",
              marginBottom: "-1px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {t.label}
            {t.id === "support" && unresolvedCount > 0 && (
              <span
                style={{
                  background: isActive ? "#2563EB" : "#94A3B8",
                  color: "#fff",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: 800,
                  padding: "1px 7px",
                }}
              >
                {unresolvedCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------- main component ----------

function AdminDashboard() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = currentUser.role === "Administrator";

  const [activeTab, setActiveTab] = useState("overview");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const [revokingId, setRevokingId] = useState(null);
  const [reactivatingId, setReactivatingId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const [supportMessages, setSupportMessages] = useState([]);
  const [supportLoading, setSupportLoading] = useState(true);
  const [supportError, setSupportError] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyingId, setReplyingId] = useState(null);
  const [replyError, setReplyError] = useState(null);
  const [supportFilter, setSupportFilter] = useState("unresolved");

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      setUsersError(err.response?.data?.detail || "Failed to load users.");
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchSupportMessages = async () => {
    setSupportLoading(true);
    setSupportError(null);
    try {
      const res = await api.get("/admin/support-messages");
      setSupportMessages(res.data);
    } catch (err) {
      setSupportError(err.response?.data?.detail || "Failed to load support messages.");
    } finally {
      setSupportLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      setUsersLoading(false);
      setSupportLoading(false);
      return;
    }
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/admin/dashboard");
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load admin dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
    fetchUsers();
    fetchSupportMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openUserDetails = async (userId) => {
    setDetailLoading(true);
    setDetailError(null);
    setSelectedUser(null);
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setSelectedUser(res.data);
    } catch (err) {
      setDetailError(err.response?.data?.detail || "Failed to load user details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeUserDetails = () => {
    setSelectedUser(null);
    setDetailError(null);
  };

  const handleRevoke = async (userId, userLabel) => {
    const confirmed = window.confirm(
      `Revoke ${userLabel}'s account?\n\nThey will immediately lose the ability to log in or access the application. Their existing profile and analysis data will NOT be deleted.`
    );
    if (!confirmed) return;

    setRevokingId(userId);
    setActionMessage(null);
    try {
      const res = await api.post(`/admin/users/${userId}/revoke`);
      setActionMessage({ type: "success", text: res.data.message });
      await fetchUsers();
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser((prev) => ({ ...prev, is_active: false }));
      }
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err.response?.data?.detail || "Failed to revoke this account.",
      });
    } finally {
      setRevokingId(null);
    }
  };

  const handleReactivate = async (userId, userLabel) => {
    const confirmed = window.confirm(
      `Reactivate ${userLabel}'s account?\n\nThey will immediately regain the ability to log in and use the application.`
    );
    if (!confirmed) return;

    setReactivatingId(userId);
    setActionMessage(null);
    try {
      const res = await api.post(`/admin/users/${userId}/reactivate`);
      setActionMessage({ type: "success", text: res.data.message });
      await fetchUsers();
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser((prev) => ({ ...prev, is_active: true }));
      }
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err.response?.data?.detail || "Failed to reactivate this account.",
      });
    } finally {
      setReactivatingId(null);
    }
  };

  const handleResolve = async (msgId, resolved) => {
    setResolvingId(msgId);
    try {
      await api.patch(`/admin/support-messages/${msgId}/resolve?resolved=${resolved}`);
      await fetchSupportMessages();
    } catch (err) {
      setSupportError(err.response?.data?.detail || "Failed to update this message.");
    } finally {
      setResolvingId(null);
    }
  };

  const handleReply = async (msgId) => {
    const reply = (replyDrafts[msgId] || "").trim();
    if (!reply) return;

    setReplyingId(msgId);
    setReplyError(null);
    try {
      await api.patch(`/admin/support-messages/${msgId}/reply`, { reply });
      setReplyDrafts((prev) => ({ ...prev, [msgId]: "" }));
      await fetchSupportMessages();
    } catch (err) {
      setReplyError(err.response?.data?.detail || "Failed to send your reply.");
    } finally {
      setReplyingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="page">
        <div className="container" style={{ padding: "60px 20px", textAlign: "center" }}>
          <h3>Access Denied</h3>
          <p style={{ color: "#64748B" }}>This dashboard is only available to Administrator accounts.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page">
        <div className="container" style={{ padding: "60px 20px", textAlign: "center" }}>
          <p>Loading platform analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="container" style={{ padding: "60px 20px", textAlign: "center" }}>
          <h3>Couldn't load dashboard</h3>
          <p style={{ color: "#DC2626" }}>{error}</p>
        </div>
      </div>
    );
  }

  const { kpis, user_distribution, sports_distribution, injury_risk_by_sport,
    risk_level_distribution, injury_type_distribution, monthly_upload_trend,
    monthly_analysis_trend, average_risk_score, highest_risk_sports, recent_activity } = data;

  const unresolvedCount = supportMessages.filter((m) => m.status !== "resolved").length;

  return (
    <div className="page">
      <div className="container" style={{ padding: "30px 20px" }}>
        <h1 className="dashboard-title">Admin Analytics Dashboard</h1>
        <p className="dashboard-subtitle">Platform-wide overview - all data live from PostgreSQL</p>

        <TabNav active={activeTab} onChange={setActiveTab} unresolvedCount={unresolvedCount} />

        {/* ================= OVERVIEW TAB ================= */}
        {activeTab === "overview" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", margin: "24px 0" }}>
              <KpiCard title="Total Registered Users" value={kpis.total_registered_users} />
              <KpiCard title="Total Athletes" value={kpis.total_athletes} />
              <KpiCard title="Total Coaches" value={kpis.total_coaches} />
              <KpiCard title="Total Physiotherapists" value={kpis.total_physiotherapists} />
              <KpiCard title="Total Sports Scientists" value={kpis.total_sports_scientists} />
              <KpiCard title="Total Videos Uploaded" value={kpis.total_videos_uploaded} />
              <KpiCard title="Total Completed Analyses" value={kpis.total_completed_analyses} />
              <KpiCard title="Total Reports Generated" value={kpis.total_reports_generated} />
              <KpiCard title="Total Active Users" value={kpis.total_active_users} />
              <KpiCard title="Average Risk Score" value={average_risk_score !== null ? `${average_risk_score}%` : "—"} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
              <ChartCard title="User Distribution">
                {user_distribution.length === 0 ? <p style={{ color: "#94A3B8" }}>No data yet.</p> : (
                  <LabeledPieChart data={user_distribution} dataKey="count" nameKey="role" />
                )}
              </ChartCard>

              <ChartCard title="Sports Distribution">
                {sports_distribution.length === 0 ? <p style={{ color: "#94A3B8" }}>No sport data yet - athletes haven't filled in their sport type.</p> : (
                  <LabeledPieChart data={sports_distribution} dataKey="count" nameKey="sport" />
                )}
              </ChartCard>

              <ChartCard title="Risk Level Distribution">
                {risk_level_distribution.length === 0 ? <p style={{ color: "#94A3B8" }}>No completed analyses yet.</p> : (
                  <LabeledPieChart
                    data={risk_level_distribution}
                    dataKey="count"
                    nameKey="risk_level"
                    colorFor={(entry, i) => RISK_COLORS[entry.risk_level] || COLORS[i % COLORS.length]}
                  />
                )}
              </ChartCard>

              <ChartCard title="Injury Type Distribution" subtitle="Share of analyses flagging each category High/Critical">
                {injury_type_distribution.length === 0 ? <p style={{ color: "#94A3B8" }}>No completed analyses yet.</p> : (
                  <LabeledPieChart data={injury_type_distribution} dataKey="count" nameKey="injury_type" />
                )}
              </ChartCard>
            </div>

            <ChartCard title="Injury Risk by Sport" subtitle="Average overall risk score per sport">
              {injury_risk_by_sport.length === 0 ? <p style={{ color: "#94A3B8" }}>No data yet.</p> : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={injury_risk_by_sport}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sport" />
                    <YAxis domain={[0, 100]} unit="%" />
                    <Tooltip />
                    <Bar dataKey="average_risk_score" fill="#2563EB" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
              <ChartCard title="Monthly Upload Trend">
                {monthly_upload_trend.length === 0 ? <p style={{ color: "#94A3B8" }}>No uploads yet.</p> : (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={monthly_upload_trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <ChartCard title="Monthly Analysis Trend">
                {monthly_analysis_trend.length === 0 ? <p style={{ color: "#94A3B8" }}>No completed analyses yet.</p> : (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={monthly_analysis_trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#22C55E" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>

            <ChartCard title="Highest Risk Sports">
              {highest_risk_sports.length === 0 ? <p style={{ color: "#94A3B8" }}>No data yet.</p> : (
                <div className="profiles-table-wrapper">
                  <table className="profiles-table">
                    <thead>
                      <tr>
                        <th>Sport</th>
                        <th>Average Risk Score</th>
                        <th>Number of Athletes</th>
                        <th>Number of Analyses</th>
                      </tr>
                    </thead>
                    <tbody>
                      {highest_risk_sports.map((s, i) => (
                        <tr key={i}>
                          <td>{s.sport}</td>
                          <td>{s.average_risk_score}%</td>
                          <td>{s.athlete_count}</td>
                          <td>{s.analysis_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ChartCard>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              <ChartCard title="Recent Users">
                {recent_activity.recent_users.map((u, i) => (
                  <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid #F1F5F9", fontSize: "13px" }}>
                    <strong>{u.name}</strong> ({u.role}) — {u.email}
                  </div>
                ))}
              </ChartCard>
              <ChartCard title="Recent Videos">
                {recent_activity.recent_videos.map((v, i) => (
                  <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid #F1F5F9", fontSize: "13px" }}>
                    {v.filename}
                  </div>
                ))}
              </ChartCard>
              <ChartCard title="Recent Analyses">
                {recent_activity.recent_analyses.map((a, i) => (
                  <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid #F1F5F9", fontSize: "13px" }}>
                    #{a.analysis_id} — <span style={{ color: RISK_COLORS[a.risk_level] || "#334155", fontWeight: 700 }}>{a.risk_level}</span> ({a.overall_risk_score}%)
                  </div>
                ))}
              </ChartCard>
              <ChartCard title="Recent Reports">
                {recent_activity.recent_reports.map((r, i) => (
                  <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid #F1F5F9", fontSize: "13px" }}>
                    {r.report_name}
                  </div>
                ))}
              </ChartCard>
            </div>
          </>
        )}

        {/* ================= USERS TAB ================= */}
        {activeTab === "users" && (
          <ChartCard title="Users" subtitle="Registered users, their existing data, and account status">
            {actionMessage && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  background: actionMessage.type === "success" ? "#DCFCE7" : "#FEE2E2",
                  color: actionMessage.type === "success" ? "#166534" : "#991B1B",
                }}
              >
                {actionMessage.text}
              </div>
            )}

            {usersLoading ? (
              <p style={{ color: "#94A3B8" }}>Loading users...</p>
            ) : usersError ? (
              <p style={{ color: "#DC2626" }}>{usersError}</p>
            ) : users.length === 0 ? (
              <p style={{ color: "#94A3B8" }}>No registered users yet.</p>
            ) : (
              <div className="profiles-table-wrapper">
                <table className="profiles-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th style={{ minWidth: "180px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.name || "—"}</td>
                        <td>{u.username ? `@${u.username}` : "—"}</td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                        <td><StatusBadge active={u.is_active} /></td>
                        <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                        <td>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <ActionButton variant="primary" icon={<Icon.Eye />} onClick={() => openUserDetails(u.id)}>
                              View
                            </ActionButton>
                            {u.id !== currentUser.id && u.is_active && (
                              <ActionButton
                                variant="danger"
                                icon={<Icon.Ban />}
                                disabled={revokingId === u.id}
                                onClick={() => handleRevoke(u.id, u.name || u.email)}
                              >
                                {revokingId === u.id ? "Revoking..." : "Revoke"}
                              </ActionButton>
                            )}
                            {u.id !== currentUser.id && !u.is_active && (
                              <ActionButton
                                variant="success"
                                icon={<Icon.Check />}
                                disabled={reactivatingId === u.id}
                                onClick={() => handleReactivate(u.id, u.name || u.email)}
                              >
                                {reactivatingId === u.id ? "Reactivating..." : "Reactivate"}
                              </ActionButton>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ChartCard>
        )}

        {/* ================= SUPPORT TAB ================= */}
        {activeTab === "support" && (
          <ChartCard title="Support Messages" subtitle="Messages submitted by users via the Contact Support page">
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              {["unresolved", "resolved", "all"].map((f) => (
                <button
                  key={f}
                  onClick={() => setSupportFilter(f)}
                  className={supportFilter === f ? "btn" : "btn-outline"}
                  style={{ padding: "6px 14px", fontSize: "13px", textTransform: "capitalize" }}
                >
                  {f}
                </button>
              ))}
            </div>

            {supportLoading ? (
              <p style={{ color: "#94A3B8" }}>Loading support messages...</p>
            ) : supportError ? (
              <p style={{ color: "#DC2626" }}>{supportError}</p>
            ) : (
              (() => {
                const filtered = supportMessages.filter(
                  (m) => supportFilter === "all" || m.status === supportFilter
                );
                return filtered.length === 0 ? (
                  <p style={{ color: "#94A3B8" }}>No {supportFilter !== "all" ? supportFilter : ""} messages.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {filtered.map((m) => (
                      <div
                        key={m.id}
                        style={{
                          border: "1px solid #E2E8F0",
                          borderRadius: "10px",
                          padding: "14px 16px",
                          background: "#F8FAFC",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "4px" }}>
                          <span style={{ fontWeight: 700, color: "#0F172A", fontSize: "14px" }}>{m.subject}</span>
                          <span
                            style={{
                              padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 700,
                              background: m.status === "resolved" ? "#DCFCE7" : "#FEF9C3",
                              color: m.status === "resolved" ? "#166534" : "#854D0E",
                            }}
                          >
                            {m.status === "resolved" ? "Resolved" : "Unresolved"}
                          </span>
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "8px" }}>
                          {m.category} &middot; {m.sender_name || "Unknown"}
                          {m.sender_username ? ` (@${m.sender_username})` : ""} &middot;{" "}
                          {m.created_at ? new Date(m.created_at).toLocaleString() : ""}
                        </div>
                        <p style={{ fontSize: "13px", color: "#334155", whiteSpace: "pre-wrap", margin: "0 0 10px" }}>
                          {m.message}
                        </p>

                        {m.admin_reply && (
                          <div
                            style={{
                              background: "#EFF6FF",
                              border: "1px solid #BFDBFE",
                              borderRadius: "8px",
                              padding: "10px 12px",
                              marginBottom: "10px",
                            }}
                          >
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#2563EB", marginBottom: "4px" }}>
                              Your reply {m.replied_at ? `\u00b7 ${new Date(m.replied_at).toLocaleString()}` : ""}
                            </div>
                            <p style={{ fontSize: "13px", color: "#1E3A8A", whiteSpace: "pre-wrap", margin: 0 }}>
                              {m.admin_reply}
                            </p>
                          </div>
                        )}

                        <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                          <textarea
                            className="form-control"
                            placeholder={m.admin_reply ? "Send another reply..." : "Write a reply to this user..."}
                            value={replyDrafts[m.id] || ""}
                            onChange={(e) =>
                              setReplyDrafts((prev) => ({ ...prev, [m.id]: e.target.value }))
                            }
                            rows={2}
                            style={{ flex: 1, fontSize: "13px", resize: "vertical" }}
                          />
                        </div>
                        {replyError && (
                          <p style={{ color: "#DC2626", fontSize: "12px", marginBottom: "8px" }}>{replyError}</p>
                        )}

                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <ActionButton
                            variant="primary"
                            disabled={replyingId === m.id || !(replyDrafts[m.id] || "").trim()}
                            onClick={() => handleReply(m.id)}
                          >
                            {replyingId === m.id ? "Sending..." : "Send Reply"}
                          </ActionButton>
                          <ActionButton
                            variant="neutral"
                            disabled={resolvingId === m.id}
                            onClick={() => handleResolve(m.id, m.status !== "resolved")}
                          >
                            {resolvingId === m.id
                              ? "Updating..."
                              : m.status === "resolved"
                              ? "Mark Unresolved"
                              : "Mark Resolved"}
                          </ActionButton>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </ChartCard>
        )}

        {(detailLoading || detailError || selectedUser) && (
          <div className="modal-overlay" onClick={closeUserDetails}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={closeUserDetails}>&times;</button>

              {detailLoading && <p>Loading user details...</p>}
              {detailError && <p style={{ color: "#DC2626" }}>{detailError}</p>}

              {selectedUser && !detailLoading && (
                <div className="profile-details">
                  <h2>{selectedUser.name || selectedUser.email}</h2>
                  <p style={{ color: "#64748B", marginTop: "-8px" }}>
                    User #{selectedUser.id}
                    {selectedUser.username && <> &middot; @{selectedUser.username}</>}
                    {" "}&middot; {selectedUser.email} &middot; {selectedUser.role} &middot;{" "}
                    <span style={{ color: selectedUser.is_active ? "#166534" : "#991B1B", fontWeight: 700 }}>
                      {selectedUser.is_active ? "Active" : "Revoked"}
                    </span>
                  </p>

                  <h3 style={{ marginTop: "20px" }}>Athlete Profile(s)</h3>
                  {selectedUser.athletes.length === 0 ? (
                    <p style={{ color: "#94A3B8" }}>No athlete profile created yet.</p>
                  ) : (
                    <div className="profiles-table-wrapper">
                      <table className="profiles-table">
                        <thead>
                          <tr>
                            <th>Athlete ID</th>
                            <th>Sport</th>
                            <th>Position</th>
                            <th>Age</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedUser.athletes.map((a) => (
                            <tr key={a.id}>
                              <td>{a.athlete_id}</td>
                              <td>{a.sport_type || "—"}</td>
                              <td>{a.position || "—"}</td>
                              <td>{a.age || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <h3 style={{ marginTop: "20px" }}>Analysis History</h3>
                  {selectedUser.analyses.length === 0 ? (
                    <p style={{ color: "#94A3B8" }}>No analyses yet.</p>
                  ) : (
                    <div className="profiles-table-wrapper">
                      <table className="profiles-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Status</th>
                            <th>Risk Level</th>
                            <th>Risk Score</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedUser.analyses.map((a) => (
                            <tr key={a.id}>
                              <td>#{a.id}</td>
                              <td>{a.status}</td>
                              <td style={{ color: RISK_COLORS[a.risk_level] || "#334155", fontWeight: 700 }}>
                                {a.risk_level || "—"}
                              </td>
                              <td>{a.overall_risk_score_numeric !== null ? `${a.overall_risk_score_numeric}%` : "—"}</td>
                              <td>{a.created_at ? new Date(a.created_at).toLocaleDateString() : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {selectedUser.id !== currentUser.id && selectedUser.is_active && (
                    <ActionButton
                      variant="danger"
                      icon={<Icon.Ban />}
                      style={{ marginTop: "20px" }}
                      disabled={revokingId === selectedUser.id}
                      onClick={() => handleRevoke(selectedUser.id, selectedUser.name || selectedUser.email)}
                    >
                      {revokingId === selectedUser.id ? "Revoking..." : "Revoke Account"}
                    </ActionButton>
                  )}
                  {selectedUser.id !== currentUser.id && !selectedUser.is_active && (
                    <ActionButton
                      variant="success"
                      icon={<Icon.Check />}
                      style={{ marginTop: "20px" }}
                      disabled={reactivatingId === selectedUser.id}
                      onClick={() => handleReactivate(selectedUser.id, selectedUser.name || selectedUser.email)}
                    >
                      {reactivatingId === selectedUser.id ? "Reactivating..." : "Reactivate Account"}
                    </ActionButton>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
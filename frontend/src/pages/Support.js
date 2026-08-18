import { useEffect, useState } from "react";
import api from "../api/api";
import "../styles/support.css";

const CATEGORIES = [
  "Technical Issue",
  "Video Analysis Issue",
  "Account Issue",
  "Access Issue",
  "Other",
];

function StatusBadge({ status }) {
  const resolved = status === "resolved";
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 700,
        background: resolved ? "#DCFCE7" : "#FEF9C3",
        color: resolved ? "#166534" : "#854D0E",
      }}
    >
      {resolved ? "Resolved" : "Unresolved"}
    </span>
  );
}

function Support() {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState(null);

  const fetchTickets = async () => {
    setTicketsLoading(true);
    setTicketsError(null);
    try {
      const res = await api.get("/support/messages");
      setTickets(res.data);
    } catch (err) {
      setTicketsError(err.response?.data?.detail || "Failed to load your support messages.");
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await api.post("/support/messages", { subject, message, category });
      setSubject("");
      setMessage("");
      setCategory(CATEGORIES[0]);
      setSubmitSuccess(true);
      await fetchTickets();
    } catch (err) {
      setSubmitError(err.response?.data?.detail || "Failed to submit your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: "900px", padding: "30px 20px" }}>
        <h1 className="dashboard-title">Contact Support</h1>
        <p className="dashboard-subtitle">
          Run into a problem or have a question? Send us a message and we'll get back to you.
        </p>

        <div className="form-card support-card">
          <h2>Send a Message</h2>

          {submitSuccess && (
            <div className="support-alert support-alert-success">
              Your message has been sent. You can track its status below.
            </div>
          )}
          {submitError && (
            <div className="support-alert support-alert-error">{submitError}</div>
          )}

          <form onSubmit={handleSubmit} className="support-form">
            <label className="support-label">
              Category
              <select
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label className="support-label">
              Subject
              <input
                className="form-control"
                type="text"
                placeholder="A short summary of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                maxLength={150}
              />
            </label>

            <label className="support-label">
              Message
              <textarea
                className="form-control"
                placeholder="Describe your issue or question in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
              />
            </label>

            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

        <div className="form-card support-card" style={{ marginTop: "24px" }}>
          <h2>Your Messages</h2>

          {ticketsLoading ? (
            <p style={{ color: "#94A3B8" }}>Loading your messages...</p>
          ) : ticketsError ? (
            <p style={{ color: "#DC2626" }}>{ticketsError}</p>
          ) : tickets.length === 0 ? (
            <p style={{ color: "#94A3B8" }}>You haven't sent any support messages yet.</p>
          ) : (
            <div className="support-ticket-list">
              {tickets.map((t) => (
                <div key={t.id} className="support-ticket">
                  <div className="support-ticket-header">
                    <span className="support-ticket-subject">{t.subject}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="support-ticket-meta">
                    {t.category} &middot;{" "}
                    {t.created_at ? new Date(t.created_at).toLocaleString() : ""}
                  </div>
                  <p className="support-ticket-message">{t.message}</p>
                  {t.admin_reply && (
                    <div className="support-reply">
                      <div className="support-reply-label">
                        Support replied
                        {t.replied_at ? ` \u00b7 ${new Date(t.replied_at).toLocaleString()}` : ""}
                      </div>
                      <p className="support-reply-text">{t.admin_reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Support;
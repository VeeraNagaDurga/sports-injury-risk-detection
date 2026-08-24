import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/api";
import "../styles/upload.css";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const RISK_COLORS = {
  Low: "#22C55E",
  Moderate: "#F59E0B",
  High: "#EF4444",
  Critical: "#991B1B",
};

function riskColor(level) {
  return RISK_COLORS[level] || "#334155";
}

function displayInjuryName(name) {
  return name === "LowerBack" ? "Lower Back" : name;
}

const PROCESSING_STAGES = [
  "Uploading and preparing video...",
  "Running pose estimation (MediaPipe)...",
  "Tracking skeleton across every frame...",
  "Calculating joint angles and range of motion...",
  "Evaluating movement symmetry and stability...",
  "Predicting injury risk...",
  "Compiling PDF biomechanics report...",
];

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const sectionStyle = { margin: "32px 0" };
const cardStyle = {
  background: "#F8FAFC",
  border: "1px solid #E2E8F0",
  borderRadius: "10px",
  padding: "20px",
};
const tableWrapStyle = { overflowX: "auto" };
const thStyle = {
  textAlign: "left",
  padding: "10px 12px",
  background: "#1E3A8A",
  color: "#fff",
  fontSize: "13px",
};
const tdStyle = {
  padding: "10px 12px",
  borderBottom: "1px solid #E2E8F0",
  fontSize: "14px",
  verticalAlign: "top",
};

// NEW. Human-friendly labels for the breakdown chart's x-axis - the raw
// keys (biomechanical_deviations, etc.) match risk_score_summary.breakdown
// exactly, same source as the bullet list that already existed.
const BREAKDOWN_LABELS = {
  biomechanical_deviations: "Biomechanics",
  movement_asymmetry: "Asymmetry",
  historical_factors: "History",
  training_load: "Training Load",
  fatigue: "Fatigue",
};

function Results() {
  const query = useQuery();
  const navigate = useNavigate();
  const analysisId = query.get("analysis_id");

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoError, setVideoError] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [excelDownloading, setExcelDownloading] = useState(false);
  const [excelError, setExcelError] = useState(null);

  const handleExcelExport = async () => {
    setExcelDownloading(true);
    setExcelError(null);
    try {
      const res = await api.get(`/analysis/${encodeURIComponent(analysisId)}/export/excel`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `analysis_${analysisId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setExcelError(
        err.response?.data?.detail || "Failed to export Excel report. Please try again."
      );
    } finally {
      setExcelDownloading(false);
    }
  };

  useEffect(() => {
    if (!analysisId) {
      setError("No analysis_id provided in URL.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    let pollTimer = null;

    const fetchAnalysis = async (isFirstLoad) => {
      try {
        if (isFirstLoad) setLoading(true);
        const res = await api.get(`/analysis/${encodeURIComponent(analysisId)}`);
        if (cancelled) return;

        setAnalysis(res.data);
        setError(null);

        if (res.data.status === "processing") {
          pollTimer = setTimeout(() => fetchAnalysis(false), 3000);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.detail || "Failed to load analysis results.");
      } finally {
        if (!cancelled && isFirstLoad) setLoading(false);
      }
    };

    fetchAnalysis(true);

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [analysisId]);

  const analysisStatus = analysis?.status;

  useEffect(() => {
    if (analysisStatus !== "processing") return;
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [analysisStatus]);

  if (loading) {
    return (
      <div className="page">
        <div className="container" style={{ padding: "60px 20px", textAlign: "center" }}>
          <p>Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="container" style={{ padding: "60px 20px", textAlign: "center" }}>
          <h3>Couldn't load results</h3>
          <p style={{ color: "#DC2626" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (analysis && analysis.status === "processing") {
    const stageIndex = Math.min(Math.floor(elapsedSeconds / 4), PROCESSING_STAGES.length - 1);
    const progressPct = Math.min(95, Math.round((elapsedSeconds / 60) * 100));

    return (
      <div className="page">
        <style>{`
          @keyframes results-spin { to { transform: rotate(360deg); } }
        `}</style>
        <div className="container" style={{ padding: "60px 20px", textAlign: "center", maxWidth: "520px", margin: "0 auto" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              margin: "0 auto 24px",
              borderRadius: "50%",
              border: "4px solid #E2E8F0",
              borderTopColor: "#2563EB",
              animation: "results-spin 0.9s linear infinite",
            }}
          />

          <h2 style={{ marginBottom: "6px" }}>Analyzing Your Video</h2>
          <p style={{ color: "#334155", fontWeight: 600, minHeight: "24px" }}>
            {PROCESSING_STAGES[stageIndex]}
          </p>

          <div
            style={{
              width: "100%",
              height: "8px",
              background: "#E2E8F0",
              borderRadius: "999px",
              overflow: "hidden",
              margin: "16px 0 8px",
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                background: "#2563EB",
                borderRadius: "999px",
                transition: "width 1s linear",
              }}
            />
          </div>
          <p style={{ color: "#94A3B8", fontSize: "13px" }}>
            Elapsed: {formatElapsed(elapsedSeconds)} — longer videos can take a minute or more.
          </p>

          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              padding: "16px 20px",
              marginTop: "24px",
              fontSize: "13px",
              color: "#64748B",
              textAlign: "left",
            }}
          >
            This is running as a background job on the server, fully independent of
            this browser tab. You're free to leave this page — nothing will be lost or
            interrupted, and you can check on it anytime from your Dashboard.
          </div>

          <button
            className="btn"
            style={{ marginTop: "20px" }}
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (analysis && analysis.status === "failed") {
    return (
      <div className="page">
        <div className="container" style={{ padding: "60px 20px", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
          <h3>Analysis failed</h3>
          <p style={{ color: "#DC2626" }}>
            {analysis.error_message || "Something went wrong while processing this video."}
          </p>
        </div>
      </div>
    );
  }

  const {
    biomechanics,
    movement_quality,
    injury_risks,
    risk_score_summary,
    recommendations,
    movement_anomalies,
    processed_video_download,
    report_download,
    filename,
    athlete_name,
  } = analysis;

  const rom = biomechanics?.range_of_motion || {};
  // "Problem moment" flagged frames from the pose engine (knee valgus,
  // asymmetry, abnormal range of motion) - already included in the
  // existing biomechanics field, no separate API call needed. Each one is
  // annotated with a circle on the exact joint(s) at fault, not just a
  // plain skeleton snapshot.
  const flaggedFrames = biomechanics?.flagged_frames || [];
  // NEW. Evenly-spaced reference frames across the WHOLE clip, so the
  // athlete sees the tracked skeleton through the entire motion (takeoff /
  // mid-air / landing, etc.), not only the isolated flagged instants.
  const movementPhaseFrames = biomechanics?.movement_phase_frames || [];
  const breakdown = risk_score_summary?.breakdown || {};

  // NEW. Chart data derived straight from the same numbers already shown
  // in the bullet list / table above each chart - never invented, just
  // reshaped for recharts.
  const breakdownChartData = Object.entries(breakdown).map(([key, value]) => ({
    name: BREAKDOWN_LABELS[key] || key,
    value: value ?? 0,
  }));

  const injuryChartData = injury_risks
    ? Object.entries(injury_risks).map(([name, data]) => ({
        name: displayInjuryName(name),
        probability: data.probability ?? 0,
        risk_level: data.risk_level,
      }))
    : [];

  const riskLevelCounts = injury_risks
    ? Object.values(injury_risks).reduce((acc, data) => {
        const level = data.risk_level || "Unknown";
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {})
    : {};
  const riskLevelPieData = Object.entries(riskLevelCounts).map(([level, count]) => ({
    name: level,
    value: count,
  }));

  return (
    <div className="page">
      <div className="container" style={{ padding: "40px 20px", maxWidth: "900px", margin: "0 auto" }}>
        <h2>Analysis Results</h2>
        <p style={{ color: "#64748B" }}>
          {athlete_name ? `Athlete: ${athlete_name}` : null} {filename ? `— ${filename}` : null}
        </p>

        {/* ---------------- Processed Video ---------------- */}
        <div style={sectionStyle}>
          <h3>Processed Video</h3>
          {videoError ? (
            <div style={{ color: "#DC2626" }}>
              The processed video couldn't be played. This usually means either:
              <ul>
                <li>the video is still processing / failed on the server (check the backend logs), or</li>
                <li>the file exists but isn't a browser-compatible format (ffmpeg/H.264 conversion issue).</li>
              </ul>
              You can still try downloading it directly:{" "}
              <a href={processed_video_download} target="_blank" rel="noreferrer">
                {processed_video_download}
              </a>
            </div>
          ) : (
            <div
              style={{
                width: "100%",
                maxWidth: "640px",
                aspectRatio: "16 / 9",
                background: "#000",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <video
                key={processed_video_download}
                controls
                preload="auto"
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                onError={() => setVideoError(true)}
              >
                <source src={processed_video_download} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>

        {/* ---------------- Risk Moments (annotated flagged frames) ---------------- */}
        <div style={sectionStyle}>
          <h3>Risk Moments</h3>
          <p style={{ color: "#64748B", fontSize: "13px", marginTop: "-4px" }}>
            The exact instants the pose engine flagged - the circled joint(s) and the line
            connecting them show precisely where the issue is, with the measured value underneath.
          </p>
          {flaggedFrames.length === 0 ? (
            <p style={{ color: "#64748B", fontSize: "13px" }}>
              No specific movement issues were flagged in this session.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "16px",
              }}
            >
              {flaggedFrames.map((f, i) => (
                <div
                  key={i}
                  style={{
                    border: "1px solid #E2E8F0",
                    borderRadius: "10px",
                    overflow: "hidden",
                    background: "#F8FAFC",
                  }}
                >
                  <img
                    src={f.image_url}
                    alt={f.issue}
                    style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block" }}
                  />
                  <div style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "8px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>{f.issue}</span>
                      {f.severity != null && (
                        <span
                          style={{
                            flexShrink: 0,
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "999px",
                            background: f.severity >= 1.5 ? "#FEE2E2" : "#FEF3C7",
                            color: f.severity >= 1.5 ? "#991B1B" : "#92400E",
                          }}
                        >
                          {f.severity}x
                        </span>
                      )}
                    </div>
                    {f.detail && (
                      <div style={{ fontSize: "12px", color: "#64748B", marginTop: "3px" }}>{f.detail}</div>
                    )}
                    <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}>
                      {f.timestamp_seconds != null ? `${f.timestamp_seconds}s` : `frame ${f.frame_index}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---------------- Movement Phases (whole-clip filmstrip) ---------------- */}
        {movementPhaseFrames.length > 0 && (
          <div style={sectionStyle}>
            <h3>Movement Phases</h3>
            <p style={{ color: "#64748B", fontSize: "13px", marginTop: "-4px" }}>
              Reference frames spaced across the full movement, not just the flagged instants above -
              so you can see how the skeleton tracked from start to finish.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "16px",
              }}
            >
              {movementPhaseFrames.map((p, i) => (
                <div
                  key={i}
                  style={{
                    border: "1px solid #E2E8F0",
                    borderRadius: "10px",
                    overflow: "hidden",
                    background: "#F8FAFC",
                  }}
                >
                  <img
                    src={p.image_url}
                    alt={`Movement phase ${p.phase_number}`}
                    style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block" }}
                  />
                  <div style={{ padding: "10px 12px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                      Phase {p.phase_number}
                    </div>
                    {p.issue ? (
                      <>
                        <div style={{ fontSize: "12px", color: "#DC2626", marginTop: "3px" }}>{p.issue}</div>
                        {p.detail && (
                          <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>{p.detail}</div>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize: "12px", color: "#22C55E", marginTop: "3px" }}>Clean form</div>
                    )}
                    <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}>
                      {p.timestamp_seconds != null ? `${p.timestamp_seconds}s` : `frame ${p.frame_index}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={sectionStyle}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <a href={report_download} target="_blank" rel="noreferrer" className="btn">
              Download PDF Biomechanics Report
            </a>
            <button
              onClick={handleExcelExport}
              disabled={excelDownloading}
              className="btn-outline"
            >
              {excelDownloading ? "Exporting..." : "Export Excel Report"}
            </button>
          </div>
          {excelError && (
            <p style={{ color: "#DC2626", fontSize: "13px", marginTop: "8px" }}>{excelError}</p>
          )}
        </div>

        {/* ---------------- Injury Risk Evaluation ---------------- */}
        {risk_score_summary && (
          <div style={sectionStyle}>
            <h3>Injury Risk Evaluation</h3>
            <div style={{ ...cardStyle, display: "flex", gap: "32px", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ textAlign: "center", minWidth: "140px" }}>
                <div style={{ fontSize: "40px", fontWeight: 800, color: riskColor(risk_score_summary.risk_level) }}>
                  {risk_score_summary.overall_score}%
                </div>
                <div style={{ fontWeight: 700, color: "#334155" }}>
                  OVERALL RISK: {risk_score_summary.risk_level?.toUpperCase()}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: "240px" }}>
                <strong>Weighted Risk Score Factors:</strong>
                <ul style={{ margin: "8px 0 0", paddingLeft: "20px", lineHeight: 1.7 }}>
                  <li>Biomechanical Deviations (35%): {breakdown.biomechanical_deviations ?? 0}%</li>
                  <li>Movement Asymmetry (20%): {breakdown.movement_asymmetry ?? 0}%</li>
                  <li>Historical Injury Factors (20%): {breakdown.historical_factors ?? 0}%</li>
                  <li>Training Load Indicators (15%): {breakdown.training_load ?? 0}%</li>
                  <li>Fatigue Indicators (10%): {breakdown.fatigue ?? 0}%</li>
                </ul>
              </div>
            </div>

            {/* NEW. Same breakdown numbers as the bullet list above, as a bar chart. */}
            {breakdownChartData.length > 0 && (
              <div style={{ ...cardStyle, marginTop: "16px" }}>
                <strong style={{ fontSize: "13px", color: "#64748B" }}>Risk Factor Breakdown</strong>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={breakdownChartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="value" fill="#2563EB" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* ---------------- Predicted Injury Profile ---------------- */}
        {injury_risks && (
          <div style={sectionStyle}>
            <h3>Predicted Injury Profile</h3>
            <div style={tableWrapStyle}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Injury Category</th>
                    <th style={thStyle}>Risk Level</th>
                    <th style={thStyle}>Probability</th>
                    <th style={thStyle}>Primary Contributing Factors</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(injury_risks).map(([name, data]) => (
                    <tr key={name}>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{displayInjuryName(name)}</td>
                      <td style={{ ...tdStyle, color: riskColor(data.risk_level), fontWeight: 700 }}>
                        {data.risk_level}
                      </td>
                      <td style={tdStyle}>{data.probability}%</td>
                      <td style={tdStyle}>
                        <ul style={{ margin: 0, paddingLeft: "18px" }}>
                          {(data.reasons || []).map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* NEW. Two charts side by side: probability per category (bar,
                color-coded by risk level) and how many categories fall into
                each risk level (pie) - both derived from the same table above. */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginTop: "16px" }}>
              {injuryChartData.length > 0 && (
                <div style={cardStyle}>
                  <strong style={{ fontSize: "13px", color: "#64748B" }}>Injury Probability by Category</strong>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={injuryChartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={50} />
                      <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Bar dataKey="probability" radius={[6, 6, 0, 0]}>
                        {injuryChartData.map((entry, i) => (
                          <Cell key={i} fill={riskColor(entry.risk_level)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {riskLevelPieData.length > 0 && (
                <div style={cardStyle}>
                  <strong style={{ fontSize: "13px", color: "#64748B" }}>Categories by Risk Level</strong>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={riskLevelPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(e) => `${e.name} (${e.value})`}
                      >
                        {riskLevelPieData.map((entry, i) => (
                          <Cell key={i} fill={riskColor(entry.name)} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------- Movement Anomaly Detection ---------------- */}
        {movement_anomalies && (
          <div style={sectionStyle}>
            <h3>Movement Anomaly Detection</h3>
            <p style={{ color: "#64748B", fontSize: "13px", marginTop: "-4px" }}>
              Compares this session against this athlete's own recent history - not just fixed thresholds.
            </p>

            {movement_anomalies.status === "insufficient_history" ? (
              <div style={{ ...cardStyle, color: "#64748B" }}>
                {movement_anomalies.message}
              </div>
            ) : (
              <>
                <div
                  style={{
                    ...cardStyle,
                    fontWeight: 700,
                    color: movement_anomalies.anomalies.length > 0 ? "#EF4444" : "#22C55E",
                    marginBottom: movement_anomalies.anomalies.length > 0 ? "12px" : "0",
                  }}
                >
                  {movement_anomalies.overall_flag}
                  <span style={{ fontWeight: 400, color: "#64748B", marginLeft: "10px" }}>
                    (compared against last {movement_anomalies.sessions_compared} session
                    {movement_anomalies.sessions_compared === 1 ? "" : "s"})
                  </span>
                </div>

                {movement_anomalies.anomalies.length > 0 && (
                  <div style={tableWrapStyle}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Metric</th>
                          <th style={thStyle}>Baseline</th>
                          <th style={thStyle}>Current</th>
                          <th style={thStyle}>Change</th>
                          <th style={thStyle}>Severity</th>
                          <th style={thStyle}>Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movement_anomalies.anomalies.map((a, i) => (
                          <tr key={i}>
                            <td style={{ ...tdStyle, fontWeight: 700 }}>{a.metric}</td>
                            <td style={tdStyle}>{a.baseline}</td>
                            <td style={tdStyle}>{a.current}</td>
                            <td style={tdStyle}>{a.change_pct > 0 ? "+" : ""}{a.change_pct}%</td>
                            <td style={{ ...tdStyle, color: riskColor(a.severity), fontWeight: 700 }}>
                              {a.severity}
                            </td>
                            <td style={tdStyle}>{a.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ---------------- Movement Quality ---------------- */}
        {movement_quality && (
          <div style={sectionStyle}>
            <h3>Movement Quality</h3>
            <div style={{ ...cardStyle, display: "flex", gap: "24px", flexWrap: "wrap" }}>
              <div><strong>Score:</strong> {movement_quality.movement_score}/100</div>
              <div><strong>Grade:</strong> {movement_quality.grade}</div>
              <div><strong>Stability:</strong> {movement_quality.stability_score}%</div>
              <div><strong>Balance:</strong> {movement_quality.balance_score}%</div>
            </div>
            {movement_quality.feedback && movement_quality.feedback.length > 0 && (
              <ul style={{ marginTop: "12px" }}>
                {movement_quality.feedback.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ---------------- Biomechanical Joint Performance ---------------- */}
        {Object.keys(rom).length > 0 && (
          <div style={sectionStyle}>
            <h3>Biomechanical Joint Performance</h3>
            <div style={tableWrapStyle}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, background: "#475569" }}>Joint / Muscle</th>
                    <th style={{ ...thStyle, background: "#475569" }}>Average Angle</th>
                    <th style={{ ...thStyle, background: "#475569" }}>Min / Max Reached</th>
                    <th style={{ ...thStyle, background: "#475569" }}>Range of Motion</th>
                    <th style={{ ...thStyle, background: "#475569" }}>ROM Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(rom).map(([joint, stats]) => (
                    <tr key={joint}>
                      <td style={tdStyle}>{joint.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</td>
                      <td style={tdStyle}>{stats.avg}°</td>
                      <td style={tdStyle}>{stats.min}° - {stats.max}°</td>
                      <td style={tdStyle}>{stats.rom}°</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: stats.status === "Normal" ? "#22C55E" : "#EF4444" }}>
                        {stats.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------- Corrective Recommendations ---------------- */}
        {recommendations && recommendations.length > 0 && (
          <div style={sectionStyle}>
            <h3>Corrective Recommendations</h3>
            {recommendations.map((rec, i) => (
              <div key={i} style={{ ...cardStyle, marginBottom: "12px" }}>
                <div style={{ fontWeight: 700, marginBottom: "8px" }}>
                  {rec.category} <span style={{ fontWeight: 400, color: "#64748B" }}>(Freq: {rec.frequency})</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: "20px" }}>
                  {rec.exercises.map((ex, j) => (
                    <li key={j} style={{ marginBottom: "4px" }}>{ex}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Results;
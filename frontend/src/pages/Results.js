import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";
import {
  FaHeartbeat, FaRunning, FaDownload, FaSyncAlt, FaArrowLeft,
  FaFilePdf, FaExclamationTriangle, FaDumbbell, FaBalanceScale, FaAngleDoubleRight
} from "react-icons/fa";
import "../styles/results.css";
 
function Results() {
  const location = useLocation();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  // Extract analysis_id from query params
  const queryParams = new URLSearchParams(location.search);
  const analysisId = queryParams.get("analysis_id");
 
  useEffect(() => {
    if (analysisId) {
      fetchResults();
    } else {
      setError("No Analysis ID provided in the URL.");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisId]);
 
  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/analysis/${encodeURIComponent(analysisId)}`);
      setAnalysis(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching analysis results:", err);
      setError("Failed to load analysis results. The video might still be processing or the ID is invalid.");
      setLoading(false);
    }
  };
 
  if (loading) {
    return (
      <div className="page" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <FaSyncAlt className="spinner-icon" style={{ fontSize: "50px", color: "#2563eb", marginBottom: "20px" }} />
        <h2>Fetching AI Analysis Outcomes...</h2>
        <p style={{ color: "#64748b", marginTop: "10px" }}>Retrieving joint tracking data and risk models...</p>
      </div>
    );
  }
 
  if (error || !analysis) {
    return (
      <div className="page">
        <div className="container" style={{ maxWidth: "600px", textAlign: "center", padding: "50px 20px" }}>
          <FaExclamationTriangle style={{ fontSize: "60px", color: "#ef4444", marginBottom: "20px" }} />
          <h2>Analysis Error</h2>
          <p style={{ color: "#64748b", margin: "15px 0 30px" }}>{error || "An unexpected error occurred."}</p>
          <Link to="/upload-video" className="btn" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <FaArrowLeft /> Back to Upload
          </Link>
        </div>
      </div>
    );
  }
 
  const {
    filename,
    athlete_name,
    tracking,
    biomechanics,
    injury_risks,
    risk_score_summary,
    recommendations,
    processed_video_download,
    report_download,
  } = analysis;
 
  const overallScore = risk_score_summary?.overall_score ?? 0;
  const riskLevel = risk_score_summary?.risk_level ?? "Low";
  const breakdown = risk_score_summary?.breakdown ?? {};
 
  const getRiskColor = (level) => {
    switch (level) {
      case "Low": return "#22c55e";
      case "Moderate": return "#eab308";
      case "High": return "#f97316";
      case "Critical": return "#ef4444";
      default: return "#64748b";
    }
  };
 
  const riskColor = getRiskColor(riskLevel);
 
  const injuryNameMap = {
    LowerBack: "Lower Back",
    ACL: "ACL Tear",
    Hamstring: "Hamstring Strain",
    Ankle: "Ankle Sprain",
    Shoulder: "Shoulder Impingement",
    Overuse: "Overuse Syndrome",
  };
 
  return (
    <div className="page">
      <div className="container">
 
        {/* Navigation & Header */}
        <div className="results-header">
          <Link to="/upload-video" className="btn-back">
            <FaArrowLeft /> Back to Upload
          </Link>
          <div className="header-actions">
            {report_download && (
              <a
                href={report_download}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-pdf"
              >
                <FaFilePdf /> Download PDF Report
              </a>
            )}
          </div>
        </div>
 
        <div className="title-section">
          <h1 className="title">AI Biomechanics Assessment</h1>
          <p className="subtitle">
            Athlete: <strong>{athlete_name}</strong> | File: <code>{filename}</code> | Detection Rate: <strong>{tracking?.detection_rate}%</strong>
          </p>
        </div>
 
        {/* Dashboard Grid Row 1: Video & Risk Meter */}
        <div className="dashboard-row-1">
          {/* Video Player */}
          <div className="video-card">
            <h3>Processed Pose Skeleton Video</h3>
            <div className="video-wrapper">
              {processed_video_download ? (
                <video
                  key={processed_video_download}
                  width="100%"
                  controls
                  autoPlay
                  muted
                  onError={(e) => console.error("Video failed to load:", processed_video_download, e)}
                >
                  <source src={processed_video_download} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="video-placeholder">Processed video is not available for this analysis.</div>
              )}
            </div>
            <p className="video-caption">
              Skeletal overlays representing joint vectors, segment tracking, and positional tracking.
            </p>
          </div>
 
          {/* Overall Risk Meter */}
          <div className="overall-risk-card" style={{ borderTop: `6px solid ${riskColor}` }}>
            <FaHeartbeat className="heart-icon" style={{ color: riskColor }} />
            <h3>Overall Injury Risk</h3>
            <div className="risk-badge" style={{ backgroundColor: `${riskColor}15`, color: riskColor }}>
              {riskLevel.toUpperCase()} RISK
            </div>
            <div className="score-display">
              <span className="score-num" style={{ color: riskColor }}>{overallScore}%</span>
              <span className="score-label">Risk Probability</span>
            </div>
 
            <div className="gauge-container">
              <div className="gauge-bg">
                <div className="gauge-fill" style={{ width: `${overallScore}%`, backgroundColor: riskColor }}></div>
              </div>
            </div>
 
            <div className="breakdown-section">
              <h4>Weighted Risk Score Factors:</h4>
              <div className="factor-row">
                <span>Biomechanical Deviations (35%)</span>
                <strong style={{ color: breakdown.biomechanical_deviations > 50 ? "#f97316" : "#475569" }}>
                  {breakdown.biomechanical_deviations ?? 0}%
                </strong>
              </div>
              <div className="factor-row">
                <span>Movement Asymmetry (20%)</span>
                <strong style={{ color: breakdown.movement_asymmetry > 40 ? "#f97316" : "#475569" }}>
                  {breakdown.movement_asymmetry ?? 0}%
                </strong>
              </div>
              <div className="factor-row">
                <span>Historical Injury Factors (20%)</span>
                <strong style={{ color: breakdown.historical_factors > 0 ? "#2563eb" : "#475569" }}>
                  {breakdown.historical_factors ?? 0}%
                </strong>
              </div>
              <div className="factor-row">
                <span>Training Load Indicators (15%)</span>
                <strong style={{ color: breakdown.training_load > 60 ? "#2563eb" : "#475569" }}>
                  {breakdown.training_load ?? 0}%
                </strong>
              </div>
              <div className="factor-row">
                <span>Fatigue Indicators (10%)</span>
                <strong style={{ color: breakdown.fatigue > 60 ? "#8b5cf6" : "#475569" }}>
                  {breakdown.fatigue ?? 0}%
                </strong>
              </div>
            </div>
          </div>
        </div>
 
        {/* Dashboard Row 2: Injury Category Risks */}
        {injury_risks && (
          <div className="injury-profiles-card">
            <h3>Predicted Injury Profiles</h3>
            <p className="card-subtitle">AI-modeled injury risk probability and contributing parameters.</p>
            <div className="injury-profiles-grid">
              {Object.entries(injury_risks).map(([key, data]) => {
                const displayName = injuryNameMap[key] || key;
                const levelColor = getRiskColor(data.risk_level);
 
                return (
                  <div key={key} className="injury-item-card">
                    <div className="injury-item-header">
                      <strong>{displayName}</strong>
                      <span className="injury-badge" style={{ backgroundColor: `${levelColor}15`, color: levelColor }}>
                        {data.risk_level}
                      </span>
                    </div>
                    <div className="injury-progress-wrapper">
                      <div className="progress-value">{data.probability}%</div>
                      <div className="injury-progress-bg">
                        <div className="injury-progress-fill" style={{ width: `${data.probability}%`, backgroundColor: levelColor }}></div>
                      </div>
                    </div>
                    <div className="injury-reasons">
                      {(data.reasons || []).map((r, i) => (
                        <div key={i} className="reason-bullet">
                          <FaAngleDoubleRight className="reason-arrow" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
 
        {/* Dashboard Row 3: Biomechanical Joint Details */}
        <div className="biomechanics-details-grid">
          {/* ROM Details */}
          <div className="rom-card">
            <div className="card-title-group">
              <FaRunning className="title-icon" />
              <h3>Range of Motion (ROM) Analysis</h3>
            </div>
            <div className="table-wrapper">
              <table className="rom-table">
                <thead>
                  <tr>
                    <th>Joint / Muscle</th>
                    <th>Average Angle</th>
                    <th>Peak Min / Max</th>
                    <th>Total ROM</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {biomechanics?.range_of_motion && Object.entries(biomechanics.range_of_motion).map(([joint, stats]) => (
                    <tr key={joint}>
                      <td><strong>{joint.replace("_", " ").toUpperCase()}</strong></td>
                      <td>{stats.avg}°</td>
                      <td>{stats.min}° - {stats.max}°</td>
                      <td>{stats.rom}°</td>
                      <td>
                        <span className={`status-tag ${stats.status.toLowerCase()}`}>
                          {stats.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
 
          {/* Symmetry & Lean Details */}
          <div className="symmetry-card">
            <div className="card-title-group">
              <FaBalanceScale className="title-icon" />
              <h3>Alignment & Symmetry</h3>
            </div>
 
            <div className="symmetry-section">
              <h4>Left/Right Side Asymmetry:</h4>
              {biomechanics?.symmetry && Object.entries(biomechanics.symmetry).map(([joint, data]) => (
                <div key={joint} className="symmetry-row">
                  <div className="symmetry-label">
                    <span>{joint.toUpperCase()}</span>
                    <small>Avg Difference: {data.difference}°</small>
                  </div>
                  <span className={`status-tag ${data.status?.toLowerCase()}`}>
                    {data.status}
                  </span>
                </div>
              ))}
            </div>
 
            <div className="alignment-section">
              <h4>Torso & Knee Stability:</h4>
 
              <div className="alignment-row">
                <div className="alignment-label">
                  <span>Trunk Lean (Average)</span>
                  <small>Peak Lean: {biomechanics?.peak_metrics?.max_trunk_lean}°</small>
                </div>
                <strong>{biomechanics?.trunk_lean}°</strong>
              </div>
 
              {biomechanics?.valgus_details && (
                <>
                  <div className="alignment-row">
                    <div className="alignment-label">
                      <span>Left Knee Valgus Rate</span>
                      <small>Max Dev: {biomechanics?.peak_metrics?.max_left_knee_valgus_dev}m</small>
                    </div>
                    <strong style={{ color: biomechanics.valgus_details.left_valgus_percentage > 15 ? "#ef4444" : "#1e293b" }}>
                      {biomechanics.valgus_details.left_valgus_percentage}%
                    </strong>
                  </div>
 
                  <div className="alignment-row">
                    <div className="alignment-label">
                      <span>Right Knee Valgus Rate</span>
                      <small>Max Dev: {biomechanics?.peak_metrics?.max_right_knee_valgus_dev}m</small>
                    </div>
                    <strong style={{ color: biomechanics.valgus_details.right_valgus_percentage > 15 ? "#ef4444" : "#1e293b" }}>
                      {biomechanics.valgus_details.right_valgus_percentage}%
                    </strong>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
 
        {/* Dashboard Row 4: Corrective Exercises */}
        {recommendations && recommendations.length > 0 && (
          <div className="recommendations-section-card">
            <div className="card-title-group">
              <FaDumbbell className="title-icon" style={{ color: "#2563eb" }} />
              <h3>AI Personalized Corrective Recommendations</h3>
            </div>
            <p className="card-subtitle">Recommended training routines and mobility drills to reduce biomechanical risk factors.</p>
 
            <div className="recommendations-grid">
              {recommendations.map((rec, i) => (
                <div key={i} className="rec-card">
                  <div className="rec-card-header">
                    <h4>{rec.category}</h4>
                    <span className="rec-freq">{rec.frequency}</span>
                  </div>
                  <ul className="rec-exercises-list">
                    {rec.exercises.map((ex, j) => (
                      <li key={j}>
                        <span className="ex-num">{j + 1}</span>
                        <span className="ex-text">{ex}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
 
      </div>
    </div>
  );
}
 
export default Results;
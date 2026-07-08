import "../styles/results.css";
import {
  FaHeartbeat,
  FaRunning,
  FaCheckCircle,
  FaChartLine
} from "react-icons/fa";

function Results() {

  return (

    <div className="page">

      <div className="container">

        <h1 className="dashboard-title">
          AI Analysis Results
        </h1>

        <p className="dashboard-subtitle">
          Pose Detection & Injury Risk Assessment
        </p>

        <div className="results-grid">

          <div className="result-card">

            <FaHeartbeat className="result-icon"/>

            <h2>Risk Level</h2>

            <h1 className="green">LOW</h1>

          </div>

          <div className="result-card">

            <FaRunning className="result-icon"/>

            <h2>Pose Frames</h2>

            <h1>315</h1>

          </div>

          <div className="result-card">

            <FaChartLine className="result-icon"/>

            <h2>Detection Accuracy</h2>

            <h1>98%</h1>

          </div>

        </div>

        <div className="recommendation-card">

          <FaCheckCircle className="recommend-icon"/>

          <div>

            <h2>AI Recommendation</h2>

            <p>

              Athlete posture appears stable.
              Continue training while maintaining
              correct knee and hip alignment.
              No immediate injury risk detected.

            </p>

          </div>

        </div>

      </div>

    </div>

  );

}

export default Results;
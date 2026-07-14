import "../styles/dashboard.css";
import StatCard from "../components/StatCard";

import {
  FaUsers,
  FaVideo,
  FaHeartbeat,
  FaRunning
} from "react-icons/fa";

function Dashboard() {
  return (
    <div className="page">
      <div className="container">

        <h1 className="dashboard-title">
          Dashboard
        </h1>

        <p className="dashboard-subtitle">
          AI Sports Injury Detection Overview
        </p>

        <div className="dashboard-grid">

          <StatCard
            title="Athletes"
            value="128"
            icon={<FaUsers />}
            color="#2563EB"
          />

          <StatCard
            title="Uploaded Videos"
            value="63"
            icon={<FaVideo />}
            color="#22C55E"
          />

          <StatCard
            title="Risk Cases"
            value="14"
            icon={<FaHeartbeat />}
            color="#EF4444"
          />

          <StatCard
            title="AI Analysis"
            value="98%"
            icon={<FaRunning />}
            color="#8B5CF6"
          />

        </div>

        <div className="analytics-card">

          <h2>Injury Risk Analytics</h2>

          <p>
            This section will display AI charts, injury trends,
            joint analysis, and performance statistics in
            Milestone 2.
          </p>

        </div>

      </div>
    </div>
  );
}

export default Dashboard;
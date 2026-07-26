import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/dashboard.css";
import StatCard from "../components/StatCard";

import {
  FaUsers,
  FaVideo,
  FaHeartbeat,
  FaRunning,
  FaTrash
} from "react-icons/fa";

function Dashboard() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/athlete-profiles");
      setProfiles(res.data.profiles || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      setLoading(false);
    }
  };

  const deleteProfile = async (athlete_id) => {
    if (window.confirm(`Delete profile for ${athlete_id}?`)) {
      try {
        await axios.delete(`http://127.0.0.1:8000/athlete-profile/${athlete_id}`);
        setProfiles(profiles.filter(p => p.athlete_id !== athlete_id));
      } catch (error) {
        console.error("Error deleting profile:", error);
        alert("Failed to delete profile from database");
      }
    }
  };

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
            title="Saved Athletes"
            value={profiles.length}
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
                        <button 
                          className="btn-view"
                          onClick={() => setSelectedProfile(profile)}
                        >
                          View
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => deleteProfile(profile.athlete_id)}
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

      </div>
    </div>
  );
}

export default Dashboard;
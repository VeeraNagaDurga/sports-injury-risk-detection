import { Link } from "react-router-dom";

function Dashboard() {
  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h1>Sports Injury Risk Detection Dashboard</h1>

      <p>Welcome to the AI-based Sports Injury Risk Detection System.</p>

      <div style={{ marginTop: "30px" }}>

        <Link to="/athlete-profile">
          <button style={{ margin: "10px", padding: "10px 20px" }}>
            Athlete Profile
          </button>
        </Link>

        <Link to="/upload">
          <button style={{ margin: "10px", padding: "10px 20px" }}>
            Upload Video
          </button>
        </Link>

        <Link to="/results">
          <button style={{ margin: "10px", padding: "10px 20px" }}>
            View Results
          </button>
        </Link>

      </div>
    </div>
  );
}

export default Dashboard;
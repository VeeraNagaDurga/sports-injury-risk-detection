import { Link } from "react-router-dom";

function Home() {
  return (
    <div style={{ textAlign: "center", marginTop: "60px" }}>
      <h1>Sports Injury Risk Detection from Video</h1>

      <p>
        AI-powered platform for analyzing athlete movements,
        predicting injury risks, and providing corrective posture
        recommendations.
      </p>

      <br />

      <Link to="/login">
        <button>Login</button>
      </Link>

      &nbsp;&nbsp;

      <Link to="/register">
        <button>Register</button>
      </Link>
    </div>
  );
}

export default Home;
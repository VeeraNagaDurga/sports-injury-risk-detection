import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../styles/auth.css";

function Login() {

  const navigate = useNavigate();

  const [user, setUser] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value
    });
  };

  const loginUser = async (e) => {

    e.preventDefault();

    try {

      const response = await axios.post(
        "http://127.0.0.1:8000/login",
        user
      );

      alert(response.data.message);

      navigate("/dashboard");

    } catch {

      alert("Login Failed");

    }

  };

  return (

    <div className="auth-page">

      <div className="form-card">

        <h2>Login</h2>

        <form onSubmit={loginUser}>

          <div className="form-group">

            <label>Email</label>

            <input
              className="form-control"
              type="email"
              name="email"
              value={user.email}
              onChange={handleChange}
            />

          </div>

          <div className="form-group">

            <label>Password</label>

            <input
              className="form-control"
              type="password"
              name="password"
              value={user.password}
              onChange={handleChange}
            />

          </div>

          <button className="btn" style={{ width: "100%" }}>
            Login
          </button>

        </form>

        <p style={{ marginTop: "20px" }}>
          Don't have an account?
          <Link to="/register"> Register</Link>
        </p>

      </div>

    </div>

  );

}

export default Login;
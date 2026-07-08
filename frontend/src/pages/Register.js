import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function Register() {
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value
    });
  };

  const registerUser = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/register",
        user
      );

      alert(response.data.message);

      setUser({
        name: "",
        email: "",
        password: ""
      });

    } catch (error) {
      alert("Registration Failed");
      console.log(error);
    }
  };

  return (
    <div style={{ width: "400px", margin: "50px auto" }}>
      <h2>Athlete Registration</h2>

      <form onSubmit={registerUser}>

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={user.name}
          onChange={handleChange}
        />

        <br /><br />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={user.email}
          onChange={handleChange}
        />

        <br /><br />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={user.password}
          onChange={handleChange}
        />

        <br /><br />

        <button type="submit">Register</button>

      </form>

      <br />

      <Link to="/login">Already have an account? Login</Link>

    </div>
  );
}

export default Register;
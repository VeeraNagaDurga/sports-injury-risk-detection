import { useState } from "react";
import axios from "axios";

function AthleteProfile() {

  const [profile, setProfile] = useState({
    athlete_id: "",
    sport_type: "",
    position: "",
    age: "",
    height: "",
    weight: "",
    injury_history: "",
    training_load: ""
  });

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const saveProfile = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/athlete-profile",
        profile
      );

      alert(response.data.message);

    } catch (error) {
      alert("Failed to Save Profile");
      console.log(error);
    }
  };

  return (
    <div style={{ width: "600px", margin: "30px auto" }}>
      <h2>Athlete Profile</h2>

      <form onSubmit={saveProfile}>

        <input
          type="text"
          name="athlete_id"
          placeholder="Athlete ID"
          onChange={handleChange}
        /><br /><br />

        <input
          type="text"
          name="sport_type"
          placeholder="Sport Type"
          onChange={handleChange}
        /><br /><br />

        <input
          type="text"
          name="position"
          placeholder="Position"
          onChange={handleChange}
        /><br /><br />

        <input
          type="number"
          name="age"
          placeholder="Age"
          onChange={handleChange}
        /><br /><br />

        <input
          type="number"
          name="height"
          placeholder="Height (cm)"
          onChange={handleChange}
        /><br /><br />

        <input
          type="number"
          name="weight"
          placeholder="Weight (kg)"
          onChange={handleChange}
        /><br /><br />

        <textarea
          name="injury_history"
          placeholder="Injury History"
          onChange={handleChange}
        ></textarea><br /><br />

        <input
          type="text"
          name="training_load"
          placeholder="Training Load"
          onChange={handleChange}
        /><br /><br />

        <button type="submit">
          Save Profile
        </button>

      </form>

    </div>
  );
}

export default AthleteProfile;
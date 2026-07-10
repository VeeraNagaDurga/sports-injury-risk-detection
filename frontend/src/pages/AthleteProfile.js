import { useState } from "react";
import axios from "axios";
import "../styles/profile.css";

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
      const res = await axios.post(
        "http://127.0.0.1:8000/athlete-profile",
        profile
      );

      alert(res.data.message);

    } catch {
      alert("Profile Save Failed");
    }
  };

  return (

    <div className="page">

      <div className="container">

        <div className="form-card profile-card">

          <h2>Athlete Profile</h2>

          <form onSubmit={saveProfile} className="profile-grid">

            <input className="form-control" placeholder="Athlete ID" name="athlete_id" onChange={handleChange}/>
            <input className="form-control" placeholder="Sport Type" name="sport_type" onChange={handleChange}/>
            <input className="form-control" placeholder="Position" name="position" onChange={handleChange}/>
            <input className="form-control" placeholder="Age" name="age" onChange={handleChange}/>
            <input className="form-control" placeholder="Height" name="height" onChange={handleChange}/>
            <input className="form-control" placeholder="Weight" name="weight" onChange={handleChange}/>

            <textarea
              className="form-control"
              placeholder="Injury History"
              name="injury_history"
              rows="4"
              onChange={handleChange}
            />

            <textarea
              className="form-control"
              placeholder="Training Load"
              name="training_load"
              rows="4"
              onChange={handleChange}
            />

            <button className="btn profile-btn">
              Save Profile
            </button>

          </form>

        </div>

      </div>

    </div>

  );

}

export default AthleteProfile;
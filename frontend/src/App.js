import "./index.css";
import "./styles/global.css";
import "./App.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AthleteProfile from "./pages/AthleteProfile";
import UploadVideo from "./pages/UploadVideo";
import Results from "./pages/Results";

function App() {
  return (
    <BrowserRouter>
      <div className="app">

        <Navbar />

        <main>

          <Routes>

            <Route path="/" element={<Home />} />

            <Route path="/login" element={<Login />} />

            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={<Dashboard />} />

            <Route
              path="/athlete-profile"
              element={<AthleteProfile />}
            />

            <Route
              path="/upload-video"
              element={<UploadVideo />}
            />

            <Route
              path="/results"
              element={<Results />}
            />

          </Routes>

        </main>

        <Footer />

      </div>
    </BrowserRouter>
  );
}

export default App;
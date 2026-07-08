import { useState } from "react";
import axios from "axios";

function UploadVideo() {

  const [video, setVideo] = useState(null);

  const uploadVideo = async (e) => {
    e.preventDefault();

    if (!video) {
      alert("Please select a video.");
      return;
    }

    const formData = new FormData();
    formData.append("video", video);

    try {

      const response = await axios.post(
        "http://127.0.0.1:8000/upload-video",
        formData
      );

      alert(response.data.message);

    } catch (error) {

      alert("Video Upload Failed");
      console.log(error);

    }
  };

  return (

    <div style={{ width: "500px", margin: "40px auto" }}>

      <h2>Upload Sports Video</h2>

      <form onSubmit={uploadVideo}>

        <input
          type="file"
          accept="video/*"
          onChange={(e) => setVideo(e.target.files[0])}
        />

        <br /><br />

        <button type="submit">
          Upload Video
        </button>

      </form>

    </div>

  );

}

export default UploadVideo;
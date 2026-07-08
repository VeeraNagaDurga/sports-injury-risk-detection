import { useState } from "react";
import axios from "axios";
import "../styles/upload.css";

function UploadVideo() {

  const [video,setVideo]=useState(null);

  const upload=async(e)=>{

    e.preventDefault();

    const data=new FormData();

    data.append("video",video);

    try{

      const res=await axios.post(
        "http://127.0.0.1:8000/upload-video",
        data
      );

      alert(res.data.message);

    }catch{

      alert("Upload Failed");

    }

  }

  return(

<div className="page">

<div className="container">

<div className="upload-card">

<h2>Upload Sports Video</h2>

<form onSubmit={upload}>

<input

type="file"

accept=".mp4,.avi,.mov"

onChange={(e)=>setVideo(e.target.files[0])}

/>

<button className="btn upload-btn">

Upload Video

</button>

</form>

</div>

</div>

</div>

)

}

export default UploadVideo;
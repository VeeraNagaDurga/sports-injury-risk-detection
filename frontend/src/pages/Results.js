import { Link } from "react-router-dom";

function Results() {
  return (
    <div style={{ width: "700px", margin: "40px auto" }}>
      <h2>Analysis Results</h2>

      <table
        border="1"
        cellPadding="10"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Result</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>Sport</td>
            <td>Running</td>
          </tr>

          <tr>
            <td>Risk Level</td>
            <td>Moderate</td>
          </tr>

          <tr>
            <td>Posture</td>
            <td>Needs Improvement</td>
          </tr>

          <tr>
            <td>Recommendation</td>
            <td>Improve Knee Alignment</td>
          </tr>
        </tbody>
      </table>

      <br />

      <Link to="/dashboard">← Back to Dashboard</Link>

    </div>
  );
}

export default Results;

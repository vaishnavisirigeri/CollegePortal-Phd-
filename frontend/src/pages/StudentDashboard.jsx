import { useState } from "react";
import "./StudentDashboard.css";

function StudentDashboard({ onBack }) {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
    setMessage("");
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setMessage("Please select at least one PDF file.");
      return;
    }

    const invalidFiles = files.filter(
      (file) => !file.name.toLowerCase().endsWith(".pdf")
    );

    if (invalidFiles.length > 0) {
      setMessage("Only PDF files are allowed.");
      return;
    }

    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      setMessage(result.message);

      if (result.success) {
        setFiles([]);
        document.getElementById("pdf-upload").value = "";
      }

    } catch (error) {
      setMessage("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-dashboard">

      <header className="student-header">
        <h1>M S Ramaiah Institute</h1>
        <p>Research & Academic Portal</p>
      </header>

      <div className="student-title">
        <h2>STUDENT DASHBOARD</h2>
      </div>

      <main className="student-content">

        <div className="welcome-section">
          <h2>Welcome, Student!</h2>
          <p>
            Upload your PhD registration documents below.
          </p>
        </div>

        <div className="upload-section">

          <h3>PhD Registration Document Upload</h3>

          <p>
            Select your PhD registration PDF file(s).
          </p>

          <input
            id="pdf-upload"
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={handleFileChange}
          />

          {files.length > 0 && (
            <div className="selected-files">
              <h4>Selected Files:</h4>

              {files.map((file, index) => (
                <p key={index}>📄 {file.name}</p>
              ))}
            </div>
          )}

          <button
            className="upload-button"
            onClick={handleUpload}
            disabled={loading}
          >
            {loading ? "Processing..." : "UPLOAD DOCUMENTS"}
          </button>

          {message && (
            <div className="upload-message">
              {message}
            </div>
          )}

        </div>

        <button className="back-button" onClick={onBack}>
          ← Back to Home
        </button>

      </main>

      <footer>
        © 2026 M S Ramaiah Institute | Research & Academic Portal
      </footer>

    </div>
  );
}

export default StudentDashboard;
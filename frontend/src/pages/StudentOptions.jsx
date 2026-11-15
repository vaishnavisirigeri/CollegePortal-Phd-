import "./StudentOptions.css";

function StudentOptions({ onUpload, onChooseCourse, onBack }) {
  return (
    <div className="student-options-page">

      <header className="student-options-header">
        <h1>M S Ramaiah Institute</h1>
        <p>Research & Academic Portal</p>
      </header>

      <div className="student-options-title">
        <h2>STUDENT PORTAL</h2>
      </div>

      <main className="student-options-content">

        <h2>Welcome, Student!</h2>
        <p>Please select an option to continue.</p>

        <div className="student-options-grid">

          {/* Upload PDF */}
          <div className="student-option-card">

            <div className="student-option-icon">
              📄
            </div>

            <h3>UPLOAD PDF</h3>

            <p>
              Upload your PhD registration documents.
            </p>

            <button onClick={onUpload}>
              UPLOAD DOCUMENT
            </button>

          </div>

          {/* Choose Course */}
          <div className="student-option-card">

            <div className="student-option-icon">
              🎓
            </div>

            <h3>CHOOSE COURSE</h3>

            <p>
              Select your research programme or course.
            </p>

            <button onClick={onChooseCourse}>
              CHOOSE COURSE
            </button>

          </div>

        </div>

        <button className="options-back-button" onClick={onBack}>
          ← Back to Home
        </button>

      </main>

      <footer>
        © 2026 M S Ramaiah Institute | Research & Academic Portal
      </footer>

    </div>
  );
}

export default StudentOptions;
import "./AdminOptions.css";

function AdminOptions({ role, onView, onDownload, onBack }) {
  return (
    <div className="admin-options-page">

      <header className="admin-header">
        <h1>M S Ramaiah Institute</h1>
        <p>Research & Academic Portal</p>
      </header>

      <div className="admin-title">
        <h2>{role.toUpperCase()} DASHBOARD</h2>
      </div>

      <main className="admin-content">

        <h2>Welcome, {role}!</h2>
        <p>Select an option to continue.</p>

        <div className="admin-options-grid">

          <div className="admin-option-card">
            <div className="admin-option-icon">📊</div>

            <h3>VIEW EXCEL</h3>

            <p>
              View the consolidated PhD student registration records.
            </p>

            <button onClick={onView}>
              VIEW RECORDS
            </button>
          </div>

          <div className="admin-option-card">
            <div className="admin-option-icon">📥</div>

            <h3>DOWNLOAD EXCEL</h3>

            <p>
              Download the complete consolidated Excel file.
            </p>

            <button onClick={onDownload}>
              DOWNLOAD EXCEL
            </button>
          </div>

        </div>

        <button className="admin-back-button" onClick={onBack}>
          ← Back to Home
        </button>

      </main>

      <footer>
        © 2026 M S Ramaiah Institute | Research & Academic Portal
      </footer>

    </div>
  );
}

export default AdminOptions;
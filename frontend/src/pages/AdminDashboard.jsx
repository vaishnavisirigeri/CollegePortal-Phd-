import { useEffect, useState } from "react";
import "./AdminDashboard.css";

function AdminDashboard({ role, onBack }) {
  const [records, setRecords] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/records")
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load records");
        }

        return data;
      })
      .then((data) => {
        setHeaders(data.headers);
        setRecords(data.records);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="admin-dashboard">

      <header className="admin-dashboard-header">
        <h1>M S Ramaiah Institute</h1>
        <p>Research & Academic Portal</p>
      </header>

      <div className="admin-dashboard-title">
        <h2>{role.toUpperCase()} - STUDENT RECORDS</h2>
      </div>

      <main className="records-content">

        <h2>Consolidated PhD Registration Records</h2>

        {loading && <p>Loading records...</p>}

        {error && <p className="records-error">{error}</p>}

        {!loading && !error && (
          <>
            <p>Total Records: {records.length}</p>

            <div className="records-table-container">
              <table>
                <thead>
                  <tr>
                    {headers.map((header, index) => (
                      <th key={index}>{header}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {records.map((record, rowIndex) => (
                    <tr key={rowIndex}>
                      {record.map((value, colIndex) => (
                        <td key={colIndex}>
                          {value ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {records.length === 0 && (
                    <tr>
                      <td colSpan={headers.length}>
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        <button className="records-back-button" onClick={onBack}>
          ← Back
        </button>

      </main>

      <footer>
        © 2026 M S Ramaiah Institute | Research & Academic Portal
      </footer>

    </div>
  );
}

export default AdminDashboard;
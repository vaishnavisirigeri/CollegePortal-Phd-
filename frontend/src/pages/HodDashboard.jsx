import { useState, useEffect } from "react";
import "./SupervisorDashboard.css"; // Reuse table and modal styling

function HodDashboard({ userProfile, onBack, onLogout }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReq, setSelectedReq] = useState(null);
  const [actionType, setActionType] = useState(""); // 'accept' or 'decline'
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const fetchRequests = () => {
    setLoading(true);
    fetch(`/api/requests?role=hod&user_id=${userProfile?.id || ""}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRequests(data.requests || []);
        } else {
          setError(data.message || "Failed to load requests.");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, [userProfile?.id]);

  const handleOpenActionModal = (req, type) => {
    setSelectedReq(req);
    setActionType(type);
    setRemarks("");
    setActionMessage("");
  };

  const handleSubmitAction = async () => {
    if (actionType === "decline" && !remarks.trim()) {
      setActionMessage("Please provide remarks explaining why this request is declined.");
      return;
    }

    try {
      setActionLoading(true);
      setActionMessage("");

      const res = await fetch(`/api/requests/${selectedReq.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "hod",
          action: actionType,
          remarks: remarks.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSelectedReq(null);
        fetchRequests();
      } else {
        setActionMessage(data.message || "Action failed.");
      }
    } catch (err) {
      setActionMessage("Server error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadExcel = () => {
    window.location.href = `/api/export-excel?role=hod&department_id=${userProfile?.department_id || ""}`;
  };

  return (
    <div className="supervisor-dashboard">
      <header className="supervisor-header">
        <div className="header-left">
          <h1>M S Ramaiah Institute</h1>
          <p>Research & Academic Portal — Jnana Shodha System</p>
        </div>
        <div className="header-right">
          <span className="user-info">
            🏛️ {userProfile?.full_name || userProfile?.username} (Head of Department)
          </span>
          <button className="btn btn-sm btn-logout" onClick={onLogout || onBack}>
            Logout
          </button>
        </div>
      </header>

      <div className="portal-subbar">
        <div>
          <h2>HEAD OF DEPARTMENT PORTAL — DEPARTMENTAL SCRUTINY</h2>
          <p>Review candidate documents endorsed by supervisors and forward to the Principal.</p>
        </div>
        <button className="btn btn-excel" onClick={handleDownloadExcel}>
          📊 Download Department Excel
        </button>
      </div>

      <main className="supervisor-content">
        <div className="dashboard-card">
          <div className="card-header flex-between">
            <h3>Department PhD Applications ({requests.length})</h3>
            <button className="btn btn-sm btn-outline" onClick={fetchRequests}>
              🔄 Refresh List
            </button>
          </div>

          {loading ? (
            <p className="loading-state">Loading departmental requests...</p>
          ) : error ? (
            <p className="error-state">{error}</p>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <p>No PhD requests currently submitted in your department.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Candidate</th>
                    <th>USN</th>
                    <th>Supervisor</th>
                    <th>Supervisor Remarks</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => {
                    const ext = req.extracted_data || {};
                    const fields = ext.fields || ext;
                    const isPendingHOD = req.status === "pending_hod";

                    return (
                      <tr key={req.id}>
                        <td>{new Date(req.created_at).toLocaleDateString()}</td>
                        <td>
                          <strong>{req.student_name || fields.candidate_name || "N/A"}</strong>
                          <div className="sub-text">{req.student_email}</div>
                        </td>
                        <td><code>{req.student_usn || fields.usn || "N/A"}</code></td>
                        <td>{req.supervisor_name || fields.supervisor || "Faculty"}</td>
                        <td className="sub-text">"{req.supervisor_remarks || "No remarks"}"</td>
                        <td>
                          <span className={`status-pill pill-${req.status}`}>
                            {req.status.replace("_", " ").toUpperCase()}
                          </span>
                        </td>
                        <td className="actions-cell">
                          {isPendingHOD ? (
                            <>
                              <button
                                className="btn btn-action-accept"
                                onClick={() => handleOpenActionModal(req, "accept")}
                              >
                                Endorse to Principal
                              </button>
                              <button
                                className="btn btn-action-decline"
                                onClick={() => handleOpenActionModal(req, "decline")}
                              >
                                Decline
                              </button>
                            </>
                          ) : (
                            <span className="reviewed-badge">
                              {req.status === "pending_supervisor"
                                ? "Awaiting Supervisor"
                                : "Scrutinized"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {selectedReq && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h3>
              {actionType === "accept"
                ? "🎖️ Endorse & Forward to Principal"
                : "❌ Decline Candidate Application"}
            </h3>

            <p className="modal-desc">
              Candidate: <strong>{selectedReq.student_name}</strong> | Supervisor: <strong>{selectedReq.supervisor_name}</strong>
            </p>

            <div className="ocr-modal-summary">
              <h4>Supervisor Recommendation:</h4>
              <p>"{selectedReq.supervisor_remarks || "Recommended for departmental approval."}"</p>
            </div>

            <div className="form-group">
              <label>
                {actionType === "accept"
                  ? "Departmental Remarks (Optional):"
                  : "Reason for Declining (Mandatory):"}
              </label>
              <textarea
                rows="3"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  actionType === "accept"
                    ? "e.g., Department committee verified admission. Forwarded for Principal's approval."
                    : "e.g., Missing departmental clearance."
                }
              />
            </div>

            {actionMessage && <p className="modal-error">{actionMessage}</p>}

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedReq(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className={`btn ${
                  actionType === "accept" ? "btn-primary" : "btn-danger"
                }`}
                onClick={handleSubmitAction}
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Submitting..."
                  : actionType === "accept"
                  ? "Forward to Principal"
                  : "Confirm Decline"}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer>
        © 2026 M S Ramaiah Institute | Research & Academic Portal
      </footer>
    </div>
  );
}

export default HodDashboard;

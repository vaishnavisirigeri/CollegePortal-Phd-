import { useState, useEffect } from "react";
import "./SupervisorDashboard.css";

function SupervisorDashboard({ userProfile, onBack, onLogout }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReq, setSelectedReq] = useState(null);
  const [actionType, setActionType] = useState(""); // 'accept' or 'decline'
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  // HOD selection
  const [hods, setHods] = useState([]);
  const [selectedHodId, setSelectedHodId] = useState("");
  const [hodsLoading, setHodsLoading] = useState(false);

  const fetchRequests = () => {
    if (!userProfile?.id) return;
    setLoading(true);
    fetch(`/api/requests?role=supervisor&user_id=${userProfile.id}`)
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

  const fetchHods = (departmentId) => {
    setHodsLoading(true);
    const query = departmentId ? `?department_id=${departmentId}` : "";
    fetch(`/api/hods${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setHods(data.hods || []);
      })
      .catch(() => setHods([]))
      .finally(() => setHodsLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, [userProfile?.id]);

  const handleOpenActionModal = (req, type) => {
    setSelectedReq(req);
    setActionType(type);
    setRemarks("");
    setSelectedHodId("");
    setActionMessage("");
    if (type === "accept") {
      // Fetch HODs for the same department as the request
      fetchHods(req.department_id || userProfile?.department_id);
    }
  };

  const handleSubmitAction = async () => {
    if (actionType === "decline" && !remarks.trim()) {
      setActionMessage("Please provide remarks explaining why this request is declined.");
      return;
    }
    if (actionType === "accept" && !selectedHodId) {
      setActionMessage("Please select an HOD to forward this request to.");
      return;
    }

    try {
      setActionLoading(true);
      setActionMessage("");

      const body = {
        role: "supervisor",
        action: actionType,
        remarks: remarks.trim(),
      };
      if (actionType === "accept") body.hod_id = selectedHodId;

      const res = await fetch(`/api/requests/${selectedReq.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
    if (!userProfile?.id) return;
    window.location.href = `/api/export-excel?role=supervisor&user_id=${userProfile.id}`;
  };

  return (
    <div className="supervisor-dashboard">
      <header className="supervisor-header">
        <div className="header-left">
          <h1>M S Ramaiah Institute</h1>
          <p>Research &amp; Academic Portal — Jnana Shodha System</p>
        </div>
        <div className="header-right">
          <span className="user-info">
            👨‍🏫 {userProfile?.full_name || userProfile?.username} (Supervisor)
          </span>
          <button className="btn btn-sm btn-logout" onClick={onLogout || onBack}>
            Logout
          </button>
        </div>
      </header>

      <div className="portal-subbar">
        <div>
          <h2>SUPERVISOR PORTAL — STUDENT ALLOCATION &amp; REVIEW</h2>
          <p>Review candidate documents, verify OCR extractions, and endorse to HOD.</p>
        </div>
        <button className="btn btn-excel" onClick={handleDownloadExcel}>
          📊 Download My Students Excel
        </button>
      </div>

      <main className="supervisor-content">
        <div className="dashboard-card">
          <div className="card-header flex-between">
            <h3>Assigned Research Candidates ({requests.length})</h3>
            <button className="btn btn-sm btn-outline" onClick={fetchRequests}>
              🔄 Refresh List
            </button>
          </div>

          {loading ? (
            <p className="loading-state">Loading candidate requests...</p>
          ) : error ? (
            <p className="error-state">{error}</p>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <p>No PhD candidate registration letters assigned to you yet.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Candidate</th>
                    <th>USN</th>
                    <th>Document</th>
                    <th>Proposed Topic</th>
                    <th>OCR Status</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => {
                    const ext = req.extracted_data || {};
                    const fields = ext.fields || ext;
                    const isPending = req.status === "pending_supervisor";

                    return (
                      <tr key={req.id}>
                        <td>{new Date(req.created_at).toLocaleDateString()}</td>
                        <td>
                          <strong>{req.student_name || fields.candidate_name || "N/A"}</strong>
                          <div className="sub-text">{req.student_email}</div>
                        </td>
                        <td><code>{req.student_usn || fields.usn || "N/A"}</code></td>
                        <td>📄 {req.document_name}</td>
                        <td className="topic-col">{fields.topic || "N/A"}</td>
                        <td>
                          <span className={`badge-pill badge-${req.ocr_status}`}>
                            {req.ocr_status} ({req.ocr_confidence || 100}%)
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill pill-${req.status}`}>
                            {req.status.replace(/_/g, " ").toUpperCase()}
                          </span>
                        </td>
                        <td className="actions-cell">
                          {isPending ? (
                            <>
                              <button
                                className="btn btn-action-accept"
                                onClick={() => handleOpenActionModal(req, "accept")}
                              >
                                Accept &amp; Forward
                              </button>
                              <button
                                className="btn btn-action-decline"
                                onClick={() => handleOpenActionModal(req, "decline")}
                              >
                                Decline
                              </button>
                            </>
                          ) : (
                            <span className="reviewed-badge">Reviewed</span>
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

      {/* Action / Review Modal */}
      {selectedReq && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h3>
              {actionType === "accept"
                ? "✅ Accept & Forward to Head of Department"
                : "❌ Decline Candidate Request"}
            </h3>

            <p className="modal-desc">
              Candidate: <strong>{selectedReq.student_name || "Student"}</strong> (
              {selectedReq.student_usn || "No USN"})
            </p>

            <div className="ocr-modal-summary">
              <h4>OCR Extracted Data:</h4>
              <p><strong>Letter No:</strong> {selectedReq.extracted_data?.letter_no || "N/A"}</p>
              <p><strong>Date:</strong> {selectedReq.extracted_data?.letter_date || "N/A"}</p>
              <p><strong>Research Topic:</strong> {selectedReq.extracted_data?.topic || "N/A"}</p>
              <p><strong>Faculty:</strong> {selectedReq.extracted_data?.faculty || "N/A"}</p>
            </div>

            {/* HOD Selection — only on Accept */}
            {actionType === "accept" && (
              <div className="form-group">
                <label style={{ fontWeight: 600, color: "#1a2e5a" }}>
                  🏛️ Select HOD to Forward To: <span style={{ color: "red" }}>*</span>
                </label>
                {hodsLoading ? (
                  <p style={{ fontSize: "0.85rem", color: "#666" }}>Loading HODs...</p>
                ) : hods.length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "#c0392b" }}>
                    No HODs found for this department. Please contact admin.
                  </p>
                ) : (
                  <select
                    value={selectedHodId}
                    onChange={(e) => setSelectedHodId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1.5px solid #c8d6e5",
                      borderRadius: "8px",
                      fontSize: "0.95rem",
                      marginTop: "6px",
                      background: "#f7f9fc",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">— Select HOD —</option>
                    {hods.map((hod) => (
                      <option key={hod.id} value={hod.id}>
                        {hod.full_name || hod.username}
                        {hod.designation ? ` (${hod.designation})` : ""}
                        {hod.department_name ? ` — ${hod.department_name}` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="form-group">
              <label>
                {actionType === "accept"
                  ? "Endorsement Remarks (Optional):"
                  : "Reason for Declining (Mandatory):"}
              </label>
              <textarea
                rows="3"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  actionType === "accept"
                    ? "e.g., Documents verified. Candidate accepted under my supervision."
                    : "e.g., Incorrect provisional order or topic mismatch. Please re-upload."
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
                className={`btn ${actionType === "accept" ? "btn-primary" : "btn-danger"}`}
                onClick={handleSubmitAction}
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Submitting..."
                  : actionType === "accept"
                  ? "Forward to HOD"
                  : "Confirm Decline"}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer>
        © 2026 M S Ramaiah Institute | Research &amp; Academic Portal
      </footer>
    </div>
  );
}

export default SupervisorDashboard;

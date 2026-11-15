import { useState, useEffect } from "react";
import "./PrincipalDashboard.css";

function PrincipalDashboard({ userProfile, onBack, onLogout }) {
  const [requests, setRequests] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReq, setSelectedReq] = useState(null);
  const [actionType, setActionType] = useState(""); // 'accept' or 'decline'
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setDepartments(data.departments || []);
      })
      .catch((err) => console.error(err));
  }, []);

  const fetchRequests = () => {
    setLoading(true);
    fetch("/api/requests?role=principal")
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
  }, []);

  const handleOpenActionModal = (req, type) => {
    setSelectedReq(req);
    setActionType(type);
    setRemarks("");
    setActionMessage("");
  };

  const handleSubmitAction = async () => {
    try {
      setActionLoading(true);
      setActionMessage("");

      const res = await fetch(`/api/requests/${selectedReq.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "principal",
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

  const handleDownloadMasterExcel = () => {
    window.location.href = "/api/export-excel?role=principal";
  };

  const filteredRequests = requests.filter((r) => {
    if (selectedDeptFilter === "ALL") return true;
    return r.department_code === selectedDeptFilter || r.department_id === selectedDeptFilter;
  });

  const totalCount = requests.length;
  const pendingPrincipalCount = requests.filter((r) => r.status === "pending_principal").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const declinedCount = requests.filter((r) => r.status.includes("declined") || r.status === "rejected").length;

  return (
    <div className="principal-dashboard">
      <header className="principal-header">
        <div className="header-left">
          <h1>M S Ramaiah Institute</h1>
          <p>Research & Academic Portal — Jnana Shodha Institutional Authority</p>
        </div>
        <div className="header-right">
          <span className="user-info">
            🎖️ {userProfile?.full_name || "Principal / Head of Institution"}
          </span>
          <button className="btn btn-sm btn-logout" onClick={onLogout || onBack}>
            Logout
          </button>
        </div>
      </header>

      <div className="portal-subbar">
        <div>
          <h2>PRINCIPAL / HEAD OF INSTITUTION OVERSIGHT</h2>
          <p>Comprehensive monitoring and final institutional approval for VTU PhD scholars.</p>
        </div>
        <button className="btn btn-excel" onClick={handleDownloadMasterExcel}>
          📥 Download College Master Excel
        </button>
      </div>

      <main className="principal-content">
        {/* Metric Cards */}
        <div className="metrics-row">
          <div className="metric-card">
            <h4>Total Submissions</h4>
            <div className="metric-num">{totalCount}</div>
          </div>
          <div className="metric-card warning">
            <h4>Awaiting Principal Approval</h4>
            <div className="metric-num">{pendingPrincipalCount}</div>
          </div>
          <div className="metric-card success">
            <h4>Officially Approved Scholars</h4>
            <div className="metric-num">{approvedCount}</div>
          </div>
          <div className="metric-card danger">
            <h4>Declined / Returned</h4>
            <div className="metric-num">{declinedCount}</div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="dashboard-card">
          <div className="card-header flex-between">
            <div className="filter-group">
              <label>Filter Department: </label>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.code}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <button className="btn btn-sm btn-outline" onClick={fetchRequests}>
              🔄 Refresh List
            </button>
          </div>

          {loading ? (
            <p className="loading-state">Loading college-wide records...</p>
          ) : error ? (
            <p className="error-state">{error}</p>
          ) : filteredRequests.length === 0 ? (
            <div className="empty-state">
              <p>No PhD submissions found for the selected department filter.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Candidate</th>
                    <th>USN</th>
                    <th>Dept</th>
                    <th>Supervisor</th>
                    <th>HOD Recommendation</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => {
                    const ext = req.extracted_data || {};
                    const fields = ext.fields || ext;
                    const isPendingPrincipal = req.status === "pending_principal";

                    return (
                      <tr key={req.id}>
                        <td>{new Date(req.created_at).toLocaleDateString()}</td>
                        <td>
                          <strong>{req.student_name || fields.candidate_name || "N/A"}</strong>
                          <div className="sub-text">{req.student_email}</div>
                        </td>
                        <td><code>{req.student_usn || fields.usn || "N/A"}</code></td>
                        <td><span className="dept-tag">{req.department_code || "GEN"}</span></td>
                        <td>{req.supervisor_name || "Supervisor"}</td>
                        <td className="sub-text">
                          "{req.hod_remarks || "Recommended by HOD"}"
                        </td>
                        <td>
                          <span className={`status-pill pill-${req.status}`}>
                            {req.status.replace("_", " ").toUpperCase()}
                          </span>
                        </td>
                        <td className="actions-cell">
                          {isPendingPrincipal ? (
                            <>
                              <button
                                className="btn btn-action-approve"
                                onClick={() => handleOpenActionModal(req, "accept")}
                              >
                                Final Approval
                              </button>
                              <button
                                className="btn btn-action-decline"
                                onClick={() => handleOpenActionModal(req, "decline")}
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="reviewed-badge">
                              {req.status === "approved"
                                ? "✅ Officially Approved"
                                : req.status}
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

      {/* Approval Modal */}
      {selectedReq && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h3>
              {actionType === "accept"
                ? "🎖️ Grant Final Institutional Approval"
                : "❌ Reject PhD Registration Request"}
            </h3>

            <p className="modal-desc">
              Candidate: <strong>{selectedReq.student_name}</strong> | Department:{" "}
              <strong>{selectedReq.department_code}</strong>
            </p>

            <div className="ocr-modal-summary">
              <h4>Audit Trail & Scrutiny Chain:</h4>
              <p><strong>Supervisor ({selectedReq.supervisor_name}):</strong> "{selectedReq.supervisor_remarks || "Endorsed"}"</p>
              <p><strong>HOD Recommendation:</strong> "{selectedReq.hod_remarks || "Forwarded"}"</p>
              <p><strong>Proposed Topic:</strong> {selectedReq.extracted_data?.topic || "N/A"}</p>
            </div>

            <div className="form-group">
              <label>Institutional Remarks / Office Order Reference:</label>
              <textarea
                rows="3"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g., Final approval granted. Scholar admitted to VTU PhD programme."
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
                  ? "Processing..."
                  : actionType === "accept"
                  ? "Approve Scholar"
                  : "Confirm Reject"}
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

export default PrincipalDashboard;

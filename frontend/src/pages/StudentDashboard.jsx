import { useState, useEffect } from "react";
import "./StudentDashboard.css";

function StudentDashboard({ userProfile, onBack }) {
  const [departments, setDepartments] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedDept, setSelectedDept] = useState(userProfile?.department_id || "");
  const [selectedSupervisor, setSelectedSupervisor] = useState(userProfile?.supervisor_id || "");
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Fetch departments & supervisors
  useEffect(() => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDepartments(data.departments);
          if (!selectedDept && data.departments.length > 0) {
            setSelectedDept(data.departments[0].id);
          }
        }
      })
      .catch((err) => console.error("Error loading departments:", err));
  }, []);

  useEffect(() => {
    if (!selectedDept) return;
    fetch(`/api/supervisors?department_id=${selectedDept}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSupervisors(data.supervisors);
          if (data.supervisors.length > 0 && !selectedSupervisor) {
            setSelectedSupervisor(data.supervisors[0].id);
          }
        }
      })
      .catch((err) => console.error("Error loading supervisors:", err));
  }, [selectedDept]);

  // Fetch student's request history
  const fetchMyRequests = () => {
    if (!userProfile?.id) return;
    setLoadingRequests(true);
    fetch(`/api/requests?role=student&user_id=${userProfile.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMyRequests(data.requests || []);
        }
      })
      .catch((err) => console.error("Error loading requests:", err))
      .finally(() => setLoadingRequests(false));
  };

  useEffect(() => {
    fetchMyRequests();
  }, [userProfile?.id]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
    setMessage("");
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setMessage("Please select at least one PDF file.");
      setMessageType("error");
      return;
    }

    if (!selectedSupervisor) {
      setMessage("Please select your research supervisor.");
      setMessageType("error");
      return;
    }

    const invalidFiles = files.filter(
      (file) => !file.name.toLowerCase().endsWith(".pdf")
    );
    if (invalidFiles.length > 0) {
      setMessage("Only PDF documents are allowed.");
      setMessageType("error");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("student_id", userProfile?.id || "");
    formData.append("supervisor_id", selectedSupervisor);
    formData.append("department_id", selectedDept);
    formData.append("letter_type", "provisional_registration");

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setMessage(result.message || "Document uploaded and submitted successfully!");
        setMessageType("success");
        setFiles([]);
        const inputElem = document.getElementById("pdf-upload");
        if (inputElem) inputElem.value = "";
        fetchMyRequests();
      } else {
        setMessage(result.message || "Upload failed.");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Unable to connect to the server. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const getStageStatus = (req, stage) => {
    const status = req.status;
    if (status === "rejected") return "rejected";
    if (status.includes("declined")) {
      if (stage === "supervisor" && status === "supervisor_declined") return "declined";
      if (stage === "hod" && status === "hod_declined") return "declined";
      return "inactive";
    }

    if (stage === "supervisor") {
      if (status === "pending_supervisor") return "current";
      return "completed";
    }
    if (stage === "hod") {
      if (status === "pending_supervisor") return "pending";
      if (status === "pending_hod") return "current";
      return "completed";
    }
    if (stage === "principal") {
      if (status === "approved") return "completed";
      if (status === "pending_principal") return "current";
      return "pending";
    }
    return "pending";
  };

  return (
    <div className="student-dashboard">
      <header className="student-header">
        <h1>M S Ramaiah Institute</h1>
        <p>Research & Academic Portal — Jnana Shodha System</p>
      </header>

      <div className="student-title-bar">
        <h2>STUDENT RESEARCH SCHOLAR PORTAL</h2>
        <span className="user-badge">
          👤 {userProfile?.full_name || userProfile?.username || "Scholar"}
        </span>
      </div>

      <main className="student-content">
        {/* Upload Form Section */}
        <section className="dashboard-card upload-card">
          <div className="card-header">
            <h3>📄 Submit PhD Provisional Registration Letter</h3>
            <p>Select your research department and assigned supervisor, then upload your VTU order.</p>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Academic Department</label>
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setSelectedSupervisor("");
                }}
              >
                <option value="">-- Select Department --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Research Supervisor (Faculty)</label>
              <select
                value={selectedSupervisor}
                onChange={(e) => setSelectedSupervisor(e.target.value)}
              >
                <option value="">-- Select Supervisor --</option>
                {supervisors.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.full_name || sup.username} ({sup.designation || "Faculty"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="dropzone-area">
            <input
              id="pdf-upload"
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={handleFileChange}
            />
            <label htmlFor="pdf-upload" className="file-label">
              <span className="file-icon">📁</span>
              <span>Click to select VTU Registration PDF</span>
            </label>
          </div>

          {files.length > 0 && (
            <div className="selected-files-list">
              <h4>Selected File(s):</h4>
              {files.map((file, idx) => (
                <div key={idx} className="file-chip">
                  📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              ))}
            </div>
          )}

          <div className="action-row">
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={loading}
            >
              {loading ? "Processing Document with OCR..." : "SUBMIT TO SUPERVISOR"}
            </button>
          </div>

          {message && (
            <div className={`status-banner ${messageType}`}>
              {message}
            </div>
          )}
        </section>

        {/* Live Approval Tracker */}
        <section className="dashboard-card tracker-card">
          <div className="card-header flex-between">
            <div>
              <h3>🔄 Jnana Shodha Live Approval Tracking</h3>
              <p>Track your submitted PhD letters through the multi-tier scrutiny workflow.</p>
            </div>
            <button className="btn btn-sm btn-outline" onClick={fetchMyRequests}>
              🔄 Refresh Status
            </button>
          </div>

          {loadingRequests ? (
            <p className="loading-text">Loading submission history...</p>
          ) : myRequests.length === 0 ? (
            <div className="empty-state">
              <p>No PhD letter requests submitted yet. Use the upload form above to submit your order.</p>
            </div>
          ) : (
            <div className="requests-stream">
              {myRequests.map((req) => {
                const ext = req.extracted_data || {};
                const fields = ext.fields || ext;

                return (
                  <div key={req.id} className="request-item-card">
                    <div className="request-item-top">
                      <div>
                        <h4>📄 {req.document_name}</h4>
                        <span className="meta-text">
                          Submitted on: {new Date(req.created_at).toLocaleDateString()} | 
                          Supervisor: <strong>{req.supervisor_name || "Assigned Faculty"}</strong> | 
                          Dept: <strong>{req.department_code || "General"}</strong>
                        </span>
                      </div>
                      <div className={`status-pill pill-${req.status}`}>
                        {req.status.replace("_", " ").toUpperCase()}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="stepper-container">
                      {/* Step 1: Supervisor */}
                      <div className={`stepper-step ${getStageStatus(req, "supervisor")}`}>
                        <div className="step-circle">1</div>
                        <div className="step-label">Supervisor Review</div>
                        {req.supervisor_remarks && (
                          <div className="step-remarks">"{req.supervisor_remarks}"</div>
                        )}
                      </div>
                      <div className="stepper-line"></div>

                      {/* Step 2: HOD */}
                      <div className={`stepper-step ${getStageStatus(req, "hod")}`}>
                        <div className="step-circle">2</div>
                        <div className="step-label">HOD Scrutiny</div>
                        {req.hod_remarks && (
                          <div className="step-remarks">"{req.hod_remarks}"</div>
                        )}
                      </div>
                      <div className="stepper-line"></div>

                      {/* Step 3: Principal */}
                      <div className={`stepper-step ${getStageStatus(req, "principal")}`}>
                        <div className="step-circle">3</div>
                        <div className="step-label">Principal Approval</div>
                        {req.principal_remarks && (
                          <div className="step-remarks">"{req.principal_remarks}"</div>
                        )}
                      </div>
                    </div>

                    {/* OCR Extraction Summary */}
                    <details className="ocr-preview-details">
                      <summary>🔍 View OCR Extracted Letter Details (Click to expand)</summary>
                      <div className="ocr-grid">
                        <div><strong>Candidate:</strong> {fields.candidate_name || fields.name || "N/A"}</div>
                        <div><strong>USN:</strong> {fields.usn || req.student_usn || "N/A"}</div>
                        <div><strong>Letter No:</strong> {ext.letter_no || ext["Letter No"] || "N/A"}</div>
                        <div><strong>Letter Date:</strong> {ext.letter_date || ext["Letter Date"] || "N/A"}</div>
                        <div><strong>Faculty:</strong> {fields.faculty || "N/A"}</div>
                        <div><strong>Research Center:</strong> {fields.research_center || fields.centre || "N/A"}</div>
                        <div className="full-width"><strong>Proposed Topic:</strong> {fields.topic || "N/A"}</div>
                      </div>
                    </details>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="footer-actions">
          <button className="btn btn-secondary" onClick={onBack}>
            ← Back to Options
          </button>
        </div>
      </main>

      <footer>
        © 2026 M S Ramaiah Institute | Research & Academic Portal
      </footer>
    </div>
  );
}

export default StudentDashboard;

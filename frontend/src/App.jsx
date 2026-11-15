import { useState } from "react";

import Login from "./pages/Login";
import Auth from "./pages/Auth";

import StudentOptions from "./pages/StudentOptions";
import StudentDashboard from "./pages/StudentDashboard";

import SupervisorDashboard from "./pages/SupervisorDashboard";
import HodDashboard from "./pages/HodDashboard";
import PrincipalDashboard from "./pages/PrincipalDashboard";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [currentRole, setCurrentRole] = useState("");
  const [userProfile, setUserProfile] = useState(null);

  // Open role-specific login
  const openAuth = (role) => {
    setCurrentRole(role);
    setCurrentPage("auth");
  };

  // Logout handler
  const handleLogout = () => {
    setUserProfile(null);
    setCurrentRole("");
    setCurrentPage("home");
  };

  // After successful authentication
  const handleLoginSuccess = (profile) => {
    setUserProfile(profile);

    const r = (profile.role || "").toLowerCase();
    if (r === "student") {
      setCurrentPage("student-options");
    } else if (r === "supervisor") {
      setCurrentPage("supervisor");
    } else if (r === "hod") {
      setCurrentPage("hod");
    } else if (r === "principal") {
      setCurrentPage("principal");
    } else {
      setCurrentPage("home");
    }
  };

  // 1. Authentication page
  if (currentPage === "auth") {
    return (
      <Auth
        role={currentRole}
        onLoginSuccess={handleLoginSuccess}
        onBack={() => setCurrentPage("home")}
      />
    );
  }

  // 2. Student Options
  if (currentPage === "student-options") {
    return (
      <StudentOptions
        onUpload={() => setCurrentPage("student")}
        onChooseCourse={() => setCurrentPage("choose-course")}
        onBack={handleLogout}
      />
    );
  }

  // 3. Student Dashboard (Upload + Live Jnana Shodha Tracker)
  if (currentPage === "student") {
    return (
      <StudentDashboard
        userProfile={userProfile}
        onBack={() => setCurrentPage("student-options")}
        onLogout={handleLogout}
      />
    );
  }

  // 4. Choose Course Placeholder
  if (currentPage === "choose-course") {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>🎓 Research Coursework & Programme Selection</h2>
        <p>This module is scheduled for the next phase of the Jnana Shodha implementation.</p>
        <button
          style={{ padding: "0.6rem 1.2rem", cursor: "pointer", marginTop: "1rem" }}
          onClick={() => setCurrentPage("student-options")}
        >
          ← Back to Student Options
        </button>
      </div>
    );
  }

  // 5. Supervisor Dashboard
  if (currentPage === "supervisor") {
    return (
      <SupervisorDashboard
        userProfile={userProfile}
        onBack={() => setCurrentPage("home")}
        onLogout={handleLogout}
      />
    );
  }

  // 6. HOD Dashboard
  if (currentPage === "hod") {
    return (
      <HodDashboard
        userProfile={userProfile}
        onBack={() => setCurrentPage("home")}
        onLogout={handleLogout}
      />
    );
  }

  // 7. Principal Dashboard
  if (currentPage === "principal") {
    return (
      <PrincipalDashboard
        userProfile={userProfile}
        onBack={() => setCurrentPage("home")}
        onLogout={handleLogout}
      />
    );
  }

  // Default: Landing page
  return (
    <Login
      onStudentLogin={() => openAuth("student")}
      onSupervisorLogin={() => openAuth("supervisor")}
      onHodLogin={() => openAuth("hod")}
      onPrincipalLogin={() => openAuth("principal")}
    />
  );
}

export default App;

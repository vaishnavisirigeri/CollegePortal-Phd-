import { useState } from "react";

import Login from "./pages/Login";
import Auth from "./pages/Auth";

import StudentOptions from "./pages/StudentOptions";
import StudentDashboard from "./pages/StudentDashboard";

import AdminOptions from "./pages/AdminOptions";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [currentRole, setCurrentRole] = useState("");
  const [userProfile, setUserProfile] = useState(null);

  // Open role-specific login
  const openAuth = (role) => {
    setCurrentRole(role);
    setCurrentPage("auth");
  };

  // After successful authentication
  const handleLoginSuccess = (profile) => {
    setUserProfile(profile);

    if (profile.role === "student") {
      setCurrentPage("student-options");
    } else if (
      profile.role === "hod" ||
      profile.role === "principal"
    ) {
      setCurrentPage("admin-options");
    } else if (profile.role === "supervisor") {
      setCurrentPage("supervisor");
    }
  };

  // Authentication page
  if (currentPage === "auth") {
    return (
      <Auth
        role={currentRole}
        onLoginSuccess={handleLoginSuccess}
        onBack={() => setCurrentPage("home")}
      />
    );
  }

  // Student options
  if (currentPage === "student-options") {
    return (
      <StudentOptions
        onUpload={() => setCurrentPage("student")}
        onChooseCourse={() => setCurrentPage("choose-course")}
        onBack={() => setCurrentPage("home")}
      />
    );
  }

  // Student PDF upload
  if (currentPage === "student") {
    return (
      <StudentDashboard
        onBack={() => setCurrentPage("student-options")}
      />
    );
  }

  // Choose course
  if (currentPage === "choose-course") {
    return (
      <div>
        <h2>Choose Course</h2>
        <p>We'll build this page next!</p>
        <button onClick={() => setCurrentPage("student-options")}>
          Back
        </button>
      </div>
    );
  }

  // HOD and Principal options
  if (currentPage === "admin-options") {
    return (
      <AdminOptions
        role={currentRole}
        onView={() => setCurrentPage("admin-dashboard")}
        onDownload={() => {
          window.location.href = "/download";
        }}
        onBack={() => setCurrentPage("home")}
      />
    );
  }

  // Excel dashboard
  if (currentPage === "admin-dashboard") {
    return (
      <AdminDashboard
        role={currentRole}
        onBack={() => setCurrentPage("admin-options")}
      />
    );
  }

  // Supervisor placeholder
  if (currentPage === "supervisor") {
    return (
      <div>
        <h2>Supervisor Login Successful</h2>
        <p>Supervisor dashboard will be developed later.</p>
        <button onClick={() => setCurrentPage("home")}>
          Back to Home
        </button>
      </div>
    );
  }

  // Landing page
  return (
    <Login
      onStudentLogin={() => openAuth("student")}
      onHodLogin={() => openAuth("hod")}
      onPrincipalLogin={() => openAuth("principal")}
      onSupervisorLogin={() => openAuth("supervisor")}
    />
  );
}

export default App;
import "./Login.css";
import collegeLogo from "../assets/college-logo.png";
function Login() {
  return (
    <div className="portal-page">

      {/* Header */}
      <header className="portal-header">

        <div className="college-logo">
           <img src={collegeLogo} alt="College Logo" />
        </div>

        <div className="college-name">
          <h1>M S Ramaiah Institute</h1>
          <p>Research & Academic Portal</p>
        </div>

      </header>


      {/* Portal Title */}
      <div className="portal-title">
        <h2>RESEARCH PORTAL</h2>
      </div>


      {/* Main Content */}
      <main className="portal-content">

        {/* Left Section */}
        <section className="roles-section">

          <div className="section-heading">
            🌐 RESEARCH PROGRAMMES
          </div>

          <div className="role-grid">

            {/* Student */}
            <div className="role-card">

              <div className="role-icon">
                👤
              </div>

              <button>
                STUDENT LOGIN
              </button>

            </div>


            {/* Supervisor */}
            <div className="role-card">

              <div className="role-icon">
                👤
              </div>

              <button>
                SUPERVISOR LOGIN
              </button>

            </div>


            {/* Principal */}
            <div className="role-card">

              <div className="role-icon">
                👤
              </div>

              <button>
                PRINCIPAL / HEAD LOGIN
              </button>

            </div>

          </div>

        </section>


        {/* Right Section */}
        <aside className="side-section">

          <div className="side-box">

            <div className="side-heading">
              🌐 REGULATIONS
            </div>

            <div className="side-link">
              ➜ Research Regulations
            </div>

            <div className="side-link">
              ➜ Academic Guidelines
            </div>

          </div>


          <div className="side-box">

            <div className="side-heading">
              🌐 LINKS
            </div>

            <a
  href="https://www.msrit.edu/"
  target="_blank"
  rel="noopener noreferrer"
  className="side-link"
>
  ➜ College Website
</a>

            <div className="side-link">
              ➜ Research Department
            </div>

          </div>

        </aside>

      </main>


      {/* Footer */}
      <footer>
        © 2026 M S Ramaiah Institute  | Research & Academic Portal
      </footer>

    </div>
  );
}

export default Login;
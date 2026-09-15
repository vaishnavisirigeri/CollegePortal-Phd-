import "./Login.css";

function Login() {
  return (
    <div className="login-page">
      
      <div className="login-card">
        <h1>College Research Portal</h1>
        <p>Login to continue</p>

        <form>
          <label>Username</label>
          <input
            type="text"
            placeholder="Enter your username"
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
          />

          <button type="submit">
            Login
          </button>
        </form>
      </div>

    </div>
  );
}

export default Login;
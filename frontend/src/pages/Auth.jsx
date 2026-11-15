import { useState } from "react";
import { supabase } from "../lib/supabase";
import "./Auth.css";

function Auth({ role, onLoginSuccess, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      // Authenticate using Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Get the logged-in user's profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, full_name, role, department_id, supervisor_id, usn")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        throw new Error("User profile not found.");
      }

      // Check whether the account has permission for this role
      if (profile.role !== role.toLowerCase()) {
        await supabase.auth.signOut();
        throw new Error(
          `You are not authorized to log in as ${role}.`
        );
      }

      // Successful login
      onLoginSuccess(profile);

    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">

        <h2>{role} Login</h2>

        <p>Enter your registered email and password.</p>

        <form onSubmit={handleLogin}>

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "LOGIN"}
          </button>

        </form>

        <button className="auth-back" onClick={onBack}>
          Back
        </button>

      </div>
    </div>
  );
}

export default Auth;
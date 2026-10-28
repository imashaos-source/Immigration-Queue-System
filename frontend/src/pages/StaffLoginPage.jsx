
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./StaffLoginPage.css";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth`;

export default function StaffLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to sign in.");
      }

      if (!result.token || !result.staff) {
        throw new Error("The server returned an invalid login response.");
      }

      // Store the token and safe staff details for the dashboard.
      localStorage.setItem("staffToken", result.token);
      localStorage.setItem("staffUser", JSON.stringify(result.staff));

      navigate("/staff/dashboard", { replace: true });
    } catch (error) {
      if (error instanceof TypeError) {
        setErrorMessage(
          "Cannot connect to the server. Check that the backend is running."
        );
      } else {
        setErrorMessage(error.message || "Sign-in failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="staff-login-page">
      <div className="staff-login-intro">
        <span className="staff-eyebrow">STAFF PORTAL</span>
        <h1>Welcome to the staff portal.</h1>
        <p>
          Sign in to review appointment requests, manage daily queues, and
          update applicant records.
        </p>

        <div className="staff-feature-list">
          <div>
            <span className="staff-feature-icon">01</span>
            <span>
              <strong>Appointment management</strong>
              <small>Review and process requests.</small>
            </span>
          </div>

          <div>
            <span className="staff-feature-icon">02</span>
            <span>
              <strong>Queue management</strong>
              <small>Organise approved daily appointments.</small>
            </span>
          </div>

          <div>
            <span className="staff-feature-icon">03</span>
            <span>
              <strong>Applicant records</strong>
              <small>Access records according to staff permissions.</small>
            </span>
          </div>
        </div>
      </div>

      <div className="staff-login-card">
        <div className="staff-login-symbol">IS</div>
        <h2>Staff sign in</h2>
        <p className="staff-login-description">
          Enter your staff account details to continue.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="staff-email">Email address</label>
            <input
              id="staff-email"
              type="email"
              autoComplete="username"
              placeholder="Enter your staff email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="staff-password">Password</label>
            <input
              id="staff-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {errorMessage && (
            <div className="staff-notice" role="alert">
              {errorMessage}
            </div>
          )}

          <button
            className="staff-signin-button"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <Link to="/" className="staff-back-link">
          ← Back to the public website
        </Link>
      </div>
    </section>
  );
}

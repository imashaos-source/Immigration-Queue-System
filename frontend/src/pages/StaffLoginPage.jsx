
import { Link } from "react-router-dom";
import "./StaffLoginPage.css";

export default function StaffLoginPage() {
  return (
    <section className="staff-login-page">
      <div className="staff-login-intro">
        <span className="staff-eyebrow">STAFF PORTAL</span>
        <h1>Welcome to the staff portal.</h1>
        <p>
          The staff portal will allow authorised immigration officers to
          review appointment requests, manage daily queues, and update
          applicant records.
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
          Staff authentication is being configured.
        </p>

        <div className="staff-notice" role="status">
          <strong>Sign-in is not enabled yet</strong>
          <p>
            Secure staff accounts and server-side authentication must be
            configured before staff can sign in.
          </p>
        </div>

        <button className="staff-signin-button" type="button" disabled>
          Sign-in coming soon
        </button>

        <Link to="/" className="staff-back-link">
          ← Back to the public website
        </Link>
      </div>
    </section>
  );
}

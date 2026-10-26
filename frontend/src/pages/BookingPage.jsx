
import { useState } from "react";
import { Link } from "react-router-dom";
import "./BookingPage.css";

const API_URL = "http://localhost:5000/api/appointments";

const initialForm = {
  applicantName: "",
  email: "",
  passportNumber: "",
  serviceType: "Passport Services",
  appointmentDate: "",
};

export default function BookingPage() {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setConfirmation(null);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          appointmentDate: new Date(form.appointmentDate).toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || result.error || "Could not submit the appointment request."
        );
      }

      setConfirmation(result);
      setForm(initialForm);
    } catch (err) {
      setError(
        err.message || "Could not connect to the server. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="booking-page">
      <section className="booking-intro">
        <Link to="/" className="back-home">← Back to home</Link>
        <span className="section-eyebrow">APPOINTMENT SERVICES</span>
        <h1>Request an appointment</h1>
        <p>
          Complete the form below to submit your appointment request.
          Staff will review it before it is approved.
        </p>
        <div className="booking-steps">
          <span className="step-active">1 <small>Your details</small></span>
          <i />
          <span>2 <small>Staff review</small></span>
          <i />
          <span>3 <small>Confirmation</small></span>
        </div>
      </section>

      <section className="booking-content">
        {confirmation ? (
          <div className="booking-result" role="status">
            <span className="result-mark">✓</span>
            <span className="section-eyebrow">REQUEST SUBMITTED</span>
            <h2>Your request has been received</h2>
            <p>
              Your appointment request was submitted successfully. It is
              awaiting staff review; this does not mean it is approved.
            </p>
            <div className="result-details">
              <span>Applicant</span>
              <strong>{confirmation.applicantName || "Request received"}</strong>
              <span>Current status</span>
              <strong>Pending review</strong>
            </div>
            <button
              type="button"
              className="booking-submit"
              onClick={() => setConfirmation(null)}
            >
              Submit another request
            </button>
            <Link className="result-home-link" to="/">Return to home</Link>
          </div>
        ) : (
          <form className="booking-form" onSubmit={handleSubmit}>
            <div className="booking-form-heading">
              <h2>Applicant information</h2>
              <p>Fields marked with * are required.</p>
            </div>

            {error && <div className="booking-error" role="alert">{error}</div>}

            <div className="booking-field">
              <label htmlFor="applicantName">Full name *</label>
              <input
                id="applicantName"
                name="applicantName"
                value={form.applicantName}
                onChange={handleChange}
                autoComplete="name"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="booking-field">
              <label htmlFor="email">Email address *</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="booking-field">
              <label htmlFor="passportNumber">Passport number *</label>
              <input
                id="passportNumber"
                name="passportNumber"
                value={form.passportNumber}
                onChange={handleChange}
                autoComplete="off"
                placeholder="Enter passport number"
                required
              />
            </div>

            <div className="booking-field">
              <label htmlFor="serviceType">Service required *</label>
              <select
                id="serviceType"
                name="serviceType"
                value={form.serviceType}
                onChange={handleChange}
                required
              >
                <option>Passport Services</option>
                <option>Visa Services</option>
                <option>Residence Permit</option>
                <option>Citizenship Services</option>
                <option>Other</option>
              </select>
            </div>

            <div className="booking-field">
              <label htmlFor="appointmentDate">Preferred date and time *</label>
              <input
                id="appointmentDate"
                name="appointmentDate"
                type="datetime-local"
                value={form.appointmentDate}
                onChange={handleChange}
                min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                  .toISOString().slice(0, 16)}
                required
              />
            </div>

            <div className="booking-notice">
              Your preferred date is a request, not a confirmed booking.
              Please wait for staff approval before attending.
            </div>

            <button className="booking-submit" type="submit" disabled={saving}>
              {saving ? "Submitting request…" : "Submit appointment request →"}
            </button>
          </form>
        )}

        <aside className="booking-aside">
          <span className="section-eyebrow">BEFORE YOU BEGIN</span>
          <h2>Have your information ready.</h2>
          <p>To complete the request, prepare the following information.</p>
          <ul>
            <li>Full name as shown on your passport</li>
            <li>Valid email address</li>
            <li>Passport number</li>
            <li>Service you need</li>
            <li>Preferred appointment date and time</li>
          </ul>
          <div className="aside-help">
            <strong>Need assistance?</strong>
            <p>This is an academic project prototype. Official contact details should be added before public deployment.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}

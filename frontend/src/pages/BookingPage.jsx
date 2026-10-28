
import { useState } from "react";
import { Link } from "react-router-dom";
import "./BookingPage.css";
import BackHomeButtons from "../components/BackHomeButtons";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/appointments`;

const initialForm = {
  applicantName: "",
  email: "",
  passportNumber: "",
  serviceType: "Passport Services",
  appointmentDate: "",
};

function getMinimumDateTime() {
  const now = new Date();
  const localDate = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 16);
}

export default function BookingPage() {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setConfirmation(null);

    // Validate the preferred appointment date before sending.
    const selectedDate = new Date(form.appointmentDate);

    if (
      !form.appointmentDate ||
      Number.isNaN(selectedDate.getTime())
    ) {
      setError("Please select a valid appointment date and time.");
      return;
    }

    if (selectedDate.getTime() < Date.now()) {
      setError("Please select a date and time that is not in the past.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          applicantName: form.applicantName.trim(),
          email: form.email.trim(),
          passportNumber: form.passportNumber.trim().toUpperCase(),
          appointmentDate: selectedDate.toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorDetails = [
          result.message,
          result.error,
          result.code,
        ]
          .filter(Boolean)
          .join(" ");

        if (
          result.code === 11000 ||
          errorDetails.includes("E11000") ||
          errorDetails.toLowerCase().includes("duplicate key")
        ) {
          throw new Error(
            "This passport number is already registered. Please check the number or contact staff for assistance."
          );
        }

        throw new Error(
          result.message ||
            result.error ||
            "Could not submit the appointment request. Please try again."
        );
      }

      // The API returns the saved appointment inside result.appointment.
      const savedAppointment = result.appointment || result;

      setConfirmation(savedAppointment);
      setForm(initialForm);
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          "Could not connect to the server. Please check that the backend is running and try again."
        );
      } else {
        setError(
          err.message ||
            "Could not submit the appointment request. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="booking-page">
      <section className="booking-intro">
        <BackHomeButtons />

        <span className="section-eyebrow">APPOINTMENT SERVICES</span>

        <h1>Request an appointment</h1>

        <p>
          Complete the form below to submit your appointment request.
          Staff will review it before it is approved.
        </p>

        <div className="booking-steps">
          <span className="step-active">
            1 <small>Your details</small>
          </span>
          <i />
          <span>
            2 <small>Staff review</small>
          </span>
          <i />
          <span>
            3 <small>Confirmation</small>
          </span>
        </div>
      </section>

      <section className="booking-content">
        {confirmation ? (
          <div className="booking-result" role="status">
            <span className="result-mark">✓</span>

            <span className="section-eyebrow">REQUEST SUBMITTED</span>

            <h2>Your request has been received</h2>

            <p>
              Your appointment request was submitted successfully.
              It is awaiting staff review; this does not mean it is approved.
            </p>

            <div className="result-details">
              {confirmation.bookingReference && (
                <>
                  <span>Booking reference</span>
                  <strong className="booking-reference">
                    {confirmation.bookingReference}
                  </strong>
                </>
              )}

              <span>Applicant</span>
              <strong>
                {confirmation.applicantName || "Request received"}
              </strong>

              <span>Current status</span>
              <strong>{confirmation.status || "Pending"}</strong>

              {confirmation.appointmentDate && (
                <>
                  <span>Preferred appointment</span>
                  <strong>
                    {new Date(
                      confirmation.appointmentDate
                    ).toLocaleString("en-LK", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Asia/Colombo",
                    })}
                  </strong>
                </>
              )}
            </div>

            <button
              type="button"
              className="booking-submit"
              onClick={() => {
                setConfirmation(null);
                setError("");
              }}
            >
              Submit another request
            </button>

            <Link className="result-home-link" to="/">
              Return to home
            </Link>
          </div>
        ) : (
          <form className="booking-form" onSubmit={handleSubmit}>
            <div className="booking-form-heading">
              <h2>Applicant information</h2>
              <p>Fields marked with * are required.</p>
            </div>

            {error && (
              <div className="booking-error" role="alert">
                {error}
              </div>
            )}

            <div className="booking-field">
              <label htmlFor="applicantName">Full name *</label>
              <input
                id="applicantName"
                name="applicantName"
                value={form.applicantName}
                onChange={handleChange}
                autoComplete="name"
                placeholder="Enter your full name"
                maxLength={100}
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
                maxLength={254}
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
                maxLength={30}
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
              <label htmlFor="appointmentDate">
                Preferred date and time *
              </label>
              <input
                id="appointmentDate"
                name="appointmentDate"
                type="datetime-local"
                value={form.appointmentDate}
                onChange={handleChange}
                min={getMinimumDateTime()}
                required
              />
            </div>

            <div className="booking-notice">
              Your preferred date is a request, not a confirmed booking.
              Please wait for staff approval before attending.
            </div>

            <button
              className="booking-submit"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Submitting request…"
                : "Submit appointment request →"}
            </button>
          </form>
        )}

        <aside className="booking-aside">
          <span className="section-eyebrow">BEFORE YOU BEGIN</span>

          <h2>Have your information ready.</h2>

          <p>
            To complete the request, prepare the following information.
          </p>

          <ul>
            <li>Full name as shown on your passport</li>
            <li>Valid email address</li>
            <li>Passport number</li>
            <li>Service you need</li>
            <li>Preferred appointment date and time</li>
          </ul>

          <div className="aside-help">
            <strong>Need assistance?</strong>
            <p>
              This is an academic project prototype. Official contact
              details should be added before public deployment.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}

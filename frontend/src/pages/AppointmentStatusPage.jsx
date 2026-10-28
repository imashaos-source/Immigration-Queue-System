
import { useState } from "react";
import { Link } from "react-router-dom";
import "./AppointmentStatusPage.css";
import BackHomeButtons from "../components/BackHomeButtons";

const API_URL = "http://localhost:5000/api/appointments/check-status";

export default function AppointmentStatusPage() {
  const [bookingReference, setBookingReference] = useState("");
  const [email, setEmail] = useState("");
  const [appointment, setAppointment] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setAppointment(null);
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingReference: bookingReference.trim().toUpperCase(),
          email: email.trim().toLowerCase(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to find your appointment."
        );
      }

      setAppointment(result.appointment);
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          "Could not connect to the server. Please try again."
        );
      } else {
        setError(
          err.message || "Something went wrong. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function formatAppointmentDate(dateValue) {
    if (!dateValue) return "Not available";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleString("en-LK", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Colombo",
    });
  }

  return (
    <main className="appointment-status-page">
      <section className="status-intro">
        <BackHomeButtons />

        <span className="status-eyebrow">APPOINTMENT SERVICES</span>

        <h1>Check your appointment</h1>

        <p>
          Enter the booking reference and email address you used when
          submitting your appointment request.
        </p>
      </section>

      <section className="status-content">
        <div className="status-card">
          {!appointment ? (
            <>
              <div className="status-card-heading">
                <span className="status-icon" aria-hidden="true">
                  ✓
                </span>

                <h2>Find your appointment</h2>

                <p>
                  Your appointment details will appear here when your
                  information matches our records.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="status-error" role="alert">
                    {error}
                  </div>
                )}

                <div className="status-field">
                  <label htmlFor="bookingReference">
                    Booking reference
                  </label>

                  <input
                    id="bookingReference"
                    name="bookingReference"
                    type="text"
                    value={bookingReference}
                    onChange={(event) =>
                      setBookingReference(event.target.value)
                    }
                    placeholder="IMM-2026-2B4CAEC1"
                    autoComplete="off"
                    maxLength={40}
                    required
                  />
                </div>

                <div className="status-field">
                  <label htmlFor="email">
                    Email address used for booking
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    maxLength={254}
                    required
                  />
                </div>

                <button
                  className="status-submit-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? "Checking appointment..."
                    : "Check appointment status →"}
                </button>
              </form>
            </>
          ) : (
            <div className="status-result" role="status">
              <span className="status-icon" aria-hidden="true">
                ✓
              </span>

              <span className="status-eyebrow">
                APPOINTMENT FOUND
              </span>

              <h2>Your appointment details</h2>

              <div className="status-result-details">
                <span>Booking reference</span>
                <strong>{appointment.bookingReference}</strong>

                <span>Applicant</span>
                <strong>{appointment.applicantName}</strong>

                <span>Service</span>
                <strong>{appointment.serviceType}</strong>

                <span>Appointment status</span>
                <strong className="status-value">
                  {appointment.status}
                </strong>

                <span>Appointment date</span>
                <strong>
                  {formatAppointmentDate(appointment.appointmentDate)}
                </strong>

                {appointment.queueNumber != null && (
                  <>
                    <span>Queue number</span>
                    <strong>{appointment.queueNumber}</strong>
                  </>
                )}
              </div>

              {appointment.status === "Pending" && (
                <p className="status-notice">
                  Your request is awaiting staff review. Please wait for
                  approval before attending.
                </p>
              )}

              {appointment.status === "Approved" && (
                <p className="status-notice">
                  Your appointment has been approved. Please follow any
                  instructions provided by the office.
                </p>
              )}

              <button
                className="status-submit-button"
                type="button"
                onClick={() => {
                  setAppointment(null);
                  setError("");
                }}
              >
                Check another appointment
              </button>
            </div>
          )}

          <Link to="/book" className="status-book-link">
            Need a new appointment? Book here
          </Link>
        </div>

        <aside className="status-help-card">
          <span className="status-eyebrow">NEED HELP?</span>

          <h2>Keep your reference safe.</h2>

          <p>
            Use the reference shown on your booking confirmation and
            the same email address you entered when applying.
          </p>

          <p>
            A submitted request is not an approval. Check your status
            before making plans to visit.
          </p>
        </aside>
      </section>
    </main>
  );
}

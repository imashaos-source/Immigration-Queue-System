
import { useEffect, useState } from "react";
import "./LiveQueueBoard.css";
import BackHomeButtons from "../components/BackHomeButtons";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/walk-ins/board`;

function formatSriLankanTime(dateValue) {
  if (!dateValue) return "Time unavailable";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Time unavailable";
  }

  return new Intl.DateTimeFormat("en-LK", {
    timeZone: "Asia/Colombo",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatSriLankanClock(dateValue) {
  return new Intl.DateTimeFormat("en-LK", {
    timeZone: "Asia/Colombo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(dateValue);
}

function getTicketType(ticket) {
  return ticket.type === "Appointment"
    ? "Online Appointment"
    : "Walk-in";
}

export default function LiveQueueBoard() {
  const [tickets, setTickets] = useState([]);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [overdueAppointments, setOverdueAppointments] = useState([]);
  const [office, setOffice] = useState("All Offices");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadQueue() {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load the live queue."
          );
        }

        if (active) {
          setTickets(data.tickets || []);
          setNextAppointment(data.nextAppointment || null);
          setOverdueAppointments(data.overdueAppointments || []);
          setLastUpdated(new Date());
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(
            err.message || "Unable to connect to the queue server."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadQueue();

    const interval = setInterval(loadQueue, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const offices = [
    "All Offices",
    ...new Set(
      tickets
        .map((ticket) => ticket.office)
        .filter(Boolean)
    ),
  ];

  const visibleTickets =
    office === "All Offices"
      ? tickets
      : tickets.filter((ticket) => ticket.office === office);

  const servingTickets = visibleTickets.filter(
    (ticket) => ticket.status === "Serving"
  );

  const waitingTickets = visibleTickets.filter(
    (ticket) => ticket.status === "Waiting"
  );

  const visibleOverdueAppointments =
    office === "All Offices"
      ? overdueAppointments
      : overdueAppointments.filter(
          (appointment) => appointment.office === office
        );

  const visibleNextAppointment =
    nextAppointment &&
    (
      office === "All Offices" ||
      nextAppointment.office === office
    )
      ? nextAppointment
      : null;

  const hasAppointmentAttention =
    visibleOverdueAppointments.length > 0;

  return (
    <main className="live-board-page">
      <BackHomeButtons />

      <header className="live-board-header">
        <p className="live-board-eyebrow">
          IMMIGRATION SERVICES
        </p>

        <h1>Live Queue Board</h1>

        <p>
          Follow the serving queue and scheduled appointments.
        </p>

        <div className="live-board-status">
          <span className="live-board-dot" />
          LIVE QUEUE

          {lastUpdated && (
            <span className="live-board-updated">
              Updated at {formatSriLankanClock(lastUpdated)}
            </span>
          )}
        </div>
      </header>

      <section className="live-board-content">
        <div className="live-board-toolbar">
          <div>
            <h2>Current Queue</h2>
            <p>
              Walk-ins and online appointments in one view.
            </p>
          </div>

          <label className="live-board-filter">
            <span>Filter by office</span>

            <select
              value={office}
              onChange={(event) => setOffice(event.target.value)}
            >
              {offices.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <p className="live-board-error">{error}</p>
        )}

        {loading ? (
          <div className="live-board-empty">
            Loading queue information...
          </div>
        ) : (
          <>
            <div className="live-board-stats">
              <article className="live-board-stat">
                <span>NOW SERVING</span>
                <strong>{servingTickets.length}</strong>
              </article>

              <article className="live-board-stat">
                <span>WAITING IN QUEUE</span>
                <strong>{waitingTickets.length}</strong>
              </article>
            </div>

            <section className="live-board-section">
              <h2>Now Serving</h2>

              {servingTickets.length > 0 ? (
                <div className="live-board-grid">
                  {servingTickets.map((ticket) => (
                    <article
                      className="live-ticket serving"
                      key={ticket._id}
                    >
                      <span className="live-ticket-label">
                        NOW SERVING
                      </span>

                      <strong>{ticket.ticketNumber}</strong>

                      <span className="live-ticket-type">
                        {getTicketType(ticket)}
                      </span>

                      <span>{ticket.serviceType}</span>

                      <span className="live-ticket-office">
                        {ticket.office}
                      </span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="live-board-empty">
                  No tickets are currently being served.
                </div>
              )}
            </section>

            <section
              className={`live-board-section next-appointment-section ${
                hasAppointmentAttention ? "has-overdue" : ""
              }`}
            >
              <h2>
                {hasAppointmentAttention
                  ? "Appointment Attention Required"
                  : "Next Scheduled Appointment"}
              </h2>

              {hasAppointmentAttention ? (
                <div className="overdue-appointments-list">
                  {visibleOverdueAppointments.map((appointment) => (
                    <article
                      className="next-appointment-card overdue-appointment-card"
                      key={appointment._id}
                    >
                      <div className="next-appointment-heading">
                        <span className="overdue-label">
                          APPOINTMENT OVERDUE
                        </span>

                        <strong>{appointment.ticketNumber}</strong>
                      </div>

                      <div className="next-appointment-details">
                        <div>
                          <span>Service</span>
                          <strong>{appointment.serviceType}</strong>
                        </div>

                        <div>
                          <span>Scheduled time (Sri Lanka)</span>
                          <strong>
                            {formatSriLankanTime(
                              appointment.appointmentTime
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Office</span>
                          <strong>{appointment.office}</strong>
                        </div>
                      </div>

                      <p className="next-appointment-note overdue-note">
                        This appointment has passed its scheduled time
                        and is still waiting. Staff should review it
                        and decide the next action.
                      </p>
                    </article>
                  ))}
                </div>
              ) : visibleNextAppointment ? (
                <article className="next-appointment-card">
                  <div className="next-appointment-heading">
                    <span className="next-appointment-label">
                      SCHEDULED APPOINTMENT
                    </span>

                    <strong>
                      {visibleNextAppointment.ticketNumber}
                    </strong>
                  </div>

                  <div className="next-appointment-details">
                    <div>
                      <span>Service</span>
                      <strong>
                        {visibleNextAppointment.serviceType}
                      </strong>
                    </div>

                    <div>
                      <span>Scheduled time (Sri Lanka)</span>
                      <strong>
                        {formatSriLankanTime(
                          visibleNextAppointment.appointmentTime
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Office</span>
                      <strong>
                        {visibleNextAppointment.office}
                      </strong>
                    </div>
                  </div>

                  <p className="next-appointment-note">
                    Staff should check the appointment time before
                    calling another walk-in, so scheduled visitors
                    are not unnecessarily delayed.
                  </p>
                </article>
              ) : (
                <div className="live-board-empty">
                  No waiting or upcoming appointments for this
                  office selection.
                </div>
              )}
            </section>

            <section className="live-board-section">
              <h2>Waiting Queue</h2>

              <p className="live-board-section-description">
                Ticket types and appointment times are shown where
                applicable. Applicant names, email addresses, and
                passport numbers are not displayed.
              </p>

              {waitingTickets.length > 0 ? (
                <div className="live-board-table-wrap">
                  <table className="live-board-table">
                    <thead>
                      <tr>
                        <th>Ticket</th>
                        <th>Type</th>
                        <th>Service</th>
                        <th>Office</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Appointment Time</th>
                      </tr>
                    </thead>

                    <tbody>
                      {waitingTickets.map((ticket) => (
                        <tr key={ticket._id}>
                          <td className="live-ticket-number">
                            {ticket.ticketNumber}
                          </td>

                          <td>{getTicketType(ticket)}</td>

                          <td>{ticket.serviceType}</td>

                          <td>{ticket.office}</td>

                          <td>
                            <span
                              className={`live-priority ${
                                ticket.priority === "Priority"
                                  ? "priority-high"
                                  : ""
                              }`}
                            >
                              {ticket.priority || "Normal"}
                            </span>
                          </td>

                          <td>
                            <span className="live-waiting-badge">
                              Waiting
                            </span>
                          </td>

                          <td>
                            {ticket.type === "Appointment"
                              ? formatSriLankanTime(
                                  ticket.appointmentTime
                                )
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="live-board-empty">
                  There are no waiting tickets for this selection.
                </div>
              )}
            </section>
          </>
        )}
      </section>

      <footer className="live-board-footer">
        Queue information refreshes automatically every 5 seconds.
        Appointment times are displayed in Sri Lanka time.
      </footer>
    </main>
  );
}


import { useEffect, useState } from "react";
import "./LiveQueueBoard.css";
import BackHomeButtons from "../components/BackHomeButtons";

const API_URL = "http://localhost:5000/api/walk-ins/board";

export default function LiveQueueBoard() {
  const [tickets, setTickets] = useState([]);
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
          throw new Error(data.message || "Unable to load the queue.");
        }

        if (active) {
          setTickets(data.tickets || []);
          setLastUpdated(new Date());
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to connect to the queue server.");
        }
      } finally {
        if (active) setLoading(false);
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
    ...new Set(tickets.map((ticket) => ticket.office)),
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

  return (
    <main className="live-board-page">
        <BackHomeButtons />
      <header className="live-board-header">
        <p className="live-board-eyebrow">IMMIGRATION SERVICES</p>
        <h1>Live Queue Board</h1>
        <p>Queue status and ticket information</p>

        <div className="live-board-status">
          <span className="live-board-dot" />
          LIVE QUEUE
          {lastUpdated && (
            <span className="live-board-updated">
              Updated at {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </header>

      <section className="live-board-content">
        <div className="live-board-toolbar">
          <div>
            <h2>Current Queue</h2>
            <p>Follow the latest serving and waiting tickets.</p>
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

        {error && <p className="live-board-error">{error}</p>}

        {loading ? (
          <div className="live-board-empty">Loading queue information...</div>
        ) : (
          <>
            <div className="live-board-stats">
              <article className="live-board-stat">
                <span>NOW SERVING</span>
                <strong>{servingTickets.length}</strong>
              </article>

              <article className="live-board-stat">
                <span>WAITING</span>
                <strong>{waitingTickets.length}</strong>
              </article>
            </div>

            <section className="live-board-section">
              <h2>Now Serving</h2>

              {servingTickets.length ? (
                <div className="live-board-grid">
                  {servingTickets.map((ticket) => (
                    <article className="live-ticket serving" key={ticket._id}>
                      <span className="live-ticket-label">NOW SERVING</span>
                      <strong>{ticket.ticketNumber}</strong>
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

            <section className="live-board-section">
              <h2>Waiting Tickets</h2>

              {waitingTickets.length ? (
                <div className="live-board-table-wrap">
                  <table className="live-board-table">
                    <thead>
                      <tr>
                        <th>Ticket</th>
                        <th>Service</th>
                        <th>Office</th>
                        <th>Priority</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {waitingTickets.map((ticket) => (
                        <tr key={ticket._id}>
                          <td className="live-ticket-number">
                            {ticket.ticketNumber}
                          </td>
                          <td>{ticket.serviceType}</td>
                          <td>{ticket.office}</td>
                          <td>
                            <span
                              className={`live-priority ${ticket.priority === "Priority" ? "priority-high" : ""}`}
                            >
                              {ticket.priority}
                            </span>
                          </td>
                          <td>
                            <span className="live-waiting-badge">
                              Waiting
                            </span>
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
      </footer>
    </main>
  );
}

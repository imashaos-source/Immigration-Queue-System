
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/appointments`;

const emptyForm = {
  applicantName: "",
  email: "",
  passportNumber: "",
  serviceType: "Passport Services",
  appointmentDate: "",
};

function getSriLankanDate(dateValue) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(dateValue));

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatDate(dateValue) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
}

function formatTime(dateValue) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(dateValue));
}

function App() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [walkInTickets, setWalkInTickets] = useState([]);
  const [walkInLoading, setWalkInLoading] = useState(false);
  const [walkInError, setWalkInError] = useState("");
  const [walkInNotice, setWalkInNotice] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [walkInForm, setWalkInForm] = useState({
    applicantName: "",
    serviceType: "Passport Services",
    office: "",
    priority: "Normal",
  });
  const [walkInSaving, setWalkInSaving] = useState(false);
  const [walkInConfirmationTicket, setWalkInConfirmationTicket] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortConfig, setSortConfig] = useState({
    key: "appointmentDate",
    direction: "desc",
  });
  const [selectedQueueDate, setSelectedQueueDate] = useState(() =>
    getSriLankanDate(new Date())
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("staffToken");
    localStorage.removeItem("staffUser");
    navigate("/staff/login", { replace: true });
  }, [navigate]);

  const authenticatedFetch = useCallback(
    async (url, options = {}) => {
      const token = localStorage.getItem("staffToken");

      if (!token) {
        handleUnauthorized();
        throw new Error("Your session has ended. Please sign in again.");
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Your session has expired. Please sign in again.");
      }

      return response;
    },
    [handleUnauthorized]
  );

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await authenticatedFetch(API_URL);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not load appointments.");
      }

      setAppointments(result);
    } catch (err) {
      setError(
        err.message ||
          "Cannot connect to the backend. Make sure your server is running."
      );
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  const loadWalkInTickets = useCallback(async () => {
    setWalkInLoading(true);
    setWalkInError("");

    try {
      const response = await authenticatedFetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/walk-ins`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not load walk-in tickets.");
      }

      setWalkInTickets(result);
    } catch (err) {
      setWalkInError(err.message || "Could not load walk-in tickets.");
    } finally {
      setWalkInLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    if (!localStorage.getItem("staffToken")) {
      navigate("/staff/login", { replace: true });
      return;
    }

    loadAppointments();
    loadWalkInTickets();
  }, [navigate, loadAppointments, loadWalkInTickets]);

  function handleLogout() {
    localStorage.removeItem("staffToken");
    localStorage.removeItem("staffUser");
    navigate("/staff/login", { replace: true });
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleWalkInSubmit(event) {
    event.preventDefault();
    setWalkInSaving(true);
    setWalkInError("");
    setWalkInNotice("");
    setWalkInConfirmationTicket(null);
    setError("");
    setNotice("");

    try {
      const response = await authenticatedFetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/walk-ins`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(walkInForm),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not register the walk-in visitor.");
      }

      const createdTicket = result.ticket || result;
      setWalkInConfirmationTicket(createdTicket);
      setWalkInNotice(
        createdTicket?.ticketNumber
          ? `Walk-in registered successfully. Ticket number: ${createdTicket.ticketNumber}.`
          : "Walk-in registered successfully."
      );
      setWalkInForm({
        applicantName: "",
        serviceType: "Passport Services",
        office: "",
        priority: "Normal",
      });
      await loadWalkInTickets();
    } catch (err) {
      setWalkInError(err.message || "Could not register the walk-in visitor.");
    } finally {
      setWalkInSaving(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      ...form,
      appointmentDate: new Date(form.appointmentDate).toISOString(),
    };

    try {
      const response = await authenticatedFetch(
        editingId ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || "Request failed.");
      }

      setNotice(
        editingId
          ? "Appointment updated successfully."
          : "Appointment created successfully."
      );
      setForm(emptyForm);
      setEditingId(null);
      await loadAppointments();
    } catch (err) {
      setError(err.message || "Unable to save the appointment.");
    } finally {
      setSaving(false);
    }
  }

  function startEditing(appointment) {
    setEditingId(appointment._id);

    const localDate = new Date(appointment.appointmentDate);
    const localOffset = localDate.getTimezoneOffset() * 60000;

    setForm({
      applicantName: appointment.applicantName,
      email: appointment.email,
      passportNumber: appointment.passportNumber,
      serviceType: appointment.serviceType,
      appointmentDate: new Date(
        localDate.getTime() - localOffset
      )
        .toISOString()
        .slice(0, 16),
    });

    setNotice("");
    setError("");
    document
      .getElementById("appointment-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
  }

  async function updateStatus(id, status) {
    setError("");
    setNotice("");

    try {
      const response = await authenticatedFetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Status update failed."
        );
      }

      const queueMessage =
        status === "Approved" && result.appointment?.queueNumber != null
          ? ` Queue number: ${result.appointment.queueNumber}.`
          : "";

      setNotice(`Appointment status updated.${queueMessage}`);
      await loadAppointments();
    } catch (err) {
      setError(err.message || "Status update failed.");
    }
  }

  async function updateWalkInStatus(ticketId, status) {
    setWalkInError("");
    setWalkInNotice("");

    try {
      const response = await authenticatedFetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/walk-ins/${ticketId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not update ticket status.");
      }

      setWalkInNotice(`${result.ticket.ticketNumber} updated to ${status}.`);
      await loadWalkInTickets();
    } catch (err) {
      setWalkInError(err.message || "Could not update ticket status.");
    }
  }

  async function deleteAppointment(appointment) {
    if (
      !window.confirm(
        `Delete the appointment for ${appointment.applicantName}?`
      )
    ) {
      return;
    }

    setError("");
    setNotice("");

    try {
      const response = await authenticatedFetch(
        `${API_URL}/${appointment._id}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not delete appointment.");
      }

      setNotice("Appointment deleted successfully.");

      if (editingId === appointment._id) {
        cancelEditing();
      }

      await loadAppointments();
    } catch (err) {
      setError(err.message || "Could not delete appointment.");
    }
  }

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortIndicator = (key) => {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const filteredAppointments = appointments
    .filter((appointment) => {
      const term = search.trim().toLowerCase();

      const searchableValues = [
        appointment.applicantName,
        appointment.email,
        appointment.passportNumber,
        appointment.serviceType,
        appointment.queueNumber == null
          ? ""
          : String(appointment.queueNumber),
      ];

      const matchesSearch = searchableValues.some((value) =>
        String(value ?? "").toLowerCase().includes(term)
      );

      const matchesStatus =
        statusFilter === "All" || appointment.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;

      if (sortConfig.key === "appointmentDate") {
        comparison =
          new Date(a.appointmentDate).getTime() -
          new Date(b.appointmentDate).getTime();
      } else if (sortConfig.key === "queueNumber") {
        const aNumber = a.queueNumber == null ? Number.POSITIVE_INFINITY : Number(a.queueNumber);
        const bNumber = b.queueNumber == null ? Number.POSITIVE_INFINITY : Number(b.queueNumber);
        comparison = aNumber - bNumber;
      } else {
        const aValue = String(a[sortConfig.key] ?? "").toLowerCase();
        const bValue = String(b[sortConfig.key] ?? "").toLowerCase();
        comparison = aValue.localeCompare(bValue);
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

  const today = getSriLankanDate(new Date());

  const todayCount = appointments.filter(
    (appointment) =>
      getSriLankanDate(appointment.appointmentDate) === today
  ).length;

  const pendingCount = appointments.filter(
    (appointment) => appointment.status === "Pending"
  ).length;

  const approvedCount = appointments.filter(
    (appointment) => appointment.status === "Approved"
  ).length;

  const completedCount = appointments.filter(
    (appointment) => appointment.status === "Completed"
  ).length;

  const dailyQueue = appointments
    .filter((appointment) => {
      if (appointment.status !== "Approved") return false;

      const queueDate =
        appointment.queueDate ||
        getSriLankanDate(appointment.appointmentDate);

      return queueDate === selectedQueueDate;
    })
    .sort((a, b) => {
      if (a.queueNumber == null) return 1;
      if (b.queueNumber == null) return -1;
      return a.queueNumber - b.queueNumber;
    });

  const staffUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("staffUser") || "null");
    } catch {
      return null;
    }
  })();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#dashboard"
          aria-label="Immigration services home"
        >
          <span className="brand-mark">IQ</span>
          <span className="brand-copy">
            <strong>Immigration Services</strong>
            <small>Appointment operations</small>
          </span>
        </a>

        <div className="nav-label">OPERATIONS</div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <a className="nav-item active" href="#dashboard">
            <span className="nav-symbol">▦</span>Overview
          </a>
          <a className="nav-item" href="#queue">
            <span className="nav-symbol">№</span>Daily queue
          </a>
          <a className="nav-item" href="#appointments">
            <span className="nav-symbol">≡</span>Appointments
          </a>
          <a className="nav-item" href="#walk-in-queue">
            <span className="nav-symbol">↗</span>Walk-in queue
          </a>
          <a className="nav-item" href="#appointment-form">
            <span className="nav-symbol">＋</span>Register walk-in
          </a>
        </nav>

        <div className="sidebar-bottom">
          <span className="connection-dot" />
          <div>
            <strong>{staffUser?.name || "Signed-in staff"}</strong>
            <small>{staffUser?.role || "Staff account"}</small>
          </div>
        </div>

        <button
          className="quiet-button"
          type="button"
          onClick={handleLogout}
        >
          Log out
        </button>

        <div className="sidebar-version">
          IMMIGRATION QUEUE SYSTEM <span>v1.0</span>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="page-header">
          <div>
            <div className="eyebrow">OPERATIONS / OVERVIEW</div>
            <h1>Appointment operations</h1>
            <p className="page-description">
              Review scheduled visits, manage applicant records, and keep
              today's queue moving.
            </p>
          </div>

          <button
            className="header-action"
            type="button"
            onClick={() =>
              document
                .getElementById("appointment-form")
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          >
            <span aria-hidden="true">＋</span> Register walk-in
          </button>
        </header>

        {error && (
          <div className="message message-error" role="alert">
            {error}
          </div>
        )}

        {notice && (
          <div className="message message-success" role="status">
            {notice}
          </div>
        )}

        <section className="overview-strip" aria-label="Appointment overview">
          <div className="overview-item">
            <span className="overview-label">All appointments</span>
            <strong>{appointments.length}</strong>
            <span className="overview-note">Records in system</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">Awaiting review</span>
            <strong>{pendingCount}</strong>
            <span className="overview-note">
              <i className="status-dot pending-dot" /> Pending
            </span>
          </div>
          <div className="overview-item">
            <span className="overview-label">Approved</span>
            <strong>{approvedCount}</strong>
            <span className="overview-note">
              <i className="status-dot approved-dot" /> Ready for service
            </span>
          </div>
          <div className="overview-item">
            <span className="overview-label">Scheduled today</span>
            <strong>{todayCount}</strong>
            <span className="overview-note">
              {completedCount} completed overall
            </span>
          </div>
        </section>

        <section className="work-section queue-section" id="queue">
          <div className="section-heading">
            <div>
              <div className="section-kicker">LIVE WORKLIST</div>
              <h2>Daily queue</h2>
              <p>Approved appointments, ordered by queue number.</p>
            </div>

            <label className="date-control" htmlFor="queueDate">
              <span>Queue date</span>
              <input
                id="queueDate"
                type="date"
                value={selectedQueueDate}
                onChange={(event) =>
                  setSelectedQueueDate(event.target.value)
                }
              />
            </label>
          </div>

          <div className="queue-summary">
            <span>
              <strong>{dailyQueue.length}</strong> people in this queue
            </span>
            <span className="queue-date-label">
              {selectedQueueDate
                ? formatDate(`${selectedQueueDate}T00:00:00`)
                : ""}
            </span>
          </div>

          {loading ? (
            <div className="table-message">Loading queue…</div>
          ) : dailyQueue.length === 0 ? (
            <div className="table-message empty-queue">
              <strong>No approved appointments for this date</strong>
              <span>
                Choose another date or approve an appointment to add it to the
                queue.
              </span>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table queue-table">
                <thead>
                  <tr>
                    <th className="queue-number-cell">Queue</th>
                    <th>Applicant</th>
                    <th>Passport number</th>
                    <th>Service</th>
                    <th>Appointment time</th>
                    <th>Record status</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyQueue.map((appointment) => (
                    <tr key={appointment._id}>
                      <td className="queue-number-cell">
                        <span className="queue-number">
                          {appointment.queueNumber == null
                            ? "—"
                            : String(appointment.queueNumber).padStart(2, "0")}
                        </span>
                      </td>
                      <td>
                        <div className="applicant-cell">
                          <strong>{appointment.applicantName}</strong>
                          <small>{appointment.email}</small>
                        </div>
                      </td>
                      <td className="passport-cell">
                        {appointment.passportNumber}
                      </td>
                      <td>{appointment.serviceType}</td>
                      <td className="time-cell">
                        {formatTime(appointment.appointmentDate)}
                      </td>
                      <td>
                        <span
                          className={`status-label ${appointment.status.toLowerCase()}`}
                        >
                          {appointment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="work-section appointments-section" id="walk-in-queue">
          <div className="section-heading">
            <div>
              <div className="section-kicker">WALK-IN OPERATIONS</div>
              <h2>Walk-in queue management</h2>
              <p>Call visitors, update ticket status, and monitor today's walk-in queue.</p>
            </div>
            <button
              className="quiet-button"
              type="button"
              onClick={loadWalkInTickets}
              disabled={walkInLoading}
            >
              {walkInLoading ? "Refreshing…" : "Refresh walk-ins"}
            </button>
          </div>

          {walkInError && (
            <div className="message message-error" role="alert">
              {walkInError}
            </div>
          )}
          {walkInNotice && (
            <div className="message message-success" role="status">
              {walkInNotice}
            </div>
          )}

          {walkInLoading ? (
            <div className="table-message">Loading walk-in tickets…</div>
          ) : walkInTickets.length === 0 ? (
            <div className="table-message empty-queue">
              <strong>No walk-in tickets for today</strong>
              <span>Register a visitor from the Walk-in Queue page to see the ticket here.</span>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Applicant</th>
                    <th>Service</th>
                    <th>Office</th>
                    <th>Priority</th>
                    <th>Status / action</th>
                  </tr>
                </thead>
                <tbody>
                  {walkInTickets.map((ticket) => (
                    <tr key={ticket._id}>
                      <td>
                        <span className="inline-queue">{ticket.ticketNumber}</span>
                      </td>
                      <td>
                        <div className="applicant-cell">
                          <strong>{ticket.applicantName}</strong>
                          <small>Registered {formatTime(ticket.createdAt)}</small>
                        </div>
                      </td>
                      <td>{ticket.serviceType}</td>
                      <td>{ticket.office}</td>
                      <td>
                        <span className={`status-label ${ticket.priority === "Priority" ? "pending" : "approved"}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td>
                        <label className="status-editor">
                          <span className="visually-hidden">
                            Status for ticket {ticket.ticketNumber}
                          </span>
                          <select
                            className={`status-select ${ticket.status === "Serving" ? "approved" : ticket.status === "Completed" ? "completed" : ticket.status === "Cancelled" ? "cancelled" : "pending"}`}
                            value={ticket.status}
                            onChange={(event) => updateWalkInStatus(ticket._id, event.target.value)}
                          >
                            <option value="Waiting">Waiting</option>
                            <option value="Serving">Serving</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="table-footnote">
            {walkInTickets.length} walk-in ticket{walkInTickets.length === 1 ? "" : "s"} for today.
          </div>
        </section>

        <section className="work-section appointments-section" id="appointments">
          <div className="section-heading appointments-heading">
            <div>
              <div className="section-kicker">RECORDS</div>
              <h2>Appointments</h2>
              <p>Search, update, or review an applicant's appointment.</p>
            </div>
            <div className="record-total">
              <strong>{filteredAppointments.length}</strong>
              <span>of {appointments.length} records</span>
            </div>
          </div>

          <div className="table-tools">
            <label className="search-control">
              <span className="visually-hidden">Search appointments</span>
              <span className="search-symbol" aria-hidden="true">
                ⌕
              </span>
              <input
                placeholder="Search name, email, passport or queue…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <label className="filter-control">
              <span className="visually-hidden">Filter by status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="All">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </label>

            <button
              className="quiet-button"
              type="button"
              onClick={loadAppointments}
              disabled={loading}
            >
              Refresh records
            </button>
          </div>

          {loading ? (
            <div className="table-message">Loading appointments…</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="table-message empty-queue">
              <strong>No appointments found</strong>
              <span>Try a different search or status filter.</span>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th aria-sort={sortConfig.key === "applicantName" ? (sortConfig.direction === "asc" ? "ascending" : "descending") : "none"}>
                      <button className="sortable-heading" type="button" onClick={() => handleSort("applicantName")}>
                        Applicant <span aria-hidden="true">{sortIndicator("applicantName")}</span>
                      </button>
                    </th>
                    <th aria-sort={sortConfig.key === "serviceType" ? (sortConfig.direction === "asc" ? "ascending" : "descending") : "none"}>
                      <button className="sortable-heading" type="button" onClick={() => handleSort("serviceType")}>
                        Service <span aria-hidden="true">{sortIndicator("serviceType")}</span>
                      </button>
                    </th>
                    <th aria-sort={sortConfig.key === "appointmentDate" ? (sortConfig.direction === "asc" ? "ascending" : "descending") : "none"}>
                      <button className="sortable-heading" type="button" onClick={() => handleSort("appointmentDate")}>
                        Date <span aria-hidden="true">{sortIndicator("appointmentDate")}</span>
                      </button>
                    </th>
                    <th aria-sort={sortConfig.key === "queueNumber" ? (sortConfig.direction === "asc" ? "ascending" : "descending") : "none"}>
                      <button className="sortable-heading" type="button" onClick={() => handleSort("queueNumber")}>
                        Queue <span aria-hidden="true">{sortIndicator("queueNumber")}</span>
                      </button>
                    </th>
                    <th aria-sort={sortConfig.key === "status" ? (sortConfig.direction === "asc" ? "ascending" : "descending") : "none"}>
                      <button className="sortable-heading" type="button" onClick={() => handleSort("status")}>
                        Status <span aria-hidden="true">{sortIndicator("status")}</span>
                      </button>
                    </th>
                    <th className="actions-heading">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment._id}>
                      <td>
                        <div className="applicant-cell">
                          <strong>{appointment.applicantName}</strong>
                          <small>{appointment.email}</small>
                          <small>Passport: {appointment.passportNumber}</small>
                        </div>
                      </td>
                      <td>{appointment.serviceType}</td>
                      <td>
                        <span className="date-cell">
                          {formatDate(appointment.appointmentDate)}
                        </span>
                        <small className="table-subtext">
                          {formatTime(appointment.appointmentDate)}
                        </small>
                      </td>
                      <td>
                        {appointment.queueNumber == null ? (
                          <span className="not-assigned">Not assigned</span>
                        ) : (
                          <span className="inline-queue">
                            #{appointment.queueNumber}
                          </span>
                        )}
                      </td>
                      <td>
                        <label className="status-editor">
                          <span className="visually-hidden">
                            Status for {appointment.applicantName}
                          </span>
                          <select
                            className={`status-select ${appointment.status.toLowerCase()}`}
                            value={appointment.status}
                            onChange={(event) =>
                              updateStatus(appointment._id, event.target.value)
                            }
                          >
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </label>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="text-action"
                            type="button"
                            onClick={() => startEditing(appointment)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-action delete-action"
                            type="button"
                            onClick={() => deleteAppointment(appointment)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="table-footnote">
            Showing {filteredAppointments.length} appointment
            {filteredAppointments.length === 1 ? "" : "s"}.
          </div>
        </section>

        {editingId ? (
        <section className="work-section form-section" id="appointment-form">
          <div className="section-heading">
            <div>
              <div className="section-kicker">
                {editingId ? "UPDATE RECORD" : "NEW RECORD"}
              </div>
              <h2>
                {editingId ? "Edit appointment" : "Register an appointment"}
              </h2>
              <p>
                {editingId
                  ? "Update the applicant's details and save your changes."
                  : "Enter the applicant's details to create an appointment record."}
              </p>
            </div>
            {editingId && (
              <span className="editing-indicator">Editing appointment</span>
            )}
          </div>

          <form className="appointment-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="applicantName">
                Applicant name <span>*</span>
              </label>
              <input
                id="applicantName"
                name="applicantName"
                value={form.applicantName}
                onChange={handleChange}
                placeholder="Full name as shown on passport"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="passportNumber">
                Passport number <span>*</span>
              </label>
              <input
                id="passportNumber"
                name="passportNumber"
                value={form.passportNumber}
                onChange={handleChange}
                placeholder="Enter passport number"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="email">
                Email address <span>*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="applicant@example.com"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="serviceType">
                Service required <span>*</span>
              </label>
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

            <div className="form-field">
              <label htmlFor="appointmentDate">
                Appointment date and time <span>*</span>
              </label>
              <input
                id="appointmentDate"
                name="appointmentDate"
                type="datetime-local"
                value={form.appointmentDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-actions">
              <button
                className="primary-action"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Saving record…"
                  : editingId
                    ? "Save changes"
                    : "Create appointment"}
              </button>

              {editingId && (
                <button
                  className="quiet-button"
                  type="button"
                  onClick={cancelEditing}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          <p className="form-note">
            <span>*</span> Required fields. Queue numbers are managed by the
            system when an appointment is approved.
          </p>
        </section>
        ) : (
        <section className="work-section form-section" id="appointment-form">
          <div className="section-heading">
            <div>
              <div className="section-kicker">NEW WALK-IN</div>
              <h2>Register a walk-in visitor</h2>
              <p>Enter the visitor's details to issue a queue ticket.</p>
            </div>
          </div>

          {walkInError && (
            <div className="message message-error" role="alert">
              {walkInError}
            </div>
          )}
          {walkInNotice && (
            <div className="message message-success" role="status">
              {walkInNotice}
            </div>
          )}

          {walkInConfirmationTicket && (
            <section className="walkin-ticket-confirmation" aria-live="polite">
              <style>{`
                @media print {
                  body * { visibility: hidden !important; }
                  .walkin-ticket-print,
                  .walkin-ticket-print * { visibility: visible !important; }
                  .walkin-ticket-print {
                    position: absolute !important;
                    inset: 0 auto auto 0 !important;
                    width: 100% !important;
                    max-width: 520px !important;
                    margin: 24px !important;
                    background: #ffffff !important;
                    color: #102b4e !important;
                    box-shadow: none !important;
                    border: 1px solid #b9c7d8 !important;
                  }
                  .walkin-ticket-print button { display: none !important; }
                }
              `}</style>
              <div className="walkin-ticket-print" style={{
                border: "1px solid #d7e0eb",
                borderRadius: "12px",
                background: "#f5f8fc",
                padding: "24px",
                margin: "20px 0",
                maxWidth: "520px",
                color: "#102b4e",
                textAlign: "center"
              }}>
                <p style={{ margin: "0 0 8px", color: "#8a6c32", fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px" }}>
                  IMMIGRATION QUEUE MANAGEMENT
                </p>
                <h3 style={{ margin: "0 0 8px", fontSize: "22px" }}>
                  Walk-in registration successful
                </h3>
                <p style={{ margin: "0 0 4px", color: "#63748a" }}>Please keep your queue ticket number</p>
                <div style={{ fontSize: "42px", fontWeight: 800, letterSpacing: "2px", margin: "8px 0 18px" }}>
                  {walkInConfirmationTicket.ticketNumber || "Ticket issued"}
                </div>
                <div style={{ textAlign: "left", borderTop: "1px solid #d7e0eb", paddingTop: "14px" }}>
                  <p><strong>Visitor:</strong> {walkInConfirmationTicket.applicantName || walkInForm.applicantName || "Registered visitor"}</p>
                  <p><strong>Service:</strong> {walkInConfirmationTicket.serviceType || walkInForm.serviceType}</p>
                  <p><strong>Office:</strong> {walkInConfirmationTicket.office || walkInForm.office}</p>
                  <p><strong>Priority:</strong> {walkInConfirmationTicket.priority || walkInForm.priority || "Normal"}</p>
                  <p><strong>Status:</strong> {walkInConfirmationTicket.status || "Waiting"}</p>
                </div>
                <p style={{ margin: "16px 0", color: "#52657c", fontSize: "13px" }}>
                  Please watch the live queue board and wait until your ticket is called.
                </p>
                <button
                  className="primary-action"
                  type="button"
                  onClick={() => window.print()}
                >
                  Print ticket
                </button>
              </div>
            </section>
          )}

          <form className="appointment-form" onSubmit={handleWalkInSubmit}>
            <div className="form-field">
              <label htmlFor="walkInApplicantName">
                Visitor name <span>*</span>
              </label>
              <input
                id="walkInApplicantName"
                name="applicantName"
                value={walkInForm.applicantName}
                onChange={(event) =>
                  setWalkInForm((previous) => ({
                    ...previous,
                    applicantName: event.target.value,
                  }))
                }
                placeholder="Full name"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="walkInServiceType">
                Service required <span>*</span>
              </label>
              <select
                id="walkInServiceType"
                name="serviceType"
                value={walkInForm.serviceType}
                onChange={(event) =>
                  setWalkInForm((previous) => ({
                    ...previous,
                    serviceType: event.target.value,
                  }))
                }
                required
              >
                <option>Passport Services</option>
                <option>Visa Services</option>
                <option>Residence Permit</option>
                <option>Citizenship Services</option>
                <option>Other</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="walkInOffice">
                Office / branch <span>*</span>
              </label>
              <input
                id="walkInOffice"
                name="office"
                value={walkInForm.office}
                onChange={(event) =>
                  setWalkInForm((previous) => ({
                    ...previous,
                    office: event.target.value,
                  }))
                }
                placeholder="e.g. Colombo"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="walkInPriority">Queue priority</label>
              <select
                id="walkInPriority"
                name="priority"
                value={walkInForm.priority}
                onChange={(event) =>
                  setWalkInForm((previous) => ({
                    ...previous,
                    priority: event.target.value,
                  }))
                }
              >
                <option value="Normal">Normal</option>
                <option value="Priority">Priority</option>
              </select>
            </div>

            <div className="form-actions">
              <button
                className="primary-action"
                type="submit"
                disabled={walkInSaving}
              >
                {walkInSaving ? "Issuing ticket…" : "Register walk-in & issue ticket"}
              </button>
            </div>
          </form>

          <p className="form-note">
            <span>*</span> Required fields. The system generates the queue ticket automatically.
          </p>
        </section>
        )}

        <footer className="page-footer">
          <span>Immigration Appointment &amp; Queue Management System</span>
          <span>Internal operations · Development version</span>
        </footer>
      </main>
    </div>
  );
}

export default App;

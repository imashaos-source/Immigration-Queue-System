
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/appointments";

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

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function App() {
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedQueueDate, setSelectedQueueDate] = useState(
    () => getSriLankanDate(new Date())
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadAppointments() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Could not load appointments.");
      }

      const data = await response.json();
      setAppointments(data);
    } catch {
      setError(
        "Cannot connect to the backend. Make sure your server is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
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
      const response = await fetch(
        editingId ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Request failed."
        );
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

    setForm({
      applicantName: appointment.applicantName,
      email: appointment.email,
      passportNumber: appointment.passportNumber,
      serviceType: appointment.serviceType,
      appointmentDate: new Date(appointment.appointmentDate)
        .toISOString()
        .slice(0, 16),
    });

    setNotice("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      const response = await fetch(`${API_URL}/${id}`, {
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
        status === "Approved" &&
        result.appointment?.queueNumber != null
          ? ` Queue number: ${result.appointment.queueNumber}.`
          : "";

      setNotice(`Appointment status updated.${queueMessage}`);
      await loadAppointments();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteAppointment(appointment) {
    const confirmed = window.confirm(
      `Delete the appointment for ${appointment.applicantName}?`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API_URL}/${appointment._id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Could not delete appointment."
        );
      }

      setNotice("Appointment deleted successfully.");

      if (editingId === appointment._id) {
        cancelEditing();
      }

      await loadAppointments();
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredAppointments = appointments.filter((appointment) => {
    const term = search.toLowerCase();

    const matchesSearch = [
      appointment.applicantName,
      appointment.email,
      appointment.passportNumber,
      appointment.serviceType,
      appointment.queueNumber == null
        ? ""
        : String(appointment.queueNumber),
    ].some((value) => value?.toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === "All" || appointment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const today = getSriLankanDate(new Date());

  const todayCount = appointments.filter(
    (appointment) =>
      getSriLankanDate(appointment.appointmentDate) === today
  ).length;

  const pendingCount = appointments.filter(
    (appointment) => appointment.status === "Pending"
  ).length;

  const approvedAppointments = appointments.filter(
    (appointment) => appointment.status === "Approved"
  );

  const approvedCount = approvedAppointments.length;

  // Show only approved appointments for the selected date.
  // Legacy appointments without queueDate use their appointment date.
  const dailyQueue = approvedAppointments
    .filter((appointment) => {
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

  function formatDate(date) {
    return new Date(date).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard">
          <span className="brand-icon">IQ</span>
          <span>
            <strong>ImmiQueue</strong>
            <small>Appointment Management</small>
          </span>
        </a>

        <div className="nav-label">WORKSPACE</div>
        <a className="nav-item active" href="#dashboard">
          ▦ Dashboard
        </a>
        <a className="nav-item" href="#appointments">
          ▤ Appointments
        </a>
        <a className="nav-item" href="#new-appointment">
          ＋ New appointment
        </a>
        <a className="nav-item" href="#queue">
          № Daily queue
        </a>

        <div className="sidebar-note">
          <span className="online-dot" />
          <div>
            <strong>System status</strong>
            <small>Local development</small>
          </div>
        </div>

        <div className="sidebar-footer">IMMIGRATION SERVICES</div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div>
            <div className="breadcrumb">Workspace / Dashboard</div>
            <h1>Appointment Dashboard</h1>
            <p className="subtitle">
              Manage applicant appointments in one place.
            </p>
          </div>

          <div className="topbar-status">
            <span className="online-dot" />
            API workspace
          </div>
        </header>

        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-icon purple">▤</div>
            <p>Total appointments</p>
            <strong>{appointments.length}</strong>
            <small>All recorded appointments</small>
          </article>

          <article className="stat-card">
            <div className="stat-icon orange">◷</div>
            <p>Pending</p>
            <strong>{pendingCount}</strong>
            <small>Awaiting review</small>
          </article>

          <article className="stat-card">
            <div className="stat-icon green">✓</div>
            <p>Approved</p>
            <strong>{approvedCount}</strong>
            <small>Approved appointments</small>
          </article>

          <article className="stat-card">
            <div className="stat-icon blue">▦</div>
            <p>Scheduled today</p>
            <strong>{todayCount}</strong>
            <small>Appointments dated today</small>
          </article>
        </section>

        {error && <div className="alert error">{error}</div>}
        {notice && <div className="alert success">{notice}</div>}

        <section className="content-grid">
          <article className="panel form-panel" id="new-appointment">
            <div className="panel-heading">
              <div>
                <h2>{editingId ? "Edit appointment" : "New appointment"}</h2>
                <p>Enter the applicant&apos;s details below.</p>
              </div>
              <span className="heading-icon">＋</span>
            </div>

            <form onSubmit={handleSubmit}>
              <label htmlFor="applicantName">Applicant name</label>
              <input
                id="applicantName"
                name="applicantName"
                value={form.applicantName}
                onChange={handleChange}
                placeholder="Enter full name"
                required
              />

              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="applicant@example.com"
                required
              />

              <label htmlFor="passportNumber">Passport number</label>
              <input
                id="passportNumber"
                name="passportNumber"
                value={form.passportNumber}
                onChange={handleChange}
                placeholder="Enter passport number"
                required
              />

              <label htmlFor="serviceType">Service type</label>
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

              <label htmlFor="appointmentDate">
                Appointment date and time
              </label>
              <input
                id="appointmentDate"
                name="appointmentDate"
                type="datetime-local"
                value={form.appointmentDate}
                onChange={handleChange}
                required
              />

              <button
                className="primary-button"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Create appointment"}
              </button>

              {editingId && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={cancelEditing}
                >
                  Cancel editing
                </button>
              )}
            </form>
          </article>

          <article className="panel appointments-panel" id="appointments">
            <div className="panel-heading">
              <div>
                <h2>Appointments</h2>
                <p>View and manage applicant records.</p>
              </div>
              <span className="record-count">
                {appointments.length} records
              </span>
            </div>

            <div className="toolbar">
              <input
                aria-label="Search appointments"
                className="search-input"
                placeholder="Search name, email, passport, queue..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="All">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <button
                className="refresh-button"
                onClick={loadAppointments}
                type="button"
                title="Refresh appointments"
              >
                ↻
              </button>
            </div>

            {loading ? (
              <div className="empty-state">Loading appointments...</div>
            ) : filteredAppointments.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">▤</span>
                <h3>No appointments found</h3>
                <p>Create an appointment or change your search filters.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Applicant</th>
                      <th>Service</th>
                      <th>Date &amp; time</th>
                      <th>Queue no.</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredAppointments.map((appointment) => (
                      <tr key={appointment._id}>
                        <td>
                          <strong>{appointment.applicantName}</strong>
                          <small>{appointment.email}</small>
                          <small>
                            Passport: {appointment.passportNumber}
                          </small>
                        </td>

                        <td>{appointment.serviceType}</td>
                        <td>{formatDate(appointment.appointmentDate)}</td>

                        <td>
                          {appointment.queueNumber != null ? (
                            <strong>#{appointment.queueNumber}</strong>
                          ) : (
                            <span>Not assigned</span>
                          )}
                        </td>

                        <td>
                          <select
                            className={`status-select ${appointment.status.toLowerCase()}`}
                            aria-label={`Status for ${appointment.applicantName}`}
                            value={appointment.status}
                            onChange={(event) =>
                              updateStatus(
                                appointment._id,
                                event.target.value
                              )
                            }
                          >
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>

                        <td>
                          <div className="row-actions">
                            <button
                              className="edit-button"
                              onClick={() => startEditing(appointment)}
                              type="button"
                            >
                              Edit
                            </button>

                            <button
                              className="delete-button"
                              onClick={() => deleteAppointment(appointment)}
                              type="button"
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

            <div className="table-footer">
              Showing {filteredAppointments.length} of {appointments.length}{" "}
              appointments
            </div>
          </article>
        </section>

        <section className="panel queue-panel" id="queue">
          <div className="panel-heading">
            <div>
              <h2>Daily appointment queue</h2>
              <p>View approved appointments for a selected date.</p>
            </div>
            <span className="record-count">
              {dailyQueue.length} appointments
            </span>
          </div>

          <div className="toolbar">
            <label htmlFor="queueDate">Appointment date</label>
            <input
              id="queueDate"
              type="date"
              value={selectedQueueDate}
              onChange={(event) =>
                setSelectedQueueDate(event.target.value)
              }
            />
          </div>

          {dailyQueue.length === 0 ? (
            <div className="empty-state">
              <h3>No approved appointments for this date</h3>
              <p>
                Select another date or approve an appointment for this date.
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Queue number</th>
                    <th>Applicant</th>
                    <th>Service</th>
                    <th>Appointment time</th>
                  </tr>
                </thead>

                <tbody>
                  {dailyQueue.map((appointment) => (
                    <tr key={appointment._id}>
                      <td>
                        <strong>
                          {appointment.queueNumber != null
                            ? `#${appointment.queueNumber}`
                            : "Not assigned"}
                        </strong>
                      </td>

                      <td>
                        <strong>{appointment.applicantName}</strong>
                        <small>{appointment.email}</small>
                      </td>

                      <td>{appointment.serviceType}</td>
                      <td>{formatDate(appointment.appointmentDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="page-footer">
          Immigration Appointment and Queue Management System
          <span>Development version</span>
        </footer>
      </main>
    </div>
  );
}

export default App;

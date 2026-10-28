
import { useState } from "react";
import "./WalkInPage.css";
import BackHomeButtons from "../components/BackHomeButtons";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/walk-ins`;

const SERVICES = [
  "Passport Services",
  "Visa Services",
  "Residence Permit",
  "Citizenship Services",
  "Other",
];

export default function WalkInPage() {
  const [form, setForm] = useState({
    applicantName: "",
    serviceType: "Passport Services",
    office: "",
    priority: "Normal",
  });
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setTicket(null);

    try {
      const token = localStorage.getItem("staffToken");

      if (!token) {
        throw new Error("Please log in as a staff member before registering a walk-in.");
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not register the visitor.");
      }

      setTicket(data.ticket);
      setForm({
        applicantName: "",
        serviceType: "Passport Services",
        office: "",
        priority: "Normal",
      });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="walkin-page">
        <BackHomeButtons />
      <section className="walkin-heading">
        <p className="walkin-eyebrow">IMMIGRATION QUEUE MANAGEMENT</p>
        <h1>Walk-in Queue Registration</h1>
        <p>Register a visitor and issue a queue ticket.</p>
      </section>

      <section className="walkin-card">
        <h2>Visitor Details</h2>
        <p className="walkin-intro">
          Enter the visitor's details to generate a ticket.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="applicantName">Applicant name</label>
          <input
            id="applicantName"
            name="applicantName"
            value={form.applicantName}
            onChange={updateField}
            placeholder="Enter full name"
            required
          />

          <label htmlFor="serviceType">Service required</label>
          <select
            id="serviceType"
            name="serviceType"
            value={form.serviceType}
            onChange={updateField}
            required
          >
            {SERVICES.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>

          <label htmlFor="office">Office / service counter</label>
          <input
            id="office"
            name="office"
            value={form.office}
            onChange={updateField}
            placeholder="e.g. Colombo"
            required
          />

          <label htmlFor="priority">Queue priority</label>
          <select
            id="priority"
            name="priority"
            value={form.priority}
            onChange={updateField}
          >
            <option value="Normal">Normal</option>
            <option value="Priority">Priority</option>
          </select>

          {error && <p className="walkin-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register & Generate Ticket"}
          </button>
        </form>

        {ticket && (
          <div className="walkin-ticket" role="status">
            <p>Ticket generated successfully</p>
            <strong>{ticket.ticketNumber}</strong>
            <span>{ticket.applicantName}</span>
            <span>{ticket.serviceType}</span>
            <span>{ticket.office}</span>
            <span>Priority: {ticket.priority}</span>
          </div>
        )}
      </section>
    </main>
  );
}

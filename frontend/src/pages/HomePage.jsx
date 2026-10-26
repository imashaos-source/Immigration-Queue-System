
import { Link } from "react-router-dom";
import "./HomePage.css";

const services = [
  {
    number: "01",
    title: "Passport services",
    description: "Request an appointment for passport-related services and document processing.",
  },
  {
    number: "02",
    title: "Visa services",
    description: "Arrange a visit for visa-related enquiries and service requests.",
  },
  {
    number: "03",
    title: "Residence permits",
    description: "Request an appointment for residence permit services.",
  },
  {
    number: "04",
    title: "Citizenship services",
    description: "Arrange a visit for citizenship-related matters.",
  },
];

const steps = [
  ["01", "Submit a request", "Enter your details and preferred service and appointment time."],
  ["02", "Wait for review", "Staff review your request and update its status."],
  ["03", "Receive confirmation", "Check your appointment status after the request is reviewed."],
  ["04", "Attend your visit", "Follow your confirmed appointment details."],
];

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="hero-content">
          <div className="home-eyebrow">
            <span /> IMMIGRATION SERVICE PORTAL
          </div>

          <h1>
            Plan your visit.
            <br />
            <em>We'll guide you through.</em>
          </h1>

          <p className="hero-description">
            Request an appointment for immigration services, understand
            the next steps, and prepare for your visit through one
            straightforward portal.
          </p>

          <div className="hero-actions">
            <Link className="hero-primary" to="/book">
              Book an appointment <span>→</span>
            </Link>
            <a className="hero-secondary" href="#process">
              How appointments work
            </a>
          </div>

          <div className="hero-note">
            <span className="note-symbol">i</span>
            <span>
              Submitting a request does not mean the appointment is approved.
              Please wait for confirmation.
            </span>
          </div>
        </div>

        <div className="hero-side">
          <div className="hero-side-top">
            <span className="hero-side-label">YOUR VISIT, ORGANIZED</span>
            <span className="hero-side-rule" />
          </div>

          <div className="hero-illustration" aria-hidden="true">
            <div className="illustration-sun" />
            <div className="illustration-building">
              <div className="building-roof" />
              <div className="building-top">
                <span /><span /><span />
              </div>
              <div className="building-columns">
                <i /><i /><i /><i />
              </div>
              <div className="building-base" />
            </div>
            <div className="illustration-ground" />
          </div>

          <div className="hero-side-bottom">
            <span className="side-index">01 / 03</span>
            <div>
              <strong>A clearer way to prepare</strong>
              <p>
                Service information and appointment requests in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="service-section" id="services">
        <div className="home-section-heading">
          <div>
            <span className="section-eyebrow">SERVICES</span>
            <h2>What can we help you with?</h2>
          </div>
          <p>Choose the service that best matches the purpose of your visit.</p>
        </div>

        <div className="service-grid">
          {services.map((service) => (
            <article className="service-item" key={service.number}>
              <span className="service-number">{service.number}</span>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <Link to="/book">
                Request appointment <span>↗</span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="process-section" id="process">
        <div className="process-intro">
          <span className="section-eyebrow">THE PROCESS</span>
          <h2>Four steps to prepare for your visit.</h2>
          <p>Follow the appointment process from request to confirmation.</p>
          <Link to="/book" className="process-link">
            Start an appointment request <span>→</span>
          </Link>
        </div>

        <div className="process-steps">
          {steps.map(([number, title, description]) => (
            <article className="process-step" key={number}>
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-cta">
        <div>
          <span className="section-eyebrow">READY TO BEGIN?</span>
          <h2>Start with an appointment request.</h2>
          <p>Keep your details ready before you begin.</p>
        </div>
        <Link to="/book">
          Book an appointment <span>→</span>
        </Link>
      </section>

      <p className="demo-disclaimer">
        Academic project demonstration. Service information must be verified
        before public deployment.
      </p>
    </div>
  );
}

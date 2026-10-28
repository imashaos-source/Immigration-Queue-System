
import { Link, NavLink, Outlet } from "react-router-dom";
import "./PublicLayout.css";

export default function PublicLayout() {
  return (
    <div className="public-site">
      <header className="public-header">
        <Link className="public-brand" to="/">
          <span className="public-brand-mark">IS</span>

          <span className="public-brand-copy">
            <strong>Immigration Services</strong>
            <small>Appointment &amp; Queue Management</small>
          </span>
        </Link>

        <nav className="public-nav" aria-label="Main navigation">
          <NavLink to="/" end>
            Home
          </NavLink>

          <a href="/#services">Services</a>

          <a href="/#process">How it works</a>

          <NavLink to="/book">Book appointment</NavLink>

          <NavLink to="/check-appointment">
            Check appointment
          </NavLink>

          <NavLink to="/live-board">Live board</NavLink>

          <Link to="/staff/login" className="staff-link">
            Staff login
          </Link>
        </nav>
      </header>

      <main className="public-main">
        <Outlet />
      </main>

      <footer className="public-footer">
        <div>
          <strong>Immigration Services</strong>
          <p>Appointment &amp; Queue Management System</p>
        </div>

        <span>Public portal · Development version</span>
      </footer>
    </div>
  );
}

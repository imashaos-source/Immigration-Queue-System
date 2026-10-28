
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import PublicLayout from "./components/PublicLayout";
import HomePage from "./pages/HomePage";
import BookingPage from "./pages/BookingPage";
import AppointmentStatusPage from "./pages/AppointmentStatusPage";
import StaffLoginPage from "./pages/StaffLoginPage";
import StaffDashboardPage from "./pages/StaffDashboardPage";
import WalkInPage from "./pages/WalkInPage";
import LiveQueueBoard from "./pages/LiveQueueBoard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public website */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/book" element={<BookingPage />} />
          <Route
            path="/check-appointment"
            element={<AppointmentStatusPage />}
          />
        </Route>

        {/* Staff pages */}
        <Route
          path="/staff/login"
          element={<StaffLoginPage />}
        />

        <Route
          path="/staff/dashboard"
          element={<StaffDashboardPage />}
        />

        {/* Walk-in and live queue pages */}
        <Route path="/walk-in" element={<WalkInPage />} />
        <Route path="/live-board" element={<LiveQueueBoard />} />

        {/* Unknown URLs return to the home page */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

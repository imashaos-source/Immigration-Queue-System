
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import PublicLayout from "./components/PublicLayout";
import HomePage from "./pages/HomePage";
import BookingPage from "./pages/BookingPage";
import StaffLoginPage from "./pages/StaffLoginPage";
import StaffDashboardPage from "./pages/StaffDashboardPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public website */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/book" element={<BookingPage />} />
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

        {/* Unknown URLs return to the home page */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

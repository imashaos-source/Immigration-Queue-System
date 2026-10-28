import { useNavigate } from "react-router-dom";
import "./BackHomeButtons.css";

export default function BackHomeButtons() {
  const navigate = useNavigate();

  function goBack() {
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }

  return (
    <div className="back-home-buttons">
      <button
        type="button"
        className="page-back-button"
        onClick={goBack}
      >
        {"\u2190"} Back
      </button>

      <button
        type="button"
        className="page-home-button"
        onClick={() => navigate("/")}
      >
        Home
      </button>
    </div>
  );
}

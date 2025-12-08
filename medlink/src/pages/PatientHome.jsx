import { useNavigate } from "react-router-dom";
import { logout } from "../api/auth";

export default function PatientHome() {
  const navigate = useNavigate();
  const name = localStorage.getItem("name");

  async function handleLogout() {
    await logout();
    localStorage.clear();
    navigate("/");
  }

  return (
    <div style={{ padding: 30 }}>
      <h2>Здравствуйте, {name}!</h2>
      <button onClick={() => navigate("/chat")}>Начать консультацию</button>
      <br /><br />
      <button onClick={handleLogout}>Выход</button>
    </div>
  );
}

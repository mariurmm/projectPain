import { useEffect, useState } from "react";
import { loadPatients } from "../api/patients";
import { logout } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function DoctorHome() {
  const [patients, setPatients] = useState([]);
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    localStorage.clear();
    navigate("/");
  }

  useEffect(() => {
    loadPatients().then(setPatients);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Пациенты</h2>

      <table border="1" width="100%">
        <thead>
          <tr>
            <th>ФИО</th>
            <th>Жалоба</th>
            <th>Приоритет</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p, i) => (
            <tr key={i}>
              <td>{p.name}</td>
              <td>{p.complaint}</td>
              <td>{p.priority}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <br />
      <button onClick={handleLogout}>Выход</button>
    </div>
  );
}

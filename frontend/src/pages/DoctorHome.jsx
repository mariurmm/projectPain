import { useEffect, useState } from "react";
import { loadPatients } from "../api/patients";
import { logout } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import "../style/DoctorHome.css";

export default function DoctorHome() {
  const [patients, setPatients] = useState([]);
  const navigate = useNavigate();
  const { language } = useLanguage();
  const name = localStorage.getItem("name");

  const t = {
    ru: {
      greeting: "Здравствуйте",
      noPatients: "Пациентов пока нет",
      fullName: "ФИО",
      complaint: "Жалоба",
      priority: "Приоритет",
      logout: "Выход",
    },
    en: {
      greeting: "Hello",
      noPatients: "No patients yet",
      fullName: "Full Name",
      complaint: "Complaint",
      priority: "Priority",
      logout: "Logout",
    },
  };

  async function handleLogout() {
    try {
      // Вызываем API выхода
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Всегда очищаем localStorage и перенаправляем на страницу входа
      localStorage.clear();
      navigate("/", { replace: true });
    }
  }

  useEffect(() => {
    loadPatients().then(setPatients);
  }, []);

  return (
    <div className="doctor-home-wrapper">
      <div className="doctor-home-container">
        <h2>{t[language].greeting}, {name}!</h2>
        
        {patients.length === 0 ? (
          <p className="no-patients">{t[language].noPatients}</p>
        ) : (
          <div className="patients-table-wrapper">
            <table className="patients-table">
              <thead>
                <tr>
                  <th>{t[language].fullName}</th>
                  <th>{t[language].complaint}</th>
                  <th>{t[language].priority}</th>
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
          </div>
        )}

        <button className="doctor-btn logout" onClick={handleLogout}>
          {t[language].logout}
        </button>
      </div>
    </div>
  );
}
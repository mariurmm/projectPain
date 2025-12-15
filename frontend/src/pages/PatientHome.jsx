import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../api/auth";
import { useLanguage } from "../context/LanguageContext";
import "../style/PatientHome.css";

export default function PatientHome() {
  const navigate = useNavigate();
  const name = localStorage.getItem("name");
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();

  const t = {
    ru: {
      greeting: "Здравствуйте",
      loading: "Загрузка...",
      appointmentTitle: "Ваша запись к врачу:",
      doctor: "Врач",
      complaint: "Жалоба",
      priority: "Приоритет",
      status: "Статус",
      notAssigned: "Не назначен",
      waiting: "Ожидание",
      noAppointment: "У вас пока нет записи к врачу",
      startConsultation: "Начать консультацию",
      logout: "Выйти",
    },
    en: {
      greeting: "Hello",
      loading: "Loading...",
      appointmentTitle: "Your appointment with doctor:",
      doctor: "Doctor",
      complaint: "Complaint",
      priority: "Priority",
      status: "Status",
      notAssigned: "Not assigned",
      waiting: "Waiting",
      noAppointment: "You don't have an appointment yet",
      startConsultation: "Start Consultation",
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
    // Fetch appointment data for this patient
    async function fetchAppointment() {
      try {
        const response = await fetch("/api/patient/appointment", {
          method: "GET",
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          setAppointment(data);
        }
      } catch (error) {
        console.error("Error fetching appointment:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAppointment();
  }, []);

  return (
    <div className="patient-home-wrapper">
      <div className="patient-home-container">
        <h2>{t[language].greeting}, {name}!</h2>
        
        {loading ? (
          <p className="loading-message">{t[language].loading}</p>
        ) : appointment ? (
          <div className="appointment-info">
            <h3>{t[language].appointmentTitle}</h3>
            <div className="appointment-table-wrapper">
              <table className="appointment-table">
                <thead>
                  <tr>
                    <th>{t[language].doctor}</th>
                    <th>{t[language].complaint}</th>
                    <th>{t[language].priority}</th>
                    <th>{t[language].status}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{appointment.doctorName || t[language].notAssigned}</td>
                    <td>{appointment.complaint}</td>
                    <td>{appointment.priority}</td>
                    <td>{appointment.status || t[language].waiting}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="no-appointment">{t[language].noAppointment}</p>
        )}

        <div className="patient-buttons">
          <button className="patient-btn start" onClick={() => navigate("/chat")}>
            {t[language].startConsultation}
          </button>
          <button className="patient-btn logout" onClick={handleLogout}>
            {t[language].logout}
          </button>
        </div>
      </div>
    </div>
  );
}
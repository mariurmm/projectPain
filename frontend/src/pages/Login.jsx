import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import "../style/Login.css";
import logoBlack from "../assets/logo_black.svg";
import { useLanguage } from "../context/LanguageContext"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { language } = useLanguage(); 

  const t = {
    ru: {
      email: "Электронная почта",
      password: "Пароль",
      placeholderEmail: "example@mail.com",
      placeholderPassword: "Введите пароль",
      login: "Войти",
      title: "MedLink Assistant",
    },
    en: {
      email: "Email",
      password: "Password",
      placeholderEmail: "example@mail.com",
      placeholderPassword: "Enter password",
      login: "Login",
      title: "MedLink Assistant",
    },
  };

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("name", data.name);

      if (data.role === "patient") navigate("/patient");
      if (data.role === "doctor") navigate("/doctor");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-box">
        <div className="login-logo-wrapper">
          <img src={logoBlack} alt="MedLink logo" className="login-logo" />
          <span className="logo-text">{t[language].title}</span>
        </div>

        <form onSubmit={handleLogin}>
          <div className="login-field">
            <label>{t[language].email}</label>
            <input
              type="email"
              placeholder={t[language].placeholderEmail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <label>{t[language].password}</label>
            <input
              type="password"
              placeholder={t[language].placeholderPassword}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <div className="login-buttons">
            <button type="submit" className="btn-primary">
              {t[language].login}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

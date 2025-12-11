import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleLogin() {
    const data = {
      email: email,
      password: password
    }
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
    <div style={{ maxWidth: 320, margin: "100px auto", textAlign: "center" }}>
      <h2>MedLink Assistant</h2>

      <input
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ width: "100%", marginTop: 10 }}
      />

      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ width: "100%", marginTop: 10 }}
      />

      <button onClick={handleLogin} style={{ marginTop: 15 }}>
        Войти
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

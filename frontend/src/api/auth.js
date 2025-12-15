import axios from "axios";

// Функция для входа
export async function login(email, password) {
  try {
    const res = await axios.post("http://localhost:3000/auth/login", { email, password });
    return res.data; // ожидаем JSON: { token, role, name }
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

// Функция для выхода из системы
export async function logout() {
  try {
    const res = await axios.post("http://localhost:3000/auth/logout");
    return res.data;
  } catch (error) {
    console.error("Logout error:", error);
    // Даже если произошла ошибка на сервере, продолжаем
    throw error;
  }
}
import axios from "axios";

export async function login(email, password) {
  const res = await axios.post("http://localhost:3000/auth/login", { email, password });
  return res.data; // ожидаем JSO N: { token, role, name }
}
export async function logout() {
  const res = await axios.post("http://localhost:3000/auth/logout");
  return res.data;
}